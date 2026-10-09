// Generated from immutable accepted content by scripts/render-typed-decision-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../components/lesson-labs/TypedDecisionShared.jsx';
import { DecisionMeaning, DecisionArchitectures, DecisionMarkers, DecisionMasks, DecisionEncoder, DecisionAttention, DecisionSoftmax, DecisionSimplex, DecisionOrdinal, DecisionTruth, DecisionCrossEntropy, DecisionParameterStep } from '../../components/lesson-labs/TypedDecisionFoundations.jsx';
import { DecisionProperScore, DecisionRewardCurves, DecisionRankedScore, DecisionReportPolicy, DecisionEstimatorEvidence, DecisionRecipeGraph, DecisionRareEvent } from '../../components/lesson-labs/TypedDecisionProbability.jsx';
import { DecisionDataRoles, DecisionCohort, DecisionTrainingHistory, DecisionConfusion, DecisionTemperature, DecisionCalibrationEvidence, DecisionCostMatrix, DecisionCostRegions, DecisionRouting, DecisionRoutingEvidence } from '../../components/lesson-labs/TypedDecisionStudy.jsx';
import { DecisionNativeArchitecture, DecisionNativeBatch, DecisionNativeCost, DecisionSchemaShift, DecisionTokenBudget, DecisionShiftEvidence, DecisionArtifact } from '../../components/lesson-labs/TypedDecisionNative.jsx';
import '../../components/lesson-labs/lesson-flow.css';

function Program({ file }) {
  return <RemoteCodeBlock source={'/learn/examples/typed-decision-systems/' + file} language="python" title={file} filename={file} />;
}
function TypedDecisionLesson() {
  return <div className="lesson-flow typed-flow">
    <section>
    <Prose>{"A customer writes, “My new card has not arrived.” A system must choose what the request means, report uncertainty and decide whether to handle it automatically. Returning a permitted label solves only the first interface problem. It does not establish that the chosen label is correct, that its probability is reliable, or that acting on it is worth the cost of a mistake."}</Prose>
    
    <Prose>{"We will follow one candidate from its description, through an encoder and a shared scoring head, into a probability report and a cost-sensitive action. Then we will train a small model on six BANKING77 intents, calibrate frozen predictions on separate data and compare a pinned pretrained Laya model as an imperfect fallback. Constructed examples explain the arithmetic; saved model outputs supply the experimental evidence."}</Prose>
    
    <Prose opening="prerequisites">{"Review "}<a href={"/learn/path/full-curriculum/masked-language-modeling-bert-style?module=large-language-models"}>{"Masked Language Modeling"}</a>{" for bidirectional context and "}<a href={"/learn/path/full-curriculum/transformer-block-architecture"}>{"the Transformer block"}</a>{" for attention and residual paths. We derive the candidate probability and loss locally. "}<a href={"/learn/path/full-curriculum/calibration-conformal-prediction"}>{"Calibration & Conformal Prediction"}</a>{" and "}<a href={"/learn/path/full-curriculum/decision-theory-risk-cost-sensitive-decisions"}>{"Decision Theory"}</a>{" extend the final probability-to-action questions."}</Prose>
    
    <Prose opening="route">{"For a first reading, follow sections 1–8, then 11–16 and 18. Sections 9–10 trace the more advanced probability-report policy and audit a released training recipe. Section 17 investigates changed schemas, languages and evidence. The worked examples stay visible; independent problems and their solutions follow the main explanation."}</Prose>
    
    <H2>{"1. A valid answer can still be wrong"}</H2>
    
    <DecisionMeaning />
    
    <Prose>{"The three candidates in the opening drawing refer to different events. "}<strong>{"Arrival"}</strong>{" means the newly ordered card has not reached the customer. "}<strong>{"Delivery estimate"}</strong>{" asks how long delivery should take. "}<strong>{"Lost card"}</strong>{" means a card previously received is now missing. These descriptions overlap in vocabulary but differ in meaning."}</Prose>
    
    <Prose>{"The probability vector "}<code>{"(0.6, 0.3, 0.1)"}</code>{" is a constructed example. Its entries sum to one because the model is distributing mass over this supplied set. The largest entry selects arrival. A typed output can guarantee that the returned ID is one of these three IDs. It can still select delivery estimate by mistake. If none describes the request, normalization still allocates all the mass to the available choices unless the interface explicitly includes a suitable “none of these” alternative."}</Prose>
    
    <Prose>{"Keep four objects separate throughout the lesson:"}</Prose>
    
    <NeuralTable caption={"1. A valid answer can still be wrong"} headers={[<>{"Object"}</>,<>{"Example"}</>,<>{"What it does not establish"}</>]} rows={[[<>{"Evidence"}</>,<>{"The customer's actual words"}</>,<>{"Which interpretation a model will learn"}</>],[<>{"Candidate schema"}</>,<>{"IDs and descriptions of allowed intents"}</>,<>{"That the set contains the right answer"}</>],[<>{"Probability report"}</>,<>{"A distribution over those candidates"}</>,<>{"That similar reports match observed frequencies"}</>],[<>{"Action"}</>,<>{"Handle now or call another model"}</>,<>{"That the cheapest-looking action has the lowest real cost"}</>]]} />
    
    <Prose>{"An application may route the request automatically, defer it, or ask a follow-up question. Those are actions chosen after interpreting the probability report. The most probable intent need not be the most economical action. We first need to understand where that report comes from."}</Prose>
    
    <H2>{"2. Three ways to produce a choice"}</H2>
    
    <DecisionArchitectures />
    
    <Prose>{"A conventional classifier produces a hidden vector "}<code>{"h"}</code>{" and multiplies it by a matrix with one learned column per class. If "}<code>{"h"}</code>{" has width "}<code>{"d"}</code>{" and there are "}<code>{"K"}</code>{" classes, "}<code>{"W"}</code>{" has shape "}<code>{"d × K"}</code>{"; "}<code>{"z = hW + b"}</code>{" contains "}<code>{"K"}</code>{" logits. A "}<strong>{"logit"}</strong>{" is an unnormalized real score. Column 0 is tied to the meaning assigned to class 0 during training. Adding a new class requires a corresponding output parameter and appropriate training or adaptation."}</Prose>
    
    <Prose>{"A dynamic candidate model instead places the candidate descriptions into the input. It computes a contextual vector "}<code>{"h_k"}</code>{" for each candidate and applies the same scalar function "}<code>{"g"}</code>{" to every one: "}<code>{"z_k = g(h_k)"}</code>{". The number of candidates can change without adding a new column to the scorer. Their descriptions and positions change the encoder's computation, so accepting a new schema does not guarantee useful performance on it."}</Prose>
    
    <Prose>{"A generative language model can also produce a label or JSON object. A grammar or constrained decoder restricts which next tokens are legal. It still follows a sequence of token predictions until the allowed object is complete. Its probability for a multi-token label is not automatically the same object as one softmax over candidate logits. Lengths, tokenization and decoding rules matter."}</Prose>
    
    <Prose>{"“Typed decision model” describes an interface and use case, not a proof of one architecture. Public product descriptions of Typesafe/Jev do not reveal enough training and architecture detail to reproduce that model. The transparent implementation here is an option-marker encoder. The ordinary pretrained route uses Laya's inspected open implementation. We will name their differences instead of transferring claims between them."}</Prose>
    
    <H2>{"3. Put the candidates inside the input"}</H2>
    
    <DecisionMarkers />
    
    <Prose>{"The scratch request contains "}<code>{"question"}</code>{", "}<code>{"state"}</code>{" and a list of options. Each option has a stable "}<code>{"id"}</code>{" for the application and a readable "}<code>{"description"}</code>{" for the model. For example, the ID "}<code>{"card_arrival"}</code>{" remains stable when the option is moved to another slot. Its description explains the intended event."}</Prose>
    
    <Prose>{"The small tokenizer extracts lowercase ASCII words. It serializes one request as:"}</Prose>
    
    <CodeBlock language={"text"}>{"<cls> question words <sep>\n<option> first description <sep>\n<option> second description <sep>\n<option> third description <sep>\nstate words <sep>"}</CodeBlock>
    
    <Prose>{"The line breaks above aid reading; the model receives one sequence of integer token IDs. The encoder has a maximum of 128 positions. Words absent from the training vocabulary become "}<code>{"<unk>"}</code>{". This intentionally small tokenizer cannot represent arbitrary languages. A request containing no ASCII word is rejected; its behavior is not a multilingual tokenizer benchmark."}</Prose>
    
    <Prose>{"The list of marker positions records where each "}<code>{"<option>"}</code>{" begins. These positions will tell the scorer which contextual vectors belong to candidates. The scratch encoder includes the descriptions but "}<strong>{"does not encode the external IDs"}</strong>{". Renaming only those IDs leaves its input tensors unchanged. Laya renders IDs within its native option text, so that exact null claim does not transfer to the native route."}</Prose>
    
    <DecisionMasks />
    
    <Prose>{"Batching introduces two different masks. A "}<strong>{"token mask"}</strong>{" identifies real sequence positions, so attention cannot read padding keys. A "}<strong>{"candidate mask"}</strong>{" identifies real choices. A two-option request batched with a three-option request needs an unused third score slot. Its stored gather index can be zero because the candidate mask discards that slot before normalization."}</Prose>
    
    <Prose>{"Ignoring the candidate mask would turn the contextual vector at position zero into an accidental extra choice. Ignoring the token mask would let padding influence real representations. They protect different dimensions and neither can substitute for the other. Reject an all-invalid candidate row: a probability distribution over no allowed events is undefined. Duplicate IDs are also rejected because the application could no longer map one reported probability to one unambiguous event."}</Prose>
    
    <H2>{"4. From contextual states to shared scores"}</H2>
    
    <DecisionEncoder />
    
    <Prose>{"The exact small model has width 32, two attention blocks and four attention heads. Token embeddings tell the model which words it sees; position embeddings tell it where they occur. Their sum gives an "}<code>{"L × 32"}</code>{" matrix. Each attention head works with width "}<code>{"32 / 4 = 8"}</code>{"."}</Prose>
    
    <Prose>{"For a query row "}<code>{"q_i"}</code>{", the attention score against key row "}<code>{"k_j"}</code>{" is their dot product divided by "}<code>{"sqrt(8)"}</code>{". Padding keys are masked. Softmax turns the remaining scores into weights that sum to one. Multiplying those weights by the value rows forms a weighted sum. Heads are joined, projected back to width 32 and added to the original hidden state through a residual connection. A normalized feed-forward transformation supplies the second residual update."}</Prose>
    
    <Prose>{"This encoder is bidirectional: an option marker may read the state appearing later in the input. The causal mask used by an autoregressive decoder would block that route. Here the entire request is available before the choice is made. Two blocks let candidate and evidence representations interact before the final marker vectors are gathered."}</Prose>
    
    <DecisionAttention />
    
    <Prose>{"Follow one marker in the attention drawing. Its row of weights selects how much of every value vector to add. A large attention weight is one part of one head in one block; it is not a complete causal explanation of the final decision. The displayed random initialization demonstrates the operation and verifies the sum. It does not claim to identify which words a trained model “understands.”"}</Prose>
    
    <Prose>{"After both blocks, gather the "}<code>{"K"}</code>{" marker rows into a "}<code>{"K × 32"}</code>{" matrix. The same LayerNorm and "}<code>{"32 → 1"}</code>{" linear map turn every row into one logit. There is no class-specific weight column in this head. Nevertheless, positional embeddings and joint attention can make scores change when candidates are reordered. Sharing the scorer is not permutation invariance."}</Prose>
    
    <Prose>{"The main attention calculation costs roughly "}<code>{"O(B L² d)"}</code>{". Projections and the feed-forward network contribute "}<code>{"O(B L d²)"}</code>{"; the final marker head is only "}<code>{"O(B K d)"}</code>{". Adding long descriptions can increase "}<code>{"L"}</code>{", so dynamic candidates have a representation cost even though the scalar head is shared. These are operation-count relationships, not measurements of a particular device."}</Prose>
    
    <H2>{"5. Make a stable probability report"}</H2>
    
    <DecisionSoftmax />
    
    <Prose>{"Logits can be negative, large or shifted by an arbitrary common constant. To obtain a probability report, divide by a positive temperature "}<code>{"T"}</code>{", subtract the largest valid scaled logit, exponentiate and normalize over valid candidates:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"p_k=\\frac{\\exp(z_k/T-m)}{\\sum_{j\\in\\mathcal V}\\exp(z_j/T-m)},\\qquad m=\\max_{j\\in\\mathcal V}z_j/T."}</MathBlock>
    </div>
    
    <Prose>{"Here "}<code>{"V"}</code>{" is the set of valid candidate indices. Invalid slots receive zero probability and do not contribute to the denominator. Subtracting "}<code>{"m"}</code>{" keeps exponents at or below one without changing ratios. Adding 1,000 to every valid logit should therefore leave the probabilities unchanged, up to floating-point rounding."}</Prose>
    
    <Prose>{"For logits "}<code>{"(2, 1, 0)"}</code>{" at "}<code>{"T=1"}</code>{", the relative exponents are "}<code>{"(1, exp(-1), exp(-2))"}</code>{". The first event receives the largest mass because its logit is largest, not because logits themselves are probabilities. Increasing "}<code>{"T"}</code>{" flattens this particular row; decreasing it sharpens the differences. A positive temperature preserves the ordering and ties. It cannot move the correct event above an incorrectly higher-scored one."}</Prose>
    
    <Prose>{"The implementation checks finite valid logits, a positive finite temperature, matching mask shape and at least one valid event before computing the maximum. Its essential operation is:"}</Prose>
    
    <CodeBlock language={"python"}>{"active = np.where(keep, logits, -np.inf) / temperature\nexp = np.exp(active - active.max(-1, keepdims=True))\nprobabilities = exp / exp.sum(-1, keepdims=True)"}</CodeBlock>
    
    <Prose>{"Rows are independent; the last axis names candidates. The masked "}<code>{"-inf"}</code>{" becomes zero after exponentiation. A masked slot may contain an arbitrary storage value because it has no event meaning. A nonfinite "}<strong>{"valid"}</strong>{" logit is an error."}</Prose>
    
    <Prose>{"Download the complete program bundle and keep its files together. The finite examples require Python, NumPy and PyTorch; the pretrained route adds its separate checkpoint and Laya dependencies in section 16. The "}<a href={"/learn/examples/typed-decision-systems/typed-decision-systems.zip"}>{"complete study bundle"}</a>{" contains all ten programs, prepared data and retained results. Its "}<a href={"/learn/examples/typed-decision-systems/README.md"}>{"README"}</a>{" gives the exact tested environment and command order. Create an isolated environment with "}<code>{"python -m venv .venv"}</code>{", activate it using "}<code>{".venv\\Scripts\\Activate.ps1"}</code>{" in PowerShell or "}<code>{"source .venv/bin/activate"}</code>{" on macOS/Linux, and install the bundle's pinned "}<code>{"requirements.txt"}</code>{"."}</Prose>
    
    <CodeBlock language={"sh"}>{"python decision_math.py --output math-results.json"}</CodeBlock>
    
    <Prose>{"This finite program checks the numerical operations against PyTorch. It writes a fresh JSON file and performs no data download or model fit. The same file also contains the typed summaries, proper scores and expected-cost calculations introduced next. Keeping them together makes their common event ordering explicit."}</Prose>
    
    <Program file="decision_math.py" />
    
    <H2>{"6. Choice, ordered Score and binary truth"}</H2>
    
    <DecisionSimplex />
    
    <Prose>{"A "}<strong>{"Choice"}</strong>{" identifies one nominal category. Its IDs have no arithmetic meaning: averaging the numeric spellings of “arrival” and “lost card” would not produce an intermediate intent. The simplex drawing represents all possible three-event distributions. Its vertices mean certainty in one event; every interior point has nonnegative coordinates summing to one."}</Prose>
    
    <Prose>{""}<code>{"pmax"}</code>{" is the probability assigned to the selected event. Entropy is "}<code>{"-sum p_k log p_k"}</code>{", with "}<code>{"0 log 0 = 0"}</code>{"; it describes how spread out the whole report is. Both are functions of the report. Neither proves that the report is empirically calibrated on future requests."}</Prose>
    
    <DecisionOrdinal />
    
    <Prose>{"A "}<strong>{"Score"}</strong>{" introduces ordered levels, such as “no deadline,” “soon” and “immediate.” Order permits cumulative questions: what is the probability of a level at or below “soon”? It does not by itself specify equal distances between levels. If the application supplies values "}<code>{"(0, 1, 10)"}</code>{", the expected numerical value is "}<code>{"sum p_k value_k"}</code>{"; if it supplies "}<code>{"(0, 1, 2)"}</code>{", a different expectation results from the same probability vector."}</Prose>
    
    <Prose>{"Laya's native Score output uses the expected "}<strong>{"zero-based level index"}</strong>{" and returns a legend. It does not interpret arbitrary rubric text as numeric utility. Distributions "}<code>{"(0.5, 0, 0.5)"}</code>{" and "}<code>{"(0, 1, 0)"}</code>{" both have expected index 1 but very different uncertainty. Preserve the full distribution when those differences affect action."}</Prose>
    
    <DecisionTruth />
    
    <Prose>{"A "}<strong>{"Noul"}</strong>{" is the native interface's binary truth report. For the predicate “the customer explicitly requests a refund,” let "}<code>{"p"}</code>{" mean the probability of true; false has probability "}<code>{"1-p"}</code>{". Negating the predicate exchanges those meanings. Choosing a threshold to trigger a workflow is a later decision, not part of the definition of truth probability."}</Prose>
    
    <Prose>{"API field names need inspection. Laya's Choice/Score "}<code>{"confidence"}</code>{" is based on normalized entropy; "}<code>{"answer_confidence"}</code>{" starts from maximum probability and may also be transformed by an installed binning map. The public Typesafe confidence definitions differ. A familiar field name is not a shared mathematical contract. Our evaluation uses explicit full-precision vectors and states which statistic it computes."}</Prose>
    
    <H2>{"7. Fit the direct supervised baseline"}</H2>
    
    <DecisionCrossEntropy />
    
    <Prose>{"To train the model, we need a target for each request. A human-observed intent gives a one-hot target: its coordinate is one and the others zero. A supplied probability target "}<code>{"t"}</code>{" instead distributes mass across the same events. Such a target might summarize annotators or a teacher; it is an assumption about supervision, not automatically the true conditional distribution."}</Prose>
    
    <Prose>{"Cross-entropy at temperature 1 is:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"L(z,t)=-\\sum_k t_k\\log p_k,\\qquad p=\\operatorname{softmax}(z)."}</MathBlock>
    </div>
    
    <Prose>{"The log-softmax derivative is "}<code>{"d log(p_k) / d z_j = 1[k=j] - p_j"}</code>{". Since target masses sum to one, summing the contributions gives "}<code>{"dL/dz_j = p_j - t_j"}</code>{". An event receiving less probability than its target has a negative derivative. Gradient descent raises its logit. The entries sum to zero because a common logit shift cannot change the loss."}</Prose>
    
    <Prose>{"For a minibatch, average the per-request losses. These are candidate-choice rows, not the response-token positions in an autoregressive SFT batch. Invalid candidate targets are rejected; putting target mass in a padded slot would describe an impossible supervised event."}</Prose>
    
    <DecisionParameterStep />
    
    <Prose>{"The derivative above concerns logits. Backpropagation continues through the shared scorer, marker gather and both encoder blocks to their parameters. The finite program records an actual small parameter update and compares its explicit loss with "}<code>{"torch.nn.functional.cross_entropy"}</code>{" on identical inputs. It checks every parameter gradient and updated value, rather than comparing only the final scalar."}</Prose>
    
    <CodeBlock language={"python"}>{"selected = logits.gather(1, targets[:, None]).squeeze(1)\nloss = (torch.logsumexp(logits, dim=-1) - selected).mean()\nloss.backward()"}</CodeBlock>
    
    <Prose>{""}<code>{"targets"}</code>{" contains one valid integer index per request. "}<code>{"gather"}</code>{" picks the corresponding logit; log-sum-exp accounts for all allowed candidates. The soft version weights every log probability by its target mass. The exact project encoder is included below so the embedding, attention, mask and scorer code can all be inspected and changed."}</Prose>
    
    <CodeBlock language={"sh"}>{"python replay_artifact.py finite --output finite.json"}</CodeBlock>
    
    <Prose>{"These two one-step fixtures establish implementation parity. They do not train the banking task. Section 12 adds its data, optimizer budget and held-out selection protocol."}</Prose>
    
    <Program file="typed_decision.py" />
    
    <Program file="replay_artifact.py" />
    
    <H2>{"8. Reward an honest distribution"}</H2>
    
    <DecisionProperScore />
    
    <Prose>{"Why should a model report uncertainty honestly instead of merely maximizing its chance of selecting the right label? A "}<strong>{"proper scoring rule"}</strong>{" rewards the whole distribution. Change notation here to distinguish the unknown true conditional probabilities "}<code>{"p"}</code>{" from a submitted report "}<code>{"q"}</code>{". A reward "}<code>{"S(q,y)"}</code>{" is proper if its expected value under outcomes "}<code>{"Y~p"}</code>{" is maximized by "}<code>{"q=p"}</code>{". It is strictly proper if this maximizer is unique. This is a population statement about the objective, not a guarantee that finite data and optimization recover "}<code>{"p"}</code>{"."}</Prose>
    
    <Prose>{"For log reward, "}<code>{"S(q,y)=log q_y"}</code>{". The reward lost by reporting "}<code>{"q"}</code>{" instead of "}<code>{"p"}</code>{" is:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\mathbb E_p[S(p,Y)-S(q,Y)]=\\sum_y p_y\\log\\frac{p_y}{q_y}=D_{\\mathrm{KL}}(p\\Vert q)."}</MathBlock>
    </div>
    
    <Prose>{"KL is nonnegative and vanishes at matching distributions. Assigning zero mass to an event with positive true probability makes the expected log reward negative infinity. A rare event can therefore matter even when it rarely changes the winning label."}</Prose>
    
    <DecisionRewardCurves />
    
    <Prose>{"The negative Brier reward is "}<code>{"-sum_k(q_k - 1[y=k])²"}</code>{". Its expected regret is "}<code>{"||p-q||²"}</code>{": expand both squared expressions and cancel the target-only terms. Unlike log reward, its penalty remains finite at a zero-probability mistake. The choice affects sensitivity and optimization even though both are strictly proper on the finite simplex."}</Prose>
    
    <Prose>{"The spherical reward is "}<code>{"q_y / ||q||₂"}</code>{". Its expected value is "}<code>{"p·q / ||q||₂"}</code>{". Cauchy–Schwarz bounds this by "}<code>{"||p||₂"}</code>{", with equality only when "}<code>{"q"}</code>{" is proportional to "}<code>{"p"}</code>{". Both rows sum to one, so proportionality means "}<code>{"q=p"}</code>{". This establishes strict propriety without assuming an empirical fitted model is already reliable. Positive weighted sums of strictly proper rewards remain strictly proper when the stated unmodified formulas and domain apply."}</Prose>
    
    <DecisionRankedScore />
    
    <Prose>{"An ordinal score can also use order. For "}<code>{"K"}</code>{" levels, define "}<code>{"F_q(j)"}</code>{" as the probability of a level at or below "}<code>{"j"}</code>{". The ranked probability score used here is a "}<strong>{"loss"}</strong>{":"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\operatorname{RPS}(q,y)=\\frac{1}{K-1}\\sum_{j=0}^{K-2}\\big[F_q(j)-1[y\\le j]\\big]^2."}</MathBlock>
    </div>
    
    <Prose>{"Each threshold is a binary Brier problem. Summing their proper losses gives a proper ordinal loss; all cumulative probabilities together determine the category masses. Predicting the farthest level incorrectly crosses more thresholds than missing by one level. This is meaningful only if the ordering itself is meaningful. Applying it to arbitrarily sorted bank-intent IDs would invent distances that the task never supplied."}</Prose>
    
    <Prose>{"A scoring rule tells us what honest reporting would optimize. We can minimize its differentiable loss directly. The next section examines a different route: sampling entire probability reports and assigning those reports rewards."}</Prose>
    
    <H2>{"9. A policy can sample probability reports"}</H2>
    
    <DecisionReportPolicy />
    
    <Prose>{"This is the deeper training branch. The sampled object will be a "}<strong>{"probability vector"}</strong>{", not a label. Start with centered logits "}<code>{"theta"}</code>{", whose entries sum to zero. Adding a common constant does not change softmax, so centering removes that redundant direction. Let "}<code>{"P = I - 11ᵀ/K"}</code>{" project a vector onto this "}<code>{"K-1"}</code>{" dimensional plane. Draw independent standard-normal noise "}<code>{"epsilon"}</code>{" and form:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"u=\\theta+\\sigma P\\epsilon,\\qquad q=\\operatorname{softmax}(u),\\qquad \\sigma>0."}</MathBlock>
    </div>
    
    <Prose>{"Every noisy "}<code>{"u"}</code>{" produces a full report "}<code>{"q"}</code>{". With a known constructed truth row "}<code>{"p=(0.6,0.3,0.1)"}</code>{", the finite experiment can compute its expected log reward plus half its spherical reward exactly. No category sampling is needed for that reward calculation. In a real observed-label setting, the reward source and its sampling noise would need their own specification."}</Prose>
    
    <Prose>{"The objective is the reward averaged over this Gaussian distribution of reports, "}<code>{"J_sigma(theta)=E[R(softmax(u))]"}</code>{". It is a "}<strong>{"smoothed"}</strong>{" objective. At nonzero sigma it is generally different from the reward of the deterministic report "}<code>{"softmax(theta)"}</code>{". The Gaussian score on the centered subspace is "}<code>{"P epsilon / sigma"}</code>{". Multiplying it by reward gives a likelihood-ratio gradient estimator. A differentiable reward also permits a pathwise derivative through "}<code>{"u"}</code>{"; the program uses a large independent pathwise sample as a numerical reference for the same smoothed objective."}</Prose>
    
    <DecisionEstimatorEvidence />
    
    <Prose>{"A baseline can reduce variance. A baseline independent of a sampled report contributes zero in expectation because the score has mean zero. For a group of "}<code>{"G"}</code>{" independent reports, the average reward of the other "}<code>{"G-1"}</code>{" reports is independent of the report being scored. This is the "}<strong>{"leave-one-out baseline"}</strong>{"."}</Prose>
    
    <Prose>{"Using the average of all "}<code>{"G"}</code>{" rewards includes the current report's reward. For report "}<code>{"i"}</code>{", subtracting that self-containing average produces exactly "}<code>{"(1-1/G)"}</code>{" times its leave-one-out advantage. The resulting group gradient is attenuated by the same factor. At "}<code>{"G=2"}</code>{", it is halved. The program checks this identity on every stored group, not merely on an average plot."}</Prose>
    
    <Prose>{"Dividing by the group's random reward standard deviation adds another dependence. That estimator is not generally a constant multiple of the desired gradient. A small epsilon prevents division by zero; it does not restore unbiasedness. The experiment retains this normalized method as a comparison and labels it accordingly."}</Prose>
    
    <Prose>{""}<code>{"report_policy.py"}</code>{" fixes theta "}<code>{"(0.4,-0.1,-0.3)"}</code>{", sigma "}<code>{"0.3"}</code>{", four group sizes and two random seeds before calculation. For each group size it computes 4,096 replicate gradient estimates and retains their aggregate summaries and first twelve estimates, with 131,072 independent vectors for the pathwise reference. These are finite estimator measurements. There is no language-model fit or PPO clipping step."}</Prose>
    
    <CodeBlock language={"sh"}>{"python report_policy.py --output report-policy.json"}</CodeBlock>
    
    <Prose>{"The complete code computes both likelihood-ratio and pathwise quantities from the same explicit reward. The standard-error bars describe Monte Carlo uncertainty in this finite example; they do not measure the quality of a pretrained decision model."}</Prose>
    
    <Program file="report_policy.py" />
    
    <H2>{"10. Audit the released training recipe"}</H2>
    
    <DecisionRecipeGraph />
    
    <Prose>{"The previous experiment makes the estimator easy to inspect. A released training recipe introduces additional choices. In the inspected Laya 0.4.0 notebook, Gaussian perturbations are centered across valid options. Sampled reports are evaluated under supplied soft targets. Their own group-mean reward is subtracted, and the resulting advantages are divided by a random standard deviation across the sampled tensor."}</Prose>
    
    <Prose>{"The log-density term is a Gaussian squared-distance score. The code also adds "}<strong>{"full-weight soft cross-entropy guidance"}</strong>{" to that policy term. Its behavior therefore cannot be explained as policy-only learning. There is no PPO ratio clip in this specific update. These observations concern the pinned public notebook, not every possible typed-decision training method."}</Prose>
    
    <Prose>{"The "}<code>{"proper_reward"}</code>{" function defaults to a spherical coefficient of "}<code>{"0.5"}</code>{"; the notebook actually passes "}<code>{"0.75"}</code>{". For ordered Score questions it additionally subtracts a normalized squared discrepancy between report and target CDFs. Comparing a forecast CDF to a soft target CDF is equivalent to expected label RPS up to a target-only constant. That distinction matters when interpreting the numeric reward, even though the report gradient is unchanged by the constant."}</Prose>
    
    <DecisionRareEvent />
    
    <Prose>{"There is also a consequential numerical modification. The source first clamps probabilities below "}<code>{"1e-12"}</code>{", takes their logarithm, and then clips log values at "}<code>{"-9.21"}</code>{". Below that log floor, further reducing a rare event's reported mass no longer incurs an additional log penalty. The unmodified log-score proof from section 8 no longer applies unchanged."}</Prose>
    
    <Prose>{"Consider true probabilities "}<code>{"p=(1-10^-6,10^-6)"}</code>{" and the report "}<code>{"q=(1-0.5×10^-6,0.5×10^-6)"}</code>{". Both rare-event log terms hit the floor. Moving mass toward the common event improves its log contribution to first order; the spherical reward loses only a second-order amount near its maximum. The finite program evaluates the exact clipped expression at both coefficients "}<code>{"0.5"}</code>{" and "}<code>{"0.75"}</code>{". This provides a counterexample to a blanket claim that the modified reward is strictly proper over every probability vector."}</Prose>
    
    <Prose>{"That counterexample does not establish that a particular trained model is bad. It establishes which theorem cannot be invoked without its conditions. Likewise, the notebook's held-out temperature fitting against teacher targets measures a different notion of agreement from calibration against independently observed human labels. Its current code separates calibration items before fitting; an older leakage criticism should not be carried forward after the code changes."}</Prose>
    
    <Prose>{"We now have enough distinctions to design our own measured example: define the events and labels, give each label one experimental job, freeze selection, and evaluate the resulting probability-to-action system."}</Prose>
    
    <H2>{"11. Give each label one experimental job"}</H2>
    
    <DecisionDataRoles />
    
    <Prose>{"A model can appear reliable if the same examples repeatedly influence its choices. We therefore assign labels four different jobs before fitting:"}</Prose>
    
    <NeuralTable caption={"11. Give each label one experimental job"} headers={[<>{"Cohort"}</>,<>{"Permitted influence"}</>,<>{"What remains frozen afterward"}</>]} rows={[[<>{"Training"}</>,<>{"Vocabulary, gradients and learned weights"}</>,<>{"Candidate meanings and the prospective training recipe"}</>],[<>{"Development"}</>,<>{"Select one checkpoint within each fixed seed"}</>,<>{"Selected weights; all three seeds remain reportable"}</>],[<>{"Calibration"}</>,<>{"Fit one temperature for each frozen predictor"}</>,<>{"Weights, temperature and primary routing rule"}</>],[<>{"Test"}</>,<>{"Measure the frozen pipeline"}</>,<>{"No feedback into any of those choices"}</>]]} />
    
    <Prose>{"The source dataset is BANKING77: 10,003 training queries, 3,080 test queries and 77 banking intents. We select six related card intents so that their meanings and confusions remain inspectable: arrival, delivery estimate, linking, not working, lost/stolen, and unrecognised payment. This is a six-intent experiment on an adapted cohort, not the original 77-way benchmark."}</Prose>
    
    <DecisionCohort />
    
    <Prose>{"The adapter pins the original CSV revision and hashes. It normalizes text using Unicode NFKC, case folding and whitespace collapse to remove exact duplicates, with original training rows taking precedence. Within the six intents it also applies the declared ASCII-word and 128-position scratch input screen. One duplicate and one overlength original training request are excluded from these intents. This does not rule out undetected paraphrase overlap."}</Prose>
    
    <Prose>{"Within each class, eligible original training IDs are ordered by a fixed hash. The first 40 become training, the next 10 development and the next 20 calibration. Twenty eligible original test rows per class form the test cohort. The final counts are 240, 60, 120 and 120, with 540 distinct source IDs and normalized texts. The largest selected scratch sequence has 122 positions. The smallest eligible training class still has 82 rows, enough for its 70 required assignments; no original test data is borrowed."}</Prose>
    
    <Prose>{"Candidate descriptions are fixed before outcomes. The target is the index of the corresponding original intent ID. The adapter preserves the original text, CSV split and row number, label, hashes and sequence length. These records let another person inspect both an example's meaning and its experimental role."}</Prose>
    
    <CodeBlock language={"sh"}>{"python prepare_banking.py --source-dir raw --output data"}</CodeBlock>
    
    <Prose>{"The "}<code>{"raw"}</code>{" folder must contain the exact pinned official "}<code>{"train.csv"}</code>{" and "}<code>{"test.csv"}</code>{" bytes. The provided bundle includes the prepared cohort and its provenance, so reading the lesson does not require preparing it again. The source is attributed under CC BY 4.0. The complete adapter rejects changed source bytes and insufficient class counts before producing a dataset."}</Prose>
    
    <Program file="prepare_banking.py" />
    
    <H2>{"12. Train, select and inspect the small model"}</H2>
    
    <DecisionTrainingHistory />
    
    <Prose>{"Now the direct supervised baseline has a real task. We reuse the exact 32-dimensional, two-block option-marker model from section 4. Only training rows create its vocabulary. Each seed begins from its own random initialization; there is no pretrained knowledge in this small model."}</Prose>
    
    <Prose>{"The prospective budget is three seeds—17, 29 and 43—with exactly 400 AdamW updates each. Learning rate is 0.003, weight decay 0.01, batch size 24 and gradient norm clipping 1. Each shuffled epoch visits all 240 training rows in ten batches. Candidate order is also permuted, and the target index moves with its candidate ID. This teaches the model on varied positions; it does not prove that the trained model is invariant to every permutation."}</Prose>
    
    <Prose>{"The full batch and permutation plans are saved before optimization. At steps 0, 40, 80, and so on through 400, evaluate development NLL. Choose the earliest minimum separately within each seed. Retain every seed rather than choosing a winner after seeing test accuracy. Seed 17 is designated in advance as the primary cheap model for the routing example."}</Prose>
    
    <CodeBlock language={"python"}>{"scores = model(*batch_rows(batch, vocabulary))\ntargets = torch.tensor([row['target'] for row in batch])\nloss = F.cross_entropy(scores, targets)\noptimizer.zero_grad(set_to_none=True)\nloss.backward()\ntorch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)\noptimizer.step()"}</CodeBlock>
    
    <Prose>{""}<code>{"scores"}</code>{" has shape "}<code>{"24 × 6"}</code>{". Each row's candidate order matches its target. The optimizer updates the whole scratch model. Development evaluation disables gradient recording; it changes the selected checkpoint file, not parameters. Only after all three selections are sealed do we save selected-model outputs for calibration and test."}</Prose>
    
    <DecisionConfusion />
    
    <Prose>{"Read the confusion matrix by true intent and predicted intent. Off-diagonal counts expose which meanings are confused. The selected request below it retains the original customer text. A high probability on the wrong intent is an informative error, not a row to remove from evaluation. When two descriptions share words, a lexical baseline based on word overlap can also be competitive or misleading; it is evaluated on the same ordered rows."}</Prose>
    
    <Prose>{"Use the complete program in two stages:"}</Prose>
    
    <CodeBlock language={"sh"}>{"python train_decision.py prepare --data data/banking.json --output results/scratch\npython train_decision.py fit --output results/scratch"}</CodeBlock>
    
    <Prose>{"Preparation writes the data identity, vocabulary, plans and protocol. Fitting checks those identities before training. The result includes initial and selected weights, terminal optimizer state, selected steps, histories and raw logits. The program refuses to overwrite an existing incomplete seed directory: an execution failure should remain diagnosable rather than trigger an unnoticed replacement experiment."}</Prose>
    
    <Prose>{""}<strong>{"Observed study outcomes."}</strong>{" All three seeds completed their declared 400 updates and selected step 400 by development NLL. Their development minima were 1.75518, 1.79180 and 1.63632 for seeds 17, 29 and 43. On the 120 test requests, their accuracies were 27/120, 20/120 and 33/120. The word-overlap baseline reached 43/120. These weak results show that a valid dynamic output interface and a correct training loop do not supply pretrained language understanding. We keep all three outcomes; extending training after seeing these test results would be a new experiment, not a repair to this one."}</Prose>
    
    <Program file="train_decision.py" />
    
    <H2>{"13. Calibrate after freezing the predictor"}</H2>
    
    <DecisionTemperature />
    
    <Prose>{"The selected checkpoint can rank intents usefully while reporting probabilities that are too sharp or too flat. Temperature scaling changes those probabilities using one positive scalar after the weights are frozen. A report of 0.8 would be top-confidence calibrated if comparable future selected answers were correct about 80% of the time. One scalar cannot guarantee that property for every class, subgroup, input type or deployment distribution."}</Prose>
    
    <Prose>{"Fit temperature on the calibration cohort, never on the test rows. Using "}<code>{"beta=1/T"}</code>{", its NLL is:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"L(\\beta)=\\frac1N\\sum_i\\left[\\log\\sum_k e^{\\beta z_{ik}}-\\beta z_{iy_i}\\right]."}</MathBlock>
    </div>
    
    <Prose>{"Differentiate one row. The derivative of log-sum-exp is the softmax-weighted mean of its logits. Thus "}<code>{"L'(beta)=mean_i(E_{p_beta}[z_i]-z_i,true)"}</code>{". Differentiate again and obtain the mean logit variance under that row's probabilities. Variance is nonnegative, so the scalar objective is convex in beta. All-equal logits give zero variance and a flat objective; temperature cannot change a uniform distribution."}</Prose>
    
    <Prose>{"The external fitter bounds beta in "}<code>{"[0.05, 20]"}</code>{", which also bounds reciprocal temperature in "}<code>{"[0.05, 20]"}</code>{". If the derivative at the low endpoint is already nonnegative, that endpoint minimizes the bounded objective. If it is still nonpositive at the high endpoint, choose the high endpoint. Otherwise bisection locates its zero. Report a boundary solution explicitly; a search constraint is part of the result, not evidence that the unbounded optimum was found."}</Prose>
    
    <DecisionCalibrationEvidence />
    
    <Prose>{"The program compares this derivative-based result with a bounded Torch LBFGS fit on the same calibration rows. It also reports the project's finite temperature grid from "}<code>{"exp(-3)"}</code>{" to "}<code>{"exp(3)"}</code>{", plus exactly 1. The grid and the continuous external fit have slightly different search endpoints and numerical resolution. They are reference optimization routes, not extra opportunities to select the prettiest test result."}</Prose>
    
    <Prose>{"Test NLL measures the probability assigned to observed outcomes; Brier sum measures the squared distance of the whole report from the observed one-hot row. Accuracy measures only the winning category. Positive temperature leaves the argmax unchanged, so raw and scaled accuracy should agree. If they do not, inspect ties, precision, row alignment or a hidden change beyond temperature."}</Prose>
    
    <Prose>{"A reliability diagram groups rows by their maximum reported probability and compares mean confidence with observed accuracy. Our main display has five fixed bins. Empty bins are absent, not plotted as zero accuracy. With only 120 test rows, changing the bins can change the visual impression; it does not alter the predictions or establish finer-grained calibration."}</Prose>
    
    <CodeBlock language={"sh"}>{"python calibrate_decisions.py --scratch results/scratch/logits.json \\\n  --native results/laya/logits.json --output results/calibration.json"}</CodeBlock>
    
    <Prose>{"The five predictors are all three scratch seeds, the lexical baseline and the native model introduced in section 16. Their IDs and labels must match exactly. The program preserves all five scalar fits. For raw-to-scaled metric changes, 1,000 paired bootstrap resamples use the same test row indices on both sides. These intervals describe resampling uncertainty in this cohort; they do not include every uncertainty from dataset design, training or a changed population."}</Prose>
    
    <Prose>{""}<strong>{"Observed calibration results."}</strong>{" Each scalar used only the 120 calibration rows. None reached the declared search boundary. Accuracy is unchanged by the positive temperature; the table's NLL and Brier values use the separate 120 test rows. Brier is the sum across all six events, averaged across requests."}</Prose>
    
    <NeuralTable caption={"13. Calibrate after freezing the predictor"} headers={[<>{"Predictor"}</>,<>{"Fitted T"}</>,<>{"Test accuracy"}</>,<>{"NLL: raw → scaled"}</>,<>{"Brier sum: raw → scaled"}</>]} rows={[[<>{"seed-17"}</>,<>{"0.46124"}</>,<>{"27/120"}</>,<>{"1.71481 → 1.68632"}</>,<>{"0.80442 → 0.79318"}</>],[<>{"seed-29"}</>,<>{"2.13122"}</>,<>{"20/120"}</>,<>{"1.79181 → 1.79177"}</>,<>{"0.83335 → 0.83334"}</>],[<>{"seed-43"}</>,<>{"0.88851"}</>,<>{"33/120"}</>,<>{"1.67481 → 1.67057"}</>,<>{"0.78045 → 0.77777"}</>],[<>{"lexical"}</>,<>{"1.01989"}</>,<>{"43/120"}</>,<>{"1.52033 → 1.52088"}</>,<>{"0.71361 → 0.71439"}</>],[<>{"laya"}</>,<>{"2.37079"}</>,<>{"87/120"}</>,<>{"1.22602 → 1.02035"}</>,<>{"0.45512 → 0.45285"}</>]]} />
    
    <Prose>{"The native model's NLL drops by about 0.20567 nats, with the predeclared paired bootstrap interval for scaled-minus-raw NLL approximately [−0.40128, −0.02037]. The lexical baseline's held-out NLL becomes slightly worse. Calibration-set optimization therefore does not promise a test improvement for every predictor, and lower NLL does not establish calibration in every subgroup."}</Prose>
    
    <Program file="calibrate_decisions.py" />
    
    <H2>{"14. Turn probabilities into costs"}</H2>
    
    <DecisionCostMatrix />
    
    <Prose>{"A probability report supports more than an argmax. Suppose a wrong automatic decision is costly, while review has a fixed cost. For an action "}<code>{"a"}</code>{" and actual outcome "}<code>{"y"}</code>{", let "}<code>{"C(a,y)"}</code>{" be its cost. The expected cost under the report is:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"R(a\\mid x)=\\sum_y p_y(x)\\,C(a,y),\\qquad a^*(x)=\\arg\\min_a R(a\\mid x)."}</MathBlock>
    </div>
    
    <Prose>{"The matrix in the drawing has actions as rows and possible outcomes as columns. Each cell's cost is multiplied by that column's probability. Sum across a row to compare actions. With probabilities "}<code>{"(0.6,0.3,0.1)"}</code>{" and action-cost rows "}<code>{"(0,4,10)"}</code>{", "}<code>{"(3,0,2)"}</code>{", "}<code>{"(8,2,0)"}</code>{", the expected costs are 2.2, 2.0 and 5.4. The most probable class is the first; the second action has lower expected cost under this asymmetric matrix. A perfect review costing 1 would be cheaper than either automatic action in this constructed example."}</Prose>
    
    <DecisionCostRegions />
    
    <Prose>{"When every wrong automatic classification costs "}<code>{"C_wrong"}</code>{" and every correct one costs zero, selecting the most probable class has estimated cost "}<code>{"C_wrong (1-pmax)"}</code>{". A "}<strong>{"perfect"}</strong>{" reviewer costing "}<code>{"C_review"}</code>{" is preferable unless that automatic cost is smaller. For wrong cost 10 and review cost 1, act only when "}<code>{"pmax > 0.9"}</code>{"; ties go to review in this policy."}</Prose>
    
    <Prose>{"That threshold is derived from a particular loss matrix and a perfect-review assumption. It is not a universal confidence standard. Change the error costs or permit reviewer mistakes and the optimal comparison changes. Likewise, miscalibrated probabilities can make a mathematically correct risk calculation systematically underestimate actual losses."}</Prose>
    
    <Prose>{"The simplex action regions show this relationship geometrically. Every point is a probability vector; each action's expected cost is a linear function of that vector. Boundaries occur where two such costs tie. Moving the review cost changes those regions even though the model's weights and probabilities remain fixed. A cost change is a policy change, not automatically a reason to retrain the encoder."}</Prose>
    
    <H2>{"15. Measure a real routing policy"}</H2>
    
    <DecisionRouting />
    
    <Prose>{"The real fallback is another model, so it can be wrong too. Let "}<code>{"e_f"}</code>{" be its observed hard-label error fraction on calibration rows. Our predeclared rule compares estimated cheap-model cost "}<code>{"10(1-pmax)"}</code>{" with fallback cost "}<code>{"0.5 + 10 e_f"}</code>{". Act cheaply only when the former is strictly smaller; otherwise call the fallback."}</Prose>
    
    <Prose>{"This uses a "}<strong>{"global"}</strong>{" fallback error estimate. Ideally we would know the fallback's error conditional on this particular request and the routing event. Harder rows may be exactly the ones routed, so global calibration-set accuracy need not describe them. The test evaluation therefore uses the fallback's actual predictions for the actual routed rows rather than treating fallback as an oracle."}</Prose>
    
    <Prose>{"Each test row contributes "}<code>{"10"}</code>{" if its final choice is wrong, plus "}<code>{"0.5"}</code>{" if the fallback was called. Average those costs across all 120 paired rows. Keep cheap wrong choices and fallback wrong choices separate. A routing policy can increase cost by paying for a fallback that repeats the same mistake or changes a correct cheap answer to an incorrect one."}</Prose>
    
    <DecisionRoutingEvidence />
    
    <Prose>{""}<strong>{"Coverage"}</strong>{" is the fraction handled by the cheap model. "}<strong>{"Selective risk"}</strong>{" is its error rate among only the rows it handles. When it handles no rows, that conditional error rate is undefined, not zero. The all-cheap and all-fallback policies provide useful endpoints. Fixed thresholds 0, 0.5, 0.7, 0.8, 0.9, 0.95 and 1 are additional diagnostics; they do not replace the predeclared rule with whichever looks best on this test plot."}</Prose>
    
    <Prose>{"The program uses cached predictions only. No additional model inference is needed to change a threshold in this measured cohort. Its paired bootstrap keeps each request's cheap result, fallback result and routing decision together, so a resample cannot combine evidence from different customers."}</Prose>
    
    <CodeBlock language={"sh"}>{"python evaluate_routing.py --calibration results/calibration.json \\\n  --output results/routing.json"}</CodeBlock>
    
    <Prose>{"Calling the fallback has a stipulated cost unit here. It is not a bill measured from an external service. Section 16 separately measures local execution time and memory. A production policy would need its own costs, current latency distribution and consequences of mistakes."}</Prose>
    
    <Prose>{""}<strong>{"Observed routing."}</strong>{" The fallback made 41 errors on the 120 calibration requests. Its estimated expected cost is therefore "}<code>{"0.5 + 10 × 41/120 = 3.91667"}</code>{", producing a cheap-action threshold "}<code>{"pmax > 0.60833"}</code>{". The designated seed17's raw probabilities route every test request to the fallback: 33 final errors and mean cost 3.25. Its calibrated reports handle five requests cheaply, all five correctly, and route 115 to the fallback. There are 32 final errors and mean cost 3.14583. Always using the cheap model instead costs 7.75."}</Prose>
    
    <Prose>{"Five covered requests are too few to establish a dependable low-risk operating region. The calibrated-policy cost interval is approximately [2.39156, 3.98344] under the recorded paired row resamples; it is an interval for that policy's mean cost, not an interval for its difference from the fallback. The saved diagnostics for seeds29/43 and the lexical model remain available, but do not replace the predeclared primary seed or select a threshold from test outcomes."}</Prose>
    
    <Program file="evaluate_routing.py" />
    
    <H2>{"16. Use the pinned ordinary tool"}</H2>
    
    <DecisionNativeArchitecture />
    
    <Prose>{"The scratch model makes every operation visible. The ordinary route uses "}<code>{"laya.Agent"}</code>{" with a pinned local English checkpoint and its actual pretrained weights. That model uses a ModernBERT-large encoder with width 1,024, adds a question-type embedding and two further transformer head layers, then gathers and scores option-marker states. Its learned action head is a separate output; it is not the cost policy or calibration model we derived above."}</Prose>
    
    <Prose>{"The checkpoint's configured maximum input length is 512 and its head budget is 192. Instructions and candidate text use some of that budget before state evidence is retained. The API reports state truncation and, when applicable, collapsed option spans. A syntactically valid returned label does not prove that the complete request or every candidate description was represented."}</Prose>
    
    <CodeBlock language={"python"}>{"from laya import Agent\n\nagent = Agent(local_checkpoint, device='cpu', backend='eager',\n              expected_sha256=checkpoint_hashes)\nquestions = {'intent': {\n    'type': 'choice',\n    'instructions': 'What is the customer asking about?',\n    'criteria': {option['id']: option['description'] for option in options},\n}}\nresults = agent.predict_batch(states, questions, batch_size=4,\n                              sort_by_length=False)"}</CodeBlock>
    
    <Prose>{"The local folder must contain the six exact files identified by "}<code>{"model-source.json"}</code>{", including the safetensors weights, tokenizer and encoder configuration. The README supplies acquisition links and the exact tested dependency versions. Checkpoint bytes are not bundled into the lesson download. The experiment uses the pinned Laya 0.4.0 API on CPU in float32 and eager mode, with four threads and no model weight updates."}</Prose>
    
    <DecisionNativeBatch />
    
    <Prose>{""}<code>{"predict_batch"}</code>{" receives the same questions for several states. It encodes a row for each state–question combination, collates rows, runs bounded forward passes and restores the per-state answer structure. Our typed example uses three questions on two constructed states, so it evaluates six question rows. Parallel batching reduces repeated call overhead; it does not make the answers independent or eliminate the encoder's arithmetic."}</Prose>
    
    <Prose>{"For calibration, we need the "}<strong>{"raw per-option logits"}</strong>{", not the four-decimal probabilities returned by native decoding. A read-only forward hook captures those logits during the same "}<code>{"predict_batch"}</code>{" calls. A declared equivalence batch compares them with the documented "}<code>{"records_from_labeled"}</code>{" collector and with one repeated batch. The hook returns no replacement output and changes no weights or predictions."}</Prose>
    
    <Prose>{"Three probability conventions remain visible:"}</Prose>
    
    <NeuralTable caption={"16. Use the pinned ordinary tool"} headers={[<>{"Convention"}</>,<>{"Calculation"}</>,<>{"Use here"}</>]} rows={[[<>{"Raw external"}</>,<>{""}<code>{"softmax(z)"}</code>{" at T=1"}</>,<>{"Unscaled probability baseline"}</>],[<>{"Calibrated external"}</>,<>{""}<code>{"softmax(z/T_external)"}</code>{" at full precision"}</>,<>{"Our held-out NLL, Brier and routing evidence"}</>],[<>{"Native shipped API"}</>,<>{"The checkpoint's type/bucket temperature, current serving clamp and rounding"}</>,<>{"Actual ordinary API output comparison"}</>]]} />
    
    <Prose>{"Current native serving clamps temperatures to "}<code>{"[0.5,5]"}</code>{". The shipped "}<code>{"choice:11+"}</code>{" value is outside that interval, causing the loader to warn and apply the boundary; that bucket is distinct from our main six-option cohort. The external fit's wider interval is never installed into the Agent. Saving and loading its separate postprocessor avoids silently applying a different native clamp or bucket override."}</Prose>
    
    <DecisionNativeCost />
    
    <Prose>{"The timing record distinguishes cold model load, the first batch of four, warm single-state API calls and warm batches of four. After three warmups it retains 20 batch-one timings and five batch-four timings, including median and 95th percentile. Batch throughput is examples per second; a batch duration is not a single request's latency. The reported process RSS is a snapshot after the campaign, not a peak-memory measurement."}</Prose>
    
    <CodeBlock language={"sh"}>{"python run_laya.py --checkpoint /path/to/local/laya \\\n  --checkpoint-manifest model-source.json --data data/banking.json \\\n  --shifts data/shifts.json --output results/laya"}</CodeBlock>
    
    <Prose>{"All cohort IDs, full raw rows, native answers, usage flags and observed forward shapes are saved. The bounded campaign includes calibration, test and the predeclared changed-input cases. Local CPU timing does not establish GPU serving performance or a vendor's quoted latency, and no remote service is called by this program."}</Prose>
    
    <Prose>{""}<strong>{"Observed native execution."}</strong>{" The pinned model has 421,293,827 parameters. On this Windows CPU with four Torch threads, cold loading took 53.99 seconds and the first batch of four took 5.68 seconds. Warm single-request calls had median 2.77 seconds and p95 5.71 seconds over 20 calls; five warm batches of four had median 4.66 seconds and p95 8.17 seconds. Aggregate throughput was 0.348 and 0.692 examples/second respectively. Process RSS afterward was 1,511,243,776 bytes. Other local work may contend for this shared machine, so these recorded timings describe this run and are not a controlled serving comparison."}</Prose>
    
    <Prose>{"The loader actually warned about the shipped "}<code>{"choice:11+"}</code>{" temperature 0.10058 and clamped it to 0.5. Our six-option cohort uses the distinct 6–10 bucket. Its external calibration temperature of 2.37079 is applied to saved raw logits, not installed into the native serving configuration."}</Prose>
    
    <Program file="run_laya.py" />
    
    <H2>{"17. Change the schema or evidence"}</H2>
    
    <DecisionSchemaShift />
    
    <Prose>{"The fixed test cohort asks how a pipeline performs under one schema and data selection. Controlled changes ask more specific questions about its mechanism. Choose the first test case of each intent by a fixed ID hash before inspecting model outputs. For four of those anchors, reverse the candidate order, paraphrase descriptions, remove the correct choice or add a distractor."}</Prose>
    
    <Prose>{"When reversing, align results by candidate ID before subtracting probability vectors. Comparing slot 0 with slot 0 would compare different events. Removing the correct event creates a forced-choice problem with no ordinary correct target; marking every remaining prediction as a standard classification error would hide the changed question. A normalized report can still look confident when the answer is absent."}</Prose>
    
    <Prose>{"Renaming only external IDs is an exact input null for the scratch encoder because those IDs are not tokenized. Its input tensors must match. Native IDs are rendered into option text, so renaming them is a measured intervention that may change logits. A shared output format cannot erase that implementation difference."}</Prose>
    
    <DecisionTokenBudget />
    
    <Prose>{"The long-context pair places the same linking clue before or after repeated neutral filler. The scratch model rejects over-budget requests. The native model has its own truncation policy; inspect its actual usage record and the location of retained evidence. A probability from an input missing its decisive sentence is a different computation from one using the full request."}</Prose>
    
    <DecisionShiftEvidence />
    
    <Prose>{"Two Hindi translations preserve the supplied English meanings but change the language. The ASCII scratch tokenizer rejects these all-Hindi state strings; the English pretrained checkpoint's returned output is recorded within that language limitation. We do not acquire or test a multilingual checkpoint here. Additional cases use two or eight candidates, and two rename IDs. Together the campaign contains 24 predetermined requests."}</Prose>
    
    <CodeBlock language={"sh"}>{"python shift_decisions.py --data data/banking.json --output data/shifts.json"}</CodeBlock>
    
    <Prose>{"Run this preparation before inference so the changed cases cannot be chosen for interesting-looking outcomes. The file retains every parent ID, changed field and valid target where one exists. These individual counterfactuals help diagnose a mechanism. They are too small and too constructed to estimate broad population robustness."}</Prose>
    
    <Prose>{""}<strong>{"Observed changed inputs."}</strong>{" Each scratch seed rejected the two Hindi states for containing no ASCII state word, and both long states for exceeding the 4,000-character input limit. Those are input rejections, not incorrect classification outputs. The native model retained 512 total tokens for each long request, dropping 620 or 619 state tokens. With the linking clue first, it selected card-linking; with the clue at the end, it selected card-arrival. This pair demonstrates the consequence of what actually survived truncation, not a general long-context accuracy rate. The two Hindi outputs and every schema intervention remain in the saved ledger, including erroneous choices."}</Prose>
    
    <Program file="shift_decisions.py" />
    
    <H2>{"18. Save the whole decision, then replay it"}</H2>
    
    <DecisionArtifact />
    
    <Prose>{"Saving only model weights does not preserve a decision system. The encoder also depends on its architecture, tokenizer or vocabulary, sequence budget, question text, candidate descriptions and order. The probability report depends on its calibration convention and fitted temperature. The action depends on its costs and tie rule."}</Prose>
    
    <Prose>{"The replay program fingerprints these dependencies. It loads local scratch weights with "}<code>{"weights_only=True"}</code>{", reconstructs the model and compares the first fixed test batch with its saved logits. It also checks the explicit attention calculation against scaled-dot-product attention and against extra right padding. These comparisons have declared floating-point tolerances: different batch shapes can change rounding without changing the algorithm."}</Prose>
    
    <Prose>{"For external native calibration, the same cached raw vectors and a JSON round trip of the fitted temperature must produce bitwise-identical float64 probabilities. That exact cached replay is a narrower claim than equality between different live CPU kernels or the native API's rounded display. The separately recorded repeated live batch supplies the qualified FP32 comparison."}</Prose>
    
    <CodeBlock language={"sh"}>{"python replay_artifact.py package --scratch results/scratch --native results/laya \\\n  --calibration results/calibration.json --routing results/routing.json \\\n  --checkpoint /path/to/local/laya --checkpoint-manifest model-source.json \\\n  --artifact-dir results/local-artifacts\npython replay_artifact.py saved --scratch results/scratch --native results/laya \\\n  --calibration results/calibration.json --routing results/routing.json \\\n  --artifact-dir results/local-artifacts --shifts data/shifts.json \\\n  --output results/local-replay.json"}</CodeBlock>
    
    <Prose>{"Create a fresh artifact directory for your local checkpoint location. The bundled "}<code>{"results/artifacts"}</code>{" and "}<code>{"results/replay.json"}</code>{" retain the original Windows checkout's relative paths as historical evidence; those paths do not automatically resolve after extracting the download elsewhere. Packaging checks all dependencies and creates local path bindings without training or inference. Keep the original results. The README distinguishes reproduction from simply inspecting them."}</Prose>
    
    <Prose>{"The recorded saved replay passed for all three selected models. Maximum first-batch logit differences were 1.19e−7, 0 and 2.38e−7, within the declared FP32 tolerance. SDPA and extra-padding equivalence also passed. Restoring the external native temperature reproduced its cached float64 probability vectors bitwise. These checks preserve a particular pipeline; they do not guarantee correctness on a new request."}</Prose>
    
    <Prose>{"Changing a candidate description invalidates a schema fingerprint because the model input and event interpretation changed. The old calibration may also cease to apply. Changing only the cost of fallback leaves the logits and temperature untouched but requires reevaluating the action policy. Keeping those dependencies separate makes it possible to change one part deliberately and test the consequences."}</Prose>
    
    <Prose>{"The completed path is now explicit: validate the requested events, encode their meanings, compute shared scores, normalize, train against declared targets, freeze and calibrate, then choose and measure actions under stated costs. Every interface has a boundary. A valid label, a proper objective, a passing gradient check and a reliable deployed decision are four different claims."}</Prose>
    </section>
    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
    <H2>{"19. Independent practice"}</H2>
    <Prose>{"Use the worked mechanisms to solve a changed case before opening its solution. Where a problem asks for a program change, keep the original result and create a fresh output file. Numerical checks should verify the claimed invariant, not only reproduce an existing printed number."}</Prose>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P1. Diagnose a valid wrong answer"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" A request says “I received the card yesterday but it fails at every shop.” The allowed IDs are arrival, not-working and lost. The model returns valid JSON selecting arrival with probability 0.92. Identify what passed, what failed and one useful diagnostic."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Separate membership in the output set from the meaning of the text."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Schema validity passed: arrival is an allowed ID and the output can be parsed. Semantic classification failed under the stated evidence; the card was received and does not work. The high probability does not resolve that contradiction. Inspect the encoded request for lost/truncated evidence, the descriptions and a held-out confusion row. A calibration adjustment might reduce confidence but cannot change a uniquely wrong argmax by positive scalar temperature alone."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P2. Add a candidate to three architectures"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" A fixed classifier has a "}<code>{"32 × 3"}</code>{" head. A dynamic marker scorer uses one "}<code>{"32 × 1"}</code>{" map. A constrained generator emits permitted label strings. Add a fourth event called “cash withdrawal.” Which structures must change, and which quality guarantee follows?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Count class-specific columns, marker rows and allowed token paths."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" The fixed head needs a fourth column and a way to learn its meaning. The dynamic model needs a fourth description/marker and corresponding candidate mask; its shared scalar map can retain its shape. The generator needs an allowed path for the label and a clear probability/decoding convention. None of these interface changes guarantees accurate recognition of the new event. Evaluate an independently designed new-schema cohort without using its test labels to choose descriptions or temperature."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P3. Catch a padded candidate"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" A two-option row is padded to three slots. Its stored logits are "}<code>{"(0, 0, 4)"}</code>{" and its valid mask is "}<code>{"(true, true, false)"}</code>{". Compute the correct probabilities and describe the failure if the mask is applied only after an unmasked softmax."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Normalization must exclude the invalid event from its denominator."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Both valid logits tie, so the correct report is "}<code>{"(0.5,0.5,0)"}</code>{". Unmasked normalization allocates most mass to the padded score 4. Setting that probability to zero afterward leaves the remaining entries summing to less than one unless they are renormalized. The simpler correct route masks before normalization. Extend "}<code>{"decision_math.py"}</code>{" with this case and an all-invalid row; assert the former matches the report and the latter raises an error."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P4. Shared parameters do not remove position"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" Both candidate markers pass through the same scalar head. A developer concludes that reversing their order must simply reverse the logits. Give two upstream operations that invalidate this conclusion and a fair test."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Inspect everything that happens before the scalar head."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Position embeddings change when marker and description positions change. Joint attention also sees the descriptions in a different positional context, so each gathered vector can change. Test the same state and identical candidate meanings in both orders; align by stable ID before comparing logits or probabilities. A shared head is compatible with either small or large order effects. Observing one unchanged pair does not prove general invariance."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P5. Remove an enormous common logit shift"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" Normalize "}<code>{"(1002,1001,1000)"}</code>{" at temperature 2 without overflowing. Explain why the result matches "}<code>{"(2,1,0)"}</code>{" at temperature 2 and why temperature zero is not an ordinary valid input to this formula."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Subtract the maximum after dividing by temperature."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" The shifted scaled logits are "}<code>{"(0,-0.5,-1)"}</code>{". Divide "}<code>{"(1,exp(-0.5),exp(-1))"}</code>{" by their sum. The common 1,000 disappears, giving the same vector as the smaller logits. At zero, division is undefined. A limiting argmax rule is a different operation; ties need their own treatment. Extend the shift-invariance check across several finite temperatures instead of testing only one hard-coded vector."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P6. Equal scores hide different uncertainty"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" Three ordered levels have indices "}<code>{"(0,1,2)"}</code>{". Compare distributions "}<code>{"a=(0.25,0.5,0.25)"}</code>{" and "}<code>{"b=(0,1,0)"}</code>{". Find their expected indices, then their expected values under rubric "}<code>{"(0,2,10)"}</code>{". Can a scalar mean recover either full distribution?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The same masses multiply different supplied values."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Both expected indices equal 1. Under the new rubric, "}<code>{"a"}</code>{" gives "}<code>{"0.25×0 + 0.5×2 + 0.25×10 = 3.5"}</code>{"; "}<code>{"b"}</code>{" gives 2. The first distribution is spread across levels while the second is certain at the middle level. One mean loses information and cannot generally reconstruct the original masses. Keep the legend, probability vector and rubric distinct in a serialized result."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P7. Follow a soft target through the gradient"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" A model reports "}<code>{"p=(0.5,0.3,0.2)"}</code>{" and the supplied target is "}<code>{"t=(0.2,0.6,0.2)"}</code>{". Compute the cross-entropy logit gradient. Then exchange candidate slots A and C in both vectors. What should happen to the gradient?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Targets and predictions must name the same events in each slot."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" The gradient is "}<code>{"p-t=(0.3,-0.3,0)"}</code>{". Gradient descent lowers A's logit and raises B's. Exchanging A and C in both vectors changes the gradient to "}<code>{"(0,-0.3,0.3)"}</code>{", exactly the same event-level change in the new order. Swapping only the target would train against a different meaning. Modify the finite one-step fixture and compare every parameter gradient with native CE after a consistent permutation."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P8. Prove the spherical maximizer"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" True probabilities are "}<code>{"p=(0.2,0.5,0.3)"}</code>{". Show that expected spherical reward is uniquely maximized by report "}<code>{"q=p"}</code>{", and state why the argument does not prove that a model trained on 240 requests is calibrated."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Apply Cauchy–Schwarz, then use the simplex sum constraint."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Expected reward is "}<code>{"(p·q)/||q||₂ ≤ ||p||₂"}</code>{". Equality requires "}<code>{"q=c p"}</code>{" with positive "}<code>{"c"}</code>{"; since both vectors sum to one, "}<code>{"c=1"}</code>{". Hence "}<code>{"q=p"}</code>{" is the unique optimum. The argument concerns an expectation under the true distribution and an unrestricted report. Finite samples, a restricted model, optimization, target noise and distribution shift can keep the trained report away from that optimum."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P9. Separate self mean from leave-one-out"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" A group has rewards "}<code>{"(1,2,5)"}</code>{". Compute the self-mean and LOO advantages. A report's score vector is then multiplied by its advantage and the products averaged. What exact factor relates the two group gradients?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The self mean is "}<code>{"8/3"}</code>{"; each LOO mean excludes one reward."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Self-centered advantages are "}<code>{"(-5/3,-2/3,7/3)"}</code>{". LOO advantages are "}<code>{"(-2.5,-1,3.5)"}</code>{". Every self-centered value is "}<code>{"2/3"}</code>{" of its LOO counterpart, so the group gradients have that same factor before random standardization or other changes. This is a pointwise identity, stronger than an approximate agreement between averages. A group-dependent random denominator introduces an additional relationship that this factor alone does not explain."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P10. Check a modified proper score"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" A library clips log reward below a fixed floor, then adds a positive spherical term. A comment calls the result strictly proper. Give a reason the unmodified log-score theorem is insufficient and outline a numeric counterexample test."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Place a true rare-event probability below the clipping floor."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Below the floor, reducing the rare-event report no longer reduces its log reward. Transfer a small amount of its mass to a common event. The common log contribution improves to first order while the spherical term's loss near its optimum is second order. Evaluate the exact implemented floor and weights at truth "}<code>{"(1-10^-6,10^-6)"}</code>{" and report "}<code>{"(1-0.5×10^-6,0.5×10^-6)"}</code>{" using float64. Preserve the original unmodified score as a control. A positive reward gain at the changed report contradicts strict propriety for that modified formula on the claimed full domain; it is not an empirical model-quality score."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P11. Find calibration leakage"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" A team fits weights on training rows, chooses a checkpoint on development rows, fits T on test labels, then reports test NLL after scaling. They argue that only one scalar was fitted. Repair the evaluation design."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The number of fitted parameters does not change which labels influenced it."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Test labels influenced T, so the reported result evaluates a pipeline partly selected on the same labels. Allocate a separate calibration cohort before fitting T and keep the test cohort untouched until the whole pipeline is frozen. With limited data, a carefully specified nested or cross-fitting design is possible, but it requires its own analysis. Calling the fitted scalar “postprocessing” does not remove leakage."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P12. Design a description-change experiment"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" The “lost card” description is changed to “card missing.” The test score improves. Why is this insufficient to conclude that the new description is better? Design a follow-up protocol with a falsifiable prediction."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Consider repeated choices made while looking at test outcomes and the overlap between arrival and lost-card language."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Choosing descriptions after seeing test scores adapts the schema to that test cohort. “Card missing” may also blur whether the card was ever received. Freeze two clear descriptions and a hypothesis—for example, the explicitly previously-received description reduces lost-versus-arrival confusion on a new labeled cohort. Select a fresh evaluation sample without using model outputs, retain both full probability vectors and paired mistakes, and predeclare the comparison. A null or reversed result must remain reportable."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P13. Know what temperature cannot fix"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" A row's logits are "}<code>{"(3,2,1)"}</code>{" but the observed class is C. Can any positive scalar T make C the unique argmax? If all logits instead equal 4, what can calibration learn from this row?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Division by a positive number preserves order."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" No: A remains strictly highest for every positive finite T. T can reduce or increase the probability assigned to C without reversing the ranking. Equal logits yield a uniform distribution at every positive T, so this row contributes a constant "}<code>{"log 3"}</code>{" to NLL and zero derivative/curvature in beta. Temperature calibration cannot recover distinctions absent from the logits."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P14. Act under asymmetric costs"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" For binary truth, "}<code>{"P(positive)=0.2"}</code>{". Predicting positive costs 2 when wrong; predicting negative costs 12 when wrong. Correct predictions cost zero. Perfect review costs 1.5. Compute all three expected costs and choose."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Weight each mistake by the probability of the outcome that makes it wrong."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Positive prediction costs "}<code>{"0.8×2=1.6"}</code>{". Negative prediction costs "}<code>{"0.2×12=2.4"}</code>{". Review costs 1.5, so review is preferred. If review were unavailable, positive would be the lower-risk action even though negative is more probable. This is why a probability argmax is optimal only for particular symmetric loss structures."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P15. A fallback can make a correct answer worse"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" Four paired requests have cheap correctness "}<code>{"(1,1,0,0)"}</code>{" and fallback correctness "}<code>{"(1,0,1,0)"}</code>{". The policy sends requests 2 and 3 to fallback. Using wrong cost 10 and call cost 0.5, compare the mean realized cost with all-cheap and all-fallback."}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Routing changes request 2 from correct to wrong and request 3 the other way."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Final correctness is "}<code>{"(1,0,1,0)"}</code>{", giving two wrong choices and two calls: total cost "}<code>{"20+1=21"}</code>{", mean 5.25. All-cheap has two errors and no calls: mean 5. All-fallback has two errors and four calls: mean 5.5. Routing beats all-fallback but loses to all-cheap in this fixture. A global fallback accuracy of 50% says nothing by itself about which particular cheap mistakes it repairs."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P16. Replay the actual artifact"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" Keep a completed artifact's weights unchanged, then edit its candidate description or external calibration file before loading it. What should the real loader do, and why is recomputing new hashes during replay an incorrect test?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Validation compares observed inputs with previously saved expected identities."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" It should reject the mismatch before running inference or applying the changed temperature. Recomputing hashes from the changed files and comparing them with themselves merely assigns a new identity; it does not validate the old artifact. Use the actual "}<code>{"load_artifact"}</code>{" path in "}<code>{"loader-checks"}</code>{" with small temporary files, verify unchanged loading, then change one dependency at a time and require rejection. Hashes detect drift under this trust model; they are not signatures proving who created an artifact."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P17. Diagnose a missing answer and missing evidence"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" In case A, the correct candidate is removed. In case B, the correct candidate remains but the decisive sentence is truncated. Both native calls return a valid ID with high confidence. What evidence distinguishes them, and what accuracy denominator is appropriate?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Inspect both schema and token-budget records."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Case A's original target ID is absent from the allowed set, so the changed request has no ordinary valid target. Record its forced-choice output without mixing it into ordinary accuracy. Case B still has a valid target, but the model saw incomplete evidence; inspect retained/dropped tokens and usage flags. It can be counted in a clearly defined truncation robustness test, with the input condition stated. A valid ID detects neither failure mode."}</Prose>
    </details>
    </section>
    <section className="typed-practice" data-lesson-exercise>
    <H3>{"P18. Change costs without changing probabilities"}</H3>
    
    <Prose>{""}<strong>{"Problem."}</strong>{" Wrong cost remains 10. Fallback calibration error is 0.1, but its call cost rises from 0.5 to 2. A cheap model reports "}<code>{"pmax=0.75"}</code>{". Compare actions under the two policies. Which artifacts change, and what additional deployment question remains unresolved?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Compare the cheap risk 2.5 with each complete fallback cost."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Initially fallback risk is "}<code>{"0.5+10×0.1=1.5"}</code>{", so route to fallback. After the price change it is "}<code>{"2+1=3"}</code>{", so act cheaply because 2.5 is lower. The weights, raw logits and fitted temperature can remain unchanged; the policy and its serialized cost inputs change. Reevaluate paired realized costs. The global fallback error may not describe the newly routed subset, so conditional error and changed traffic still need evidence."}</Prose>
    </details>
    </section>
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning">
    <H2>{"20. Further learning"}</H2>
    
    <ul>
    <li>{""}<a href={"https://web.stanford.edu/~jurafsky/slp3/4.pdf"}>{"Speech and Language Processing, chapter 4"}</a>{" develops logistic and multinomial regression, softmax and cross-entropy. Use its derivation to connect candidate-logit gradients with ordinary classifiers. The cited online third-edition chapter is a changing draft; the lesson's research record identifies the version consulted."}</li>
    <li>{""}<a href={"https://d2l.ai/chapter_attention-mechanisms-and-transformers/transformer.html"}>{"Dive into Deep Learning: the Transformer"}</a>{" supplies an explained encoder implementation. Trace its residual and masking operations alongside the small option-marker model rather than treating “encoder” as an unexplained library box."}</li>
    <li>{""}<a href={"https://proceedings.mlr.press/v70/guo17a.html"}>{"Guo et al., On Calibration of Modern Neural Networks"}</a>{" introduces the empirical temperature-scaling perspective and its evaluation conventions. Read it after section 13 to distinguish a useful one-parameter method from a universal calibration guarantee."}</li>
    <li>{""}<a href={"https://sites.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf"}>{"Gneiting and Raftery, Strictly Proper Scoring Rules, Prediction, and Estimation"}</a>{" provides the theoretical treatment behind log, quadratic and spherical scores. Start with finite categorical examples before extending to continuous forecasts."}</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="references">
    <H2>{"21. Technical references and reproducibility"}</H2>
    
    <Prose>{"The mathematical formulas are derived above; the following sources establish the dataset, actual public implementation and architectural context."}</Prose>
    
    <NeuralTable caption={"21. Technical references and reproducibility"} headers={[<>{"Source"}</>,<>{"What it supports"}</>,<>{"Scope of use"}</>]} rows={[[<>{""}<a href={"https://arxiv.org/abs/2003.04807"}>{"BANKING77 paper"}</a>{" and "}<a href={"https://github.com/PolyAI-LDN/task-specific-datasets/tree/57ec275d8078af65b7731c2a98be812d844a6d6b/banking_data"}>{"pinned dataset"}</a>{""}</>,<>{"Original intent corpus and task definition"}</>,<>{"Our adapted six-intent cohort is separately documented; original reported benchmark results are not local measurements"}</>],[<>{""}<a href={"https://github.com/NandhaKishorM/laya/tree/3cf26cbcb18725dbc2d127bb8bb2c4c43243ae63"}>{"Laya source revision"}</a>{""}</>,<>{"Encoder/head, serialization, native API, reward and calibration conventions"}</>,<>{"Specific inspected functions and notebook; their defaults are version-specific"}</>],[<>{""}<a href={"https://huggingface.co/convaiinnovations/laya/tree/7b928d828b7b0e022f929d9bd2e44165aa270148"}>{"Pinned Laya checkpoint"}</a>{""}</>,<>{"Actual English model/config/tokenizer identities"}</>,<>{"The local CPU study uses this checkpoint; sibling multilingual weights are not evaluated"}</>],[<>{""}<a href={"https://arxiv.org/abs/2412.13663"}>{"ModernBERT"}</a>{""}</>,<>{"Modern bidirectional encoder design"}</>,<>{"Architectural context for the native model; not a reproduction of its pretraining"}</>],[<>{""}<a href={"https://huggingface.co/jhu-clsp/mmBERT-base"}>{"mmBERT model card"}</a>{""}</>,<>{"A related multilingual encoder and its declared training context"}</>,<>{"Further context only; no local mmBERT weights or quality results"}</>]]} />
    
    <Prose>{"The downloadable programs include the exact scratch core, preparation and evaluation code, fixed cohort, prospective protocol, observed outputs and environment requirements. Large pretrained weights remain a separate acquisition. File identities connect results to the source that produced them. The native external postprocessor remains separate from the Agent's shipped temperature and rounded-output conventions."}</Prose>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="readiness">
    <H2>{"22. Ready to explain, implement and extend"}</H2>
    
    <Prose>{"You should now be able to trace one candidate through tokenization, contextual marker state, shared scalar score, normalized report and expected action cost. Explain why an unknown output ID can be prevented while a semantic mistake remains possible. Implement the stable masked loss, state which labels train weights versus temperature, and show a saved artifact rejecting changed inputs."}</Prose>
    
    <Prose>{"For a practical extension, continue with the "}<a href={"/learn/projects/typed-decision-model"}>{"Typed Decision Model project"}</a>{". It exposes the encoder, pretrained adapter and research tools as editable files. Keep its constructed fixtures distinct from this lesson's real-data cohort and fallible fallback experiment. A useful next project is a new domain with a predeclared schema, independent calibration/test roles and an explicit cost matrix—not an extra round of tuning on the same 120 test requests."}</Prose>
    
    <Prose>{"The broader LLM training sequence next turns toward inference efficiency. Probability quality, decision costs and serving resources interact, but a faster model does not automatically produce better-calibrated decisions. Carry the same separation of mechanism, measured evidence and action into that work."}</Prose>
    </section>
  </div>;
}
export default {
  title: 'Typed Decision Models & Calibrated Neural Decision Systems',
  slug: 'typed-decision-models-calibrated-neural-decision-systems',
  readTime: '~80 min read + 100 min practice',
  content: TypedDecisionLesson,
};
