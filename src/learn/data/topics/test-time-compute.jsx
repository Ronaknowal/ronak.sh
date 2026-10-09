// Prepared accepted content rendered by scripts/render-test-time-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../components/lesson-labs/TestTimeShared.jsx';
import { CandidateBoundary, WorkTimeline, ComputeLedger, Opportunity, ScoreSelection, AnswerGroups, VoteDistribution, RiskMatrix } from '../../components/lesson-labs/TestTimeSelection.jsx';
import { SearchTree, SearchWork, Revisions, HybridSchedule, BudgetController } from '../../components/lesson-labs/TestTimeSearch.jsx';
import { CandidateInspector, OutcomeGrid, ObservedCost } from '../../components/lesson-labs/TestTimeEvidence.jsx';
import { BudgetFrontier, AllocationInformation, AmortizedWork, ProviderFields } from '../../components/lesson-labs/TestTimeAllocation.jsx';
import '../../components/lesson-labs/lesson-flow.css';
function Program({ file }) { return <RemoteCodeBlock source={'/learn/examples/test-time-compute/' + file} language="python" title={file} filename={file}/>; }
function TestTimeLesson() { return <div className="lesson-flow ttc-flow"><section>
<Prose>{"An answer can improve because the model changed, or because a fixed model was used differently. This lesson follows the second possibility: spend more inference work on candidates, checks, revisions or intermediate search, then decide what to return. The useful question is "}<strong>{"which additional work changes the decision, and how will we know whether it helped?"}</strong>{""}</Prose>

<Prose>{""}<strong>{"You will learn to"}</strong>{" implement candidate selection without seeing evaluation answers, compare work with waiting time, understand when voting and search help, run a small fixed-model experiment, and allocate a declared budget. The examples include complete Python programs and their actual retained outputs."}</Prose>

<Prose opening="prerequisites">{""}<strong>{"Useful prerequisites:"}</strong>{" "}<a href={"/learn/path/full-curriculum/decoding-strategies-greedy-beam-top-k-top-p-temperature?module=large-language-models"}>{"Decoding Strategies"}</a>{" explains token sampling; "}<a href={"/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models#9-search-before-the-answer-is-finished"}>{"PRM versus ORM"}</a>{" supplies the complete beam/UCT implementation reused here. We refresh both contracts. Basic probability and Python are enough for the first pass."}</Prose>

<Prose opening="route">{""}<strong>{"First pass:"}</strong>{" sections 1–5, the search/revision pictures in 7–9, and the actual experiment and metrics in 10–11. Continue to 12–14 when choosing deployment budgets. Section 6's decision theory and the deeper derivations in 3, 5, 7 and 13 remain visible for a second reading. Practice, programs and annotated resources finish the lesson."}</Prose>

<span id="1-why-it-exists" aria-hidden="true"/><span id="1-start-with-the-problem" aria-hidden="true"/><H2>{"1. Spend work before choosing an answer"}</H2>

<Prose>{"A box contains 15 counters. Remove 4, then divide the remainder equally between 2 bags. What number belongs in each bag? Follow five proposed answers through the same decision boundary."}</Prose>

<CandidateBoundary/>

<Prose>{"Candidate A says "}<code>{"5.5"}</code>{"; B says "}<code>{"11/2"}</code>{"; C says "}<code>{"7.5"}</code>{"; D says "}<code>{"2/11"}</code>{"; E says "}<code>{"roughly five"}</code>{". A and B express the same correct number. C forgot the removal, D inverted the division, and E violates the numeric output contract. These are deliberately constructed candidates, not quotations from a model. Their colours identify them even when the selection changes."}</Prose>

<Prose>{"The solid path is the system available at inference: prompt, generation, answer extraction, selection, returned answer. The dashed path introduces the known answer only for evaluation. A selector that receives the correct answer can demonstrate an upper opportunity bound, but cannot demonstrate deployable selection. A task may provide an executable checker—such as a unit test or proof checker—at inference. That is an explicit available tool with its own cost and limitations, different from quietly reading hidden evaluation labels."}</Prose>

<Prose>{"A "}<strong>{"candidate"}</strong>{" is a generated response. A "}<strong>{"selection policy"}</strong>{" maps the available candidates and permitted scores to one response, one answer or an abstention. A "}<strong>{"test-time compute policy"}</strong>{" additionally decides how many calls to make, their dependencies and when to stop. Its state can change while the model's numerical weights remain fixed. Training may have taught the model to revise effectively; the current revision call still performs inference."}</Prose>

<Prose>{"We will keep three questions separate: did generation produce a useful answer, could the selector identify it, and what did the complete procedure cost? More candidates address the first question. They can also make the second harder if a flawed judge rewards a particularly persuasive error."}</Prose>

<H2>{"2. Count work and waiting separately"}</H2>

<Prose>{"Before choosing a method, decide what the budget measures. Three calls taking 2 seconds each provide a small scheduling example."}</Prose>

<WorkTimeline/>

<Prose>{"With one worker, the calls occupy 6 seconds. With three ideal independent workers and no overhead, they can finish after 2 seconds while still consuming 6 worker-seconds. A chain of three revisions cannot use this shortcut: the second prompt needs the first answer. Parallelism changes waiting time without automatically reducing total work."}</Prose>

<Prose>{"Real workers share memory bandwidth, batch capacity and queueing delays, so the drawn durations are supplied scheduling inputs. They are not GPU measurements. A user deadline includes queueing, prompt processing, generation, judging and return transport. A generated-token budget counts another quantity. Neither can be replaced by a candidate count without knowing candidate lengths and other work."}</Prose>

<ComputeLedger/>

<Prose>{"The generator emits tokens; a verifier reads candidates and may generate judgments; answer parsing and selection consume CPU work. Prompt tokens can be processed repeatedly. With two independent revision chains of depth 3, original prompt length 20 and 10 generated tokens per call, each chain reads prompts of lengths 20, 30, 40. Across both chains that is 180 prompt-token positions and 60 generated tokens. The calculation assumes previous answers are appended and no prefix-cache saving. Cached prefixes change the actual work; they do not make the longer logical context disappear."}</Prose>

<Prose>{"The complete finite programs need Python 3.12 or later. Most use only its standard library. The reused PRM program also imports NumPy and PyTorch; the pretrained experiment adds Transformers and SentencePiece. Download the "}<a href={"/learn/examples/test-time-compute/test-time-compute.zip"}>{"complete example bundle"}</a>{", unpack it, and create an environment before running files:"}</Prose>

<CodeBlock language={"shell"}>{"python -m venv .venv\n# Windows: .venv\\Scripts\\activate\n# macOS/Linux: source .venv/bin/activate\npython -m pip install -r requirements.txt\npython budgeting.py"}</CodeBlock>

<Prose>{"The pinned requirements describe the environment used for the retained example. Model weights are acquired separately and are not embedded in the bundle. The numeric mechanisms can be read and run before downloading any model."}</Prose>

<Program file="budgeting.py"/>

<Prose>{""}<code>{"schedule"}</code>{" keeps a heap of each worker's next free time. Each supplied job takes the earliest worker, and the function records its actual start/end under this simple model. "}<code>{"total_work"}</code>{" sums durations; "}<code>{"makespan"}</code>{" reads the last finish. "}<code>{"hybrid"}</code>{" sums the growing prompts explicitly. Change workers from 3 to 1 while leaving durations fixed: work remains 6 and waiting changes. Change revision depth instead: both the call count and serial dependency grow. The later "}<code>{"exchange"}</code>{" function is used in section 13."}</Prose>

<span id="2-core-intuition" aria-hidden="true"/><span id="2-build-the-intuition" aria-hidden="true"/><H2>{"3. A correct candidate is an opportunity"}</H2>

<Prose>{"Suppose each independent attempt succeeds with probability "}<InlineMath>{"p"}</InlineMath>{", under one fixed question and sampling policy. A second attempt supplies another chance. First examine what happens when attempts really are independent, then when they are exact duplicates."}</Prose>

<Opportunity/>

<Prose>{"For "}<InlineMath>{"N"}</InlineMath>{" independent attempts, every attempt fails with probability "}<InlineMath>{"(1-p)^N"}</InlineMath>{". The complementary event is that at least one succeeds:"}</Prose>

<div className="neural-equation"><MathBlock>{"P(\\text{at least one correct})=1-(1-p)^N."}</MathBlock></div>

<Prose>{"At "}<InlineMath>{"p=.3,N=4"}</InlineMath>{", the opportunity is "}<InlineMath>{"1-.7^4=.7599"}</InlineMath>{". This is "}<strong>{"pool coverage"}</strong>{", not the probability that an arbitrary judge returns the right answer. It becomes the performance of an ideal selector only when that selector can always recognize a successful member. It also assumes the same success probability and conditional independence for these attempts. Across questions, success probabilities usually differ; average the per-question opportunities rather than inserting the overall average "}<InlineMath>{"p"}</InlineMath>{" into a nonlinear formula."}</Prose>

<Prose>{"If four candidates are copies of the same sampled response, the opportunity remains .3. They occupy four visible positions but provide only one random attempt. More generally, shared errors, restricted diversity or dependent revisions can invalidate the independent-attempt calculation. Different answers do not by themselves prove independence; equal answers do not by themselves disprove it."}</Prose>

<Prose>{"The boundary cases explain the formula's limits. With "}<InlineMath>{"N=1"}</InlineMath>{", opportunity is "}<InlineMath>{"p"}</InlineMath>{". With "}<InlineMath>{"p=0"}</InlineMath>{", repeated sampling from that unchanged distribution cannot discover a correct answer. With "}<InlineMath>{"p=1"}</InlineMath>{", one attempt already succeeds. The incremental opportunity from attempt "}<InlineMath>{"N+1"}</InlineMath>{" is "}<InlineMath>{"p(1-p)^N"}</InlineMath>{", so its benefit diminishes under these particular assumptions. This is a property of the mathematical model, not a universal empirical scaling law."}</Prose>

<Program file="probability.py"/>

<Prose>{""}<code>{"opportunity"}</code>{" evaluates the complement. "}<code>{"binary_majority"}</code>{" and "}<code>{"plurality"}</code>{" will answer the selection question in section 5; "}<code>{"pass_at_k"}</code>{" will evaluate a retained pool in section 11. The small plurality enumerator deliberately limits its domain because listing all "}<InlineMath>{"K^N"}</InlineMath>{" possible answer sequences grows exponentially. It is a correctness oracle for small examples, not a practical generator."}</Prose>

<CodeBlock language={"shell"}>{"python probability.py"}</CodeBlock>

<Prose>{"The program prints opportunity .7599 and the separate exact calculations used below. Trying "}<InlineMath>{"p=0"}</InlineMath>{" or one candidate provides a useful null case: a higher count cannot overcome zero support, and one draw leaves no selection advantage."}</Prose>

<span id="4-from-scratch-implementation" aria-hidden="true"/><H2>{"4. Select with an imperfect score"}</H2>

<Prose>{"An ideal checker is unusual. A learned verifier often supplies an imperfect score instead. Watch what happens when the pool gains a high-scoring wrong answer."}</Prose>

<ScoreSelection/>

<Prose>{"With A scored .7 and B scored .65, either can provide the correct answer 11/2. Adding C scored .9 makes "}<strong>{"best-of-N"}</strong>{" choose 7.5. Opportunity has not fallen: a correct candidate still exists. Selected correctness has fallen because the score ordering is wrong. E can have the highest score of all, yet our declared numeric task first rejects its malformed answer. Filtering eligibility is part of the policy and must be applied consistently."}</Prose>

<Prose>{"For eligible candidates "}<InlineMath>{"y_1,\\ldots,y_N"}</InlineMath>{" and available scores "}<InlineMath>{"s_i"}</InlineMath>{", best-of-N selects an index maximizing "}<InlineMath>{"s_i"}</InlineMath>{". Exact ties need a rule; our implementation keeps the earliest candidate. The scores may be probabilities, logits or rankings, but that interpretation must be supplied by the verifier's training target. Calling a number a confidence does not make it calibrated correctness."}</Prose>

<Prose>{"A judge's overall precision cannot determine this decision. Precision measures the fraction correct among some accepted population at some threshold. Best-of-N depends on the relative ordering within each pool, especially its extreme scores. The same aggregate error rate can coexist with very different ranking failures. Search can expose cases where the judge is confidently wrong, so raising "}<InlineMath>{"N"}</InlineMath>{" can improve opportunity and worsen selection at the same time."}</Prose>

<Program file="selection.py"/>

<Prose>{""}<code>{"Candidate"}</code>{" contains identity, text and a nonnegative score. There is deliberately no correctness field. "}<code>{"canonical_answer"}</code>{" returns an exact numeric key or "}<code>{"None"}</code>{"; "}<code>{"select"}</code>{" sees only eligible candidates. In "}<code>{"best"}</code>{" mode it maximizes score with input-order ties. Empty eligible sets return an explicit abstention. Nonnegative weights are required because the same object also supports weighted voting; a real signed reward needs a separately justified transformation before it is added as a vote mass."}</Prose>

<CodeBlock language={"shell"}>{"python selection.py"}</CodeBlock>

<Prose>{"The constructed pool returns 15/2 under best-individual selection and 11/2 under ordinary or weighted voting. These are different decision rules over the same candidates. Their disagreement motivates examining what a vote represents."}</Prose>

<H2>{"5. Combine answers, not spellings"}</H2>

<Prose>{"Counting raw text would give "}<code>{"5.5"}</code>{" and "}<code>{"11/2"}</code>{" separate votes. Trace the spelling-to-answer operation before counting agreement."}</Prose>

<AnswerGroups/>

<Prose>{"The parser converts an accepted decimal or fraction to a reduced rational number. "}<code>{"5.5"}</code>{", "}<code>{"11/2"}</code>{" and "}<code>{"22/4"}</code>{" all become 11/2. A zero denominator or extra prose remains invalid. This exact numeric equivalence is useful here, but does not establish equivalence of arbitrary algebraic expressions, units, programs or proofs. The parser is part of the task specification."}</Prose>

<Prose>{"Our parser accepts a whole numeric string, or the final numeric substring following the last literal "}<code>{"Answer:"}</code>{" marker. It does not pick a convenient number out of prose. Invalid candidates consume generation work but cast no vote. If every candidate is invalid, the policy abstains. If several answer groups tie, the group first encountered wins. That tie rule is deterministic; it does not assert that the first answer is more reliable."}</Prose>

<Prose>{"The most frequent answer is a "}<strong>{"plurality"}</strong>{" winner. It is a majority only when it holds more than half the votes. For example, three answer probabilities .4, .35, .25 have a unique modal first answer even though its probability is below .5."}</Prose>

<VoteDistribution/>

<Prose>{"For independent draws from a fixed finite answer distribution with a unique mode, empirical frequencies converge to those probabilities. If the correct answer is the mode, sufficiently many draws increasingly identify it; if a wrong answer is the mode, voting increasingly returns that wrong answer. A tie for the largest true probability needs separate analysis. “Correct more often than random” is not enough: .4 exceeds 1/3 but still loses when another answer has probability .5."}</Prose>

<Prose>{"The familiar binary formula is a special case. With odd "}<InlineMath>{"N"}</InlineMath>{", two alternatives and independent correctness probability "}<InlineMath>{"p"}</InlineMath>{", a correct majority has probability"}</Prose>

<div className="neural-equation"><MathBlock>{"\\sum_{k=(N+1)/2}^{N}\\binom{N}{k}p^k(1-p)^{N-k}."}</MathBlock></div>

<Prose>{"At "}<InlineMath>{"p=.55,N=3"}</InlineMath>{", this is .57475. The three-answer example "}<InlineMath>{"(.4,.35,.25)"}</InlineMath>{" instead gives first-answer selection probability .465212 at seven votes under the program's first-occurrence ties, found by exact enumeration. Applying the binary formula to it would merge all wrong answers into one competitor that the real voting rule does not use."}</Prose>

<Prose>{"Wang and colleagues' self-consistency method samples reasoning paths and aggregates their final answers. Its practical benefit depends on the model, prompt, extraction and task. Our local pretrained experiment will use numeric-answer sampling without CoT exemplars, so it tests this simpler voting pipeline rather than reproducing their reasoning experiment. Neither route makes extra generations free."}</Prose>

<span id="3-mathematical-foundation" aria-hidden="true"/><span id="3-make-the-idea-precise" aria-hidden="true"/><H2>{"6. Decide what agreement should mean"}</H2>

<Prose>{"Unit votes ignore scores. Weighted voting can sum a declared nonnegative score within each answer group. In our running pool, A and B contribute .7+.65=1.35 to 11/2, which beats C's.9 for 15/2. Taking the mean instead gives .675 versus .9 and reverses the result. Taking the maximum chooses C directly. Sum, mean and maximum encode different policies."}</Prose>

<Prose>{"PRM scores need another reduction before this answer-level aggregation. Minimum local score, product of local probabilities, and a last-step continuation-value score mean different things. The earlier "}<a href={"/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models#6-turn-many-scores-into-one-decision"}>{"score-reduction lesson"}</a>{" develops those targets. A paper finding that a last-step reduction worked best for one PRM does not establish a universal reduction rule. Summing log scores also differs from summing probability masses, even when logs preserve individual ranking."}</Prose>

<Prose>{""}<strong>{"Deeper: choose an action under an explicit loss."}</strong>{" Agreement is valuable only relative to what mistakes cost. Use a new small answer distribution, 0/2/10 with probabilities .4/.35/.25, to make the distinction visible."}</Prose>

<RiskMatrix/>

<Prose>{"Each matrix row is a candidate action; each column is a possible reference answer. With exact-match loss, a row pays 1 whenever action and reference differ. Its expected loss is 1 minus that action's probability, so action 0 wins. With absolute numeric loss, the expected losses are 3.2, 2.8, 6.8; action 2 wins. A changed loss changed the decision while the probability distribution stayed fixed."}</Prose>

<Prose>{"This is "}<strong>{"minimum Bayes risk"}</strong>{" relative to an estimated distribution "}<InlineMath>{"q"}</InlineMath>{":"}</Prose>

<div className="neural-equation"><MathBlock>{"a^*=\\arg\\min_{a\\in\\mathcal A}\\sum_y q(y)\\,\\ell(a,y)."}</MathBlock></div>

<Prose>{"Here "}<InlineMath>{"\\mathcal A"}</InlineMath>{" is the permitted action set, "}<InlineMath>{"y"}</InlineMath>{" a possible reference and "}<InlineMath>{"\\ell"}</InlineMath>{" the stated loss. Under absolute loss on the real line, a weighted median minimizes risk. Our finite action set contains such a median. A model-distribution optimum need not minimize true task risk if the model or loss is wrong."}</Prose>

<Program file="decision_risk.py"/>

<Prose>{""}<code>{"minimum_risk"}</code>{" constructs the complete action-by-reference loss matrix, normalizes nonnegative weights and sums each row. Fractions keep the worked decimals exact until display. Stable input-order ties make the decision reproducible."}</Prose>

<Prose>{"For text, enumerating all references is impractical. One approximation uses "}<InlineMath>{"N"}</InlineMath>{" candidate actions and "}<InlineMath>{"S"}</InlineMath>{" sampled references, averaging a utility or loss against the same reference set for each action. It costs "}<InlineMath>{"NS"}</InlineMath>{" pair evaluations, each with its own cost "}<InlineMath>{"U"}</InlineMath>{". Candidate discovery and reference estimation are separate choices. Full ancestral reference sampling estimates expectation under the base model; temperature or truncation changes that sampling distribution. Reusing references across actions creates correlated estimates, but does not require a new independent reference set per action. Eikema and Aziz develop this separation and its computational consequences; our finite matrix illustrates the decision, not their translation benchmark."}</Prose>

<H2>{"7. Search before the answer is finished"}</H2>

<Prose>{"Complete-candidate ranking waits until every response ends. A process reward can instead guide which partial paths receive the next generation call. Revisit the concrete algebra tree from PRM before counting its work."}</Prose>

<SearchTree/>

<Prose>{"The root is "}<code>{"2(x+1)=8"}</code>{". Branch A reaches "}<code>{"2x=6"}</code>{" with local score .6; branch B reaches the incorrect "}<code>{"2x=8"}</code>{" with score .9. A's correct child "}<code>{"x=3"}</code>{" has next score .95; B's best child is incorrect "}<code>{"x=4"}</code>{" with .5. Product-scored beam width 1 prunes A and selects B's leaf at .45 after scoring four nodes. Width 2 preserves A and selects its .57 leaf after six scored nodes. The correct leaf of a pruned parent cannot be counted as an available candidate."}</Prose>

<Prose>{"The "}<a href={"/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models#9-search-before-the-answer-is-finished"}>{"complete reused beam and UCT program"}</a>{" maintains actual parents, frontiers, completed leaves and visit statistics. A local-step score differs from estimated future success; changing the scoring target changes the search. Wider search need not improve an imperfect judge. A depth-zero budget has no completed answer, not a zero-cost success."}</Prose>

<SearchWork/>

<Prose>{"Beam depth creates sequential dependence; different candidates at the same depth may be evaluated in parallel. Lookahead asks additional questions before choosing which prefix to keep. With four candidate step evaluations and two extra rollout steps for each, a uniform accounting model charges 12 step evaluations. Real implementations should count actual early stops, varying token lengths and verifier work instead of assuming every step is equal."}</Prose>

<Prose>{"Independent subtrees protect different initial proposals from competing for one global beam. The HF authors' DVTS method grows separately retained branches at a fixed expansion width. It can preserve diversity that a globally pruned beam loses, while a wrong early choice can still trap each subtree. REBASE instead distributes expansion budget using reward estimates at a depth. These mechanisms change which work is spent; their reported advantages remain tied to their evaluated models, judges and tasks."}</Prose>

<Program file="search_budget.py"/>

<Prose>{"The adapter imports the exact supplied PRM files, runs its finite width 1/2/depth 0 examples and reports scored nodes. It also shows two separately executed scoring policies and their summed work. Those two deterministic traversals are not independent neural samples or a DVTS reproduction. Its lookahead row is explicitly an accounting example. The bundled "}<code>{"prerequisite/prm_search.py"}</code>{" and "}<code>{"prerequisite/prm_contracts.py"}</code>{" provide the complete underlying implementations."}</Prose>

<CodeBlock language={"shell"}>{"python search_budget.py --prm-dir prerequisite"}</CodeBlock>

<Prose>{"For generic UCT, a simulation follows selected edges, samples a terminal continuation and backs up returns/visits. That backup changes search statistics, not neural weights. A real search system must state whether its terminal checker is an available tool, a learned approximation or an evaluation-only oracle. The distinction is as important as its tree width."}</Prose>

<H2>{"8. Revise without assuming improvement"}</H2>

<Prose>{"Parallel candidates begin from the same question. A revision receives a previous answer as context and can make a locally different proposal. The added information can help repair an error, or encourage the model to replace a correct answer with a worse one."}</Prose>

<Revisions/>

<Prose>{"Our constructed trace starts at 11/2, changes to 15/2 and then repeats 7.5. Taking the last response fails. Retaining earlier responses preserves a correct possibility, but our final flawed score .9 still outranks the initial .8 and selects the wrong revision. Retention and selection are separate interventions. Simply appending “check again” is not a guarantee of improvement."}</Prose>

<Program file="revision.py"/>

<Prose>{""}<code>{"inspect_revisions"}</code>{" records which earlier responses each supplied revision conditions on. At every step it compares the last response with selection over all retained responses. The program supplies no neural revision claim; it makes the control and information structure explicit. In a model-backed version, replace the supplied trace with actual revision calls while preserving the same record and cost boundary."}</Prose>

<HybridSchedule/>

<Prose>{"Breadth supplies different starting paths; depth spends serial effort on each. With breadth 2 and depth 3, six calls form two three-call chains. Under the fixed-length example in section 2, the longest dependency has three calls. A single six-call chain has greater sequential depth; six independent calls have greater breadth. Equal call counts need not mean equal prompt work because revision contexts grow."}</Prose>

<Prose>{"Snell and colleagues studied trained revision behavior as well as verifier search. Their findings depend on problem difficulty and budget: no one serial/parallel ratio wins by definition. Training a reviser, using it with frozen weights and selecting among its outputs are three separate operations. The policy should retain the possibility of stopping when further revisions add work without useful new information."}</Prose>

<H2>{"9. Control a reasoning budget"}</H2>

<Prose>{"A longer output cap merely permits more output. It does not force the model to use that budget productively. Compare a stop rule with a controller that responds to an end-of-thinking boundary."}</Prose>

<BudgetController/>

<Prose>{"The s1 method's budget-forcing intervention can suppress an end-thinking delimiter, append a continuation cue such as “Wait”, and let the model continue. It can also terminate thinking and request a final answer. This requires the relevant model format and token handling; it is not equivalent to adding arbitrary words to every model's prompt. The paper's supervised fine-tuning route also shows why RL cannot be declared necessary for every form of useful test-time scaling."}</Prose>

<Prose>{"Our controller exposes the resource logic using supplied token segments. With 5 context positions available and 2 reserved for the final response, at most 3 positions can go to thinking or injected continuation tokens, even when the requested thinking cap is 4. Injected tokens consume context but are distinct from model-emitted tokens. Control events are not silently counted as generated text."}</Prose>

<Program file="budget_controller.py"/>

<Prose>{""}<code>{"control"}</code>{" validates budgets, computes the smaller of the thinking cap and available context after reserve, and walks explicit segments. It charges a "}<code>{"Wait"}</code>{" insertion when continuing, limits continuation count and records the final tokens separately. Its final response is complete only if all supplied final tokens fit. This is a finite controller demonstration, not a model that learns to think and not an execution of the large s1 checkpoint."}</Prose>

<Prose>{"A zero thinking budget can proceed directly to finalization. An insufficient final reserve can truncate the answer. Repeated continuation can loop, consume the context or reinforce an error. The right empirical question is whether the fixed model/controller combination improves the desired outcome at a measured cost. We can now ask that question of a small actual model without assuming the answer in advance."}</Prose>

<span id="6-visual-walkthrough" aria-hidden="true"/><H2>{"10. Run a fixed-model experiment"}</H2>

<Prose>{"A small experiment makes the selection boundary testable. We use twelve problems in their original order from the GSM8K test split, a small pretrained instruction model, and a policy fixed before seeing outputs. The model is "}<code>{"google/flan-t5-small"}</code>{", revision "}<code>{"0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab"}</code>{". It is an encoder-decoder model; a supplied decoder-start position is distinct from the tokens it generates."}</Prose>

<CandidateInspector/>

<Prose>{"Start with question 2, seed 29, and eight candidates. The actual returned strings are "}<code>{"3"}</code>{", "}<code>{"20"}</code>{", "}<code>{"4"}</code>{", "}<code>{"30"}</code>{", "}<code>{"23"}</code>{", "}<code>{"2"}</code>{", "}<code>{"13"}</code>{", "}<code>{"16"}</code>{". Each gets one vote. Our declared first-occurrence tie rule chooses "}<code>{"3"}</code>{"; only after selection does evaluation reveal that the answer is 3. The first candidate already won at N1 and remains the winner at N4 and N8. This is persistence under a tie rule, not a growing consensus. Other questions and seeds remain inspectable, including malformed and wrong responses."}</Prose>

<Prose>{"The twelve questions are a convenience subset, not a representative sample of all mathematical reasoning. The model may have encountered the dataset during pretraining. These outputs are short numeric-answer samples, not a reproduction of self-consistency over prompted chains of thought. Their purpose is to expose every step of a real generate–select–evaluate experiment, including a disappointing result."}</Prose>

<Prose>{"The complete acquisition program freezes source bytes and the first twelve records. The original GSM8K repository supplies an MIT licence, included with the data. IDs preserve the original zero-based test-row index, so displayed question 2 is "}<code>{"gsm8k-test-1"}</code>{"."}</Prose>

<Program file="prepare_data.py"/>

<Prose>{""}<code>{"prepare"}</code>{" verifies the source and licence hashes before selecting rows. It saves a separate source record and writes deterministic UTF-8 bytes with LF newlines. An initial local attempt failed a byte-hash check because line endings differed, before any model loading or generation; the corrected run kept identical questions, prompts and settings. A hash check concerns bytes, so two JSON files can contain equal data while having different hashes."}</Prose>

<Prose>{"Each problem receives one greedy response and eight samples for each of three seeds, 17, 29 and 43: twelve times 25 is 300 actual model outputs. Every call permits at most 64 newly generated tokens. Sampling uses temperature 0.8, top-p0.95, and disables top-k truncation. The selected N1/N4/N8 policies use prefixes of each same eight-candidate pool. This paired design saves work and exposes exactly which extra candidates changed a decision."}</Prose>

<Program file="sample_hf.py"/>

<Prose>{""}<code>{"run"}</code>{" checks the selected-data identity and prompt length before generation. It loads the pinned model locally, keeps weights fixed, sets CPU float32 execution with two Torch threads, and saves the resolved generation settings. Inside the loop, the seed depends on the declared seed, question index and sample index. Each completed output is immediately appended to the journal with token IDs, decoded text, stop reason and observed CPU time."}</Prose>

<Prose>{""}<code>{"generated_work"}</code>{" excludes the supplied decoder-start position and padding after the first EOS. EOS itself is a generated token and consumes work. A PAD token actually emitted before termination also counts even if the text decoder hides it. Reading only the decoded string would miss these distinctions. Prompt tokens are recorded separately; the token-cost plot below uses generated tokens, not a claim of equal FLOPs per token."}</Prose>

<Prose>{"To reproduce the prescribed study, first install the section 2 requirements, then run these commands from the unpacked bundle. The retained data and outputs already support analysis without downloading weights or generating again."}</Prose>

<CodeBlock language={"shell"}>{"hf download google/flan-t5-small --revision 0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab --cache-dir flan-t5-cache\npython sample_hf.py --cache flan-t5-cache --data data --output my-observations\npython evaluate.py --data data --observations my-observations --output my-summary.json"}</CodeBlock>

<Prose>{"Use a new output directory for your own declared experiment; existing outputs are protected from overwrite. The observed loader warned that the checkpoint declares tied embeddings while its stored arrays differ; it preserved the stored untied arrays. The checkpoint bytes matched the pinned upstream weights. The experiment did not modify that configuration to improve results. CPU times depend on the machine and concurrent work; the retained calls are serial observations, not a serving-throughput benchmark."}</Prose>

<Prose>{"The selector receives candidate identity and text. "}<code>{"evaluate.py"}</code>{" later joins the answer from the dataset's final "}<code>{"####"}</code>{" field. It reports all twelve questions, including abstentions. Inspect the exact prompt and parser before changing either: a change defines a new experiment and cannot retroactively improve the old report."}</Prose>

<Program file="evaluate.py"/>

<Prose>{"The evaluation reads and checks the completed 300-row journal. It assembles each eight-candidate pool in original sample order, calls the gold-blind selector on the requested prefix, then records correctness, parse coverage, pool opportunity and work. The next section explains why these columns can disagree."}</Prose>

<span id="9-failure-modes-and-gotchas" aria-hidden="true"/><H2>{"11. Read the metric before the curve"}</H2>

<Prose>{"One number cannot tell us whether the generator, parser or selector caused a failure. Put the methods beside the same questions before averaging them."}</Prose>

<OutcomeGrid/>

<Prose>{"A filled correctness mark means the selected numeric answer equals the source answer; an abstention remains an incorrect outcome in the full denominator. "}<strong>{"Parse coverage"}</strong>{" is the fraction of question–seed cases that return a numeric selection. "}<strong>{"Oracle pool coverage"}</strong>{" is the fraction whose candidate pool contains at least one correct answer, whether or not the selector finds it. These are different from one another and from selected accuracy."}</Prose>

<Prose>{"For sampled methods, first average each question over its three seeds, then average the twelve questions. Because each question has exactly three seeds, this equals the aggregate over 36 question–seed cases. The seeds are repeats of a policy on the same questions, not 36 independently sampled problems. Greedy has only 12 cases and uses a different decoding distribution from sampled N = 1."}</Prose>

<NeuralTable caption={"11. Read the metric before the curve"} headers={[<>{"Policy"}</>,<>{"Correct selected / cases"}</>,<>{"Parse coverage"}</>,<>{"Oracle pool coverage"}</>,<>{"Mean generated tokens"}</>,<>{"Mean observed CPU seconds"}</>]} rows={[[<>{"Greedy"}</>,<>{"0 / 12"}</>,<>{"10 / 12"}</>,<>{"0 / 12"}</>,<>{"2.250"}</>,<>{"0.101"}</>],[<>{"Vote N1"}</>,<>{"1 / 36"}</>,<>{"33 / 36"}</>,<>{"1 / 36"}</>,<>{"2.389"}</>,<>{"0.119"}</>],[<>{"Vote N4"}</>,<>{"1 / 36"}</>,<>{"35 / 36"}</>,<>{"1 / 36"}</>,<>{"9.139"}</>,<>{"0.462"}</>],[<>{"Vote N8"}</>,<>{"1 / 36"}</>,<>{"35 / 36"}</>,<>{"1 / 36"}</>,<>{"18.528"}</>,<>{"0.927"}</>]]} />

<ObservedCost/>

<Prose>{"The sampled accuracy stays at about 2.78% while generated-token work rises. No positive scaling curve is hidden behind the flat segment. More samples helped the system return a parseable answer on two cases, but those additional selected answers were wrong. The single successful case was already successful at N1. That explains why output coverage can improve without accuracy improving."}</Prose>

<Prose>{"A frequently reported "}<strong>{"pass@k"}</strong>{" estimator asks another question. Suppose a retained pool contains n attempts, c of them correct. If we choose k of those attempts uniformly without replacement, failure means selecting all k from the n−c incorrect ones. Thus:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\widehat{\\mathrm{pass@}k}=1-\\frac{\\binom{n-c}{k}}{\\binom{n}{k}}."}</MathBlock></div>

<Prose>{"For n = 8, c = 2, k = 2, this is 1−15/28=13/28. A particular first-two prefix can still contain no correct answer. A selector can also choose a wrong answer from a pool containing a correct one. The formula describes random-subset opportunity, not selected correctness. Its usual unbiased interpretation for repeated generation assumes iid draws under the specified sampling distribution. Correlation and an altered sampling protocol change that interpretation."}</Prose>

<Prose>{"In our retained pools, the averaged estimator is approximately 0.347%, 1.389% and 2.778% for k1, 4, 8. These differ from the realized prefix opportunity, which is 2.778% at all three sizes. The sole correct sampled attempt happened to be first. Both summaries are legitimate when their questions and denominators are stated; swapping one for the other would invent a result."}</Prose>

<Prose>{""}<code>{"bootstrap"}</code>{" resamples whole questions while keeping every seed and method for a question together. The retained 2000 resamples at seed 101 give a percentile interval [0, 8.33%] for each sampled policy, and [0, 0] for greedy. A degenerate all-zero resampling interval does not establish a true zero success probability. With only twelve selected problems, these intervals are descriptive uncertainty for this tiny cohort, not a reliable population guarantee. Paired policy differences also remain exactly zero here because every question has identical sampled selected outcomes across N1/N4/N8."}</Prose>

<Prose>{"Record the rule, denominator and unit before drawing a curve. Then use retained outputs to diagnose whether more work found useful candidates, improved selection, merely reduced abstention, or changed nothing."}</Prose>

<span id="7-decision-matrix" aria-hidden="true"/><H2>{"12. Allocate the next unit of work"}</H2>

<Prose>{"A flat result also challenges a uniform budget: should every request receive the same number of attempts? We need an estimate of benefit before spending, and a rule that respects total cost. Consider two request classes whose success probabilities were supplied for a planning exercise."}</Prose>

<BudgetFrontier/>

<Prose>{"The constructed table gives class A success estimates 0.40, 0.70, 0.75 at additional costs 0, 1, 2; class B gives 0.20, 0.35, 0.65. Choose one option for each request. With budget 3, A's cost 1 and B's cost 2 yield expected 1.35 correct answers across two requests, or mean 0.675. Spending 2 on A and 1 on B yields only 1.10. These are hypothetical validation estimates, not numbers fitted from the GSM8K test outcomes."}</Prose>

<Prose>{"Write option j for request i as cost "}<InlineMath>{"c_{ij}"}</InlineMath>{" and estimated success "}<InlineMath>{"v_{ij}"}</InlineMath>{". The finite allocation problem is:"}</Prose>

<div className="neural-equation"><MathBlock>{"\\max_{j_1,\\ldots,j_m}\\sum_{i=1}^{m}v_{i j_i}\\quad\\text{subject to}\\quad\\sum_{i=1}^{m}c_{i j_i}+h\\leq B."}</MathBlock></div>

<Prose>{"Here B is the total additional-work budget, and h is the overhead of estimating difficulty or choosing an allocation. The cost 0 option still has a baseline success estimate; zero additional work does not mean no underlying response generation. The table assumes each option's expected value is usable independently and every cost is measured in the same discrete unit."}</Prose>

<Prose>{"Dynamic programming stores the best value after assigning the first i requests at each reachable exact cost b. To assign the next request, try each of its options and extend the state if the total cost fits. Equivalently, "}<InlineMath>{"F_i(b)=\\max_j[F_{i-1}(b-c_{ij})+v_{ij}]"}</InlineMath>{" over feasible predecessor costs. An unreachable cost has no state. At the end choose the best value at any cost at mostB−h. Exact rational arithmetic makes ties reproducible."}</Prose>

<Program file="allocation.py"/>

<Prose>{""}<code>{"allocate"}</code>{" keeps a dictionary indexed by total spent cost. Each entry also stores the option-index path so the selected allocation is recoverable. It breaks equal-value ties by lexicographic option indices; "}<code>{"exhaustive"}</code>{" independently enumerates complete assignments for small tables. At budget 3 with overhead 1, A0+B2 and A1+B1 both yield 1.05; the stated tie rule selects A0+B2. At budget 0 it keeps both baselines and yields 0.60. Overhead larger than the budget is infeasible, not a free decision."}</Prose>

<Prose>{"A tempting greedy rule spends each next unit on the largest current marginal gain. It works under appropriate diminishing-return and unit-cost assumptions, but can miss delayed gains. In a second constructed table, A's values are 0, 0.3, 0.3 and B's are 0, 0.2, 0.9 at costs 0, 1, 2. With two units, greedy first takes A's0.3, then B's0.2, reaching 0.5. The optimum invests both in B and reaches 0.9. The first small gain unlocks a much larger second gain. This is why the complete finite search matters."}</Prose>

<AllocationInformation/>

<Prose>{"In an actual deployment, use a separate validation set to estimate cost–benefit curves or train a difficulty predictor. Freeze that policy before evaluating on untouched test requests. At inference, the router can use the prompt and other permitted features, but cannot observe whether an ungenerated test answer would be correct. A research plot grouped by oracle test difficulty may explain behavior without supplying a deployable router. Distribution shift, noisy gain estimates and routing overhead can erase an apparent advantage. The lesson's twelve test outcomes do not feed the constructed allocation table."}</Prose>

<span id="8-what-scales-and-what-doesn-t" aria-hidden="true"/><H2>{"13. Larger weights or more inference calls"}</H2>

<Prose>{"Allocation within one model is only part of the decision. A smaller model can spend additional inference work, while a larger model may start with a better answer distribution. Compare their total budgets before claiming one is cheaper."}</Prose>

<AmortizedWork/>

<Prose>{"Let X denote a smaller model's total training work and Y its total baseline inference work over a chosen deployment volume. In a deliberately simple model, a model M times as large costs M times as much for both phases, so its combined work is M(X+Y). If we keep the smaller model's training cost X and multiply its inference budget by a, equal total work requires:"}</Prose>

<div className="neural-equation"><MathBlock>{"X+aY=M(X+Y),\\qquad a=M+(M-1)\\frac{X}{Y},\\quad Y>0."}</MathBlock></div>

<Prose>{"For X = 100, Y = 10, M = 2, the larger-model total is 220. Keeping training at 100 leaves 120 for inference, twelve times the baseline 10. If deployment inference rises to Y = 100, the same formula gives a = 3. Training is spread over more requests, so its one-time saving buys fewer extra inference multiples. At M = 1, a = 1. At Y = 0 the multiplier is undefined, because there is no baseline inference work to multiply."}</Prose>

<Prose>{""}<code>{"exchange"}</code>{" in "}<code>{"budgeting.py"}</code>{" implements exactly this dimensional comparison. It does not predict equal accuracy at equal work. Verifier size, prompt length, context growth, cache use, batching, utilization and hardware can change actual cost substantially. The "}<a href={"/learn/path/full-curriculum/inference-cost-economics-compute-scaling?module=large-language-models"}>{"Inference Cost Economics"}</a>{" lesson treats those systems quantities. Here the equation explains why deployment volume changes the training-versus-inference tradeoff and why a single multiplier cannot settle it universally."}</Prose>

<span id="5-production-implementation" aria-hidden="true"/><H2>{"14. Use provider budget controls deliberately"}</H2>

<Prose>{"Hosted reasoning models expose parts of this policy through request fields. A hard output cap and an effort preference express different intentions; supported fields depend on the selected provider and model."}</Prose>

<ProviderFields/>

<Prose>{"For the OpenAI Responses API, this client sends "}<code>{"max_output_tokens"}</code>{" and optionally "}<code>{"reasoning.effort"}</code>{". The cap can include hidden reasoning and other output tokens as well as visible text. A request may finish incomplete before producing visible answer text. Preserve "}<code>{"status"}</code>{", "}<code>{"incomplete_details"}</code>{" and the full usage object when diagnosing it."}</Prose>

<Prose>{"For Claude, the adaptive route uses "}<code>{"thinking: {type: \"adaptive\"}"}</code>{" and optionally "}<code>{"output_config.effort"}</code>{" on a model that supports them. The separate manual route uses "}<code>{"thinking: {type: \"enabled\", budget_tokens: ...}"}</code>{"; this example requires at least 1024 and less than "}<code>{"max_tokens"}</code>{". A manual thinking budget is a target, not a promise of exactly that many tokens. Do not combine unsupported effort or thinking settings simply because another model accepted them."}</Prose>

<Prose>{"The DeepSeek route uses its documented chat-completions thinking switch and reads "}<code>{"message.reasoning_content"}</code>{" separately from "}<code>{"message.content"}</code>{". No common cross-provider field makes these controls interchangeable. Check the linked provider's current model documentation before sending a request."}</Prose>

<Program file="provider_budget.py"/>

<Prose>{""}<code>{"build_request"}</code>{" makes the provider-specific JSON from explicit model, prompt and cap inputs. "}<code>{"send"}</code>{" uses ordinary HTTPS with credentials read from environment variables, a timeout, explicit HTTP errors and no automatic retry. "}<code>{"summarize"}</code>{" extracts visible text and preserves provider usage and stop/status information without guessing missing counters. Its default command prints the unsent payload; add "}<code>{"--send"}</code>{" only when you want to issue a billable request."}</Prose>

<CodeBlock language={"shell"}>{"python provider_budget.py openai --model YOUR_SUPPORTED_MODEL --effort medium --cap 4096\npython provider_budget.py claude --model YOUR_SUPPORTED_MODEL --thinking-budget 2048 --cap 4096\npython provider_budget.py deepseek --model YOUR_SUPPORTED_MODEL --cap 4096\npython provider_contracts.py"}</CodeBlock>

<Prose>{"These commands use placeholders for a supported model name, not a promise that every account can use one model. For a real call, set "}<code>{"OPENAI_API_KEY"}</code>{", "}<code>{"ANTHROPIC_API_KEY"}</code>{" or "}<code>{"DEEPSEEK_API_KEY"}</code>{" in the environment and add "}<code>{"--send"}</code>{". The retained lesson checks use supplied response fixtures and make no hosted calls. They establish local request/response handling, not provider performance or live service availability."}</Prose>

<Prose>{"If usage reports 100 output tokens and 70 reasoning tokens, report both counters. The difference 30 is not necessarily the number of visible text tokens: output accounting can include additional formatting or nonvisible output. Keep missing usage fields unknown rather than filling them with zero. A provider's effort preference also cannot be translated directly into the explicit candidate counts or work units of our earlier examples."}</Prose></section>
<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><span id="11-self-check-exercises" aria-hidden="true"/><H2>{"15. Practice"}</H2>
<Prose>{"Try the changed cases below after experimenting with the live controls. Hints and solutions are independent of those controls; every concept needed to solve them remains in the main lesson."}</Prose><section className="ttc-practice" data-lesson-exercise><H3>{"1. Opportunity under dependence"}</H3>

<Prose>{"A single attempt succeeds with probability 0.2. Compute the opportunity with three iid attempts, then with three identical copies of one attempt. Can either number be called selected accuracy?"}</Prose><details><summary>Hint</summary><Prose>{" count the event that every independent attempt fails."}</Prose></details><details><summary>Worked solution</summary><Prose>{" iid opportunity is 1−0.8³=0.488. Identical copies share one success event, so opportunity remains 0.2. Neither determines selected accuracy without a rule for finding the correct answer when it exists. Copying answers increases candidate count without adding independent opportunities."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"2. Majority and plurality"}</H3>

<Prose>{"For five iid binary votes with correctness probability 0.6, calculate majority correctness. Then compare many-way distributions (0.38 correct,0.34 wrong,0.28 wrong) and (0.38 correct,0.42 wrong,0.20 wrong)."}</Prose><details><summary>Hint</summary><Prose>{" enumerate exactly three, four and five correct votes, then compare individual answer masses."}</Prose></details><details><summary>Worked solution</summary><Prose>{" the three terms are C(5,3)×0.6³×0.4²=0.3456, C(5,4)×0.6⁴×0.4=0.2592, and 0.6⁵=0.07776. Their sum is 0.68256. In the first many-way distribution, the correct answer is the unique largest class despite being below 0.5; iid empirical plurality converges to it. In the second, a wrong answer has the largest mass 0.42, so plurality converges toward that error. Equal largest masses need an explicit tie treatment. Binary majority and multiclass plurality have different assumptions."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"3. Answer equivalence"}</H3>

<Prose>{"Group "}<code>{"0.25"}</code>{", "}<code>{"1/4"}</code>{", "}<code>{"2/8"}</code>{", "}<code>{"Answer: 1/4"}</code>{", "}<code>{"1/0"}</code>{" and "}<code>{"approximately .25"}</code>{" under the lesson's parser. How many votes and how much candidate work remain?"}</Prose><details><summary>Hint</summary><Prose>{" the parser accepts exact numeric strings after the last explicit answer delimiter."}</Prose></details><details><summary>Worked solution</summary><Prose>{" the first four canonicalize to 1/4. Division by zero and prose fail the parser, leaving four valid votes. All six candidates consumed generation work. Dropping their cost or removing their questions from the accuracy denominator would change the measured policy."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"4. More candidates, worse selection"}</H3>

<Prose>{"A correct candidate A has score 0.8; wrong B has 0.7. Add wrong C with 0.95. What changes for best-score selection and oracle presence?"}</Prose><details><summary>Hint</summary><Prose>{" separate the score ordering from whether a correct answer exists."}</Prose></details><details><summary>Worked solution</summary><Prose>{" best-score selection changes fromA toC, so its correctness falls from 1 to 0. Oracle presence remains 1. A verifier's aggregate precision does not specify how its scores rank these candidates; candidate-distribution shifts can create errors that win its ranking."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"5. Three ways to combine scores"}</H3>

<Prose>{"Two candidates answer 3 and score 0.55 each. One answers 4 and scores 0.9. Compare best individual, summed weighted voting and mean-score voting."}</Prose><details><summary>Hint</summary><Prose>{" decide whether another agreeing sample adds mass or changes a mean."}</Prose></details><details><summary>Worked solution</summary><Prose>{" best individual returns 4. Summed weighted voting returns 3 because 1.10 exceeds 0.9. Mean-score voting returns 4 because 0.55 is less than 0.9. These are different policies, not three implementations of one rule. Scores must be nonnegative for the weighted-vote contract used here."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"6. A loss-dependent answer"}</H3>

<Prose>{"Answers −2,1,7 have masses 0.45,0.15,0.40. Find the minimum-risk choice under exact-match and absolute-error loss. How many comparisons arise from five actions and seven sampled references?"}</Prose><details><summary>Hint</summary><Prose>{" put proposed actions in rows and reference answers in columns."}</Prose></details><details><summary>Worked solution</summary><Prose>{" exact-match risks are 0.55,0.85,0.60, selecting −2. The absolute-loss rows are [0,3,9], [3,0,6], [9,6,0]; their weighted sums are 4.05,3.75,4.95, selecting 1. Five times seven is 35 utility/loss evaluations. References estimate a model distribution; they are not evaluation truth. Temperature or truncation changes the distribution sampled."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"7. Pruning and charged lookahead"}</H3>

<Prose>{"Use the retained PRM tree with width 2, but allow only one expansion depth. How many nodes are scored, and is a completed answer available? Then allow depth 2. Separately, charge three proposed steps with four additional lookahead steps per proposal."}</Prose><details><summary>Hint</summary><Prose>{" distinguish a surviving prefix from a completed leaf, and charge every rollout edge."}</Prose></details><details><summary>Worked solution</summary><Prose>{" depth 1 scores only A and B: two nodes. Both prefixes survive but neither is a completed answer, so the search must report no completed answer. Depth 2 additionally scores their four leaves: six nodes total; A1 with product 0.6×0.95=0.57 beats B1 with 0.9×0.5=0.45. The changed lookahead plan consumes 3×(1+4)=15 step-generations, before other scoring costs. Independently rooted searches preserve separate frontiers; global pruning can allocate all survivors to one root. The adapter's scoring-policy examples are finite demonstrations, not independently generated neural DVTS samples."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"8. Revision dependencies"}</H3>

<Prose>{"For a task whose answer is 3, retained revisions answer 4,3,5 with scores 0.4,0.8,0.6. Compare taking the last response with keeping the highest-scored response. Then raise the final score to 0.9. Separately, compare four sequential 1.5-second stages with four independent 1.5-second calls on two ideal workers."}</Prose><details><summary>Hint</summary><Prose>{" trace the highest eligible score, then place jobs on worker timelines without breaking dependencies."}</Prose></details><details><summary>Worked solution</summary><Prose>{" taking the last response returns wrong answer 5. Retained best-score selection initially returns correct answer 3 at score 0.8. Raising the final score to 0.9 makes that selector return wrong answer 5 too, even though the correct candidate is retained. The serial critical path is 4×1.5=6 seconds. Two workers finish four independent calls in two waves, or 3 seconds. Both consume 6 worker-seconds under the supplied ideal assumptions. A real shared device may not sustain those independent durations."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"9. Reserve the final response"}</H3>

<Prose>{"Thinking cap 7, final reserve 3 and remaining context 8: what is the maximum available thinking space? What happens if a continuation cue consumes one position?"}</Prose><details><summary>Hint</summary><Prose>{" reserve context before consuming it."}</Prose></details><details><summary>Worked solution</summary><Prose>{" at most min(7,8−3)=5 positions are available for thinking and its injected cues. If a "}<code>{"Wait"}</code>{" cue consumes one, at most four can be model-emitted thinking tokens within that context allowance. The three final positions remain reserved. Raising the cap cannot increase physical context capacity or guarantee improved reasoning."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"10. Three success quantities"}</H3>

<Prose>{"A retained pool of ten has three correct attempts. Its first three are wrong, and the selected answer is wrong. Compute pass@3, realized first-prefix opportunity and selected correctness."}</Prose><details><summary>Hint</summary><Prose>{" the estimator samples a subset; the prefix and selector are specific events."}</Prose></details><details><summary>Worked solution</summary><Prose>{" pass@3 is 1−C(7,3)/C(10,3)=1−35/120=17/24, approximately 0.70833. Realized prefix opportunity is 0, and selected correctness is 0. The pool size is 10 and subset size 3; neither is a question count. Across a dataset, average these per-question quantities with a declared treatment of repeated seeds."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"11. Keep the full denominator"}</H3>

<Prose>{"Twelve questions yield nine parseable selected answers, six correct, and three abstentions. Report overall accuracy, valid-only accuracy and parse coverage. Which unit should the paired bootstrap resample?"}</Prose><details><summary>Hint</summary><Prose>{" valid-only accuracy asks a conditional question."}</Prose></details><details><summary>Worked solution</summary><Prose>{" overall 6/12=0.5; valid-only 6/9=2/3; coverage 9/12=0.75. Report the conditional score alongside coverage if useful, never substitute it for all-question accuracy. Resample whole questions with all their seed/method results together, preserving the comparison's dependence."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"12. Repair information leakage"}</H3>

<Prose>{"A selector receives the hidden gold answer, a router is chosen using test correctness, and an evaluator discards invalid responses. Repair each boundary and decide which evidence can be retained."}</Prose><details><summary>Hint</summary><Prose>{" identify what was available before each decision."}</Prose></details><details><summary>Worked solution</summary><Prose>{" remove gold from the selector's input and join it after selection. Choose the router on a separate validation set, freeze it, then use untouched test data. Keep invalids as abstentions with their work and full-denominator failures. If only evaluation bookkeeping was wrong and all raw outputs were retained, corrected evaluation can reuse them. If leaked truth influenced generation, selection-policy design or routing choices, the resulting performance cannot serve as an untouched evaluation; freeze the repaired policy and acquire a fresh suitable test evaluation."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"13. Allocate with overhead"}</H3>

<Prose>{"Use the section 12 table with budget 3, then overhead 1. Finally change B's cost 2 value from 0.65 to 0.40 while keeping budget 3 and overhead 0. Find the selected option indices."}</Prose><details><summary>Hint</summary><Prose>{" enumerate one choice per request and respect the stated lexicographic tie rule."}</Prose></details><details><summary>Worked solution</summary><Prose>{" original budget 3 chooses[1, 2], expected 1.35. With overhead 1, [0, 2] and[1, 1] tie at 1.05, so choose[0, 2]. In the changed table, [1, 2] gives 1.10 and[2, 1] gives 1.10; the tie chooses[1, 2]. This change concerns hypothetical validation inputs. Inspecting test answers to select which table to use would invalidate the information boundary."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"14. Amortize training"}</H3>

<Prose>{"With X = 80,Y = 20,M = 3, compute the small-model inference multiplier at equal total work. Repeat with Y = 160."}</Prose><details><summary>Hint</summary><Prose>{" first subtract the small model's training work from the larger model's total."}</Prose></details><details><summary>Worked solution</summary><Prose>{" 3(80+20)−80=220 inference units, so a = 220/20=11. At Y = 160, 3(80+160)−80=640, so a = 640/160=4. Adding verifier work or changing hardware utilization alters the cost model. Equal work alone does not establish equal answer quality."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"15. Read token counters correctly"}</H3>

<Prose>{"A provider reports 100 output tokens, including 70 reasoning tokens. A T5-style result contains a supplied start ID, three generated IDs ending in EOS, and two padding IDs after it. What can you report?"}</Prose><details><summary>Hint</summary><Prose>{" distinguish the API's counters from visible text and returned tensor width from emitted work."}</Prose></details><details><summary>Worked solution</summary><Prose>{" report 100 output and 70 reasoning tokens; do not claim exactly 30 visible-text tokens. For the supplied T5 trace, generated work is 3, including EOS; the supplied start and two post-EOS padding positions are excluded. Any PAD actually emitted among those three would still count. Decoded text alone cannot reconstruct this accounting."}</Prose></details></section>
<section className="ttc-practice" data-lesson-exercise><H3>{"16. Transfer project: a budget policy you can audit"}</H3>

<Prose>{"Design a new fixed-model experiment on a task with an automatic checker. Include data selection, model identity, parser, candidate policy, selector, metrics, cost and a stopping rule. It need not produce a positive result."}</Prose><details><summary>Hint</summary><Prose>{" make every consequential choice before looking at test outputs, and make selection runnable without gold."}</Prose></details><details><summary>Worked solution</summary><Prose>{" one complete configuration uses the next twelve original GSM8K test rows 12–23, recorded source hash and licence, the same pinned Flan checkpoint, the existing strict numeric parser, eight samples per seed 17/29/43, temperature 0.8/top-p0.95 and cap 64. Freeze a comparison of first-sample versus first-occurrence plurality at N = 8. Record all IDs/texts/stop reasons and generated-token work. The selector accepts only candidate IDs/text; evaluate against the source gold afterward on all twelve questions. Report selected accuracy, parse/oracle coverage, paired question-level differences and all raw outcomes. Stop after the planned 288 samples, with no outcome-driven rerun. A real invocation uses a separate output directory and an intentionally adapted acquisition/driver record; the supplied original driver correctly refuses different source rows. Check that the gold field never enters the selector, all 288 expected records exist, every token count follows the declared EOS rule and invalids remain. This is a new proposal, not an experiment already executed by the lesson."}</Prose></details></section>
</section>
<section><H2>{"Summary"}</H2>

<Prose>{"Test-time compute is a decision about additional inference work. Candidate generation creates opportunities; a selector must turn them into useful returned answers. Parallel sampling, intermediate search, revision and budget forcing spend different resources and impose different dependencies. Their gains depend on the model, task, error structure and decision rule."}</Prose>

<Prose>{"The small actual experiment found no selected-answer gain when increasing sampled candidates from 1 to 4 or 8. Its negative result makes the evaluation contract concrete: preserve candidates and costs, keep gold outside selection, label every denominator and separate measured results from constructed planning examples."}</Prose>

</section><section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning"><H2>{"Further learning"}</H2>

<Prose>{""}<a href={"https://huggingfaceh4-blogpost-scaling-test-time-compute.hf.space/"}>{"Scaling test-time compute with open models"}</a>{" is a worked route through sampling, verification and diverse search. Read its model/evaluator choices alongside the results; it helps connect a search diagram to a real open-model pipeline."}</Prose>

<Prose>{""}<a href={"https://web.stanford.edu/class/cs224n/slides_w26/cs224n-2026-lecture13-reasoning-part2.pdf"}>{"Stanford CS224n: reasoning, part 2"}</a>{" places methods and difficulty-dependent allocation in a broader reasoning course. The slide diagrams provide an alternative overview after the local mechanisms are clear."}</Prose>

<Prose>{"The "}<a href={"/learn/path/full-curriculum/process-reward-models-prm-vs-outcome-reward-models-orm?module=large-language-models#9-search-before-the-answer-is-finished"}>{"PRM versus ORM lesson"}</a>{" gives the full reused beam/UCT source and explains why continuation value differs from local process validity. The next "}<a href={"/learn/path/full-curriculum/inference-engines-serving?module=large-language-models"}>{"Inference Engines & Serving"}</a>{" topic asks how a runtime executes these calls efficiently under actual memory and scheduling constraints."}</Prose>

</section><section className="lesson-ending lesson-ending--references" data-lesson-ending="references"><span id="10-primary-sources" aria-hidden="true"/><H2>{"Technical references"}</H2>

<Prose>{""}<a href={"https://arxiv.org/html/2408.03314v1"}>{"Snell et al., Scaling LLM Test-Time Compute Optimally"}</a>{" supplies the proposal/verifier and parallel/sequential framing, difficulty-dependent allocation and training/inference comparison. Its conditional results do not imply universal log-linear gains."}</Prose>

<Prose>{""}<a href={"https://arxiv.org/html/2203.11171v1"}>{"Wang et al., Self-Consistency"}</a>{" motivates aggregating extracted answers from diverse reasoning paths. Our numeric-answer study uses a narrower protocol and makes no reproduction claim."}</Prose>

<Prose>{""}<a href={"https://aclanthology.org/2022.emnlp-main.754/"}>{"Eikema & Aziz, Sampling-Based Minimum Bayes Risk Decoding"}</a>{" separates candidate actions and sampled references, clarifying what expectation a risk estimate approximates. "}<a href={"https://arxiv.org/html/2408.00724v1"}>{"Wu et al., Scaling Inference Compute"}</a>{" develops compute allocation across generation/search and motivates reward-guided alternatives such as REBASE. These methods require their own implemented proposal/scoring contracts; the finite diagrams are not benchmark replications."}</Prose>

<Prose>{""}<a href={"https://arxiv.org/html/2501.19393v1"}>{"s1: Simple test-time scaling"}</a>{" and its "}<a href={"https://github.com/simplescaling/s1"}>{"code"}</a>{" describe supervised preparation and budget forcing. "}<a href={"https://github.com/openai/human-eval/blob/master/human_eval/evaluation.py"}>{"HumanEval evaluation code"}</a>{" shows the pass@k estimator, while "}<a href={"https://github.com/openai/grade-school-math"}>{"GSM8K"}</a>{" provides the licensed source problems."}</Prose>

<Prose>{"For current hosted controls, use "}<a href={"https://developers.openai.com/api/docs/guides/reasoning"}>{"OpenAI reasoning"}</a>{", "}<a href={"https://platform.claude.com/docs/en/build-with-claude/extended-thinking"}>{"Claude extended thinking"}</a>{" and "}<a href={"https://api-docs.deepseek.com/guides/thinking_mode/"}>{"DeepSeek thinking mode"}</a>{". Local payload tests do not substitute for the selected model's current supported fields."}</Prose>

</section><section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H2>{"Readiness check"}</H2>

<Prose>{"You are ready to continue when you can trace an answer through generation, canonicalization, selection and evaluation; calculate total work separately from a critical path; explain why additional candidates can hurt; implement one gold-blind selector; and interpret a flat measured curve without replacing it with an oracle or a conditional denominator. You should also be able to name the assumptions behind a budget allocation and explain which provider counters were actually observed."}</Prose>

</section><section className="lesson-ending lesson-ending--resources" data-lesson-ending="resources"><H2>{"Program files"}</H2>

<Prose>{"The "}<a href={"/learn/examples/test-time-compute/test-time-compute.zip"}>{"complete bundle"}</a>{" includes the files below, pinned requirements, the licensed selected data and the actual retained generation journal/summary. The "}<a href={"/learn/examples/test-time-compute/README.md"}>{"README"}</a>{" lists independent finite checks and the optional model acquisition/generation route. No model weights or credentials are included."}</Prose>

<NeuralTable caption={"Program files"} headers={[<>{"File"}</>,<>{"What to inspect"}</>]} rows={[[<>{""}<a href={"/learn/examples/test-time-compute/selection.py"}>{"selection.py"}</a>{""}</>,<>{"Numeric parser, candidate contract, selection and abstention"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/probability.py"}>{"probability.py"}</a>{""}</>,<>{"Opportunity, majority, exact plurality and pass@k"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/decision_risk.py"}>{"decision_risk.py"}</a>{""}</>,<>{"Explicit reference distribution, loss matrix and minimum risk"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/budgeting.py"}>{"budgeting.py"}</a>{""}</>,<>{"Scheduling, growing prompts and amortization"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/allocation.py"}>{"allocation.py"}</a>{""}</>,<>{"Exact budget DP and exhaustive comparison"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/budget_controller.py"}>{"budget_controller.py"}</a>{""}</>,<>{"Thinking, continuation and final-reserve accounting"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/revision.py"}>{"revision.py"}</a>{""}</>,<>{"Last-response versus retained-response policies"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/search_budget.py"}>{"search_budget.py"}</a>{""}</>,<>{"Reused beam/UCT work inspection"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/prerequisite/prm_search.py"}>{"prm_search.py"}</a>{" / "}<a href={"/learn/examples/test-time-compute/prerequisite/prm_contracts.py"}>{"prm_contracts.py"}</a>{""}</>,<>{"Unchanged complete prerequisite search and score contracts"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/prepare_data.py"}>{"prepare_data.py"}</a>{""}</>,<>{"Licensed, pinned first-twelve data acquisition"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/sample_hf.py"}>{"sample_hf.py"}</a>{""}</>,<>{"Complete fixed-model generation and output journal"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/evaluate.py"}>{"evaluate.py"}</a>{""}</>,<>{"Post-selection evaluation and paired question bootstrap"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/provider_budget.py"}>{"provider_budget.py"}</a>{""}</>,<>{"Ordinary provider-specific HTTPS client"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/provider_contracts.py"}>{"provider_contracts.py"}</a>{""}</>,<>{"Supplied response fixtures and intercepted-transport checks"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/verify_finite.py"}>{"verify_finite.py"}</a>{""}</>,<>{"Independent enumeration and finite edge cases"}</>],[<>{""}<a href={"/learn/examples/test-time-compute/summary.json"}>{"summary.json"}</a>{" / "}<a href={"/learn/examples/test-time-compute/observations-r2/generations.jsonl"}>{"generation journal"}</a>{""}</>,<>{"Actual retained outputs and results"}</>]]} /></section></div>; }
export default { title: 'Test-Time Compute Scaling', slug: 'test-time-compute-scaling', readTime: '~70 min read + 80 min practice', content: TestTimeLesson };
