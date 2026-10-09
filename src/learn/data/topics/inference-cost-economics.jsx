// Generated from the hash-guarded complete manuscript by generate.mjs.
import React, { useState } from 'react';
import { Prose, H2, H3, CodeBlock } from "../../components/content";
import { Math as InlineMath, MathBlock as SharedMathBlock } from "../../components/content/Math.jsx";
import { LessonIntro } from "../../components/lesson-labs/LessonElements.jsx";
import RemoteCodeBlock from "../../components/content/RemoteCodeBlock.jsx";
import { useCodeDownload } from "../../components/content/LessonCodeDownloads.jsx";
import { TokenObjects, RequestBill, Reservation, HardwareDenominator, Attribution, PrefixBilling, MixedUsage, Aggregation } from "../../components/lesson-labs/inference-cost/CostAccounting.jsx";
import { SequenceWork, WeightBytes, CacheBytes, DeviceFit, Experts, Projection, PrefillDecodeProjection, Roofline, Parallelism } from "../../components/lesson-labs/inference-cost/CostPhysical.jsx";
import { WorkloadSurface, CapacityStairs, SurvivingSupply, Crossovers, MarginalCost, RetryTree, ConditionalRouting, AllocationLattice, ClassAssignment, SolverMapping, Sensitivity } from "../../components/lesson-labs/inference-cost/CostDecisions.jsx";
import { DeferredObservation } from "../../components/lesson-labs/inference-cost/CostObserved.jsx";
import "../../components/lesson-labs/lesson-flow.css";
import "../../components/lesson-labs/inference-cost/inference-cost.css";
function Resettable({
  component: Component,
  label
}) {
  const [epoch, setEpoch] = useState(0);
  return <div className="cost-resettable"><Component key={epoch} /><button type="button" className="cost-reset" onClick={() => setEpoch(v => v + 1)} aria-label={label + " reset scenario"}>Reset scenario</button></div>;
}
const PrefixTiming = () => <PrefixBilling timing />;
const TensorObservation = () => <DeferredObservation kind="tensors" />;
const ForwardObservation = () => <DeferredObservation kind="forwards" />;
const MathBlock = ({
  children
}) => <div className="cost-math-scroll" tabIndex={0} role="region" aria-label="Mathematical expression"><SharedMathBlock>{children}</SharedMathBlock></div>;
const NeuralTable = ({
  caption,
  headers,
  rows
}) => <div className="cost-table-scroll" tabIndex={0} role="region" aria-label={caption}><table className="cost-table"><thead><tr>{headers.map((v, i) => <th key={i} scope="col">{v}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></div>;
function Asset({
  file
}) {
  useCodeDownload({
    filename: file,
    kind: 'asset',
    downloadUrl: '/learn/examples/inference-cost/' + file,
    title: file
  });
  return null;
}
function InferenceCostLesson() {
  return <div className="lesson-flow cost-lesson">
{['inference-cost-programs.zip', 'FILES.md', 'README.md', 'native-prompts.json', 'native-observations.json', 'finite-observations.json', 'price-snapshot.json', 'documented-usage.json', 'usage.jsonl', 'model-source-report.json', 'alice-heldout.txt', 'alice-provenance.json'].map(file => <Asset key={file} file={file} />)}
<LessonIntro exampleKind="Python accounting and saved CPU observations">{"An assistant's bill grows for several different reasons. More people may be asking questions. Each question may include a longer conversation. A retry can consume another request without producing another successful task. A provisioned server can remain rented while idle. A useful cost calculation tells these causes apart before proposing a cheaper replacement."}</LessonIntro>

<Prose opening="summary">{"We will follow one request from text to billed usage, inspect the physical work beneath it, and build a constrained capacity plan. Money calculations use a dated quote or an explicitly constructed scenario. Tensor observations later use a real, pinned checkpoint. A quote, a capacity model and an actual observation answer different questions; keeping their boundaries visible makes the comparison useful."}</Prose>

<Prose opening="route">{"For a first pass, read sections 1–6, 8–12 and 14–16. Sections 7 and 13 are visible deeper branches for workload modelling and an ordinary optimization tool. Return to them after you can reconstruct a bill and identify a capacity constraint. "}<a href={"/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models"}>{"KV-Cache & Memory Management"}</a>{", "}<a href={"/learn/path/full-curriculum/queueing-theory-for-llm-serving?module=large-language-models"}>{"Queueing Theory for LLM Serving"}</a>{" and "}<a href={"/learn/path/full-curriculum/prefix-caching-prompt-caching?module=large-language-models"}>{"Prefix Caching & Prompt Caching"}</a>{" explain the underlying serving structures. The accounting derivations here are self-contained."}</Prose>

<span className="cost-alias" id="1-start-with-the-problem" />
<span className="cost-alias" id="1-why-it-exists" />
<span className="cost-alias" id="2-build-the-intuition" />
<span className="cost-alias" id="2-core-intuition" />
<H2>{"1. A request is not just an output string"}</H2>

<Resettable component={TokenObjects} label="D01" />

<Prose>{"The model receives an input sequence before producing an answer. That sequence can contain system instructions, tool definitions, earlier conversation turns, retrieved documents and the current question. The final answer on the screen shows only one part of the work."}</Prose>

<Prose>{"Follow the supplied Alice excerpt across the drawing. Its UTF-8 bytes represent text. The tokenizer groups that text into pieces and assigns vocabulary IDs. Those input IDs occupy positions in the model's context. Output positions are added afterward. A word can occupy more than one token; a Unicode character can occupy more than one byte. Count the objects appropriate to the question instead of treating words, characters, bytes and tokens as interchangeable."}</Prose>

<Prose>{"The example uses the exact tokenizer paired with the local checkpoint we will inspect in section 14. Its counts explain that checkpoint's input. A hosted model can have another tokenizer and usage schema, so this local count is not a substitute for its returned billing fields. Choose the Unicode example to see why a character count alone cannot predict usage. Empty text has zero input IDs under this fixture's explicit no-added-special-tokens convention. An API may add messages or structural tokens even when the visible message is empty."}</Prose>

<Prose>{"We will distinguish three units throughout. A "}<strong>{"request"}</strong>{" is one invocation of the model service. An "}<strong>{"attempt"}</strong>{" is a request made toward completing a task; retries are additional attempts. A "}<strong>{"task"}</strong>{" is the outcome the user needs, such as a correctly answered question. One task can consume several requests. Its bill is not automatically the bill of its final successful request."}</Prose>

<Resettable component={RequestBill} label="D02" />

<Prose>{"Start with a constructed request containing 1,000 uncached input tokens and 200 output tokens. We use a first-party global standard price snapshot retrieved on 8 October 2026: Sonnet 5.5 input at 2 USD per million tokens and output at 10 USD per million tokens. The currency, model, platform, billing mode and date belong to the rate. They are not timeless constants."}</Prose>

<Prose>{"The input costs $0.002 and the output $0.002. Together they cost $0.004. Increasing output to 800 tokens makes the output contribution $0.008 and the total $0.010. Zero output still leaves the input contribution. These are arithmetic scenarios using a public quote, not invoices from paid requests."}</Prose>

<Prose>{"Let "}<InlineMath>{"n_c"}</InlineMath>{" be the nonnegative integer token count in category "}<InlineMath>{"c"}</InlineMath>{", and "}<InlineMath>{"r_c"}</InlineMath>{" its quoted USD price per million tokens. The amount for one request is"}</Prose>

<div className="neural-equation"><MathBlock>{"C_{\\mathrm{request}}=\\sum_c\\frac{n_c r_c}{10^6}."}</MathBlock></div>

<Prose>{"Each token appears in exactly one charged input category under the schema we use: uncached input, five-minute cache creation, one-hour cache creation or cache read. Output is a separate category. We will introduce the cache spans in section 10; their names here establish the complete ledger rather than adding an unexplained extra input total later."}</Prose>

<Prose>{"The complete "}<code>{"request_ledger.py"}</code>{" implements "}<code>{"request_bill(counts, rates)"}</code>{". It reads every required category, rejects negative/non-integer counts, parses monetary rates with "}<code>{"Decimal"}</code>{", and returns both per-category contributions and the total. Decimal strings preserve values such as "}<code>{"\"0.1\""}</code>{" directly instead of first approximating them as binary floating-point numbers. Reporting rounded cents can be a separate policy; repeatedly rounding every tiny request can change a large aggregate."}</Prose>

<Prose>{"Download the "}<a href={"/learn/examples/inference-cost/inference-cost-programs.zip"}>{"complete program archive"}</a>{", "}<a href={"/learn/examples/inference-cost/FILES.md"}>{"file index"}</a>{" and "}<a href={"/learn/examples/inference-cost/README.md"}>{"setup guide"}</a>{". The programs cover local accounting, matrix work, capacity planning, prefix economics, integer allocation and a pinned CPU model inspection. They need no API key or GPU booking. The complete files appear next to the ideas they implement."}</Prose>

<CodeBlock language={"text"}>{"python request_ledger.py --usage usage.jsonl --prices price-snapshot.json"}</CodeBlock>

<Prose>{""}<code>{"read_ledger()"}</code>{" reads JSONL—one JSON record per line—and yields each attempt's subtotal before the final aggregate. It keeps one row plus five cumulative category totals in memory, rather than loading the whole ledger. The supplied "}<code>{"usage.jsonl"}</code>{" rows are explicitly constructed attempts. Keep their request IDs when joining billing to later task outcomes. A missing price or category is an unresolved input; the program refuses to invent a zero-dollar value."}</Prose>

<RemoteCodeBlock source="/learn/examples/inference-cost/request_ledger.py" filename="request_ledger.py" />


<H2>{"2. Follow the bill to the work"}</H2>

<Resettable component={SequenceWork} label="D03" />

<Prose>{"The request ledger tells us what the service charges. To choose a deployment, we also need to know what the model must do. The drawing keeps those two accounts side by side."}</Prose>

<Prose>{""}<strong>{"Prefill"}</strong>{" processes the input positions and produces scores for the first output. Subsequent "}<strong>{"decode"}</strong>{" forwards process newly supplied output tokens using retained keys and values from earlier positions. A long prompt can create substantial prefill work even with a short answer. A short prompt with a long answer creates many sequential decode steps. Both can have the same retail price under a particular tariff while imposing different scheduling and memory demands."}</Prose>

<Prose>{"Three physical quantities will matter: arithmetic operations, bytes stored or moved, and elapsed time. A token price does not reveal any of them by itself. The provider's bill can include product pricing, different hardware or other operations. A hardware calculation cannot infer the provider's margin from a retail token quote."}</Prose>

<Prose>{"Trace the long-input/short-output case. Many input rows enter prefill, then only a few output positions are appended. Switch to short-input/long-output: fewer rows enter prefill, but many dependent decode steps follow. A later output depends on earlier selected outputs, so those steps cannot simply be collapsed into one parallel prefill operation. Within a service, other requests can run alongside them; that is the batching and scheduling question taught in the serving lessons."}</Prose>

<Resettable component={Reservation} label="D04" />

<Prose>{"The expense also depends on the "}<strong>{"time horizon"}</strong>{"—the period over which a resource is rented or a decision is assessed. Suppose two devices are reserved for 720 hours at 4.29 USD per GPU-hour each. That quoted rate is the one-device H100 SXM listing retrieved from Lambda on 8 October 2026; device count and duration are constructed. Under our reserved-time assumption,"}</Prose>

<div className="neural-equation"><MathBlock>{"C_{\\mathrm{reserved}}=2\\times720\\times4.29=6177.60\\ \\mathrm{USD}."}</MathBlock></div>

<Prose>{"Only 80 hours of activity does not shrink a 720-hour reservation. Under a different assumption in which only those 80 hours are billable, the same multiplication gives $686.40. These are alternative billing contracts. Adding them together would charge the same occupancy twice. Listed minute billing, taxes and other invoice terms require their own actual interpretation; this scenario does not predict rounding or availability."}</Prose>

<Prose>{"Relative to this horizon, a reservation is a "}<strong>{"fixed expense"}</strong>{": it stays while completed work changes. A "}<strong>{"variable expense"}</strong>{" changes with work, such as a separately charged per-request service. A cost can be fixed within the next hour but adjustable when planning the next month. “Fixed” describes a decision boundary, not an eternal property of the hardware."}</Prose>

<Prose>{"Move idle intervals inside the reserved rectangle. The charge remains $6,177.60. The cost per completed token rises because the same expense is spread over less work. With no completed tokens the ratio is undefined. That state still has a real bill; it does not have a meaningful zero-dollar cost per token."}</Prose>

<span className="cost-alias" id="3-make-the-idea-precise" />
<span className="cost-alias" id="3-mathematical-foundation" />
<H2>{"3. Count resident bytes before promising a rate"}</H2>

<Resettable component={WeightBytes} label="D05" />

<Prose>{"A server must hold the necessary state before it can sustain useful work. Begin with weights: the learned numerical parameters. If "}<InlineMath>{"P"}</InlineMath>{" stored parameters each use "}<InlineMath>{"s_w"}</InlineMath>{" bytes, their simple element-storage estimate is"}</Prose>

<div className="neural-equation"><MathBlock>{"M_{\\mathrm{weights}}=P s_w."}</MathBlock></div>

<Prose>{"Seven billion parameters at two bytes each require 14 billion bytes, or 14 decimal GB. Seventy billion require 140 GB. A device advertised with 80 GB cannot hold those 140 GB by itself. Multiple devices, a different precision or a different architecture can change placement, but none follows automatically from the parameter count."}</Prose>

<Prose>{"Two bytes is the element size of BF16 or FP16 in this simple count. Choosing one-byte storage halves the parameter-element term. Quantized weights can also require scales, zero points, packing or another execution representation; those bytes are outside the simplified count. A storage reduction does not prove unchanged answer quality or faster kernels. Keep those questions separate."}</Prose>

<Prose>{"Weights also leave room for temporary buffers, activations and request state. The drawing's capacity boundary includes all these occupants. Filling it entirely with weights leaves no promise that an actual execution fits. Advertised capacity and usable capacity under a particular runtime are different quantities."}</Prose>

<Resettable component={CacheBytes} label="D06" />

<Prose>{"The "}<strong>{"KV cache"}</strong>{" stores keys and values from earlier sequence positions so decode can reuse them. Count its actual axes: "}<InlineMath>{"L"}</InlineMath>{" layers, two tensors per layer, "}<InlineMath>{"h_{\\mathrm{KV}}"}</InlineMath>{" key/value heads, "}<InlineMath>{"T"}</InlineMath>{" positions per request, width "}<InlineMath>{"d"}</InlineMath>{" per head and "}<InlineMath>{"B"}</InlineMath>{" requests. If each element uses "}<InlineMath>{"s"}</InlineMath>{" bytes, equal-length logical storage is"}</Prose>

<div className="neural-equation"><MathBlock>{"M_{\\mathrm{KV}}=2Lh_{\\mathrm{KV}}TdBs."}</MathBlock></div>

<Prose>{"For "}<InlineMath>{"L=32"}</InlineMath>{", "}<InlineMath>{"h_{\\mathrm{KV}}=8"}</InlineMath>{", "}<InlineMath>{"T=4096"}</InlineMath>{", "}<InlineMath>{"d=128"}</InlineMath>{", "}<InlineMath>{"B=4"}</InlineMath>{" and "}<InlineMath>{"s=2"}</InlineMath>{", this gives 2,147,483,648 bytes, exactly 2 GiB. Here GiB means "}<InlineMath>{"2^{30}"}</InlineMath>{" bytes; decimal GB means "}<InlineMath>{"10^9"}</InlineMath>{" bytes. Mixing these units changes a capacity calculation even when the token count is correct."}</Prose>

<Prose>{"Grouped-query attention can use more query heads than KV heads. The cache stores the KV heads, so changing query-head count alone does not change this formula when KV head count stays fixed. For unequal request lengths, replace "}<InlineMath>{"BT"}</InlineMath>{" with "}<InlineMath>{"\\sum_b T_b"}</InlineMath>{". Padding, reserved capacity, page granularity and allocator metadata can make actual backing storage larger than the logical elements currently occupied. The prerequisite KV lesson explains those layouts; section 14 will count both logical elements and actual tensor backing storage."}</Prose>

<Resettable component={DeviceFit} label="D07" />

<Prose>{"Now place the parts together on a constructed device with 24,000,000,000 bytes. Weights use 14,000,000,000 bytes and a declared workspace uses 2,000,000,000. The preceding cache costs 536,870,912 bytes per request. Four requests therefore use 18,147,483,648 bytes in total and fit under this simplified allocation."}</Prose>

<Prose>{"The space remaining after weights and workspace is 8,000,000,000 bytes. The maximum whole-request allocation is"}</Prose>

<div className="neural-equation"><MathBlock>{"B_{\\max}=\\left\\lfloor\\frac{M_{\\mathrm{device}}-M_{\\mathrm{weights}}-M_{\\mathrm{workspace}}}{M_{\\mathrm{KV,one\\ request}}}\\right\\rfloor=14."}</MathBlock></div>

<Prose>{"Fourteen cache allocations use 7,516,192,768 bytes. Fifteen would use 8,053,063,680, exceeding the available cache region. This is an integer boundary, not a smooth throughput curve. Longer contexts expand each cache and can reduce the number of simultaneous requests before changing any weight bytes."}</Prose>

<Prose>{"This estimate assumes all needed parts are placed on the same device as drawn. Adding the capacity of several devices can be misleading if each replicates the full weights or if one shard is too large. Count placement and replication as well as aggregate memory. "}<code>{"capacity_requests()"}</code>{" in "}<code>{"work_and_memory.py"}</code>{" subtracts weights and workspace before taking the integer quotient; a negative remainder means the fixed state itself does not fit."}</Prose>

<Resettable component={Experts} label="D08" />

<Prose>{"A "}<strong>{"mixture of experts"}</strong>{", or MoE, makes another distinction necessary: resident parameters and parameters used for one token. In the constructed drawing, shared weights contain 1 billion parameters and four experts contain 6 billion each. All four expert regions together give 25 billion resident parameters, or 50 GB at two bytes each. Selecting one expert uses 7 billion shared-plus-selected parameters for that token's main paths."}</Prose>

<Prose>{"Outline a second active expert. The active count becomes 13 billion, while resident storage stays 25 billion. The unselected weights have not disappeared. If experts are sharded across devices, routing tokens to them introduces communication and placement requirements. Total parameters can describe storage; active parameters can help estimate a subset of arithmetic. Neither alone determines throughput or an invoice."}</Prose>

<span className="cost-alias" id="4-from-scratch-implementation" />
<H2>{"4. Count arithmetic and traffic separately"}</H2>

<Resettable component={Projection} label="D09" />

<Prose>{"Zoom in on one dense projection. The input matrix "}<InlineMath>{"X"}</InlineMath>{" has two rows and three values per row. The weight matrix "}<InlineMath>{"W"}</InlineMath>{" has four rows, each with three coefficients. We compute "}<InlineMath>{"Y=XW^\\top"}</InlineMath>{", giving two output rows with four values each."}</Prose>

<Prose>{"The first input is "}<InlineMath>{"[1,2,3]"}</InlineMath>{". The first weight row is "}<InlineMath>{"[1,0,2]"}</InlineMath>{". Their dot product is "}<InlineMath>{"1\\times1+2\\times0+3\\times2=7"}</InlineMath>{". The next weight row "}<InlineMath>{"[0,1,1]"}</InlineMath>{" gives 5. Each output combines one input row with one weight row; selecting a cell in the drawing keeps those contributing elements visible."}</Prose>

<Prose>{"The full inputs are"}</Prose>

<div className="neural-equation"><MathBlock>{"X=\\begin{bmatrix}1&2&3\\\\2&0&-1\\end{bmatrix},\\quad W=\\begin{bmatrix}1&0&2\\\\0&1&1\\\\1&-1&0\\\\2&2&1\\end{bmatrix}."}</MathBlock></div>

<Prose>{"The scratch dot products give"}</Prose>

<div className="neural-equation"><MathBlock>{"Y=\\begin{bmatrix}7&5&-1&9\\\\0&-1&2&3\\end{bmatrix}."}</MathBlock></div>

<Prose>{"For counting, use the common "}<strong>{"nominal FLOP"}</strong>{" convention: a multiply-add contributes two floating-point operations. It is a work convention, even when the small example contains integer-valued operands or a first accumulator starts at zero. For "}<InlineMath>{"B"}</InlineMath>{" input rows, input width "}<InlineMath>{"K"}</InlineMath>{" and output width "}<InlineMath>{"N"}</InlineMath>{","}</Prose>

<div className="neural-equation"><MathBlock>{"F_{\\mathrm{projection}}=2BKN."}</MathBlock></div>

<Prose>{"Here "}<InlineMath>{"2\\times2\\times3\\times4=48"}</InlineMath>{" nominal FLOPs. Actual execution instructions can fuse a multiply and an addition; “two FLOPs” does not mean two separate instructions."}</Prose>

<Prose>{"To count ideal compulsory traffic, imagine reading each input and weight once and writing each output once. With element size "}<InlineMath>{"s"}</InlineMath>{","}</Prose>

<div className="neural-equation"><MathBlock>{"D_{\\mathrm{compulsory}}=s(BK+KN+BN)."}</MathBlock></div>

<Prose>{"At two bytes per element, the drawing gives "}<InlineMath>{"2(6+12+8)=52"}</InlineMath>{" bytes. These are the quantities in an ideal data-movement model, not measured DRAM traffic. Repeated reads, caches, temporaries, accumulation precision and the selected kernel can change actual traffic. The displayed tiny matrices teach the count; we do not claim that NumPy's demonstration uses a two-byte execution kernel."}</Prose>

<Prose>{"Increase "}<InlineMath>{"B"}</InlineMath>{" from 2 to 8. Operations become 192, while ideal bytes become 136. The same weight matrix serves more rows, so operations grow faster than compulsory bytes. "}<strong>{"Arithmetic intensity"}</strong>{" is their ratio, FLOPs per byte: "}<InlineMath>{"F/D"}</InlineMath>{". That ratio will connect arithmetic to bandwidth in the next section."}</Prose>

<Prose>{"The complete "}<code>{"work_and_memory.py"}</code>{" implements "}<code>{"matmul_scratch()"}</code>{" as explicit dot products, then compares the result with ordinary NumPy "}<code>{"np.asarray(x) @ np.asarray(weight).T"}</code>{". "}<code>{"matrix_counts()"}</code>{" implements the separate work/traffic model. Array equality checks mathematical values; it does not verify hardware traffic or latency. Keeping the two checks distinct prevents a correct matrix product from being mistaken for a performance benchmark."}</Prose>

<RemoteCodeBlock source="/learn/examples/inference-cost/work_and_memory.py" filename="work_and_memory.py" />

<Resettable component={PrefillDecodeProjection} label="D10" />

<Prose>{"Prefill supplies many positions together, creating opportunities to reuse a weight block across rows. A decode request usually supplies one new query position at a time. A batch of decode requests can provide several rows to the same projection, amortizing weight reads. Each request still brings its own growing cache."}</Prose>

<Prose>{"For a dense model, "}<InlineMath>{"2P"}</InlineMath>{" nominal projection FLOPs per processed token can be a useful rough estimate when "}<InlineMath>{"P"}</InlineMath>{" represents the relevant dense matrix parameters. It is not a complete model operation count. Attention score/value products also depend on sequence length; embeddings, normalization, activations, biases and some output arrangements require their own treatment. MoE uses selected paths rather than every resident expert for each token."}</Prose>

<Prose>{"Growing context changes the attention work and KV reads even when dense projection dimensions stay constant. Increasing batch can improve weight reuse while increasing memory and changing latency. A cost plan therefore needs prompt length, output length, batch, cache state and latency requirements, rather than an isolated parameter count."}</Prose>


<H2>{"5. The fastest possible time is a bound"}</H2>

<Resettable component={Roofline} label="D11" />

<Prose>{"Suppose a work item requires 400 billion nominal operations and 20 billion bytes of traffic. In a deliberately constructed machine model, usable arithmetic rate is 100 trillion operations per second and bandwidth is 1 trillion bytes per second. The arithmetic alone requires at least 4 ms; the traffic alone at least 20 ms."}</Prose>

<Prose>{"If the two can overlap perfectly, completion still cannot occur before the slower requirement finishes. Let "}<InlineMath>{"F"}</InlineMath>{" be operations, "}<InlineMath>{"D"}</InlineMath>{" moved bytes, "}<InlineMath>{"R"}</InlineMath>{" usable operations per second and "}<InlineMath>{"W"}</InlineMath>{" usable bytes per second. Then"}</Prose>

<div className="neural-equation"><MathBlock>{"t_{\\min}=\\max\\left(\\frac{F}{R},\\frac{D}{W}\\right)."}</MathBlock></div>

<Prose>{"The fixture's lower bound is 20 ms. It is a "}<strong>{"lower bound"}</strong>{", meaning actual execution can take longer. It is not an observed latency or an upper bound. Dividing operations or bytes by a peak rate cannot include all stalls, launch overhead or communication unless those are separately modelled."}</Prose>

<Prose>{"This reasoning is often drawn as a "}<strong>{"roofline"}</strong>{". At low arithmetic intensity, bandwidth limits the rate; at high intensity, arithmetic capacity can limit it. The crossover intensity is "}<InlineMath>{"R/W"}</InlineMath>{". The work's implementation and available parallelism determine whether either roof is approached."}</Prose>

<Prose>{"Consider the constructed batch-eight work item: 3.2 trillion operations and 22 billion bytes. At the same rates, arithmetic requires 32 ms and traffic 22 ms, so the bound is 32 ms total, or 4 ms per item. That smaller per-item bound does not imply a 4 ms response latency: the batch as a whole takes at least 32 ms under this model. Waiting to form the batch can add further delay."}</Prose>

<Prose>{"Edit bandwidth or arithmetic rate and follow the limiting pipeline. A zero usable rate does not create a finite execution estimate. The program rejects it as an invalid resource assumption. An unsupported rate remains unknown rather than being silently replaced with a convenient advertised number."}</Prose>

<Prose>{"For example, the retrieved H100 specification lists an advertised BF16 Tensor Core figure marked "}<strong>{"with sparsity"}</strong>{". A dense calculation cannot silently use that sparse rate. This lesson uses declared dense rates for the roofline examples; its actual CPU demonstration measures tensor storage and partial operations, not a GPU roof or speed."}</Prose>

<Resettable component={Parallelism} label="D12" />

<Prose>{"Rate also requires enough independent work. A tiny matrix may leave many processing lanes unused, so arithmetic intensity by itself cannot predict high utilization. Larger or batched work may expose more parallel tiles. It can also require more memory and delay individual requests. The drawing separates these effects instead of labelling every increase in batch a guaranteed saving."}</Prose>

<Prose>{"Splitting a projection across devices introduces another dependency. Each device performs its shard; outputs or activations may then need a collective exchange. If communication cannot overlap with the required computation, add its duration after that computation. If a valid schedule permits overlap, use the appropriate dependency-aware maximum. Changing the drawing's overlap assumption changes a model, not an observed network measurement."}</Prose>

<Prose>{"Pope and colleagues study such partition choices on named PaLM/TPUv4 configurations. Their latency/cost tradeoffs support the need to compare batch and partition jointly. The source's measured frontier is specific to its models and hardware; it is not a universal speedup promised for a different checkpoint or GPU."}</Prose>


<H2>{"6. Turn delivered work into dollars"}</H2>

<Resettable component={HardwareDenominator} label="D13" />

<Prose>{"We can now connect a physical service rate to a bill without mixing units. Suppose the two-device service emits an "}<strong>{"aggregate"}</strong>{" 200 output tokens per second at its declared input mix when doing useful work. Across a 720-hour reservation, let the delivered-work fraction "}<InlineMath>{"u"}</InlineMath>{" be 0.25. This is an explicit planning fraction, not an unexplained GPU-monitor utilization percentage."}</Prose>

<Prose>{"Completed output is"}</Prose>

<div className="neural-equation"><MathBlock>{"O=r_{\\mathrm{aggregate}}uH\\times3600,"}</MathBlock></div>

<Prose>{"where "}<InlineMath>{"r_{\\mathrm{aggregate}}"}</InlineMath>{" is output tokens per second and "}<InlineMath>{"H"}</InlineMath>{" is hours. The fixture gives 129,600,000 output tokens. The reserved hardware charge remains $6,177.60, giving"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{10^6 C_{\\mathrm{hardware}}}{O}=47.666\\ldots\\ \\mathrm{USD/MTok\\ of\\ output}."}</MathBlock></div>

<Prose>{"At "}<InlineMath>{"u=1"}</InlineMath>{", the same reservation supplies 518,400,000 output tokens under the same rate assumption. Hardware expenditure per million output tokens becomes "}<InlineMath>{"11.9166\\ldots"}</InlineMath>{". The rate was already for both devices together: multiplying token output by device count again would double the denominator and understate cost."}</Prose>

<Prose>{"Neither ratio is a hosted API output-token quote. The hardware expense is allocated over output tokens, while the workload may also process input. Its rate must already include the declared input mix and service policy. Networking, storage, engineers, taxes and other expenses are included only if the numerator explicitly contains them. A different numerator or denominator answers a different question."}</Prose>

<Prose>{""}<code>{"hardware_per_million()"}</code>{" in "}<code>{"capacity_cost.py"}</code>{" preserves this mapping: charge is devices × hours × USD/device-hour; delivered output is aggregate rate × delivered fraction × seconds. At zero delivered fraction the charge remains, while the ratio returns "}<code>{"None"}</code>{". This is a missing denominator, not a zero cost."}</Prose>

<Resettable component={Attribution} label="D14" />

<Prose>{"Suppose two products share that reservation. Allocating some hardware expense to each product is "}<strong>{"attribution"}</strong>{": a bookkeeping convention for dividing the same total. It is not new spending. Allocations can use occupied time, processed work, peak capacity reserved or another explicit policy. Different policies answer different managerial questions, so document the rule."}</Prose>

<Prose>{"Unused capacity can stay unallocated or be distributed according to that rule. It cannot disappear from total expenditure. Likewise, do not add a per-token rate derived from this same lease to the lease again. Genuine independent network or storage charges can be added because they represent additional expenses."}</Prose>

<Prose>{"Once the denominator is clear, the remaining question is whether the assumed service rate is possible for the actual workload. The next deeper section makes that dependency explicit; the capacity-plan sections then use a declared rate rather than pretending it is universal."}</Prose>


<H2>{"7. Deeper: rates are workload dependent"}</H2>

<Resettable component={WorkloadSurface} label="D15" />

<Prose>{"This deeper branch asks where a capacity coefficient comes from. “Requests per second” is incomplete until a request is defined. A 100-token input followed by 20 output tokens and a 10,000-token input followed by 2,000 output tokens do not require the same work. Cache hits, batch policy and output caps can also change the distribution."}</Prose>

<Prose>{"The drawing's table contains explicitly constructed service requirements for selected input/output classes. Selecting a mix weights those requirements; it does not interpolate an unknown cell into an empirical claim. In a simple serial-service abstraction, if class "}<InlineMath>{"j"}</InlineMath>{" has fraction "}<InlineMath>{"w_j"}</InlineMath>{" and service time "}<InlineMath>{"s_j"}</InlineMath>{" on one server, mean service work is "}<InlineMath>{"\\sum_j w_j s_j"}</InlineMath>{". Its reciprocal is a corresponding saturation-rate model when its serial assumptions hold. This is not automatically the measured capacity of a continuous-batching engine."}</Prose>

<Prose>{"For one trace, declare 10 ms for the short-input/short-output class and 80 ms for the long-input/short-output class. An equal mix needs "}<InlineMath>{"0.5(10)+0.5(80)=45"}</InlineMath>{" ms mean serial service work, giving a model saturation rate of about 22.22 requests/s. A mix containing an unsupported class has no computed rate. These two declared times illustrate the calculation; they were not observed on the CPU checkpoint or a GPU engine."}</Prose>

<Prose>{"An LLM scheduler can overlap work across requests while its available memory changes with sequence lengths. It may trade throughput against individual response times. Tail latency also depends on arrival bursts, variance and queueing. A mean throughput figure therefore cannot establish a service-level objective such as “99% complete within this deadline.” Use the queueing lesson to choose the clock/population boundary and "}<a href={"/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models"}>{"Continuous Batching"}</a>{" for the changing batch mechanics."}</Prose>

<Prose>{"When recording a measured capacity, retain the prompt/output distributions, arrival process, concurrency, cache state, model/revision, precision, hardware and scheduler configuration. An unsupported workload cell should remain unknown until measured. The CPU checkpoint inspection in section 14 will establish tensor dimensions and explicitly counted work; it does not provide a GPU requests-per-second coefficient. "}<a href={"/learn/path/full-curriculum/inference-engines-serving?module=large-language-models"}>{"Inference Engines & Serving"}</a>{" connects these questions to production tools."}</Prose>

<Prose>{"We can still study the economics of a declared capacity. The next sections do exactly that, keeping the capacity assumption visible so a later benchmark can replace it."}</Prose>

<span className="cost-alias" id="8-what-scales-and-what-doesn-t" />
<H2>{"8. Reserved capacity creates stairs"}</H2>

<Resettable component={CapacityStairs} label="D16" />

<Prose>{"Suppose one capacity slot can complete 180,000 tasks in a month under a stated workload and service policy. Renting it costs $1,200 for that month. There is also a genuine independent variable expense of $0.002 per task. A slot is a whole replica or resource allocation; buying 1.2 replicas is unavailable in this particular plan."}</Prose>

<Prose>{"Let monthly task volume be "}<InlineMath>{"V"}</InlineMath>{", per-slot capacity "}<InlineMath>{"K"}</InlineMath>{", fixed expense "}<InlineMath>{"F"}</InlineMath>{" per slot and variable expense "}<InlineMath>{"v"}</InlineMath>{" per task. Provisioning enough whole slots gives"}</Prose>

<div className="neural-equation"><MathBlock>{"n(V)=\\left\\lceil\\frac{V}{K}\\right\\rceil,\\qquad C(V)=n(V)F+vV."}</MathBlock></div>

<Prose>{"The ceiling means “round upward to the next whole slot.” At "}<InlineMath>{"V=160{,}000"}</InlineMath>{", one slot suffices and cost is $1200+320=$1,520. At "}<InlineMath>{"V=180{,}000"}</InlineMath>{", that slot is full and cost is $1,560. At "}<InlineMath>{"V=180{,}001"}</InlineMath>{", another slot is needed: cost becomes $2,760.002. One additional task has crossed a provisioning boundary."}</Prose>

<Prose>{"Follow the demand marker across the drawn slot boundary. The smooth within-slot variable term rises by $0.002 per task. The fixed term jumps when the next slot is needed. Treating total cost as one smooth line erases that important decision."}</Prose>

<Prose>{"At zero demand, this constructed on-demand monthly plan provisions zero slots and incurs zero expense. An always-on service can require at least one slot even at zero demand. Select that variant and its fixed charge remains. State the policy rather than silently assigning zero demand to whichever convention makes a comparison attractive."}</Prose>

<Prose>{""}<code>{"fleet_cost()"}</code>{" in "}<code>{"capacity_cost.py"}</code>{" uses an integer ceiling formula before multiplying expenses. Its returned capacity and number of slots let us check feasibility. The model is deliberately small: it does not claim that a cloud provider offers monthly fractional billing in these exact units or that the assumed capacity was measured."}</Prose>

<Resettable component={SurvivingSupply} label="D17" />

<Prose>{"Nominal capacity may also leave insufficient room for service requirements. Suppose each replica's nominal capacity is 100,000 tasks per month, but a declared usable fraction of 0.7 allows only 70,000 in the plan. We require 150,000 tasks even after any one replica fails."}</Prose>

<Prose>{"With "}<InlineMath>{"n"}</InlineMath>{" replicas, one failure leaves "}<InlineMath>{"n-1"}</InlineMath>{". The constraint is"}</Prose>

<div className="neural-equation"><MathBlock>{"(n-1)\\times70{,}000\\ge150{,}000."}</MathBlock></div>

<Prose>{"Three replicas leave only 140,000 after one failure and are infeasible. Four leave 210,000 and satisfy the declared capacity constraint. The program computes "}<InlineMath>{"\\lceil150{,}000/70{,}000\\rceil+1=4"}</InlineMath>{"."}</Prose>

<Prose>{"The 0.7 fraction is an engineering input in this constructed example. It does not derive a p99 latency guarantee. A real usable fraction needs a performance mapping and measurements of the relevant arrival/workload distribution. Failure domains, shard dependencies, maintenance and correlated failures can impose further constraints. Counting one spare replica answers only the stated “any one replica failed” requirement."}</Prose>


<H2>{"9. A crossover can be infeasible"}</H2>

<Resettable component={Crossovers} label="D18" />

<Prose>{"Compare the preceding reserved plan with a constructed metered alternative at $0.01 per task. For the first slot, equality occurs when"}</Prose>

<div className="neural-equation"><MathBlock>{"F+vV=cV,\\qquad V_* = \\frac{F}{c-v}."}</MathBlock></div>

<Prose>{"Here "}<InlineMath>{"c"}</InlineMath>{" is the alternative's per-task charge. With "}<InlineMath>{"F=1200"}</InlineMath>{", "}<InlineMath>{"v=0.002"}</InlineMath>{" and "}<InlineMath>{"c=0.01"}</InlineMath>{", the algebra gives "}<InlineMath>{"V_*=150{,}000"}</InlineMath>{". That lies inside the first slot's 180,000-task capacity, so this crossing is feasible. At 160,000 tasks the reserved plan costs $1,520 and the metered alternative $1,600 under the supplied assumptions."}</Prose>

<Prose>{"Now increase demand to 200,000. The reserved plan needs two slots and costs $2,800. The alternative costs $2,000. Crossing the first break-even volume did not make the reserved plan cheaper at every larger volume. The next capacity stair changed its fixed term."}</Prose>

<Prose>{"For slot count "}<InlineMath>{"n"}</InlineMath>{", use "}<InlineMath>{"nF/(c-v)"}</InlineMath>{" and then check that the result belongs to that slot's demand interval, "}<InlineMath>{"((n-1)K,nK]"}</InlineMath>{". An algebraic crossing outside its interval is not a usable solution. If "}<InlineMath>{"c\\le v"}</InlineMath>{" and fixed expense is positive, increased volume cannot repay the fixed charge under this linear-within-slot model."}</Prose>

<Prose>{""}<code>{"feasible_crossovers()"}</code>{" reports both the computed crossing and interval membership. Change capacity so that the first crossing lies beyond the first slot's capacity. The drawing marks it infeasible instead of declaring a winner. In a real comparison, equal task quality, acceptable latency and all relevant expense categories must also hold. The example assumes those requirements only to isolate the capacity arithmetic."}</Prose>

<Resettable component={MarginalCost} label="D19" />

<Prose>{"The "}<strong>{"average cost"}</strong>{" divides total expense by completed tasks. "}<strong>{"Marginal cost"}</strong>{" asks how expense changes when serving additional work. These can point to different decisions."}</Prose>

<Prose>{"Within a paid slot, one more task incurs the constructed $0.002 variable expense if spare capacity exists and no other requirement changes. At the 180,000-to-180,001 boundary, the total expense changes by $1,200.002 because another slot is necessary. The average cost at either endpoint spreads a different whole-slot charge across all tasks; it does not tell us the price of that particular next task."}</Prose>

<Prose>{"If an already paid slot cannot be returned during the current hour, its lease may be sunk for a short-run routing decision. That does not remove the lease from monthly expenditure or justify ignoring it when renewing capacity. State whether the decision uses existing paid capacity or provisions a new horizon. "}<code>{"reserved_charge()"}</code>{", "}<code>{"fleet_cost()"}</code>{" and "}<code>{"feasible_crossovers()"}</code>{" expose those terms separately rather than add a lease-derived per-token charge to the same lease."}</Prose>

<RemoteCodeBlock source="/learn/examples/inference-cost/capacity_cost.py" filename="capacity_cost.py" />


<H2>{"10. Repeated prefixes have both write and read costs"}</H2>

<Resettable component={PrefixBilling} label="D20" />

<Prose>{"Our assistant often sends the same instructions or retrieved document before a changing question. Prefix caching can reuse that shared input. The economic question is how much the initial creation costs and how many later requests actually read it."}</Prose>

<Prose>{"In the constructed drawing, three requests share a 900-token prefix. Each adds a 100-token uncached suffix and produces 200 output tokens. At the dated Sonnet rates, a five-minute write costs $2.50 per million prefix tokens; reads cost $0.10. The first request costs"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{900\\times2.50+100\\times2+200\\times10}{10^6}=0.00445\\ \\mathrm{USD}."}</MathBlock></div>

<Prose>{"Each later hit costs"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{900\\times0.10+100\\times2+200\\times10}{10^6}=0.00229\\ \\mathrm{USD}."}</MathBlock></div>

<Prose>{"One write plus two hits totals $0.00903. Without caching, all three 1,000-token inputs at rate 2 and 200-token outputs at rate 10 total $0.012. The reduction comes from those two actual hits. Merely enabling caching is not evidence that requests hit."}</Prose>

<Prose>{"The prefix's identity includes everything before the cache breakpoint in the relevant ordered input. Altering earlier instructions or content can make a different prefix. The drawing keeps input categories blue, five-minute writes amber, one-hour writes violet, reads cyan and outputs rose; request identity is an outline. A selected prefix retains its hue in storage, usage and dollars, so selection cannot be mistaken for a new billing category."}</Prose>

<Resettable component={PrefixTiming} label="D21" />

<Prose>{"A "}<strong>{"time to live"}</strong>{", or TTL, describes a cache lifetime. Under the documented request-start convention, time spent generating a response consumes that lifetime. A prefix becomes reusable after its initial response begins. A follower submitted before that point cannot be assumed to hit. Reads refresh the lifetime."}</Prose>

<Prose>{"For a simple declared availability delay of zero, starts at 0, 120 and 240 seconds reuse the five-minute entry. Starts at 0, 360 and 720 miss it every time, giving three writes and $0.01335—more than the $0.012 uncached alternative. A one-hour write for that same spaced pattern costs $0.0058 initially and $0.00229 for each hit, totaling $0.01038."}</Prose>

<Prose>{"Follow the pending-write example at starts 0, 1 and 5 with a five-second availability delay. The first two requests miss and pay creation charges. At time 5 the first write is available, so the third can hit. The second miss must not erase the earlier pending completion. "}<code>{"prefix_requests()"}</code>{" retains each write's availability and request-start expiry; it finds an available unexpired entry and refreshes the eligible entry with the latest expiry. Availability is inclusive, expiry exclusive. Distinct prefix identities maintain separate clocks. This is a transparent lifetime scenario, not a measurement of hosted eviction internals."}</Prose>

<Prose>{"How many hits repay a write premium? For prefix-only rates "}<InlineMath>{"r_w"}</InlineMath>{" for a write, "}<InlineMath>{"r_r"}</InlineMath>{" for a read and "}<InlineMath>{"r_b"}</InlineMath>{" for ordinary input, one write followed by "}<InlineMath>{"n"}</InlineMath>{" reads is no dearer than "}<InlineMath>{"n+1"}</InlineMath>{" uncached inputs when"}</Prose>

<div className="neural-equation"><MathBlock>{"r_w+n r_r\\le(n+1)r_b."}</MathBlock></div>

<Prose>{"If "}<InlineMath>{"r_w>r_b"}</InlineMath>{" and "}<InlineMath>{"r_r<r_b"}</InlineMath>{", the real-valued threshold is "}<InlineMath>{"(r_w-r_b)/(r_b-r_r)"}</InlineMath>{". For rates 2.50/0.10/2, it is about 0.263. Reads are whole events, so the minimum integer count is its ceiling: "}<strong>{"one hit"}</strong>{", not 0.263 hits. Zero hits pays 2.50 versus 2 per million prefix tokens; one hit pays 2.60 versus 4. Equality is allowed in this break-even convention; strict savings requires a strict inequality. "}<code>{"read_hit_threshold()"}</code>{" and "}<code>{"minimum_hits()"}</code>{" report these two quantities separately. If the write already costs no more than base input, zero hits is feasible. If a premium write also has reads no cheaper than base input, no later count repays it."}</Prose>

<Resettable component={MixedUsage} label="D22" />

<Prose>{"The supplied documentation example reports 2,048 uncached input tokens, 1,800 cache-read tokens, 148 five-minute creation tokens, 100 one-hour creation tokens and 503 output tokens. Its creation parent subtotal is 248. That parent describes the sum 148+100; it is not another independently priced category."}</Prose>

<Prose>{"At the dated rates the amount is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{2048(2)+1800(0.10)+148(2.50)+100(4)+503(10)}{10^6}=0.010076\\ \\mathrm{USD}."}</MathBlock></div>

<Prose>{"This is a first-party illustrative schema transcribed in "}<code>{"documented-usage.json"}</code>{", not a paid observation. The mixed-TTL order places the longer-lived prefix before the shorter-lived extension. "}<code>{"normalize_usage()"}</code>{" extracts disjoint categories and verifies creation subcounts sum to the parent. Nonzero created input without a five-minute/one-hour split cannot determine which write rate applies, so the parser refuses it. A total input field from another provider must be normalized according to that provider's schema, not charged with these assumptions."}</Prose>

<RemoteCodeBlock source="/learn/examples/inference-cost/cache_accounting.py" filename="cache_accounting.py" />

<Prose>{"To see the ordinary API boundary, the following complete optional Python example submits a request and prints the returned usage. It follows the documented "}<code>{"client.messages.create()"}</code>{" route. It has "}<strong>{"not been executed here"}</strong>{" and is not needed for the local examples. Running it uses your account and can incur a charge. Choose an actual supported model ID and eligible prefix under current documentation; a cache-control field alone does not guarantee a hit."}</Prose>

<CodeBlock language={"python"}>{"\"\"\"Optional paid request example; local accounting reproduction does not need it.\"\"\"\nimport argparse\nfrom pathlib import Path\nimport anthropic\n\n\ndef main():\n    parser = argparse.ArgumentParser()\n    parser.add_argument(\"--model\", required=True)\n    parser.add_argument(\"--prefix\", required=True, type=Path)\n    parser.add_argument(\"--question\", required=True)\n    args = parser.parse_args()\n    client = anthropic.Anthropic()  # Reads your ANTHROPIC_API_KEY environment variable.\n    response = client.messages.create(\n        model=args.model,\n        max_tokens=200,\n        system=[{\n            \"type\": \"text\",\n            \"text\": args.prefix.read_text(encoding=\"utf-8\"),\n            \"cache_control\": {\"type\": \"ephemeral\"},\n        }],\n        messages=[{\"role\": \"user\", \"content\": args.question}],\n    )\n    print(response.usage.model_dump_json())\n\n\nif __name__ == \"__main__\":\n    main()"}</CodeBlock>

<Prose>{"The system block carries the prefix breakpoint; the changing question follows it. Returned usage, normalized by the local accounting program, establishes what was written, read and charged. Check eligibility, account/platform pricing and usage fields before multiplying rates. For exact storage and prefix matching implementation, return to the Prefix Caching lesson; here we are composing its mechanics with expenses."}</Prose>


<H2>{"11. A cheaper request may not be a cheaper task"}</H2>

<Resettable component={RetryTree} label="D23" />

<Prose>{"Suppose each attempt costs $0.01. The first succeeds with probability 0.8. We retry exactly once after failure, and that retry succeeds with conditional probability 0.8 "}<strong>{"among tasks whose first attempt failed"}</strong>{". The tree's second level is conditional; copying an unconditional model accuracy into it would make an unsupported assumption."}</Prose>

<Prose>{"Every task buys the first attempt. A fraction 0.2 buy the second. Expected expense per original task is $0.01+0.2($0.01)=$0.012. Success probability is 0.8+0.2(0.8)=0.96. Across many tasks with these stable rates, expense per successful task is the ratio"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{\\mathbb E[C_{\\mathrm{task}}]}{\\Pr(\\mathrm{success})}=\\frac{0.012}{0.96}=0.0125\\ \\mathrm{USD}."}</MathBlock></div>

<Prose>{"This ratio includes expenses on tasks that still fail. It is not the expected expense conditional only on successful tasks. Restricting the ledger to successes discards money actually spent on failures."}</Prose>

<Prose>{"Change retry conditional success to 0.4. The attempt expense stays $0.012 because the same first-failure fraction triggers retry. Success falls to 0.88 and expense per success becomes about $0.013636. Correlated failure can make a repeated attempt much less helpful than an independence assumption predicts. Deadlines, cancellation and retry policy belong in that conditional model, alongside token charges."}</Prose>

<Prose>{""}<code>{"retry_accounting()"}</code>{" in the first program implements these explicit probabilities. Zero success leaves no cost-per-success ratio. It cannot certify a retry model's quality; that probability needs actual selected-subset evaluation."}</Prose>

<Resettable component={ConditionalRouting} label="D24" />

<Prose>{"Routing to a cheap model introduces another selected subset. In a constructed 100-task population, the fast tier is correct on 82 and wrong on 18, costing $0.002 each. A validator flags 10% of correct answers and 80% of wrong answers. It therefore escalates 8.2 correct and 14.4 wrong answers: 22.6 expected tasks. Fractions here are expectations over repeated populations, not a claim that a single batch contains 0.6 of a person."}</Prose>

<Prose>{"The stronger tier costs $0.02 per escalated task and succeeds with probability 0.95 conditional on that flagged set. Its answer replaces the flagged fast answer. Follow the retained branch: "}<InlineMath>{"82(1-0.1)=73.8"}</InlineMath>{" correct fast answers remain unflagged. The 22.6 replacements supply "}<InlineMath>{"22.6(0.95)=21.47"}</InlineMath>{" expected successes. Together there are 95.27 successes, or quality 0.9527."}</Prose>

<Prose>{"Total expense is $100(0.002)+22.6(0.02)=$0.652. Expense per success is approximately $0.0068437. The stronger tier can also replace a previously correct fast answer with a wrong one; the branch calculation includes that possibility. A perfect-validator assumption would hide both false-positive spending and missed wrong answers."}</Prose>

<Prose>{"Under a required quality of at least 0.95, this constructed policy is eligible. Change the validator miss rate or selected-set stronger accuracy and it can become ineligible. A cheaper total is insufficient when the task requirement fails. "}<code>{"routed_tasks()"}</code>{" keeps flag rates, retained correct answers, selected-set quality and expense separate. It does not infer quality from a model's price or declare a universal fast-versus-strong ranking."}</Prose>

<span className="cost-alias" id="7-decision-matrix" />
<H2>{"12. Optimize subject to the actual constraints"}</H2>

<Resettable component={AllocationLattice} label="D25" />

<Prose>{"We now have enough pieces to formulate a small plan. Let "}<InlineMath>{"x"}</InlineMath>{" count a type of capacity slot costing 7 budget units and supplying 4 work units; let "}<InlineMath>{"y"}</InlineMath>{" count another costing 4 and supplying 2. We need at least 7 work units and can allocate at most 3 slots. These are declared units for a tiny optimization example, not measured devices or dollars from a provider."}</Prose>

<Prose>{"The decision is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\min_{x,y\\in\\mathbb Z_{\\ge0}}7x+4y"}</MathBlock></div>

<Prose>{"subject to"}</Prose>

<div className="neural-equation"><MathBlock>{"4x+2y\\ge7,\\qquad x+y\\le3."}</MathBlock></div>

<Prose>{"The lattice shows only whole numbers of slots. A point is feasible when both constraints hold. For example, "}<InlineMath>{"(1,1)"}</InlineMath>{" costs 11 but supplies only 6 and is excluded. "}<InlineMath>{"(1,2)"}</InlineMath>{" supplies 8 at cost 15. "}<InlineMath>{"(2,0)"}</InlineMath>{" supplies 8 at cost 14 and is the cheapest feasible point. The chosen point's cost is meaningful because its supply and slot count were checked first."}</Prose>

<Prose>{""}<code>{"enumerate_allocations()"}</code>{" visits every bounded integer cell, records its supply, cost and feasibility, then selects the least-cost valid cell with a stated tie order. If no valid cell exists it returns no optimum. Demand 13 is infeasible: three highest-capacity slots supply at most 12. An empty feasible set does not have a zero-price plan."}</Prose>

<Prose>{"A relaxed model permits fractional slots. Such a model can provide a mathematical bound, but its point is not directly deployable under a whole-slot rule. Naive rounding can change expense or violate other constraints. The next deeper section maps both choices to an ordinary solver and checks its result instead of assuming success."}</Prose>

<Resettable component={ClassAssignment} label="D26" />

<Prose>{"Quality and dependencies can remove an otherwise cheap point. A task class that needs a quality level above a route's supported selected-set evaluation cannot use that route in a valid plan. If two classes require different eligible routes, aggregate capacity alone is insufficient: supply must be assigned to the right classes."}</Prose>

<Prose>{"The drawing connects named class requirements to eligibility and demand constraints. Changing a required quality changes which assignments are allowed, not a fabricated pretrained model accuracy. A service dependency can also impose geographic, communication or latency restrictions. The SRE capacity-planning treatment describes this distinction between demand, performance mapping, feasible supply and an objective."}</Prose>

<Prose>{"Trace its constructed population of 20 easy and 10 hard tasks. The cheap route costs $0.002 per task, succeeds on all easy tasks and half the hard tasks, and has capacity for 20 tasks. The stronger route costs $0.02, has quality 0.95 on either class and capacity for 10 tasks. Each class requires at least 0.9. Assigning all 20 easy tasks cheaply and all 10 hard tasks to the stronger route costs $0.24 and satisfies both class-quality and route-capacity constraints. Sending everything cheaply would cost $0.06, but fails the hard class and the supplied cheap-route capacity. Lowering one quality requirement cannot make missing capacity appear. These coefficients are declared teaching inputs, not measured model scores."}</Prose>

<Prose>{"Choose requirements before minimizing expense. If they conflict, report infeasibility or explicitly prioritize a requirement; do not quietly remove the inconvenient one. Uncertain model quality and workload performance remain uncertain inputs even after a solver returns an optimum."}</Prose>


<H2>{"13. Deeper: use the ordinary optimization tool"}</H2>

<Resettable component={SolverMapping} label="D27" />

<Prose>{"This deeper branch connects the same finite problem to SciPy's "}<code>{"milp"}</code>{", a mixed-integer linear-programming interface. "}<strong>{"Linear"}</strong>{" means the objective and constraints are sums of coefficients times decisions. "}<strong>{"Integer"}</strong>{" specifies which decisions must remain whole. "}<strong>{"Mixed"}</strong>{" allows an application to combine integer and continuous decisions; here both slot counts are integers."}</Prose>

<Prose>{"Build the objective vector "}<InlineMath>{"c=[7,4]"}</InlineMath>{" and decision vector "}<InlineMath>{"z=[x,y]^\\top"}</InlineMath>{". Their dot product "}<InlineMath>{"c^\\top z"}</InlineMath>{" is cost. Each row of the constraint matrix computes one requirement:"}</Prose>

<div className="neural-equation"><MathBlock>{"A=\\begin{bmatrix}4&2\\\\1&1\\end{bmatrix},\\qquad Az=\\begin{bmatrix}\\text{supply}\\\\\\text{slot count}\\end{bmatrix}."}</MathBlock></div>

<Prose>{"The supply row has lower bound 7 and no finite upper bound. The slot-count row has no additional finite lower bound and upper bound 3. Variable bounds require "}<InlineMath>{"0\\le x,y\\le3"}</InlineMath>{". Integrality codes 1/1 require whole counts. These arrays are the drawing's cells and half-planes expressed in the library's language."}</Prose>

<Prose>{"The complete "}<code>{"allocation_solver.py"}</code>{" first runs the transparent enumerator, then constructs "}<code>{"Bounds"}</code>{", "}<code>{"LinearConstraint"}</code>{" and "}<code>{"milp"}</code>{" for the same coefficients. It sets a five-second solver time limit and zero requested relative MIP gap. Those options request a termination policy; they do not guarantee that every larger problem finishes optimally."}</Prose>

<Prose>{"Read status before interpreting a decision. Status 0 represents successful optimization. In this example status 2 reports infeasibility. A time limit or other failure must retain its returned status; a missing optimum is not a zero vector to round into a purported solution. After success, the code independently multiplies "}<InlineMath>{"Az"}</InlineMath>{", checks constraint residuals, checks distance from integer counts within the declared numerical tolerance, and recomputes the objective. Solver arrays use floating-point numbers even though the problem describes whole slots."}</Prose>

<Prose>{"Switching integrality to 0/0 permits the continuous relaxation. The default supply can then be met by 1.75 of the first slot at cost 12.25. That is below the whole-slot optimum 14 but is unavailable under the stated slot contract. The gap explains why integer allocation matters; it does not tell us to buy fractional resources from a provider that does not sell them."}</Prose>

<CodeBlock language={"text"}>{"python allocation_solver.py"}</CodeBlock>

<Prose>{"Its printed cells let you trace the ordinary result back to the enumerated lattice for demand 7. Demand 13 exercises the infeasible route. The final row exposes the relaxation. This is a reproducible small fleet-allocation tool, with supplied capacities and requirements, rather than an automatic guarantee for an actual production service."}</Prose>

<RemoteCodeBlock source="/learn/examples/inference-cost/allocation_solver.py" filename="allocation_solver.py" />

<span className="cost-alias" id="5-production-implementation" />
<span className="cost-alias" id="6-visual-walkthrough" />
<H2>{"14. Inspect the real model and reproduce the accounting"}</H2>

<Resettable component={TensorObservation} label="D28" />

<Prose>{"So far, arithmetic and capacity values came from declared scenarios. Now inspect actual tensors from a checkpoint. The example uses EleutherAI Pythia-14M at revision "}<code>{"cf967c0a9a04383db6f7b1108d86b2962634b4ac"}</code>{". Its exact six downloaded file identities are supplied, and the program checks them before loading. Alice excerpts come from the supplied Project Gutenberg provenance; the original text is public domain in the USA, with local copyright conditions noted in its provenance file."}</Prose>

<Prose>{"The retained run used CPU float32, evaluation mode, no gradients, eager attention and two threads. It did not fit the model, book a GPU or call a paid API. All four prompts have sixteen actual selected IDs. The original complete excerpts have different tokenizer lengths, so the supplied selection records preserve both the source text and the selected prefix rather than claiming every paragraph is sixteen tokens long."}</Prose>

<Prose>{"The loaded configuration has six layers, four attention heads, hidden width 128 and vocabulary size 50,304. Each head has width 32. The parameter tensors contain 14,067,712 elements: 56,270,848 bytes at four bytes each. Two rotary-frequency buffers add 16 bytes each, giving 56,270,880 bytes for the recorded resident parameter-plus-buffer tensors. These are tensor-storage observations, not process memory usage."}</Prose>

<Prose>{""}<code>{"storage_rows()"}</code>{" records each named tensor's shape, element count, element bytes, logical bytes and backing-storage bytes. A view can expose fewer elements than its underlying allocation, and two named tensors can share storage. The program deduplicates backing allocations by device, storage address and storage size. In this particular run, parameter logical bytes equal unique backing bytes; that observed equality does not make deduplication unnecessary in a different model."}</Prose>

<Prose>{"Keys and values belong to separate rows from parameters and buffers. At a sixteen-position prompt, each layer's K tensor has shape "}<code>{"[1, 4, 16, 32]"}</code>{", and V has the same shape. Across six layers their logical bytes are"}</Prose>

<div className="neural-equation"><MathBlock>{"2\\times6\\times4\\times16\\times32\\times4=98{,}304."}</MathBlock></div>

<Prose>{"Actual unique cache backing bytes also equal 98,304 in this run. After one new position, the cache has 17 positions and 104,448 bytes. After two, it has 18 positions and 110,592 bytes. Dynamic cache allocation in another implementation can reserve more than the occupied logical length; the report preserves both totals so the distinction can be checked."}</Prose>

<Resettable component={ForwardObservation} label="D29" />

<Prose>{"Trace Alice-1, whose selected prompt ends with “I must be shutting up like”. Prefill processes its sixteen IDs and selects output ID 436. The next forward processes that ID with the cache and selects 1425. The third forward processes 1425 only to inspect its stored state; it selects no additional output. The two selected output IDs decode to "}<code>{" this.”"}</code>{". This short fixed continuation counts work; it is not a meaningful evaluation of the model's literary understanding."}</Prose>

<NeuralTable caption={"14. Inspect the real model and reproduce the accounting"} headers={[<>{"Saved step"}</>, <>{"Input/query positions"}</>, <>{"Cache positions after forward"}</>, <>{"Selected output ID"}</>, <>{"Logical KV bytes"}</>, <>{"Logit bytes"}</>, <>{"Partial Linear FLOPs"}</>]} rows={[[<>{"Prefill, step 0"}</>, <>{"16"}</>, <>{"16"}</>, <>{"436"}</>, <>{"98,304"}</>, <>{"3,219,456"}</>, <>{"243,793,920"}</>], [<>{"Cached forward, step 1"}</>, <>{"1"}</>, <>{"17"}</>, <>{"1425"}</>, <>{"104,448"}</>, <>{"201,216"}</>, <>{"15,237,120"}</>], [<>{"Inspection forward, step 2"}</>, <>{"1"}</>, <>{"18"}</>, <>{"None"}</>, <>{"110,592"}</>, <>{"201,216"}</>, <>{"15,237,120"}</>]]} />

<Prose>{"All four requests have these same dimensions and operation counts under the fixed input lengths, but their selected IDs differ. Alice-2 selects 2927/497, Alice-3 selects 1083/15 and Alice-4 selects 16922/15. Select any retained request and step to see its actual query IDs, cache rows and output decision. The browser reads saved observations; it does not run the model again."}</Prose>

<Prose>{"The logit tensor stores one score per vocabulary ID at each requested query position. Here the program retains logits for every prefill input, so its storage is "}<InlineMath>{"16\\times50{,}304\\times4=3{,}219{,}456"}</InlineMath>{" bytes. A one-position forward gives 201,216 bytes. Asking for only final logits or using another output representation can change this storage, so state that option in an accounting report."}</Prose>

<Prose>{"The last column is deliberately a "}<strong>{"partial operation count"}</strong>{". Hooks observe 25 "}<code>{"torch.nn.Linear"}</code>{" calls per forward: the layer projections plus output head. Each hook uses actual input rows and module dimensions to count nominal "}<InlineMath>{"2BKN"}</InlineMath>{" work. Prefill has sixteen rows and 243,793,920 counted operations; each later one-position forward has 15,237,120. Attention score/value matmuls, embeddings, normalization, activations, bias additions and other operations are excluded. The number is not total model FLOPs, measured traffic or latency."}</Prose>

<Prose>{"This also explains why blindly multiplying the complete parameter count by two is not this exact partial count. Input embeddings can be looked up rather than multiplied as a full dense matrix, while heads and other projections have distinct roles. The section 4 projection drawing shows precisely which operation is being counted."}</Prose>

<Prose>{"The retained campaign completed exactly twelve forwards and selected eight output IDs across four requests. Parameter-content digests before and after are identical. That confirms this diagnostic left parameters unchanged; it does not certify task quality, capacity or provider cost. The tokenizer issued a cleanup warning during execution; the program records actual IDs rather than relying only on displayed text."}</Prose>

<Prose>{"The full "}<code>{"native_model_accounting.py"}</code>{" uses the ordinary "}<code>{"AutoTokenizer"}</code>{" and "}<code>{"AutoModelForCausalLM"}</code>{" route. It then calls the model with explicit "}<code>{"input_ids"}</code>{", full attention-mask length and "}<code>{"past_key_values"}</code>{". Each completed forward's actual tensors/counts are saved before their dimensions are checked against the scratch cache formula. A fresh output directory is required, and a failure records the active step plus already completed observations. This keeps actual evidence separate from its later interpretation."}</Prose>

<Prose>{"Create and activate a virtual environment using the setup guide, then install the package snapshot used for the examples:"}</Prose>

<CodeBlock language={"text"}>{"python -m pip install numpy==2.3.5 scipy==1.18.1 torch==2.14.0 transformers==5.19.0 tokenizers==0.23.2 huggingface-hub==1.33.0 safetensors==0.8.0\npython acquire_model.py --output model-cache\npython native_model_accounting.py --model model-cache --output my-observations\npython practice_answers.py --native-report my-observations/report.json"}</CodeBlock>

<Prose>{""}<code>{"acquire_model.py"}</code>{" is the exact hash-checking utility from the KV Cache lesson. Acquisition is an optional network/disk operation before inference; existing valid bytes are reused, and model weights are not inside the program archive. "}<code>{"my-observations"}</code>{" must be new. Read the "}<a href={"/learn/examples/inference-cost/native-observations.json"}>{"retained native observations"}</a>{" to compare your shapes and storage with this run; there is no need to generate another run merely to inspect them."}</Prose>

<RemoteCodeBlock source="/learn/examples/inference-cost/acquire_model.py" filename="acquire_model.py" />
<RemoteCodeBlock source="/learn/examples/inference-cost/native_model_accounting.py" filename="native_model_accounting.py" />

<span className="cost-alias" id="9-failure-modes-and-gotchas" />
<H2>{"15. Choose an investigation"}</H2>

<Resettable component={Sensitivity} label="D30" />

<Prose>{"The actual tensor report answers a storage and counted-work question. It does not settle which deployment will be cheaper for the assistant. A useful next investigation targets the assumption that can change the decision."}</Prose>

<Prose>{"Start with a range rather than a convenient single forecast when demand, usable service rate or independent overhead is uncertain. Compute expense and feasibility across its declared endpoints and relevant capacity stairs. The shaded region in the drawing is a "}<strong>{"scenario band"}</strong>{" from supplied assumptions, not a confidence interval derived from repeated observations."}</Prose>

<Prose>{"For example, retain the 180,000-task slot capacity and $0.002 variable expense, but let fixed expense range from $1,000 to $1,400 and demand from 120,000 to 160,000. At 120,000 tasks, reserved expense ranges from $1,240 to $1,640, while the $0.01-per-task alternative costs $1,200. At 160,000, reserved expense ranges from $1,320 to $1,720, compared with $1,600. Those bounds can change the winner. Narrow fixed expense to $1,000–$1,100 and demand to 160,000–170,000: reserved expense stays between $1,320 and $1,440, below the alternative's $1,600–$1,700 throughout that supplied one-slot region. Crossing a capacity stair requires recomputing the region rather than extending that conclusion."}</Prose>

<Prose>{"If one eligible choice remains cheaper and meets the required capacity throughout the supplied range, that decision is robust to those particular inputs. If the winner flips, measure the uncertain quantity that separates them. If quality or latency is unknown, stop the eligibility conclusion: a lower expense curve cannot fill in an absent quality evaluation."}</Prose>

<Resettable component={Aggregation} label="D31" />

<Prose>{"A reproducible investigation joins records by request ID, attempt ID and task outcome. Keep billed categories and rates, prompt/output lengths, cache status, hardware/time boundary, model/revision, engine settings, arrival/concurrency and task quality. Include failed, canceled and retried attempts according to the stated denominator. Dropping unsuccessful work can make apparent cost per success fall without reducing expenditure."}</Prose>

<Prose>{"Choose aggregation deliberately. For two completed groups with expenses $0.004/$0.030 and twenty/three hundred output tokens, total expense per output token is"}</Prose>

<div className="neural-equation"><MathBlock>{"\\frac{0.004+0.030}{20+300}=0.00010625\\ \\mathrm{USD/token}."}</MathBlock></div>

<Prose>{"The unweighted mean of their two per-token ratios is "}<InlineMath>{"\\tfrac12(0.004/20+0.030/300)=0.00015"}</InlineMath>{". That statistic gives each group equal weight regardless of token count. The ratio of sums answers “how much expense per token across all this work?” Neither replaces a cost-per-success statistic or a latency distribution."}</Prose>

<Prose>{"For timing comparisons, record warmup, exact included operations, instrumentation and workload order. A hook inside a timer changes the measured work. A client interval can include transport while an engine interval begins later. Resource peaks, tensor bytes and compulsory-byte models are different observations. "}<a href={"/learn/path/full-curriculum/inference-engines-serving?module=large-language-models"}>{"Inference Engines & Serving"}</a>{" develops the ordinary tools for these production measurements."}</Prose>

<Prose>{"The assistant's next investigation can therefore be small and targeted: reconcile usage first; verify memory fit if it is uncertain; measure an eligible workload's service distribution if capacity is uncertain; evaluate the actually routed subset if quality is uncertain. Preserve an unfavorable outcome rather than changing the workload to produce a preferred winner."}</Prose>


<H2>{"16. Summary"}</H2>

<Prose>{"Inference economics connects a ledger to a feasible service. Token categories determine a request's quoted charge. Resident weights, KV and workspace constrain which states fit. Arithmetic, traffic, parallelism and dependencies constrain execution, with a roofline supplying a conditional lower bound. Delivered work—not nominal capacity—provides the denominator for allocating a reserved expense."}</Prose>

<Prose>{"Whole capacity slots create cost stairs, so a crossover must belong to a feasible interval. Prefix savings depend on actual writes, hits, ancestry and lifetime. Retry and routing expenses belong to original tasks, including failures; selected-subset quality cannot be inferred from a cheaper token quote. An optimizer can choose among supplied feasible choices, but cannot establish missing performance or quality coefficients."}</Prose>

<NeuralTable caption={"16. Summary"} headers={[<>{"Uncertain question"}</>, <>{"Next useful evidence"}</>]} rows={[[<>{"What produced the bill?"}</>, <>{"Disjoint usage ledger, exact rate/currency/date and all attempts"}</>], [<>{"Will this model/request state fit?"}</>, <>{"Named weight/buffer/KV/workspace placement and actual backing storage"}</>], [<>{"Can the fleet serve the workload within its SLO?"}</>, <>{"Workload-specific capacity and queue/response distributions"}</>], [<>{"Does routing preserve required task quality?"}</>, <>{"Conditional evaluations for flagged/unflagged tasks and each required class"}</>], [<>{"Which eligible choice is cheaper?"}</>, <>{"Feasible capacity stairs, independent expense categories and sensitivity"}</>]]} />

<Prose>{"The opening assistant can now explain why expenditure rose and what a proposed change must prove. The local checkpoint results establish actual tensor storage and partial work, while the declared accounting scenarios establish their conditional arithmetic. The remaining deployment decision needs its own workload, quality and service measurements."}</Prose>

<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice"><span className="cost-alias" id="11-self-check-exercises" />
<H2>{"17. Independent practice"}</H2>

<Prose>{"Use the complete "}<code>{"practice_answers.py"}</code>{" to compare changed inputs with the calculations below. Hints and solutions can be opened independently. All monetary rates in a task are USD per million tokens unless the task explicitly says per task or per device-hour."}</Prose>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"1. Change both sides of the request ledger"}</H3>

<Prose>{"A request has 1,500 uncached input tokens and 120 output tokens at rates 3/12. Compute its expense, then compare doubling only input with doubling only output. Write one complete JSONL record with the other categories zero."}</Prose>

<details><summary>Hint</summary><Prose>{" Keep input and output contributions separate before adding."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" Input costs $0.0045; output costs $0.00144; total is $0.00594. Doubling input adds $0.0045, producing $0.01044. Doubling output adds $0.00144, producing $0.00738. A valid record is "}<code>{"{\"request_id\":\"practice-1\",\"counts\":{\"uncached_input\":1500,\"cache_creation_5m\":0,\"cache_creation_1h\":0,\"cache_read\":0,\"output\":120}}"}</code>{". Its rates must be 3/12, not the supplied default 2/10 snapshot. The number of added tokens alone does not determine added expense when categories have different rates."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"2. Interpret a creation subtotal"}</H3>

<Prose>{"Using the dated Sonnet snapshot, a usage row reports 80 uncached tokens, 600 reads, 200 five-minute writes, 100 one-hour writes and 60 outputs. Its total creation field is 300. Compute expense and diagnose charging the 300 again."}</Prose>

<details><summary>Hint</summary><Prose>{" The creation parent has two children with different prices."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" Contributions are $0.00016, $0.00006, $0.00050, $0.00040 and $0.00060, totaling $0.00172. The 300 is 200+100; charging it again duplicates created input and also needs an unjustified single rate. "}<code>{"normalize_usage()"}</code>{" must check the two subcounts before passing the five disjoint categories to "}<code>{"request_bill()"}</code>{"."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"3. Price a different repeated prefix"}</H3>

<Prose>{"Three requests share 1,200 prefix tokens; each adds 50 uncached tokens and 100 outputs. The first writes a five-minute entry and the next two hit at starts 60/120 seconds. Compare total expense with no caching. What if all three instead miss?"}</Prose>

<details><summary>Hint</summary><Prose>{" Each request still pays its suffix and output contribution."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" The write request costs "}<InlineMath>{"(1200(2.5)+50(2)+100(10))/10^6="}</InlineMath>{"0.00410. Each hit costs $0.00122. Total is $0.00654, compared with three uncached requests at $0.00350 each, totaling $0.01050. Three writes instead total $0.01230. Cache configuration without reuse can cost more than uncached input. The supplied practice output verifies the changed write-plus-two-hits result; the all-miss calculation changes the hit pattern rather than the category rate."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"4. Use a conditional retry probability"}</H3>

<Prose>{"First-attempt success is 0.7. One retry after failure succeeds with conditional probability 0.5 and costs the same $0.02 as the first attempt. Compute expected expense per original task, overall success and expense per successful task. Explain why substituting 0.7 on the retry is an assumption."}</Prose>

<details><summary>Hint</summary><Prose>{" Only 30% of tasks pay for retry."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" Expense is $0.02(1+0.3)=$0.026. Success is 0.7+0.3(0.5)=0.85. Their ratio is approximately $0.0305882353 per success, including expenses on remaining failures. An unconditional first-attempt accuracy does not establish accuracy on tasks that already failed; the conditional 0.5 is the supplied input. If retry outcomes were independent with the same success probability, 0.7 would be justified, but that is a different model."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"5. Count capacity in decimal bytes"}</H3>

<Prose>{"A 24 GB device stores 9 billion FP16 parameters and reserves 3 GB workspace. Each request needs 0.75 GB KV. How many whole requests fit? State what happens if “24 GB” was actually 24 GiB while all other quantities remain decimal."}</Prose>

<details><summary>Hint</summary><Prose>{" Subtract fixed occupants before dividing; do not reinterpret every unit at once."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" Weights use 18 GB, leaving 24−18−3=3 GB for cache. Four 0.75 GB requests fit. With 24 GiB, device bytes become 25,769,803,776, leaving 4,769,803,776 after decimal weights/workspace. Six 750,000,000-byte requests fit; seven do not. This deliberately changed unit convention explains the different answer. Neither estimate includes unspecified allocator or other runtime state."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"6. Use KV heads rather than query heads"}</H3>

<Prose>{"Compute KV storage for 24 layers, 4 KV heads, head width 128, 2,048 positions, 3 requests and 2 bytes per element. A configuration has 16 query heads. Explain the result of mistakenly using them instead."}</Prose>

<details><summary>Hint</summary><Prose>{" The two stored tensors are K and V for each KV head."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" "}<InlineMath>{"2(24)(4)(128)(2048)(3)(2)=301{,}989{,}888"}</InlineMath>{" bytes, or 288 MiB. Substituting 16 query heads multiplies it by four, giving 1,207,959,552 bytes or 1,152 MiB, under this logical model. Grouped-query attention reuses KV heads across queries; extra query heads do not imply extra stored KV heads when the architecture's actual KV count stays 4."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"7. Trace another matrix"}</H3>

<Prose>{"Let "}<InlineMath>{"X"}</InlineMath>{" be 3×4 and "}<InlineMath>{"W"}</InlineMath>{" 5×4, with two-byte elements in the compulsory-traffic model. Count nominal projection operations and bytes. For input row "}<code>{"[2,-1,0,3]"}</code>{" and selected weight row "}<code>{"[1,2,4,-1]"}</code>{", compute the selected output."}</Prose>

<details><summary>Hint</summary><Prose>{" Count "}<InlineMath>{"BK"}</InlineMath>{", "}<InlineMath>{"KN"}</InlineMath>{" and "}<InlineMath>{"BN"}</InlineMath>{" elements separately."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" The output is 3×5. Operations are "}<InlineMath>{"2(3)(4)(5)=120"}</InlineMath>{". Compulsory bytes are "}<InlineMath>{"2(12+20+15)=94"}</InlineMath>{". The selected dot product is "}<InlineMath>{"2(1)+(-1)(2)+0(4)+3(-1)=-3"}</InlineMath>{". These dimensions determine a work/traffic model; actual NumPy execution precision or DRAM traffic is not established by this element-size assumption."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"8. Keep a lower bound conditional"}</H3>

<Prose>{"A work item needs 0.6 trillion operations and 30 GB traffic at usable rates 150 TFLOP/s and 2 TB/s. Compute the ideal-overlap lower bound. Then include an explicitly unoverlapped 3 ms dependent stage."}</Prose>

<details><summary>Hint</summary><Prose>{" Compare two times before adding the independent stated dependency."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" Arithmetic requires 0.004 s and traffic 0.015 s. The maximum is 15 ms. An unoverlapped dependent 3 ms stage raises this model's bound to 18 ms. None is an actual latency measurement. Sparse peak rates, unknown parallelism or an assumed overlap schedule cannot be silently substituted for the stated usable dense rates and dependency."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"9. Charge the chosen horizon once"}</H3>

<Prose>{"Four devices cost $3.50 per GPU-hour. They are active 12 hours within a 48-hour reservation. Compute the reserved and active-only charges under their respective contracts. Why is adding them wrong?"}</Prose>

<details><summary>Hint</summary><Prose>{" Device-hours multiply, rather than replace, wall-clock hours."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" Reserved expense is $4(48)(3.50)=$672. Under an active-only billing assumption it is $4(12)(3.50)=$168. These are alternative contracts for the same occupancy. Adding them charges the 12 active hours twice. A separate independent storage bill could be added; an activity-derived allocation of the lease could not."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"10. Check an aggregate denominator"}</H3>

<Prose>{"Two devices cost $2 per GPU-hour each. Their aggregate service rate is 80 output tokens/s at a fixed input mix, delivered-work fraction 0.4. Use one hour to compute hardware expense per million output tokens. Diagnose another multiplication of output by two."}</Prose>

<details><summary>Hint</summary><Prose>{" The rate already covers the device group."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" Expense is $4. Output is 80×0.4×3600=115,200 tokens. Expense per million is "}<InlineMath>{"4(10^6)/115{,}200\\approx"}</InlineMath>{"34.7222222. Multiplying output by device count again would report 230,400 tokens and halve the apparent expense to about $17.3611111 without doing more work. More elapsed hours would scale both quantities together under these fixed-rate/fraction assumptions."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"11. Reject an unavailable crossover"}</H3>

<Prose>{"Each slot costs $900 per horizon and supplies 60,000 tasks. Independent variable expense is $0.003 per task, compared with a metered alternative at $0.015. Find the first-slot algebraic crossover and check feasibility. Consider the next two slots as well."}</Prose>

<details><summary>Hint</summary><Prose>{" Each slot count has its own interval and fixed charge."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" First crossing is 900/(0.015−0.003)=75,000, outside the first slot's interval (0,60,000]. Two-slot crossing 150,000 is outside (60,000,120,000]; three-slot crossing 225,000 is outside (120,000,180,000]. All three algebraic crossings are infeasible in their respective regions. At a capacity stair, a new charge moves the crossing outward again. No valid winner follows from the first smooth-line solution."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"12. Keep supply after failure"}</H3>

<Prose>{"Each slot supplies 40,000 usable tasks per month after the chosen headroom. Demand is 90,000 and one slot may fail. How many slots are required and what remains after failure?"}</Prose>

<details><summary>Hint</summary><Prose>{" Apply the capacity requirement to "}<InlineMath>{"n-1"}</InlineMath>{" survivors."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" "}<InlineMath>{"\\lceil90{,}000/40{,}000\\rceil+1=4"}</InlineMath>{". Three survivors supply 120,000, satisfying demand. Three total slots would leave 80,000 and fail. “Usable” already includes the supplied headroom; applying another fraction would require a separately stated reason. This arithmetic establishes one-failure capacity, not a latency distribution or protection against correlated failures."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"13. Solve a changed integer allocation"}</H3>

<Prose>{"First-pass readers can enumerate this problem using "}<a href={"#12-optimize-subject-to-the-actual-constraints"}>{"section 12's integer allocation"}</a>{". For the SciPy input mapping and solver-status part, return to "}<a href={"#13-deeper-use-the-ordinary-optimization-tool"}>{"section 13's ordinary optimization tool"}</a>{" before attempting it. Both parts and the full solution remain below."}</Prose>

<Prose>{"Minimize 5x+3y with capacity 3x+2y≥8, whole nonnegative slot counts and x+y≤3. Enumerate the optimum, map it to SciPy inputs, and interpret demand 10."}</Prose>

<details><summary>Hint</summary><Prose>{" Compare the feasible (2,1) and (3,0) cells; do not allow fractional slots."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" "}<InlineMath>{"(2,1)"}</InlineMath>{" supplies 8 and costs 13; "}<InlineMath>{"(3,0)"}</InlineMath>{" supplies 9 and costs 15. The other cheaper cells lack capacity, so the optimum is (2,1). Use "}<code>{"c=[5,3]"}</code>{", constraint rows "}<code>{"[[3,2],[1,1]]"}</code>{", lower bounds "}<code>{"[8,-inf]"}</code>{", upper bounds "}<code>{"[inf,3]"}</code>{", variable bounds 0/3 and integrality 1/1. The actual ordinary solver returned status 0 and cost 13, matching enumeration. Demand 10 exceeds maximum supply 9 and returns infeasible status 2; it supplies no zero-dollar deployment."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"14. Find a hidden class failure"}</H3>

<Prose>{"There are 90 easy tasks and 10 hard tasks. A cheap route succeeds on every easy task and half the hard tasks, costing $0.002 each. Each class requires quality at least 0.9. An alternative for hard tasks costs $0.02 and has conditional quality 0.95 on that class. Compute the aggregate cheap quality, eligibility and expense before and after routing only hard tasks differently."}</Prose>

<details><summary>Hint</summary><Prose>{" Test class requirements before averaging them together."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" Cheap aggregate quality is (90+10(0.5))/100=0.95, but hard quality 0.5 violates the requirement, so the $0.20 all-cheap route is ineligible. Routing hard tasks to the supplied alternative costs 90(0.002)+10(0.02)=$0.38. Easy quality stays 1; hard quality becomes 0.95; aggregate quality becomes 0.995. This policy uses the class-conditional input; it does not infer the alternative's hard-task quality from an unrelated overall benchmark."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"15. Choose an aggregation"}</H3>

<Prose>{"One group costs $0.01 and emits 10 tokens; another costs $0.02 and emits 100. Compute total expense per token and the unweighted mean of the two group ratios. Explain their different questions."}</Prose>

<details><summary>Hint</summary><Prose>{" Division and averaging do not generally commute."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" Ratio of sums is 0.03/110≈$0.000272727 per token. Mean ratios is (0.01/10+0.02/100)/2=$0.0006. The second gives equal weight to unequal token populations; the first spreads total expense across all 110 tokens. Neither yields cost per successful task without task-outcome data. Retain failed work in whichever aggregate's accounting contract includes it."}</Prose></details></div>

<div className="lesson-exercise" data-lesson-exercise=""><H3>{"16. Read actual cache rows independently"}</H3>

<Prose>{"Open the retained Alice-2 step 2 record. Independently sum K/V elements×element bytes across all layers. Identify query length, cached length and whether this forward selected another output. Which storage does this sum exclude?"}</Prose>

<details><summary>Hint</summary><Prose>{" Each K and V row has shape "}<code>{"[1,4,18,32]"}</code>{"; there are six layers."}</Prose></details>

<details><summary>Worked solution</summary><Prose>{" Each tensor has 2,304 elements and 9,216 logical bytes. Twelve tensors give 110,592 bytes. Query length is 1, cached length 18, and selected output is "}<code>{"None"}</code>{": this is the inspection forward after both emitted tokens. The sum excludes weights, buffers, logits, temporary allocations, runtime/Python state and allocator metadata. In this retained run unique cache backing storage equals logical storage; that equality must be checked in another layout. "}<code>{"practice_answers.py --native-report native-observations.json"}</code>{" independently sums the saved tensor rows and reports the matching value without another model forward."}</Prose></details>

<RemoteCodeBlock source="/learn/examples/inference-cost/practice_answers.py" filename="practice_answers.py" /></div></section>

<span className="cost-alias" id="10-primary-sources" />
<H2>{"18. Further learning, references and readiness"}</H2>

<section className="lesson-ending lesson-ending--further-learning" data-lesson-ending="further-learning" data-lesson-resource-list=""><H3>{"Further learning"}</H3>

<ul><li>{""}<a href={"https://openstax.org/books/principles-economics-3e/pages/7-3-costs-in-the-short-run"}>{"OpenStax, Costs in the Short Run"}</a>{" develops fixed, variable, average and marginal costs with a clear time horizon. Use it to strengthen the economic distinction behind the reservation and capacity stairs; its textbook cases are not inference benchmarks."}</li><li>{""}<a href={"https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/index.html"}>{"NVIDIA, GPU Performance Background"}</a>{" draws processing lanes, memory and arithmetic intensity. Its explanations make the roofline and parallelism limits concrete; its named older-device examples do not measure this checkpoint or today's service."}</li><li>{""}<a href={"https://sre.google/sre-book/software-engineering-in-sre/"}>{"Google SRE, Developing Software for Complex Machines"}</a>{" explains why requirements, performance mappings, dependencies and feasible supply precede minimizing an allocation objective. Read the allocation/implementation discussion when a simple replica count no longer captures the service."}</li><li>{""}<a href={"https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.milp.html"}>{"SciPy "}<code>{"milp"}</code>{" documentation"}</a>{" provides an ordinary integer/relaxed example and explains constraints, integrality and status. Reproduce the changed practice coefficients before extending the local solver."}</li></ul></section>

<section className="lesson-ending lesson-ending--references" data-lesson-ending="references" data-lesson-resource-list=""><H3>{"Technical references"}</H3>

<ul><li>{""}<a href={"https://proceedings.mlsys.org/paper_files/paper/2023/file/c4be71ab8d24cdfb45e3d06dbfca2780-Paper-mlsys2023.pdf"}>{"Pope et al., Efficiently Scaling Transformer Inference, MLSys 2023"}</a>{": the main paper connects prefill/generation, partitioning, memory, communication and latency/cost tradeoffs on specified PaLM/TPUv4 systems. Its source-specific results support the method of constrained comparison rather than a portable performance constant."}</li><li>{""}<a href={"https://platform.claude.com/docs/en/about-claude/pricing"}>{"Anthropic pricing"}</a>{" and "}<a href={"https://platform.claude.com/docs/en/build-with-claude/prompt-caching"}>{"prompt caching"}</a>{": first-party rates, disjoint usage fields, prefix matching, lifetime and mixed-TTL rules. This lesson's public quote snapshot is dated 8 October 2026; recheck the actual account/platform tariff for a new request."}</li><li>{""}<a href={"https://lambda.ai/instances"}>{"Lambda instance listings"}</a>{" and "}<a href={"https://www.nvidia.com/en-us/data-center/h100/"}>{"NVIDIA H100 specifications"}</a>{": dated price/device-capacity inputs. Read price units and sparse-performance footnotes before applying a number; capacity, rate and invoice amount are separate facts."}</li><li>{""}<a href={"https://docs.python.org/3/library/decimal.html"}>{"Python "}<code>{"decimal"}</code>{""}</a>{": exact decimal-string parsing and explicit precision/rounding behavior used by the monetary ledgers."}</li><li>{""}<a href={"https://huggingface.co/EleutherAI/pythia-14m/tree/cf967c0a9a04383db6f7b1108d86b2962634b4ac"}>{"Pythia-14M checkpoint"}</a>{" and "}<a href={"https://huggingface.co/docs/transformers/en/cache_explanation"}>{"Transformers caching documentation"}</a>{": the pinned actual model and ordinary cache interface underlying the CPU tensor observations. The supplied files/report bind this lesson's exact revision and executable path."}</li></ul></section>

<section className="lesson-ending lesson-ending--next" data-lesson-ending="next"><H3>{"Readiness"}</H3>

<Prose>{"You are ready to apply the lesson when you can reconstruct disjoint usage and one complete monetary subtotal; trace a stored parameter/KV/workspace constraint; distinguish operation counts, traffic models and elapsed observations; preserve a reservation's charge while changing its denominator; reject an infeasible crossover or solver result; and compute retry/routing expense with actual conditional quality requirements."}</Prose>

<Prose>{"For a concrete check, change a capacity, price or task requirement in one practice case, state its units and recompute the complete result. Then identify the assumption that still needs measurement. The next topic, "}<a href={"/learn/path/full-curriculum/test-time-compute-scaling?module=large-language-models"}>{"Test-Time Compute & Reasoning Models"}</a>{", asks when additional calls or generated work improve a task enough to justify those extra resources."}</Prose></section>
</div>;
}
export default {
  title: 'Inference Cost Economics & Compute Scaling',
  readTime: '75 min',
  content: () => <InferenceCostLesson />
};
