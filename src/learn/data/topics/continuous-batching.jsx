// Generated from accepted immutable content by scripts/render-continuous-batching-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../components/lesson-labs/ContinuousBatchingShared.jsx';
import { CbRequest, CbBoundary, CbSchedules, CbRefill, CbBudgets, CbClocks, CbProjection, CbSegmented, CbScatter } from '../../components/lesson-labs/ContinuousBatchingFoundations.jsx';
import { CbAddresses, CbSlack, CbTransaction, CbRelease, CbFork, CbCopyOnWrite, CbPageNormalization, CbOnlineSoftmax, CbAdmission, CbRebuild } from '../../components/lesson-labs/ContinuousBatchingStorage.jsx';
import { CbChunks, CbQueryAllocation, CbModeledTime, CbManager, CbLifecycle, CbNativeParity, CbNativeClocks, CbWorkers, CbPipeline, CbDiagnosis, CbBindingLimit } from '../../components/lesson-labs/ContinuousBatchingServing.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="cb-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/continuous-batching/' + file} language="python" title={file} filename={file} />
);
function ContinuousBatchingLesson() {
  return <div className="lesson-flow cb-flow">
    <section>
    <Prose>{
      "A language model serves several people at once. One response ends after a few tokens; " +
      "another continues for hundreds. A new prompt arrives while both are running. How can the " +
      "model admit that new work without waiting for an entire batch to finish—and without letting " +
      "one person's query read another person's history?"
    }</Prose>
    
    <Prose>{"We will build the two mechanisms together. "}<strong>{"Continuous batching"}</strong>{" changes the set of requests between forward passes. "}<strong>{"PagedAttention"}</strong>{
      " lets attention read a request's history from physical blocks that need not be adjacent. The " +
      "scheduler decides which work runs; the page tables decide which stored numbers that work may " +
      "read. Correctness requires their identities, positions and lifetimes to agree."
    }</Prose>
    
    <Prose opening="prerequisites">{"The "}<a href={"/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models"}>{"KV-cache lesson"}</a>{" explains the per-layer keys and values we retain. The "}<a href={
      "/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models"
    }>{"causal decoder"}</a>{
      " supplies the complete PyTorch network used here. We refresh both contracts before extending " +
      "them. No operating-systems paging or queueing-theory prerequisite is assumed."
    }</Prose>
    
    <Prose opening="route">{
      "The first pass follows sections 1–13, the diagnostic in section 15, and the practices. The " +
      "online-softmax derivation in section 9 and the multi-worker discussion in section 14 are " +
      "visible deeper branches. The concrete normalization rule and the local request lifecycle are " +
      "part of the first pass. The Python programs run locally; the interactive drawings operate " +
      "finite models and recorded observations."
    }</Prose>
    
    <span id="1-why-it-exists" aria-hidden="true" />
    <H2>{"1. Keep a request separate from its last selected token"}</H2>
    
    <Prose>{"Start with request A, whose prompt IDs are "}<code>{"[11, 7, 5]"}</code>{". The final prompt row has just selected ID "}<code>{"9"}</code>{
      ". An ID is a vocabulary index, not an embedding coordinate. The model has processed three " +
      "positions and has emitted one output. Those are different counts."
    }</Prose>
    
    <CbRequest />
    
    <Prose>{"Positions 0, 1 and 2 already have a key and value in every attention layer. ID "}<code>{"9"}</code>{
      ", at position 3, is waiting to become an input. The next forward pass creates its K/V " +
      "records and predicts the following output. If the response stops immediately after selecting "
    }<code>{"9"}</code>{", those records are never needed."}</Prose>
    
    <Prose>{"Call the initial processing of a known prompt "}<strong>{"prefill"}</strong>{". Call the later processing of a pending generated token "}<strong>{"decode"}</strong>{
      ". Prefill's final row selects the first output; each subsequent decode pass selects one " +
      "more. For a prompt of length P and a completed response of G outputs, stopping immediately " +
      "after the last selection normally leaves P + G − 1 computed positions. This convention will " +
      "explain both memory reservations and the simulation's useful-row counter."
    }</Prose>
    
    <Prose>{
      "A request record therefore needs its identity, prompt IDs, generated IDs, computed length, " +
      "arrival time, output cap and state. The "
    }<strong>{"cap"}</strong>{
      " is an upper bound supplied before execution. The actual stopping point may be earlier and " +
      "is not known to the scheduler. Two requests with identical lengths still need distinct " +
      "identities."
    }</Prose>
    
    <H2>{"2. Change membership at a forward boundary"}</H2>
    
    <Prose>{
      "A forward pass has already assembled its tensors. Inserting a new request halfway through " +
      "that pass would change their shapes and interpretation. Instead, finish the pass, deliver " +
      "its outputs, update state and assemble the next one."
    }</Prose>
    
    <CbBoundary />
    
    <Prose>{
      "The waiting queue contains accepted requests that are not yet running. Active requests can " +
      "be prefilling or decoding. At a boundary the scheduler chooses work, the model computes it, " +
      "and the output handler attaches each result to its request ID. Finished requests release " +
      "their cache references. A request arriving during the forward waits until a later boundary; " +
      "it does not retroactively join the current tensor."
    }</Prose>
    
    <Prose>{"This is "}<strong>{"iteration-level scheduling"}</strong>{
      ": the unit of scheduling is one model iteration rather than a whole response. It does not " +
      "require every request to produce a token on every iteration. A prefill chunk may end before " +
      "the prompt's final position and therefore produce no externally emitted token yet."
    }</Prose>
    
    <Prose>{
      "Cancellation also needs a contract. Our finite scheduler observes cancellation at " +
      "boundaries, emits one local "
    }<code>{"canceled"}</code>{
      " event and releases owned references. The maintained library later has a different " +
      "acknowledgment behavior: removing a pending request does not itself return a terminal "
    }<code>{"GenerationOutput"}</code>{
      ". Keep application state and framework results distinct. Refusing a duplicate ID before " +
      "insertion is simpler than trying to disentangle two histories after they share a name."
    }</Prose>
    
    <span id="2-core-intuition" aria-hidden="true" />
    <H2>{"3. Refill the empty slot"}</H2>
    
    <Prose>{"Consider eight requests A–H arriving together, four slots, and completion lengths "}<code>{"[30, 500, 25, 480, 40, 450, 20, 510]"}</code>{
      " work units. These lengths belong to a supplied workload oracle. Admission uses arrival " +
      "order, not foreknowledge of which response will finish soonest. For this first comparison " +
      "every nonempty iteration lasts one unit."
    }</Prose>
    
    <CbSchedules />
    
    <Prose>{
      "A static batch admits A–D and waits until all four finish before admitting E–H. A continuous " +
      "batch reuses each slot as soon as its previous request ends. Both versions can deliver a " +
      "completed output immediately; the static baseline's limitation here is admission, not " +
      "delayed output delivery."
    }</Prose>
    
    <CbRefill />
    
    <Prose>{
      "C completes at boundary 25. The row that held C now holds E; A, B and D continue. A ends at " +
      "30, so F enters. E ends at 65, then G enters that slot. G ends at 85, then H enters. The " +
      "continuous finish times are C 25, A 30, E 65, G 85, D 480, F 480, B 500 and H 595. In the " +
      "static schedule the second group starts at 500 and its longest member takes another 510 " +
      "units, giving 1010."
    }</Prose>
    
    <Prose>{
      "Both schedules perform 2055 request-work units. Continuous batching removes idle slot " +
      "intervals; it does not shorten an individual request's prescribed work. The ratio 1010/595, " +
      "about 1.697, is a ratio under the equal-iteration-time model. Real iteration time changes " +
      "with token count, history length, kernels and memory traffic. This drawing is not a hardware " +
      "speed measurement."
    }</Prose>
    
    <Prose>{
      "To run the complete examples, extract the lesson's file bundle into one directory. Use " +
      "Python 3.11 or later; the recorded environment used NumPy 2.3.5 and CPU PyTorch 2.14.0. A " +
      "separate virtual environment keeps these dependencies local. The ordinary Transformers route " +
      "in section 12 has additional pinned packages and a separately downloaded model. Start with " +
      "the standard-library scheduler:"
    }</Prose>
    
    <CodeBlock language={"bash"}>{
      "python -m venv .venv\n" +
      "# Activate .venv using your shell's activation command.\n" +
      "python -m pip install numpy==2.3.5 torch==2.14.0\n" +
      "python iteration_scheduler.py"
    }</CodeBlock>
    
    <Prose>{"The "}<code>{"README.md"}</code>{
      " gives Windows and POSIX activation commands, every program's inputs, and the model " +
      "acquisition step. "
    }<code>{"iteration_scheduler.py"}</code>{" prints JSON with both schedules, every interval and the changed-input checks. Its top-level "}<code>{"schedule"}</code>{" function is useful independently of the verification fixtures."}</Prose>
    
    <Prose>
    <a href="/learn-code/continuous-batching/continuous-batching-programs.zip" download>Download the complete program bundle</a>{' · '}<a href="/learn-code/continuous-batching/README.md">Setup and file guide</a>
    </Prose>
    <Program file="iteration_scheduler.py" />
    
    <Prose>{"The program sorts arrivals once and uses a deque for future and waiting work. "}<code>{"active"}</code>{
      " preserves slot identity; the event list preserves request identity. At each boundary it " +
      "first admits arrivals and observes cancellations, then fills eligible slots, performs one " +
      "unit of work and records completions. A static batch may admit only when all its slots are " +
      "empty. Idle time jumps directly to the next arrival instead of scanning unused timestamps."
    }</Prose>
    
    <Prose>{
      "The loop's work scales with scheduled iterations and the small active set, in addition to " +
      "arrival sorting. It does not allocate a dense time-by-request array. The separate interval " +
      "reconstruction checks capacity and work conservation. Empty work terminates without a " +
      "forward, a one-request workload makes the two policies equal, and a later arrival can leave " +
      "a slot idle even under continuous batching. No admission policy can run work before it " +
      "arrives."
    }</Prose>
    
    <H2>{"4. Count three different budgets"}</H2>
    
    <Prose>{
      "Refilling a slot solves only one constraint. A server must also decide how much token work " +
      "and how much history storage fit."
    }</Prose>
    
    <CbBudgets />
    
    <Prose>{"First count "}<strong>{"scheduled requests"}</strong>{". Second count "}<strong>{"new query rows"}</strong>{
      " processed in this iteration. A decode request typically adds one row, while a prefill chunk " +
      "may add several. Third count "
    }<strong>{"resident physical pages"}</strong>{
      " containing K/V state. An unscheduled request may still occupy pages; a page shared by two " +
      "requests counts once physically."
    }</Prose>
    
    <Prose>{
      "With a six-query-row budget, two continuing decodes use two rows and leave four for prefill. " +
      "This says nothing by itself about how many new pages are needed: a row may fit into an " +
      "already allocated tail. Conversely, a waiting request may need storage even though there is " +
      "an empty request slot. Units prevent a misleading diagnosis such as “six tokens fit, " +
      "therefore six requests fit.”"
    }</Prose>
    
    <Prose>{
      "The user experiences time, not these internal counters. Give each timestamp a precise event " +
      "before subtracting it."
    }</Prose>
    
    <CbClocks />
    
    <Prose>{"If arrival is a, first emission is f, and subsequent emissions are t₂, t₃ and so on, "}<strong>{"time to first token"}</strong>{", or TTFT, is f − a. An "}<strong>{"inter-token gap"}</strong>{
      " is the time between adjacent emissions. Completed-response elapsed time is last emission " +
      "minus arrival. Queueing and prefill both contribute to TTFT. A response with one output has " +
      "an empty gap list, not a measured zero gap. A canceled response may have emitted tokens but " +
      "lacks a completed-response elapsed time under this definition."
    }</Prose>
    
    <Prose>{"For supplied times a = 2, emissions "}<code>{"[5, 6.5, 8]"}</code>{", TTFT is 3, gaps are "}<code>{"[1.5, 1.5]"}</code>{
      " and response elapsed is 6. These are arithmetic over declared clocks. Later we will inspect " +
      "actual framework timestamps without inventing event times the API did not record."
    }</Prose>
    
    <H2>{"5. Share the weights, separate the histories"}</H2>
    
    <Prose>{
      "Changing membership also changes tensor rows. Suppose A contributes two new positions and B " +
      "contributes one, with hidden width four. Stack their new hidden rows into a 3 × 4 matrix. " +
      "The same projection weights apply to every row, so that operation can be shared."
    }</Prose>
    
    <CbProjection />
    
    <Prose>{"The offsets "}<code>{"[0, 2, 3]"}</code>{
      " say that A owns rows 0–1 and B owns row 2. Offsets locate segments in this iteration's " +
      "packed tensor. Absolute position IDs locate tokens within each request's history. They are " +
      "not interchangeable: B's first packed row could represent its position 50."
    }</Prose>
    
    <Prose>{
      "Row-wise normalization, linear projections and the feed-forward network can operate on the " +
      "packed matrix. Attention needs more information. A's queries may read A's earlier cached " +
      "keys and their own permitted new keys; they must not read B's keys."
    }</Prose>
    
    <CbSegmented />
    
    <Prose>{"A single lower-triangular mask over "}<code>{"[A0, A1, B0]"}</code>{
      " would allow B0 to read A0 and A1. That is causal in the concatenated row order but wrong " +
      "for independent requests. The correct mask first enforces request identity and then enforces " +
      "position order within that request. Perturbing A while holding B fixed must leave B's result " +
      "unchanged under the correct mask."
    }</Prose>
    
    <Prose>{
      "For a query at absolute position q and a key at k, an ordinary causal segment permits k ≤ q. " +
      "If the segment already has n cached positions and contributes m new rows, new query i has q " +
      "= n + i. Its row sees all n old keys plus the first i + 1 new keys. This is the same offset " +
      "mask used by the cached decoder; packing adds a request boundary around it."
    }</Prose>
    
    <CbScatter />
    
    <Prose>{
      "After the forward, scatter rows back using the recorded segment-to-request mapping. A " +
      "request's ID persists when its row number changes. Comparing only the multiset of output IDs " +
      "would miss a swap between A and B."
    }</Prose>
    
    <Prose>{"The complete "}<code>{"packed_decoder.py"}</code>{" reuses the actual "}<code>{"TinyLM"}</code>{
      " class from the causal lesson. It has learned absolute position embeddings, explicit " +
      "attention layers and a feed-forward network. Here a three-layer, width-16, four-head random " +
      "fixture supplies fixed weights. This is an architecture comparison, not trained language " +
      "quality. The Pythia network later uses a different position mechanism and tokenizer."
    }</Prose>
    
    <Program file="packed_decoder.py" />
    
    <Prose>{""}<code>{"PackedDecoder"}</code>{
      " concatenates the new token and position embeddings, runs shared row-wise primitives, then " +
      "splits Q/K/V by request for attention. For each layer it gathers only that request's valid " +
      "old K/V records from the shared pool introduced next. It concatenates those with the new " +
      "keys and values, applies the offset mask, and places the result back into the corresponding " +
      "packed rows. Newly computed K/V records are appended to storage only after the forward has " +
      "assembled all layers."
    }</Prose>
    
    <Prose>{"Its manual attention and PyTorch's "}<code>{"scaled_dot_product_attention"}</code>{
      " use matching scale and masks. FP64 comparisons check mixed prefill/decode chunks and " +
      "reordered requests against independent full-prefix TinyLM calls at absolute and relative " +
      "tolerance 10⁻¹². An A-only perturbation leaves B exactly unchanged in the tested fixture. A " +
      "partial fork followed by a child append also matches the independently recomputed child " +
      "prefix; its maximum absolute discrepancy was about 4.44 × 10⁻¹⁶. These checks establish the " +
      "tested operator correspondence, not universal bitwise equality across devices."
    }</Prose>
    
    <Prose>{
      "The wrapper conservatively reserves enough pages for every member before computing. When " +
      "both members would write a shared tail, this reservation can overestimate the ultimate " +
      "requirement. That makes rejection safe but does not claim maximum packing. The " +
      "implementation is an inspectable CPU reference: it shares position-wise computation but does " +
      "not implement a fused GPU segmented-attention kernel."
    }</Prose>
    
    <Prose>{"The complete inherited "}<code>{"tiny_causal_lm.py"}</code>{
      " is included for the packed decoder's architecture import. Its training entry point belongs " +
      "to the causal-modeling lesson and is not executed by this workflow. The bundled Alice " +
      "train/heldout files and provenance preserve that helper's complete inputs; this lesson's " +
      "native campaign uses only the declared train-text prefixes and trains no model."
    }</Prose>
    
    <Program file="tiny_causal_lm.py" />
    
    <span id="3-mathematical-foundation" aria-hidden="true" />
    <H2>{"6. Give logical positions physical addresses"}</H2>
    
    <Prose>{
      "The model needs a history in token order. Memory does not have to place that history in one " +
      "contiguous region. Split it into fixed-size "
    }<strong>{"pages"}</strong>{", also called blocks, and store a table translating each logical block to a physical page."}</Prose>
    
    <CbAddresses />
    
    <Prose>{"Use page size C = 3, valid length 7 and table "}<code>{"[4, 1, 6]"}</code>{
      ". Logical positions 0–2 occupy physical page 4, positions 3–5 occupy page 1, and position 6 " +
      "occupies offset 0 of page 6. Position 5 therefore reads page 1, offset 2. Position 7 would " +
      "point into allocated page 6, but it is invalid because it lies beyond the request's valid " +
      "length."
    }</Prose>
    
    <Prose>{
      "For logical position t, compute block b = floor(t/C), offset o = t mod C, and physical page " +
      "p = table[b]. Then read the K/V cell at p, o. Layer, head and feature coordinate remain " +
      "additional axes. Our actual arrays have shape "
    }<code>{"[layer, head, physical_page, offset, coordinate]"}</code>{
      "; the drawing simplifies those axes explicitly instead of turning a token position into a " +
      "feature coordinate."
    }</Prose>
    
    <Prose>{
      "Moving a page's values and updating every corresponding table reference can leave logical " +
      "attention unchanged. Changing the table without moving values cannot. This separation is the " +
      "point of indirection: logical order follows the table, while allocation chooses available " +
      "physical addresses."
    }</Prose>
    
    <CbSlack />
    
    <Prose>{"For lengths "}<code>{"[137, 89, 512, 50]"}</code>{" and C = 16, useful history is 788 token slots. Page counts are "}<code>{"[9, 6, 32, 4]"}</code>{
      ", giving 51 × 16 = 816 allocated slots and 28 unused tail slots. Reserving 512 slots for " +
      "each request would allocate 2048 slots. The paged allocation uses 816/2048 ≈ 39.84% of that " +
      "reservation, while its tail slack is 28/816 ≈ 3.43% of its allocated slots. Different " +
      "denominators answer different questions."
    }</Prose>
    
    <Prose>{
      "For lengths ℓᵢ, allocated token slots are CΣᵢceil(ℓᵢ/C). Multiply by the bytes per token " +
      "across layers and K/V heads to obtain tensor storage; table entries and reference counters " +
      "are additional metadata. Smaller pages reduce tail slack but increase metadata and the " +
      "number of page boundaries a kernel handles. The often-used expected slack (C − 1)/2 assumes " +
      "uniformly distributed integer length residues modulo C. It is not a measured property of " +
      "every workload."
    }</Prose>
    
    <span id="4-from-scratch-implementation" aria-hidden="true" />
    <H2>{"7. Make an append all-or-nothing"}</H2>
    
    <Prose>{
      "A table is useful only if updates keep it consistent with physical storage. Suppose a " +
      "request has length 5 with C = 3 and wants to append two rows. Its current second page has " +
      "one free valid-tail slot; the second new row needs a third page."
    }</Prose>
    
    <CbTransaction />
    
    <Prose>{
      "First compute the full allocation requirement. Then reserve all required pages and prepare " +
      "their values. Finally publish the new table, valid length and reference counts together. If " +
      "reservation fails, return before any observable mutation. Writing the first new row and only " +
      "then discovering that the next page is unavailable would leave the caller unsure whether " +
      "retrying should append one or two rows."
    }</Prose>
    
    <Prose>{
      "The complete shared pool supplies actual NumPy K/V arrays rather than page-number " +
      "bookkeeping alone. It also supplies a dense logical read so that each operation can be " +
      "compared with an independent expected history."
    }</Prose>
    
    <Program file="shared_pool.py" />
    
    <Prose>{""}<code>{"create"}</code>{" installs an empty identity. "}<code>{"append"}</code>{
      " validates the incoming layer/head/row/coordinate shape, computes new-page and private-tail " +
      "requirements, stages the touched arrays, and commits only after all requirements fit. "
    }<code>{"dense"}</code>{" follows the table and truncates at valid length. "}<code>{"snapshot"}</code>{
      " records all metadata and whole-array hashes, making a failed append's unchanged-state claim " +
      "testable. A scheduler may choose a smaller chunk before calling "
    }<code>{"append"}</code>{"; the allocator itself never silently shortens one."}</Prose>
    
    <CbRelease />
    
    <Prose>{""}<code>{"release"}</code>{
      " removes table references. A physical page becomes free only when its reference count " +
      "reaches zero. Reusing its numeric address does not resurrect the old request. A released ID " +
      "has no valid table from which to read, and newly allocated tail cells remain invalid until " +
      "written. Duplicate IDs, invalid fork bounds and double release are errors in this interface."
    }</Prose>
    
    <Prose>{
      "Releasing a request traverses its table, so its cost grows with the number of references " +
      "released. Appending costs the new-row writes plus any necessary tail copy. Dense gathering " +
      "deliberately materializes a logical view for verification; the addressed attention operator " +
      "in section 9 can instead consume one page at a time. The tests cover multiple fork/release " +
      "orders, actual value conservation, physical reuse and whole-state equality after an " +
      "out-of-memory refusal."
    }</Prose>
    
    <span id="6-visual-walkthrough" aria-hidden="true" />
    <H2>{"8. Share a prefix, then copy only when writing"}</H2>
    
    <Prose>{
      "Two requests can share computed history only when that history means the same computation: " +
      "matching model weights, tokens, positions, attention rules and relevant adapters. Our pool's " +
      "explicit "
    }<code>{"fork"}</code>{
      " trusts that condition. It does not search text or decide whether two arbitrary prompts are " +
      "equivalent; the later prefix-caching lesson develops lookup and cache identity."
    }</Prose>
    
    <CbFork />
    
    <Prose>{
      "Take a parent of length 5, C = 3, and fork its first 4 positions. Both tables initially " +
      "reference the parent's first two pages. The child has three valid cells on page one and only " +
      "one on page two. The parent has two valid cells on page two. The extra parent cell is " +
      "physically present, but it is not part of the child's history."
    }</Prose>
    
    <Prose>{"If the child appends at its logical position 4, it must not overwrite the parent's position 4. "}<strong>{"Copy-on-write"}</strong>{", or COW, makes a private page for this write."}</Prose>
    
    <CbCopyOnWrite />
    
    <Prose>{
      "Copy the child's one valid tail cell into a fresh page, place the child's new row at offset " +
      "1, and change the child's table to point at that private page. Decrement the old page's " +
      "reference count. The parent's values and table stay unchanged. Copying a full physical page " +
      "without preserving the child's validity boundary risks treating an unrelated parent suffix " +
      "as computed child history."
    }</Prose>
    
    <Prose>{
      "Contrast a parent of length 6 forked at 6. Both shared pages are full. The next append " +
      "allocates a new third page; it need not copy either old page. A fork at zero shares no page. " +
      "The amount of sharing therefore depends on both logical prefix length and alignment, not " +
      "just a percentage of matching text."
    }</Prose>
    
    <Prose>{""}<code>{"SharedPool.fork"}</code>{
      " increments one reference per table entry. Reference counts count ownership paths, not token " +
      "counts. "
    }<code>{"append"}</code>{
      " includes a partial shared tail in its reservation requirement, so insufficient space fails " +
      "atomically before either request changes. The supplied tests compare child and parent dense " +
      "arrays after append and after both release orders. This makes a stale reference, leaked page " +
      "or corrupted parent visible as a concrete value or ownership discrepancy."
    }</Prose>
    
    <H2>{"9. Normalize attention across the whole permitted history"}</H2>
    
    <Prose>{
      "Storage pages do not create separate attention distributions. A query still asks one " +
      "question over all its permitted keys. To see the difference, use scores "
    }<code>{"[0, log 2, log 3, log 4]"}</code>{", values "}<code>{"[2, 0, 4, 1]"}</code>{", and two tokens per page."}</Prose>
    
    <CbPageNormalization />
    
    <Prose>{"Exponentiating the scores gives masses "}<code>{"[1, 2, 3, 4]"}</code>{". Their total is 10, so probabilities are "}<code>{"[.1, .2, .3, .4]"}</code>{
      ". The output is .1×2 + .2×0 + .3×4 + .4×1 = 1.8. Normalizing the first page alone gives " +
      "output 2/3; normalizing the second alone gives 16/7. Averaging those outputs gives 31/21 ≈ " +
      "1.47619. The second page had more probability mass and should have received more weight."
    }</Prose>
    
    <Prose>{
      "For scores sⱼ and value vectors vⱼ, ordinary attention is Σⱼ exp(sⱼ)vⱼ / Σⱼ exp(sⱼ), after " +
      "excluding masked positions and applying the usual query/key scale. Reordering page visits " +
      "does not change the real-number expression. Equal total mass on each page is a special case " +
      "where equally averaging page outputs happens to work; it does not justify the shortcut " +
      "generally."
    }</Prose>
    
    <Prose>{
      "The complete operator reads the pool's addressed pages, excludes invalid tails, and " +
      "accumulates one global normalization. It compares with an independent dense calculation and " +
      "actual PyTorch SDPA."
    }</Prose>
    
    <Program file="paged_attention.py" />
    
    <Prose>{""}<code>{"attend"}</code>{
      " maps logical blocks through the table. For each block it forms scaled scores and the " +
      "matching valid mask, then passes only permitted score/value pairs to "
    }<code>{"online_reduce"}</code>{
      ". A fully masked row returns an explicit invalid status rather than silently returning a " +
      "plausible zero vector. The recorded twelve changed query/mask cases include large positive " +
      "and negative scores, a skipped masked block, physical relocation and an all-invalid row. The " +
      "valid float64 outputs match dense and SDPA references at tolerance 10⁻¹²."
    }</Prose>
    
    <Prose>{""}<strong>{"Deeper: keeping the denominator stable without gathering every page."}</strong>{
      " Directly exponentiating a score near 1000 can overflow. Softmax avoids that by subtracting " +
      "a common maximum, which cancels between numerator and denominator. Across pages, maintain " +
      "the maximum m seen so far, scaled mass l, and scaled weighted accumulator u."
    }</Prose>
    
    <CbOnlineSoftmax />
    
    <Prose>{
      "When the next page has maximum m_b, let m′ = max(m, m_b). Previously accumulated terms used " +
      "scale exp(−m), so multiply them by exp(m − m′) to express them at the new scale. Add each " +
      "new term exp(sⱼ − m′). The updates are l′ = exp(m − m′)l + Σ exp(sⱼ − m′) and u′ = exp(m − " +
      "m′)u + Σ exp(sⱼ − m′)vⱼ. At the end return u/l. Here l is a scalar mass and u has the " +
      "value-vector width; neither is already normalized."
    }</Prose>
    
    <Prose>{
      "Initialize from the first nonempty valid block. That avoids evaluating −∞ − (−∞) before any " +
      "score exists. A masked-only block contributes nothing. Shifting every valid score by the " +
      "same constant changes the stored maximum but leaves the final ratio unchanged. " +
      "Floating-point summation order can still change rounding; stability does not imply bitwise " +
      "equality for every traversal or dtype. This implementation teaches the operator. A GPU " +
      "PagedAttention kernel additionally arranges memory loads, parallel reductions and occupancy " +
      "for the target hardware."
    }</Prose>
    
    <span id="7-decision-matrix" aria-hidden="true" />
    <H2>{"10. Decide which histories may remain resident"}</H2>
    
    <Prose>{
      "We can now append safely, but an allocator's refusal still leaves a scheduling question. " +
      "Should the server reserve each request's possible future growth at admission, or admit more " +
      "current work and handle later pressure?"
    }</Prose>
    
    <CbAdmission />
    
    <Prose>{
      "With prompt length P, output cap G and page size C, reserving ceil((P + G − 1)/C) pages " +
      "covers the cache through final selection under our stopping convention. Summing those " +
      "reservations before admission can guarantee room if the caps and model state assumptions " +
      "hold. It can also leave much of that capacity unused when responses stop early. In contrast, " +
      "incremental allocation counts currently resident pages and grows when needed. That admits " +
      "more work but requires a response when growth fails."
    }</Prose>
    
    <Prose>{
      "For page size 4, a prompt of length 3 with cap 8 needs at most ceil(10/4) = 3 pages. Two " +
      "such requests and a prompt 12/cap 3 request need a total cap reservation of 3 + 3 + 4 = 10 " +
      "pages. Eight pages can hold their early state but not all those maxima simultaneously. " +
      "Available request slots do not remove the eventual storage constraint."
    }</Prose>
    
    <CbRebuild />
    
    <Prose>{
      "Our explicit policy protects the oldest admitted request that can make progress. If it needs " +
      "pages, it can "
    }<strong>{"preempt"}</strong>{
      " a later admitted request: discard that request's K/V state, keep its known token history " +
      "and generated count, and put it back in the waiting queue. On readmission, rebuild the known " +
      "computed prefix before continuing decode. The victim policy uses visible admission order, " +
      "not hidden remaining output length."
    }</Prose>
    
    <Prose>{
      "Rebuilding performs repeated work. It must not emit the old outputs again, increment the " +
      "generated count during reconstruction, or pretend that recomputed rows are newly useful " +
      "positions. A request can even be preempted halfway through its initial prompt, before its " +
      "first output. The simulator therefore tracks a logical high-water position and counts " +
      "repeated positions separately from the stage label "
    }<code>{"prefill"}</code>{" or "}<code>{"recompute"}</code>{"."}</Prose>
    
    <Prose>{
      "A progress policy matters as much as an allocation policy. If the next row of one request " +
      "would require more pages than the whole pool can hold, the simulator reports "
    }<code>{"infeasible-next-row"}</code>{
      ". Repeatedly evicting everyone else would not help. If it fits alone, protecting one request " +
      "prevents a cycle in which every request is repeatedly evicted before anyone advances. " +
      "Swapping state to another memory tier is another possible response, but its transfers, " +
      "backing capacity and consistency have costs; it is not implemented as a free alternative " +
      "here."
    }</Prose>
    
    <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
    <H2>{"11. Bound prefill without forgetting earlier chunks"}</H2>
    
    <Prose>{
      "A long arriving prompt can occupy an iteration while existing users wait for their next " +
      "token. Splitting its prefill into chunks gives the scheduler boundaries at which to include " +
      "continuing decodes."
    }</Prose>
    
    <CbChunks />
    
    <Prose>{
      "For a 12-token prompt split into four-row chunks, the second chunk represents absolute " +
      "positions 4–7. Those queries read the cached first four keys plus their own permitted new " +
      "keys. Resetting their positions to 0–3 or applying only a four-by-four triangle would change " +
      "the computation. Chunking changes the schedule, not the intended causal dependencies. The " +
      "packed decoder's matching full-prefix checks exercise precisely this offset rule."
    }</Prose>
    
    <CbQueryAllocation />
    
    <Prose>{
      "If two decodes each need one row and the query budget is six, four rows remain for prefill. " +
      "With both decodes continuing, the 12-token prompt takes three such chunks. If a decode " +
      "finishes, recompute the remaining budget at the next boundary instead of reserving a slot " +
      "for a request that no longer exists."
    }</Prose>
    
    <Prose>{
      "Smaller chunks do not reduce the total required causal query/key pairs for an unchanged " +
      "prompt. They change when those pairs are processed, how often fixed per-iteration overhead " +
      "is paid, and how often old K/V data must be brought back for later chunks. The complete " +
      "causal pair count for 12 prompt rows is 12×13/2 = 78. The three chunks contribute 10, 26 and " +
      "42 pairs respectively: local triangles plus attention to the old prefix. Counting only three " +
      "local triangles would miss 48 required pairs."
    }</Prose>
    
    <CbModeledTime />
    
    <Prose>{"The finite simulator charges each iteration "}<code>{"fixed + linear × query_rows + attention × valid_pairs"}</code>{
      ". Its default coefficients are .2, .05 and .001 in arbitrary modeled time units. These " +
      "numbers are a declared sensitivity model, not a fit to a GPU. Even within that model, equal " +
      "query budgets need not give equal iteration times because the history lengths change the " +
      "pair count."
    }</Prose>
    
    <Program file="serving_simulation.py" />
    
    <Prose>{""}<code>{"simulate"}</code>{
      " combines arrivals, request slots, query budgets, the real shared pool and boundary " +
      "cancellation. Deterministic numeric storage fixtures give each logical position the same K/V " +
      "values when rebuilt; they do not predict language-model tokens. The event stream separates " +
      "arrivals, admission, preemption, emission and termination. Every iteration records its " +
      "actual row assignments, attention-pair count, modeled start/end and page state."
    }</Prose>
    
    <Prose>{
      "The supplied A/B/long workload uses prompts 3/3/12, caps 8/8/3 and arrivals 0/0/.6. With ten " +
      "pages, chunk 4 and budget 6, it performs no preemption. A and B finish at modeled time " +
      "3.515; the long request finishes at 3.195. With five pages, the long request is preempted " +
      "before its first output and repeats four positions. With eight pages, it is preempted after " +
      "outputs have already begun and repeats thirteen positions. These deliberately different " +
      "pressure cases show why a bigger intermediate pool need not monotonically improve every " +
      "request under one fixed greedy policy."
    }</Prose>
    
    <Prose>{"The source also compares chunk 64 under the same six-row query budget: "}<code>{"chunk64"}</code>{
      " is permission to use all remaining row budget, not permission to exceed it. Inspect the " +
      "actual iteration trace rather than assuming its entire prompt fits into one call. A " +
      "completed request's useful positions total P + G − 1; repeated positions are additional. A " +
      "one-output request has no gap samples. Cancellation releases storage at the first observed " +
      "boundary after its requested time, which can be later than that time if an iteration is in " +
      "progress."
    }</Prose>
    
    <Prose>{
      "Change one cost coefficient, page budget or chunk limit and read the entire changed trace. " +
      "More prefill work per iteration can shorten an arriving request's TTFT while increasing a " +
      "continuing request's next gap. In the absence of competing decode work, there is no other " +
      "request's gap to improve. Choosing a production token budget requires measurements on the " +
      "intended model, device and traffic; this deterministic example identifies what to measure."
    }</Prose>
    
    <span id="5-production-implementation" aria-hidden="true" />
    <H2>{"12. Use a maintained request manager deliberately"}</H2>
    
    <Prose>{
      "The scratch route made request identity, segmentation and storage visible. An ordinary " +
      "library manages those mechanisms through an API. The following route uses the actually " +
      "exercised Transformers 5.19.0 CPU continuous-batching manager, with eager SDPA attention. " +
      "Configuration names and lifecycle behavior are version-specific."
    }</Prose>
    
    <Prose>{
      "Install the pinned additions in the same environment, then acquire the six pinned Pythia " +
      "files into a separate cache. "
    }<code>{"acquire_model.py"}</code>{
      " checks their exact hashes; inference afterwards uses local files only. Downloading model " +
      "weights needs network access and disk space. The lesson's file bundle includes the source " +
      "report and Alice text, not the model weights."
    }</Prose>
    
    <CodeBlock language={"bash"}>{
      "python -m pip install transformers==5.19.0 tokenizers==0.23.2 huggingface-hub==1.33.0 " +
      "safetensors==0.8.0\n" +
      "python acquire_model.py --output model-cache\n" +
      "python native_batching.py --model model-cache --budget 16"
    }</CodeBlock>
    
    <Program file="acquire_model.py" />
    
    <Prose>{
      "The acquirer refuses an existing file with different bytes and retains a failed partial " +
      "download for inspection. That avoids silently mixing model revisions. It is the exact " +
      "maintained helper reused from KV-cache work. The native runner verifies the same files " +
      "before loading the model in evaluation mode. Its "
    }<code>{"torch.inference_mode"}</code>{" reference call disables gradient tracking; "}<code>{"torch.set_num_threads(1)"}</code>{" bounds CPU work in the executable example."}</Prose>
    
    <CbManager />
    
    <Prose>{"Each submitted record has an ID such as "}<code>{"alice-8"}</code>{". "}<code>{"add_request"}</code>{" returns the accepted ID. Terminal results carry "}<code>{"request_id"}</code>{
      ", generated token IDs and a status. Store results under that ID and compare each to its own " +
      "reference, even if completions arrive in a different order. A missing result is a timeout or " +
      "error, not an empty successful response."
    }</Prose>
    
    <Program file="native_batching.py" />
    
    <Prose>{""}<code>{"page_size=8"}</code>{" and "}<code>{"num_blocks=128"}</code>{" configure physical storage. "}<code>{"max_batch_tokens"}</code>{" is the scheduled query-row budget; "}<code>{"max_requests_per_batch=3"}</code>{" is a request limit. "}<code>{"max_blocks_per_request=0"}</code>{
      " delegates that sizing choice to the library. This route disables sharing, async batching, " +
      "CUDA graphs, compilation and automatic Flash attention switching. The scratch COW exercise " +
      "and the native campaign consequently test different capabilities; a successful native run " +
      "does not certify the library's sharing path."
    }</Prose>
    
    <Prose>{"The dataclass uses "}<code>{"dataclasses.asdict"}</code>{" for inspection. Older guide spellings such as "}<code>{"block_size"}</code>{" and "}<code>{"use_default_compile_configs"}</code>{" do not replace the pinned source's "}<code>{"page_size"}</code>{" and "}<code>{"default_compile_level"}</code>{
      ". Resolved padding settings are also separate from logical budgets: this run resolved query " +
      "padding to 64 and K/V padding to 16384. Those padded dimensions do not mean the scheduler " +
      "was allowed to ignore its chosen 16/32/64 row budget."
    }</Prose>
    
    <CbLifecycle />
    
    <Prose>{"The runner initializes a manager, submits all finite requests before "}<code>{"start"}</code>{", drains results with a deadline and stops the manager in "}<code>{"finally"}</code>{". It explicitly does not call "}<code>{"warmup"}</code>{". "}<code>{"stop(block=True, ...)"}</code>{" waits for the background thread; "}<code>{"destroy()"}</code>{
      " clears remaining resources after the thread stops. A failure to stop is surfaced rather " +
      "than labeled successful cleanup."
    }</Prose>
    
    <Prose>{
      "A separate tiny random-model preflight queued A and B, canceled pending C before starting, " +
      "then observed two forwards and three emissions: A returned "
    }<code>{"[30, 19]"}</code>{", B returned "}<code>{"[24]"}</code>{", and both were "}<code>{"FINISHED"}</code>{". C was removed and produced no terminal "}<code>{"GenerationOutput"}</code>{
      ". The queues were empty, the thread stopped and the processor was cleared. That is the " +
      "exercised pending-cancellation contract. It is not evidence for every possible race between " +
      "a live producer and a running forward. An application should record its own cancel request " +
      "and reconcile eventual framework state instead of waiting forever for an acknowledgment this " +
      "API does not supply."
    }</Prose>
    
    <H2>{"13. Inspect all requests from one real campaign"}</H2>
    
    <Prose>{
      "The finite drawings isolate mechanisms; a real tokenizer and model can expose mismatches " +
      "they miss. We use the existing public-domain Alice text as natural token history, with " +
      "EleutherAI Pythia14M revision "
    }<code>{"cf967c0a9a04383db6f7b1108d86b2962634b4ac"}</code>{
      ". Literary text supplies varied prefix lengths, not a sample of production traffic or a " +
      "quality benchmark."
    }</Prose>
    
    <Prose>{
      "The campaign fixed six prompts—the first 8, 12, 20, 32, 48 and 64 tokenizer IDs without " +
      "added special tokens—and six greedy outputs per prompt. EOS stopping was disabled for this " +
      "bounded comparison. The same CPU FP32 model, SDPA, one Torch thread and evaluation mode " +
      "supplied six independent full-prefix references, then three manager arms with query budgets " +
      "16, 32 and 64. Page size 8, 128 pages and request limit 3 stayed fixed. There was no " +
      "training, warmup, tuning or repeated timing loop."
    }</Prose>
    
    <CbNativeParity />
    
    <Prose>{"Every arm returned all six request identities with "}<code>{"FINISHED"}</code>{
      " status. All 108 native output IDs matched their corresponding 36 full-prefix reference IDs. " +
      "The complete reference sequences were:"
    }</Prose>
    
    <NeuralTable caption={"13. Inspect all requests from one real campaign"} headers={[<>{"Request / prompt length"}</>,<>{"Six generated IDs, in order"}</>]} rows={[[<>{"alice-8"}</>,<>{"15, 187, 187, 3, 42, 1353"}</>],[<>{"alice-12"}</>,<>{"1930, 15, 187, 187, 3, 42"}</>],[<>{"alice-20"}</>,<>{"247, 1643, 1897, 281, 755, 617"}</>],[<>{"alice-32"}</>,<>{"562, 13, 703, 369, 1335, 275"}</>],[<>{"alice-48"}</>,<>{"617, 2564, 15, 187, 187, 510"}</>],[<>{"alice-64"}</>,<>{"253, 2934, 273, 253, 1984, 1425"}</>]]} />
    
    <Prose>{
      "These are token identities from the pinned tokenizer, not word counts. The native output API " +
      "did not supply the per-step logits used for a logit-tolerance comparison. Matching the IDs " +
      "therefore establishes this finite greedy-output result; it does not imply equal " +
      "floating-point arrays or agreement for arbitrary future prompts."
    }</Prose>
    
    <CbNativeClocks />
    
    <Prose>{
      "Inclusive manager elapsed times were .745033 seconds for budget 16, .517740 seconds for 32 " +
      "and .494733 seconds for 64, on the recorded Windows CPU host. Each includes manager " +
      "initialization, submission, execution, collection and cleanup as measured by the runner. The " +
      "three are single observations, not repeated estimates with confidence intervals, and their " +
      "order is not a justified performance ranking. All managers stopped and cleared their " +
      "processors."
    }</Prose>
    
    <Prose>{
      "The saved record retains creation time, available lifespan events and output timestamp " +
      "arrays relative to each arm's own origin. Read each field according to the pinned API: a " +
      "framework creation timestamp is not an externally measured network arrival. Missing lifespan " +
      "entries stay unavailable. The trace does not fill gaps with inferred GPU activity or divide " +
      "an inclusive duration into invented prefill/decode measurements."
    }</Prose>
    
    <Prose>{
      "The complete study program freezes exact model/data/source identities and settings before " +
      "running. Its exclusive output journal prevents accidentally overwriting an earlier campaign. " +
      "A failed arm would retain partial results and stop instead of silently rerunning for a " +
      "favorable outcome."
    }</Prose>
    
    <Program file="native_study.py" />
    
    <Prose>{"To make a new independent campaign, choose fresh record/output paths and run "}<code>{"prepare"}</code>{" before "}<code>{"run"}</code>{
      ". Inspect the prepared protocol before executing it. The supplied observations are already " +
      "complete; reading them does not require repeating inference."
    }</Prose>
    
    <CodeBlock language={"bash"}>{
      "python native_study.py prepare --model model-cache --record my-protocol.json\n" +
      "python native_study.py run --model model-cache --record my-protocol.json --output " +
      "my-results.json"
    }</CodeBlock>
    
    <Prose>{""}<code>{"prepare"}</code>{" checks bytes and tokenization without model inference; "}<code>{"run"}</code>{
      " checks the frozen inputs before loading the model. Each reference and arm is appended to a " +
      "journal as it completes. The source's comparison indexes by request ID, records first " +
      "divergence when present, and treats generated-token equality and terminal status as separate " +
      "fields. Changing a scheduler setting creates a new experiment; it does not retroactively " +
      "change the saved one."
    }</Prose>
    
    <H2>{"14. Deeper: place the scheduler inside an engine"}</H2>
    
    <Prose>{
      "So far one process has held the whole small model. A larger engine may divide layers or " +
      "heads across workers. The request's logical identity must then survive another boundary: " +
      "scheduling decisions travel separately from large activation and K/V tensors."
    }</Prose>
    
    <CbWorkers />
    
    <Prose>{"The "}<strong>{"control plane"}</strong>{" tells workers which requests and logical positions to process. The "}<strong>{"tensor plane"}</strong>{
      " carries numerical arrays needed by the computation. Thin ID/table arrows and thick " +
      "activation arrows represent different payloads. A shared logical mapping decision does not " +
      "imply that every worker stores identical K/V bytes: one worker may own a different layer or " +
      "head shard. Workers must interpret the coordinated decision consistently for their local " +
      "tensors."
    }</Prose>
    
    <Prose>{
      "This is one reason Orca's selective batching distinguishes position-wise operations from " +
      "request-specific attention rather than treating every operation as the same rectangular " +
      "batch. The finite packed decoder implements that distinction locally. It does not implement " +
      "worker communication, fault recovery or distributed scheduling."
    }</Prose>
    
    <CbPipeline />
    
    <Prose>{
      "For a constructed two-stage pipeline, let stage 1 take two units and stage 2 three units per " +
      "microbatch. With two microbatches, stage 1 runs M1 during 0–2 and M2 during 2–4. Stage 2 " +
      "runs M1 during 2–5, then M2 during 5–8. M2 cannot enter stage 2 at 4 because that stage is " +
      "occupied. The schedule finishes at 8; simply adding stage durations per microbatch would " +
      "give 10 and miss overlap. Three such microbatches finish at 11. These are supplied " +
      "dependency schedules, not observed engine benchmarks."
    }</Prose>
    
    <Prose>{
      "Chunking prefill can create smaller schedulable pieces, but it also changes communication " +
      "and repeated-read overhead. Separating prefill and decode onto different resources adds a " +
      "K/V transfer boundary and separate capacity requirements. Current engine configuration " +
      "therefore involves more than selecting the largest batch. The dated vLLM V1 documentation " +
      "discusses decode-prioritized chunked prefill and distinct "
    }<code>{"max_num_batched_tokens"}</code>{" and "}<code>{"max_num_seqs"}</code>{
      "; those GPU-oriented settings were source-read, not executed in this CPU lesson. Inference " +
      "Engines & Serving develops the broader deployment choices."
    }</Prose>
    
    <span id="9-failure-modes-and-gotchas" aria-hidden="true" />
    <H2>{"15. Reconstruct the state before changing the knob"}</H2>
    
    <Prose>{
      "A slow or wrong response is easier to diagnose when its request record, scheduled rows and " +
      "physical history can be inspected together."
    }</Prose>
    
    <CbDiagnosis />
    
    <Prose>{
      "If A receives B's otherwise correct IDs, inspect the scatter mapping. If a child changes its " +
      "parent, inspect the shared tail's reference count and copy boundary. If retrying an append " +
      "duplicates a row, inspect whether a failed call mutated valid length or bytes. If perturbing " +
      "A changes B, inspect the cross-request attention mask. If rearranging pages changes the " +
      "mathematical result substantially, inspect whether normalization was reset at every page."
    }</Prose>
    
    <Prose>{
      "Each diagnosis names an invariant and a counterexample. “The batch is too large” is not a " +
      "substitute for locating the violated relation. A numerical discrepancy also deserves a " +
      "matched-input comparison before it is attributed to scheduling; dtype, mask, token positions " +
      "and stopping convention must agree."
    }</Prose>
    
    <CbBindingLimit />
    
    <Prose>{
      "For performance, first identify the binding constraint. Empty request slots with no free " +
      "pages suggest residence/admission pressure. Free pages with a full query-row budget suggest " +
      "work scheduling. An idle device with no arrived work is neither failure. Changing a " +
      "nonbinding limit may do nothing, which is a useful null result when the drawing makes the " +
      "reason visible."
    }</Prose>
    
    <Prose>{
      "You can now follow a request through a changing batch while preserving its logical history: " +
      "select work at boundaries, pack only compatible row-wise operations, segment attention by " +
      "identity, address valid K/V through tables, transact mutations and account for repeated " +
      "work. The next lesson, "
    }<a href={"/learn/path/full-curriculum/queueing-theory-for-llm-serving?module=large-language-models"}>{"Queueing Theory for LLM Serving"}</a>{
      ", asks how traffic and service variability change the latency/throughput tradeoff. Prefix " +
      "caching later extends our trusted fork into reusable-prefix lookup; engine design extends " +
      "the local lifecycle into deployment."
    }</Prose>
    </section>
    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
    <span id="11-self-check-exercises" aria-hidden="true" />
    <H2>{"Practice"}</H2>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"1. Separate arrival wait from a static-batch barrier"}</H3>
    
    <Prose>{"Two slots receive A, B, C, D with arrivals "}<code>{"[0,0,1,5]"}</code>{" and work lengths "}<code>{"[3,7,2,1]"}</code>{
      ". Find continuous and static start/finish times, using the boundary convention from section " +
      "3. Which waits could a larger slot count remove?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" At boundary 3 only A's slot is free; at boundary 5 C completes just as D arrives."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Continuous intervals are A 0–3, B 0–7, C 3–5 and D 5–6, finishing at 7. Static admits A/B " +
      "at 0, then waits for B: C 7–9 and D 7–8, finishing at 9. C waits 2 units continuously versus " +
      "6 statically; D waits 0 versus 2. Before its arrival, neither C nor D is eligible. Extra " +
      "slots can remove capacity/barrier waits after arrival, but cannot move arrival earlier. Both " +
      "execute 13 work units. Run these changed inputs through "
    }<code>{"schedule"}</code>{
      ", then reconstruct active counts from the half-open intervals rather than trusting only the " +
      "final makespan."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"2. Pack three segments without making one conversation"}</H3>
    
    <Prose>{
      "Requests A, B, C contribute 1, 3, 2 rows. Their first new absolute positions are 4, 0, 7. " +
      "Give offsets, positions and the identity of packed row 4. State a perturbation check that " +
      "detects cross-request attention."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Prefix-sum the row counts; absolute positions restart from each request's own origin."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Offsets are "}<code>{"[0,1,4,6]"}</code>{"; packed absolute positions are "}<code>{"[4,0,1,2,7,8]"}</code>{
      ". Row 4 belongs to C at position 7. A global triangle wrongly permits C to see all earlier " +
      "A/B rows. Perturb only B's tokens or cached values and compare C's outputs before/after " +
      "under the correct mask: C must remain unchanged, with matching model state and deterministic " +
      "evaluation. Reorder segments to C, A, B and rebuild offsets; scatter outputs by ID so that " +
      "the per-request comparison still matches."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"3. An allocated cell can still be invalid"}</H3>
    
    <Prose>{"Use C=4, table "}<code>{"[5,2,8]"}</code>{", valid length 9. Locate positions 3, 4 and 8. Is position 9 readable?"}</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Table lookup and validity are two separate checks."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Position 3 is page 5/offset 3; position 4 is page 2/offset 0; position 8 is page 8/offset " +
      "0. Position 9 would address page 8/offset 1 physically but is outside "
    }<code>{"[0,9)"}</code>{
      ", so reject it before reading. Three tail cells are allocated and invalid. Swapping physical " +
      "pages 2 and 8 while swapping their table references preserves all nine logical values; " +
      "swapping only references corrupts them."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"4. Keep the memory denominator visible"}</H3>
    
    <Prose>{
      "For lengths 9, 17, 24 and page size 8, compute useful, allocated and unused slots. Compare " +
      "with 32 reserved slots per request and report both allocation/reservation and tail/allocated " +
      "fractions."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Round each request separately before summing."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Useful=50. Page counts 2, 3, 3 allocate 64 slots; 14 are unused. Three maximum reservations " +
      "allocate 96. Thus allocation/reservation=64/96=2/3, while tail/allocated=14/64=21.875%. " +
      "Tail/useful would be 28%, a different quantity. Metadata is additional to these token-slot " +
      "counts. Dividing total 50 by 8 and rounding once would allocate 56 slots and incorrectly " +
      "assume unrelated tails can share a page without a different layout."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"5. Refuse a whole append"}</H3>
    
    <Prose>{
      "A chunk requires two new pages but only one is free. Specify the equality a failed append " +
      "must preserve. Then explain the retry after another request releases one unshared page."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Checking only valid length can miss corruption of live values."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Save the full table/length/refcount/free-list state and hashes of both K/V arrays. After " +
      "refusal all must equal the snapshot; no partial row or reserved page may escape. Releasing " +
      "the other request makes two pages available, assuming its released reference was the last " +
      "one. Retry the original whole chunk exactly once; it either commits all rows with the " +
      "expected dense result or fails atomically again. If the released page is still shared, it " +
      "does not become free, so the same retry still fails. The supplied allocator implements this " +
      "transaction rather than requiring callers to roll back partial writes."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"6. Fork a different partial tail"}</H3>
    
    <Prose>{
      "Parent length 7, page size 4, child prefix 5. Describe the shared references, the child's " +
      "append at position 5, and the parent's state. Compare a parent 8/child 8 fork."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The second physical page contains more valid parent data than child data."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Both tables initially reference two pages; each count becomes 2. The child's valid tail has " +
      "only offset 0, while the parent's tail has offsets 0–2. For a child append, allocate a " +
      "private tail, copy only offset 0 and write offset 1. The old tail count falls to 1, the " +
      "private tail count is 1, and the first shared page remains count 2. The parent's seven " +
      "logical values stay exact. For parent 8/child 8, both pages are full; appending position 8 " +
      "allocates a new page without copying either old page. With no free page, both append " +
      "variants refuse without mutation, for different structural reasons: private-tail allocation " +
      "versus new-block allocation."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"7. Do not average page answers"}</H3>
    
    <Prose>{"Scores are "}<code>{"[log2,log5,log1]"}</code>{", values "}<code>{"[1,3,−2]"}</code>{
      ", page size 2. Compute the correct output and the equally averaged page-output shortcut. " +
      "What happens under physical relocation?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Global mass is 8; the pages have masses 7 and 1."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The global numerator is 2×1+5×3+1×(−2)=15, giving 15/8=1.875. Page outputs are 17/7 and −2, " +
      "whose equal average is 3/14≈.214286. Correct mass-weighted combination is " +
      "(7/8)(17/7)+(1/8)(−2)=15/8. Relocating the same values and updating tables leaves this " +
      "expression unchanged. The shortcut's error is a denominator error, not a storage-address " +
      "error."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"8. Shift every score by 1000"}</H3>
    
    <Prose>{
      "Add 1000 to the scores in task 7. Explain the stable online calculation when a fully masked " +
      "block is inserted before the first valid block, and the result when every block is masked."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" A common exponential scale cancels only if you avoid overflowing while forming it."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The correct output remains 15/8 because the factor exp(1000) would multiply numerator and " +
      "denominator equally. Do not form that factor. Skip the initial empty block, initialize from " +
      "the first valid maximum and exponentiate only differences from the running maximum. Rescale " +
      "old mass and weighted sum together whenever that maximum rises. If all blocks are masked, no " +
      "denominator exists; return the explicit invalid state rather than dividing 0/0 or " +
      "manufacturing probabilities. A masked block is not a zero-valued observation with positive " +
      "mass."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"9. Explain a preemption and an infeasible request"}</H3>
    
    <Prose>{
      "Page size 4, pool 5 pages: active A has prompt 3/cap 8 and B prompt 3/cap 8. Their current " +
      "cache lengths are 8 and 8, so each occupies 2 pages. A's next row needs another page; " +
      "afterwards B also asks for its next row. Under the protected-oldest policy, what happens? " +
      "Separately consider one request already at length 20 asking to append one row."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Compare current pages, cap reservations and a request's minimum possible next state."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " A's append consumes the fifth page; B cannot grow then. A remains protected and can " +
      "continue within its third page, eventually finish and release it. B can wait, or be " +
      "preempted if a later protected append needs its pages; preemption is not automatically " +
      "required merely because B's immediate append is blocked. Full cap reservation would have " +
      "needed 3+3=6 pages and would not admit both initially. The length 20 request needs 6 pages " +
      "for 21 positions, more than the entire 5-page pool. It is explicitly infeasible; evicting " +
      "other requests cannot solve it. A recomputation trace must preserve already generated IDs, " +
      "count rebuilt positions as repeated and resume from the pending token rather than emit old " +
      "outputs again."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"10. Recompute the mixed-row budget"}</H3>
    
    <Prose>{
      "A 10-token prompt is waiting while three decodes continue. Query budget 7, chunk limit 4. " +
      "After the first iteration one decode finishes. Give the prefill chunk sizes and " +
      "attention-pair counts."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The chunk limit and the remaining query budget both apply."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " First allocate 3 decode rows and 4 prefill rows. Next only 2 decodes remain, leaving 5 " +
      "budget rows, but chunk 4 still limits prefill to 4. The final chunk has 2 rows. Prefill " +
      "absolute ranges are 0–3, 4–7, 8–9, with pair counts 10, 26 and 19, totaling 55=10×11/2. The " +
      "last chunk's 19 pairs are 16 old-prefix pairs plus 3 local-triangle pairs. Raising the chunk " +
      "limit to 5 after the first boundary would permit a 5-row second chunk and a 1-row last " +
      "chunk, still totaling 55 causal pairs but changing iteration packing and modeled overhead."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"11. Compute only the clocks that exist"}</H3>
    
    <Prose>{
      "X arrives at 1.2 and emits at 2, 2.7, 4.1. Y arrives at 3 and emits once at 3.4. Z arrives " +
      "at 0, emits at .8 and is canceled at 1.5. Report TTFT, gap lists and completed-response " +
      "elapsed time."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" An absent interval is not a zero interval."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " X: TTFT .8, gaps [.7, 1.4], elapsed 2.9. Y: TTFT .4, gaps [], elapsed .4. Z: TTFT .8, gaps " +
      "[], completed-response elapsed unavailable because it did not complete. Its cancellation " +
      "elapsed 1.5 is a different metric. The framework's own request-creation event may be later " +
      "than an external client arrival; state which timestamp you used before comparing TTFT across " +
      "systems."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"12. Check identities rather than insertion order"}</H3>
    
    <Prose>{"Expected outputs are A "}<code>{"[4,2]"}</code>{", B "}<code>{"[9]"}</code>{", C "}<code>{"[3,7]"}</code>{
      ". A returned map inserts C, then A, then B. Which comparisons are valid? Now suppose A and " +
      "C's arrays are swapped while the three-array multiset stays unchanged."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The map key is part of each observation."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Compare "}<code>{"returned[A]"}</code>{" with "}<code>{"[4, 2]"}</code>{", "}<code>{"returned[B]"}</code>{" with "}<code>{"[9]"}</code>{" and "}<code>{"returned[C]"}</code>{" with "}<code>{"[3, 7]"}</code>{
      ", and check the exact key set and terminal statuses. Insertion order does not matter. A/C " +
      "swapping fails two keyed comparisons even though a sorted multiset check passes. Also reject " +
      "duplicate terminal responses while collecting, because overwriting a previous map entry can " +
      "hide a lifecycle defect. A missing key is not equivalent to a valid empty array."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"13. Repair the pinned API boundary"}</H3>
    
    <Prose>{"A script calls "}<code>{"config.to_dict()"}</code>{", uses "}<code>{"block_size"}</code>{
      ", cancels pending request C, waits for three terminal outputs from A/B/C, and exits without " +
      "stopping the manager. Repair its contract for the exercised 5.19 route."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Serialization, request acknowledgment and resource lifetime are independent problems."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Use "}<code>{"dataclasses.asdict(config)"}</code>{" and the pinned "}<code>{"page_size"}</code>{
      " field; inspect actual resolved settings rather than assuming guide aliases. Record C's " +
      "cancellation locally and do not await a terminal "
    }<code>{"GenerationOutput"}</code>{
      " for that removed pending request. Drain the two expected uncanceled results with a deadline " +
      "and fatal-error checks. Put blocking "
    }<code>{"stop"}</code>{" in "}<code>{"finally"}</code>{
      ", surface a still-running thread and destroy resources after stopping. Record whether warmup " +
      "ran. These corrections establish API consistency; they do not prove that one token budget is " +
      "faster or that cancellation during a live forward behaves identically to this pre-start " +
      "case."
    }</Prose>
    </details>
    </section>
    <section className="cb-practice" data-lesson-exercise>
    <H3>{"14. Assemble a new finite serving check"}</H3>
    
    <Prose>{
      "Use the supplied capstone solution as a reference only after trying the task. Create three " +
      "requests with prompts of lengths 2, 4, 3 and small supplied continuations. Mix their chunks " +
      "and change insertion order. Back the decoder with real shared pages; compare every new logit " +
      "row with the corresponding independent full-prefix decoder. Then fork a partial prefix, " +
      "force an atomic allocation refusal and verify that an infeasible schedule terminates " +
      "explicitly."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " Separate the neural equality check from the modeled schedule: the latter supplies costs and " +
      "completion events, not generated language."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" "}<code>{"serving_capstone.py"}</code>{
      " implements the complete changed fixture with fixed random weights, segment-by-segment " +
      "reference slices, a partial COW append, parent conservation and an unchanged whole-pool " +
      "snapshot after refusal. It also runs new finite arrival/cap schedules, checks page/query " +
      "capacities and requires every request to finish, cancel or report infeasibility. The " +
      "assertions state the success criteria rather than merely comparing final strings. Extend it " +
      "with a new request order and a zero-length new segment; preserve existing IDs, position " +
      "origins and checks. Do not weaken a tolerance to conceal a wrong mask or relabel repeated " +
      "rows as useful."
    }</Prose>
    
    <Program file="serving_capstone.py" />
    </details>
    </section>
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning">
    <H2>{"Further learning"}</H2>
    
    <ul>
    <li>{""}<a href={"https://raw.githubusercontent.com/stanford-cs336/spring2025-lectures/main/lecture_10.py"}>{"Stanford CS336 lecture 10 source"}</a>{
      " develops inference arithmetic intensity, selective batching and paging. Read its " +
      "tensor-shape argument after section 5, then compare its operating-systems analogy with our " +
      "explicit table and valid-tail checks. This recommendation is based on the source text, not a " +
      "claim of watching the lecture video."
    }</li>
    <li>{""}<a href={"https://jax-ml.github.io/scaling-book/inference/"}>{"How to Scale Your Model: inference"}</a>{
      " connects cache capacity and batching to hardware limits and serving architecture. It is " +
      "useful after the finite model: ask which fixed costs and memory transfers our simple clock " +
      "leaves out."
    }</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="references">
    <span id="10-primary-sources" aria-hidden="true" />
    <H2>{"Technical references"}</H2>
    
    <ul>
    <li>{""}<a href={"https://www.usenix.org/system/files/osdi22-yu.pdf"}>{"Orca, OSDI 2022"}</a>{
      ", especially §§3–4: iteration-level scheduling, selective batching, reservations and the " +
      "control/data distinction. Its complete-system benchmark is not the source of our finite " +
      "1010/595 comparison."
    }</li>
    <li>{""}<a href={"https://arxiv.org/html/2309.06180v1"}>{"PagedAttention/vLLM, original v1"}</a>{
      ", §§2–4: noncontiguous K/V blocks, logical tables, sharing, COW and eviction/recomputation. " +
      "Our allocator/attention references expose those invariants without claiming GPU-kernel " +
      "performance."
    }</li>
    <li>{""}<a href={"https://arxiv.org/html/2403.02310v2"}>{"Sarathi-Serve v2"}</a>{
      ", §§2–4: chunked prefill and decode work under token budgets. Hardware-sensitive conclusions " +
      "require its stated evaluation conditions."
    }</li>
    <li>{""}<a href={"https://huggingface.co/docs/transformers/v5.19.0/continuous_batching"}>{"Transformers 5.19 continuous batching"}</a>{
      ": the ordinary API route. The complete runnable source pins the inspected dataclass fields " +
      "and actual lifecycle behavior; current online documentation may evolve."
    }</li>
    <li>{""}<a href={"https://docs.vllm.ai/en/latest/configuration/optimization/"}>{"vLLM optimization guidance"}</a>{
      ", read 8 October 2026: current V1 preemption/chunking and separate work/request limits. GPU " +
      "execution of that engine is outside these recorded CPU examples."
    }</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="readiness">
    <H2>{"Readiness check"}</H2>
    
    <Prose>{
      "You are ready to continue when you can trace a finished slot's replacement without changing " +
      "another request's identity; derive its valid cache length from processed versus selected " +
      "tokens; map a logical read through a page table; preserve a parent's values during " +
      "partial-prefix COW; explain the global softmax denominator; and diagnose a blocked append " +
      "using separate row, request and page budgets. Implement a changed case and compare it " +
      "against an independent reference. Then use actual request clocks to distinguish a " +
      "correctness failure from a scheduling tradeoff."
    }</Prose>
    </section>
  </div>;
}
export default {
  title: 'Continuous Batching & PagedAttention',
  slug: 'continuous-batching-pagedattention',
  readTime: '~80 min read + 90 min practice', content: ContinuousBatchingLesson,
};
