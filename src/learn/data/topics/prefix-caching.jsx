// Generated from the accepted manuscript by scripts/render-prefix-caching-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../components/lesson-labs/PrefixCachingShared.jsx';
import { PcTensors, PcAliasing, PcCausal, PcEdit, PcNamespace, PcBoundary, PcResident, PcPairs, PcUnits } from '../../components/lesson-labs/PrefixCachingFoundations.jsx';
import { PcStates, PcOwners, PcAdmission, PcUnion, PcFork, PcHash, PcTrace, PcHistory, PcDenominators } from '../../components/lesson-labs/PrefixCachingStorage.jsx';
import { PcSnapshot, PcNative, PcAllocator } from '../../components/lesson-labs/PrefixCachingNative.jsx';
import { PcRadix, PcPins, PcDepthFirst, PcWaiting, PcProviders, PcCost, PcSession, PcTrust } from '../../components/lesson-labs/PrefixCachingPolicy.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const Program = ({
  file
}) => <RemoteCodeBlock 
  source={'/learn-code/prefix-caching/' + file} 
  language="python" 
  title={file} 
  filename={file} 
/>;
function PrefixCachingLesson() {
  return <div className="lesson-flow pc-flow">
  <section>

    <Prose>
      {"Two readers ask different questions about the same long document. The model must answer each question, but much of the work of reading the document can be shared. The useful question is precise: which intermediate values depend only on the common beginning, where are those values stored, and who may overwrite them?"}
    </Prose>


    <Prose opening="summary">
      {""}
      <strong>
        {"You will learn to"}
      </strong>
      {" trace a new query through retained keys and values; identify a compatible prefix; manage finite shared pages without corrupting active requests; count saved work and physical bytes; reuse a real decoder cache; and interpret a provider's cache lifetime and usage fields."}
    </Prose>


    <Prose opening="prerequisites">
      {""}
      <strong>
        {"Prerequisites:"}
      </strong>
      {" "}
      <a href={"/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models"}>
        {"KV-Cache & Memory Management"}
      </a>
      {" explains per-layer projected keys and values and absolute positions. "}
      <a href={"/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models"}>
        {"Continuous Batching & PagedAttention"}
      </a>
      {" introduces request page tables and copy-on-write. We refresh those objects before using them. The queueing comparison later uses only waiting plus service time; its broader context is "}
      <a href={"/learn/path/full-curriculum/queueing-theory-for-llm-serving?module=large-language-models"}>
        {"Queueing Theory"}
      </a>
      {"."}
    </Prose>


    <Prose opening="route">
      {""}
      <strong>
        {"First pass:"}
      </strong>
      {" follow sections 1–9 and the provider comparison in 12, then practice tasks 1–12 and 16. The visible deeper branches 10–11 and 13 examine radix trees, scheduling, money and isolation; the practice entry maps the remaining tasks back to these sections. Complete programs accompany the mechanisms; their saved examples include useful misses and refusals as well as reuse."}
    </Prose>


    <span 
      id="1-why-it-exists" 
      aria-hidden="true" 
    />

    <H2>
      {"1. Keep the work both requests need"}
    </H2>


    <Prose>
      {"Consider token-ID sequences A="}
      <code>
        {"[1,2,3,4,5,6,7,8,9,10]"}
      </code>
      {" and B="}
      <code>
        {"[1,2,3,4,5,6,7,8,11,12]"}
      </code>
      {". These are integer token IDs, not an assertion that each written word is one token. Their first eight IDs agree. A's last two IDs and B's last two IDs differ."}
    </Prose>


    <PcTensors />


    <Prose>
      {"At one attention layer, the new token at position 8 is projected into a query, a key and a value. Its query compares with keys at positions 0–8, and the resulting weights combine values at those positions. The cache already supplies rows 0–7. Only row 8's new key and value must be written. The next layer repeats the operation with its own projected rows; retaining one layer's values is insufficient for the other layers."}
    </Prose>


    <Prose>
      {"For batch size one, a common tensor layout is "}
      <code>
        {"[1, KV heads, positions, head features]"}
      </code>
      {" for each of K and V at each layer. In the drawing, the head and feature axes distinguish one position's vector from a list of tokens. A query is an operation on the vectors; it is not a physical cache page. Grouped-query attention may have more query heads than KV heads, so memory uses the latter count."}
    </Prose>


    <Prose>
      {"The cache preserves the document's intermediate representations. It does not preserve a final answer for every possible question. B still computes representations for IDs 11 and 12 and their output logits, so a different question can lead to a different answer."}
    </Prose>


    <PcAliasing />


    <Prose>
      {"With four positions per page, A's table can be "}
      <code>
        {"[p0,p1,p2]"}
      </code>
      {" and B's "}
      <code>
        {"[p0,p1,p3]"}
      </code>
      {". Both tables point to the same stored K/V for IDs 1–8. The last pages hold different tails. This is physical sharing: two references identify one allocation. Copying the first eight rows into a second array also saves computation, but occupies two allocations. We will execute both kinds of reuse and measure the appropriate evidence for each."}
    </Prose>


    <span 
      id="2-core-intuition" 
      aria-hidden="true" 
    />

    <H2>
      {"2. Establish what makes reuse valid"}
    </H2>


    <Prose>
      {"Why should A's first eight representations be usable by B? The answer comes from causal dependence, not from the prompts seeming similar."}
    </Prose>


    <PcCausal />


    <Prose>
      {"Begin at position 3. Its input embedding depends on its token and position. In a causal decoder, attention at that position can read only positions 0–3. Suppose both requests have the same embeddings, position convention, attention permissions and parameters over that prefix. The first layer then performs the same real-arithmetic operations on the same inputs for each old row. The same reasoning applies at the next layer: equal previous-layer rows provide equal next-layer inputs. Induction through all layers establishes reusable prefix K/V."}
    </Prose>


    <Prose>
      {"Changing a later suffix cannot enter an earlier row's causal dependency cone. Changing an earlier token can affect its own row and every later row. In particular, the second block's IDs can be identical while its K/V differ because it attended to a different first block."}
    </Prose>


    <PcEdit />


    <Prose>
      {"Change B's zero-based index 5 from 6 to 20. Positions 0–4 remain the same causal prefix, but positions 5 onward need new computation. With page size 4, only the first complete page remains eligible. Changing an index in B's last two tokens instead preserves the first eight positions. Restore the original ID to recover the original compatibility boundary."}
    </Prose>


    <PcNamespace />


    <Prose>
      {"A cache entry therefore needs more than text. Its "}
      <strong>
        {"compatibility namespace"}
      </strong>
      {" identifies the model revision, adapter, tokenization/input convention, positional treatment, attention-mask policy and any other effective inputs, including multimodal state when present. A "}
      <strong>
        {"trust group"}
      </strong>
      {" determines which callers may share even numerically compatible content. An adapter mismatch can invalidate numbers; a trust mismatch can disallow an otherwise correct computation. Those are different reasons for a miss."}
    </Prose>


    <Prose>
      {"The causal argument concerns equivalent mathematical computations. Floating-point kernels can evaluate reductions in different orders when a prefix is processed separately. Later comparisons use a declared tolerance and separately report top-1 agreement. Evaluation mode fixes inference behavior; training dropout, changed weights or a mutable prefix invalidate this simple reuse contract."}
    </Prose>


    <Prose>
      {"Put stable instructions and genuinely shared material before changing questions when that ordering suits the task. Reordering or normalizing text solely to obtain a cache hit changes the model input. Similar meaning, a hash of displayed text, or two separately decoded strings cannot substitute for comparing the actual effective token prefix."}
    </Prose>


    <H2>
      {"3. Find the reusable boundary"}
    </H2>


    <Prose>
      {"Even a compatible prefix is useful only while its stored blocks are resident. First determine which complete blocks are eligible; then find how many consecutive eligible blocks are still present."}
    </Prose>


    <PcBoundary />


    <Prose>
      {"For a ten-token prompt with four-token pages, at most eight rows fit complete reusable blocks. For an eight-token prompt, it may seem that both full blocks can be reused. There is a subtlety: K/V stores keys and values, not the final hidden row's output logits. An engine that retains only full KV blocks and must compute at least one prompt query leaves the final block for recomputation. It can reuse four rows at length 8, then eight rows at length 9."}
    </Prose>


    <Prose>
      {"Let prompt length be "}
      <InlineMath>
        {"L"}
      </InlineMath>
      {", page size "}
      <InlineMath>
        {"b"}
      </InlineMath>
      {", and let this engine require a final query. Its maximum reusable row count is"}
    </Prose>


    <div className="pc-equation">

      <MathBlock>
        {"P_{\\max}=b\\left\\lfloor\\frac{\\max(0,L-1)}b\\right\\rfloor."}
      </MathBlock>

    </div>


    <Prose>
      {"At page size 4, lengths 1, 4, 7, 8, 9, 10 have limits 0, 0, 4, 4, 8, 8. A system that also saves compatible final logits can use a different boundary. The formula describes the stated KV-only policy, not a theorem that every engine must recompute an entire final block."}
    </Prose>


    <PcResident />


    <Prose>
      {"Lookup starts at the first block and stops at the first miss. If block 0 is resident, block 1 is absent and block 2 is resident, the reusable prefix ends at block 0. A later cached block is not a replacement for the missing earlier rows that suffix attention must read. Residency is a fact about current storage, whereas identity is a fact about compatible content."}
    </Prose>


    <H3>
      {"Prepare the runnable examples"}
    </H3>


    <Prose>
      {"Download the complete example bundle and extract its files into one directory. Use Python 3.12. The finite programs use the standard library; the decoder and allocator examples require the pinned packages in "}
      <code>
        {"requirements.txt"}
      </code>
      {"."}
    </Prose>


    <CodeBlock language={"sh"}>
      {"python -m venv .venv\n# Windows PowerShell: .venv/Scripts/Activate.ps1\n# macOS/Linux: source .venv/bin/activate\npython -m pip install -r requirements.txt\npython prefix_study.py --stage finite --output results\npython prefix_study.py --stage tiny --output results"}
    </CodeBlock>


    <Prose>
      {"The pinned local environment uses NumPy 2.3.5, Torch 2.14.0 and Transformers 5.19.0, with the exact tokenizer and model-file dependencies listed in the bundle. "}
      <code>
        {"README.md"}
      </code>
      {" gives the full sequence and separate optional API setup. Saved JSON observations let you inspect the supplied results without running a model. New runs create an exclusive stage directory so a previous result is not silently replaced; use a new output directory for your own changed experiment."}
    </Prose>


    <Prose>

      <a 
        href="/learn-code/prefix-caching/prefix-caching.zip" 
        download
      >Download all programs and saved JSON results</a>
      {" · "}
      <a href="/learn-code/prefix-caching/README.md">Setup and file guide</a>
      {" · "}
      <a href="/learn-code/prefix-caching/SAVED-RESULTS.md">Saved-result scope</a>

    </Prose>

    <Program file="prefix_identity.py" />


    <Prose>
      {""}
      <code>
        {"eligible_rows"}
      </code>
      {" implements the final-query limit. "}
      <code>
        {"block_identities"}
      </code>
      {" first validates uint32 token IDs, serializes the namespace with a stable key order, and hashes a length-delimited parent digest followed by the current block's explicit little-endian integers. Its parent chain carries earlier context into each later lookup key. Each "}
      <code>
        {"Identity"}
      </code>
      {" also retains the exact namespace and complete prefix tuple; "}
      <code>
        {"ExactIndex.find"}
      </code>
      {" checks that equality after selecting a digest bucket. Section 7 explains why both layers matter."}
    </Prose>


    <Prose>
      {"Try the page-size boundary independently of the model: "}
      <code>
        {"eligible_rows(8,4)"}
      </code>
      {" gives 4, while "}
      <code>
        {"eligible_rows(9,4)"}
      </code>
      {" gives 8. The program's complete finite checks include the supplied boundary cases and a deliberately colliding digest. All new cache code here is batch-independent bookkeeping; it does not normalize token IDs or alter model inputs to manufacture a hit."}
    </Prose>


    <span 
      id="3-mathematical-foundation" 
      aria-hidden="true" 
    />

    <H2>
      {"4. Count the work that disappears"}
    </H2>


    <Prose>
      {"Reusing eight rows out of ten avoids eight new query-row computations. It does not remove eight tenths of everything the request does. Draw the attention pairs before converting that row count into a performance claim."}
    </Prose>


    <PcPairs />


    <Prose>
      {"Without reuse, query 0 reads one key, query 1 two, and query 9 ten. The ten rows contain 55 causal query/key pairs. Reusing positions 0–7 avoids their triangle of 36 pairs. Query 8 still reads nine keys and query 9 ten: 19 pairs remain. The live rectangle has two new queries reading eight old keys, or 16 pairs; the new tail's own triangle contributes 3."}
    </Prose>


    <Prose>
      {"For "}
      <InlineMath>
        {"T(n)=n(n+1)/2"}
      </InlineMath>
      {", retained prefix length "}
      <InlineMath>
        {"P"}
      </InlineMath>
      {" and tail length "}
      <InlineMath>
        {"R=L-P"}
      </InlineMath>
      {","}
    </Prose>


    <div className="pc-equation">

      <MathBlock>
        {"\\text{avoided pairs}=T(P),\\qquad\n\\text{remaining pairs}=T(L)-T(P)=RP+\\frac{R(R+1)}2."}
      </MathBlock>

    </div>


    <Prose>
      {"The rectangle "}
      <InlineMath>
        {"RP"}
      </InlineMath>
      {" explains an apparent puzzle: a cache hit saves recomputation while the suffix still reads old K/V. The suffix query projections, attention products, feed-forward work and output calculation remain. At "}
      <InlineMath>
        {"P=0"}
      </InlineMath>
      {", nothing is reused and all 55 pairs remain. At "}
      <InlineMath>
        {"L=10,P=9"}
      </InlineMath>
      {", one query and ten pairs remain."}
    </Prose>


    <PcUnits />


    <Prose>
      {"Eight avoided query rows are 80% of this prompt's rows; 36 avoided pairs are about 65.45% of its causal pairs. Neither percentage is elapsed-time reduction. Actual kernels batch operations, move memory, launch work and interact with scheduling. Reusing one prefix for several later requests also requires computing the shared prefix once in the first place."}
    </Prose>


    <Program file="prefix_work.py" />


    <Prose>
      {""}
      <code>
        {"work"}
      </code>
      {" returns the row count, full and avoided triangles, the still-live prefix rectangle and the suffix triangle separately. "}
      <code>
        {"verify"}
      </code>
      {" compares its closed form with a direct sum of the surviving query lengths for 136 small cases. Its saved anchor is 10/8→2 new rows, 16 old-prefix reads, 3 tail pairs and 19 total remaining pairs. This gives an exact finite accounting reference for the later cache traces, without a timing curve disguised as a measurement."}
    </Prose>


    <span 
      id="4-from-scratch-implementation" 
      aria-hidden="true" 
    />

    <H2>
      {"5. Give every physical page an owner"}
    </H2>


    <Prose>
      {"Identity and eligibility say what could be reused. A finite store must also know who is using each allocation, which bytes have been computed, and what can be discarded."}
    </Prose>


    <PcStates />


    <Prose>
      {"A free page has no owner or reusable content. Admission reserves a page for a request before computation has finished. Successful computation fills it; a full page can then be indexed as complete. An active page has at least one owner and cannot be evicted. When its last owner releases it, a complete page becomes retained inactive: it still occupies memory and remains reusable, but is eligible for eviction. An incomplete tail in this implementation returns to the free pool after its last owner releases it."}
    </Prose>


    <Prose>
      {"The distinction prevents two common errors. Reserving storage does not mean its K/V values are ready for reuse. Finishing or cancelling a request does not free storage unless the release operation actually runs."}
    </Prose>


    <PcOwners />


    <Prose>
      {"After A completes, p0 and p1 each have owner A. B's compatible lookup returns those pages without changing them. Admission acquires each once, producing owners {A,B}. A releases and the count drops to 1; B may still read. B releases and the count drops to 0; the full pages enter the inactive queue. A new compatible request can remove them from that queue and acquire them again. Releasing twice is an error, not a way to create capacity."}
    </Prose>


    <PcAdmission />


    <Prose>
      {"Admission must be planned before mutation. Suppose a request can reuse one retained page and needs two new pages. It must exclude the matched page from the eviction candidates. If only one unprotected page can be reclaimed, admission fails without altering ownership, contents, index or queue order. Otherwise a rejected request could damage the very cache state it was trying to reuse."}
    </Prose>


    <Program file="prefix_store.py" />


    <Prose>
      {"The store owns a fixed list of "}
      <code>
        {"Page"}
      </code>
      {" objects, a free list, an "}
      <code>
        {"ExactIndex"}
      </code>
      {", a request table and an "}
      <code>
        {"OrderedDict"}
      </code>
      {" of inactive pages. "}
      <code>
        {"match"}
      </code>
      {" is read-only and stops at the first miss. "}
      <code>
        {"admit"}
      </code>
      {" determines total pages, subtracts matched pages and asks "}
      <code>
        {"_victims"}
      </code>
      {" to plan the full deficit while protecting those hits. Only after that succeeds does it claim shared pages, reclaim victims and reserve new pages. No active page can be a victim."}
    </Prose>


    <Prose>
      {""}
      <code>
        {"complete"}
      </code>
      {" writes the finite payload identity and registers only complete blocks after computation. This example stores token tuples as stand-ins for actual K/V; section 9 uses real tensors. A block rediscovered after a miss can be deduplicated onto an existing exact entry. That explicit choice differs from engines whose append-only tables permit duplicate physical copies. "}
      <code>
        {"release"}
      </code>
      {" removes one request's ownership and either retains a complete page or reclaims an incomplete one. "}
      <code>
        {"generation"}
      </code>
      {" increases when a physical slot receives a new allocation, so p0 reused later must not be mistaken for p0's old content."}
    </Prose>


    <Prose>
      {"The saved A/B example fills a four-page pool: tables "}
      <code>
        {"[0,1,2]"}
      </code>
      {" and "}
      <code>
        {"[0,1,3]"}
      </code>
      {", with two owners on pages 0 and 1. An unrelated request is denied while all four pages are active; the snapshot stays identical. After both releases, pages 2 and 3 are free and pages 0 and 1 are retained. The invariant checks ensure each physical page is in exactly one of free, retained inactive or active ownership."}
    </Prose>


    <Prose>
      {"This is a single-threaded teaching allocator with atomic admission at function boundaries. A concurrent engine also needs synchronization around computation completion and reclamation. "}
      <code>
        {"OrderedDict"}
      </code>
      {" updates are constant-time, but candidate selection and explicit whole-prefix equality cost more; the source names those costs rather than claiming a production-optimal allocator."}
    </Prose>


    <H2>
      {"6. Count unique storage and protect branches"}
    </H2>


    <Prose>
      {"Six logical page references do not necessarily occupy six physical pages. The address graph gives the correct count."}
    </Prose>


    <PcUnion />


    <Prose>
      {"A="}
      <code>
        {"[p0,p1,p2]"}
      </code>
      {" and B="}
      <code>
        {"[p0,p1,p3]"}
      </code>
      {" contain six references but the union is {p0,p1,p2,p3}: four pages. If a full page across all layers contains "}
      <InlineMath>
        {"M"}
      </InlineMath>
      {" bytes, these allocations occupy "}
      <InlineMath>
        {"4M"}
      </InlineMath>
      {", whereas multiplying both table lengths yields "}
      <InlineMath>
        {"6M"}
      </InlineMath>
      {". A retained inactive page also occupies physical bytes even when no live request table points to it. Metadata and unused tail slots need separate accounting."}
    </Prose>


    <Prose>
      {"For "}
      <InlineMath>
        {"N"}
      </InlineMath>
      {" layers, "}
      <InlineMath>
        {"H_{KV}"}
      </InlineMath>
      {" heads, head width "}
      <InlineMath>
        {"d"}
      </InlineMath>
      {", page size "}
      <InlineMath>
        {"b"}
      </InlineMath>
      {", and "}
      <InlineMath>
        {"s"}
      </InlineMath>
      {" bytes per scalar, a full all-layer K/V block has"}
    </Prose>


    <div className="pc-equation">

      <MathBlock>
        {"M=2NH_{KV}bds."}
      </MathBlock>

    </div>


    <Prose>
      {"The 2 counts K and V. Our native fixture later uses two layers, two KV heads, four positions, four features and FP32 scalars: 512 bytes per all-layer block. Four occupied blocks use 2048 bytes of payload; six independently allocated logical blocks would use 3072. Its allocator additionally reserves two trash sectors, so the actual backing allocation is 3072 bytes even when the ordinary data blocks total 2048. Backing and occupied payload answer different questions."}
    </Prose>


    <PcFork />


    <Prose>
      {"An immutable full block is safe to share. A partial tail is about to change. If two branches share "}
      <code>
        {"[5,6,7,_]"}
      </code>
      {" and append different IDs, one physical write cannot represent both outcomes. Copy that partial page before their writes, retaining any earlier complete shared pages. The result is "}
      <code>
        {"[5,6,7,8]"}
      </code>
      {" and "}
      <code>
        {"[5,6,7,9]"}
      </code>
      {" in separate slots."}
    </Prose>


    <Prose>
      {""}
      <code>
        {"PrefixStore.fork"}
      </code>
      {" acquires the full pages for the new request and allocates copies only for unindexed partial pages. It plans those copies before changing ownership. "}
      <code>
        {"append_to_partial"}
      </code>
      {" requires exactly one owner, fills the private tail and then runs completion; the newly full block can enter the index. Its saved check records the copy pair and both final token tuples. This is the same copy-on-write principle introduced in PagedAttention, now applied to separately evolving requests."}
    </Prose>


    <span 
      id="9-failure-modes-and-gotchas" 
      aria-hidden="true" 
    />

    <H2>
      {"7. Make hashes an index, not a proof"}
    </H2>


    <Prose>
      {"The first two pages of A and B agree; the third does not. A hash chain gives a compact way to locate candidate entries without repeatedly scanning all prior IDs."}
    </Prose>


    <PcHash />


    <Prose>
      {"For namespace "}
      <InlineMath>
        {"n"}
      </InlineMath>
      {" and blocks "}
      <InlineMath>
        {"t_0,t_1,\\ldots"}
      </InlineMath>
      {", define "}
      <InlineMath>
        {"h_0=H(n,t_0)"}
      </InlineMath>
      {", then "}
      <InlineMath>
        {"h_j=H(h_{j-1},t_j)"}
      </InlineMath>
      {". An upstream edit changes the parent identity of every later block. Without the parent, identical current IDs such as "}
      <code>
        {"[50,51]"}
      </code>
      {" after "}
      <code>
        {"[30,31]"}
      </code>
      {" and after "}
      <code>
        {"[40,41]"}
      </code>
      {" could incorrectly reuse K/V that attended to different context."}
    </Prose>


    <Prose>
      {"Hashing still maps a large input space into a finite output space. In the program, replace the digest with a function returning one byte, zero, for every input. Two distinct prefixes now deliberately land in the same bucket. "}
      <code>
        {"ExactIndex"}
      </code>
      {" rejects the wrong candidate because it compares the namespace and complete prefix tuple. Comparing only the current block and a collided parent digest would not be sufficient."}
    </Prose>


    <Prose>
      {"The default digest is SHA256, but exact equality is what makes this reference collision-safe. Retaining every full prefix tuple uses quadratic aggregate prefix storage in the worst case, approximately "}
      <InlineMath>
        {"O(L^2/b)"}
      </InlineMath>
      {" token IDs. The chained hashing pass itself processes "}
      <InlineMath>
        {"O(L)"}
      </InlineMath>
      {" IDs. An engine can intern exact parent identities or choose a different collision policy; the compact teaching implementation makes the distinction inspectable. A namespace field must bind the actual effective-input policy, not merely a reassuring name that remains unchanged after the underlying weights change."}
    </Prose>


    <span 
      id="6-visual-walkthrough" 
      aria-hidden="true" 
    />

    <H2>
      {"8. Measure hits under finite pressure"}
    </H2>


    <Prose>
      {"A long common prefix provides an opportunity. A resident, eligible and admitted prefix provides actual reuse. A trace explains why the two differ."}
    </Prose>


    <PcTrace />


    <Prose>
      {"Introduce C="}
      <code>
        {"[1,2,3,4,20,21,22,23,24,25]"}
      </code>
      {". It shares only A's first page. The examples below run one request at a time and release it before the next arrives; they are constructed workloads, not captured service traffic."}
    </Prose>


    <PcHistory />


    <Prose>
      {"After A completes and releases, its first two pages remain retained and its two-token tail is free. B can acquire both retained pages and allocate a private tail. If C arrives between A and B, C's unrelated blocks consume capacity. With fewer physical pages, completing C can evict the second block that B later wants. The event grid distinguishes a slot reused for new content from the same prefix continuing to reside there."}
    </Prose>


    <Program file="prefix_workload.py" />


    <Prose>
      {""}
      <code>
        {"run_trace"}
      </code>
      {" captures before-state, admission decision, completed payload and released state for every request. Its counters derive from those actual finite-store decisions. "}
      <code>
        {"requested_tokens"}
      </code>
      {" includes every prompt row; "}
      <code>
        {"reused_tokens"}
      </code>
      {" sums matched rows; "}
      <code>
        {"new_queries"}
      </code>
      {" is their difference. It also counts requests with at least one reused row. The saved results are:"}
    </Prose>


    <NeuralTable 
      caption={"8. Measure hits under finite pressure"} 
      headers={[<>{"Constructed trace"}</>, <>{"Pool pages"}</>, <>{"Requests hitting / requests"}</>, <>{"Reused / requested rows"}</>, <>{"New query rows"}</>]} 
      rows={[[<>{"A, cold"}</>, <>{"4"}</>, <>{"0/1"}</>, <>{"0/10"}</>, <>{"10"}</>], [<>{"A, B, A"}</>, <>{"4"}</>, <>{"2/3"}</>, <>{"16/30"}</>, <>{"14"}</>], [<>{"A, C, B"}</>, <>{"4"}</>, <>{"2/3"}</>, <>{"12/30"}</>, <>{"18"}</>], [<>{"A, C, B under pressure"}</>, <>{"3"}</>, <>{"2/3"}</>, <>{"8/30"}</>, <>{"22"}</>], [<>{"Three unrelated ten-ID prompts"}</>, <>{"4"}</>, <>{"0/3"}</>, <>{"0/30"}</>, <>{"30"}</>], [<>{"No requests"}</>, <>{"4"}</>, <>{"not applicable"}</>, <>{"not applicable"}</>, <>{"0"}</>]]} 
    />


    <PcDenominators />


    <Prose>
      {"The reordered and pressured traces have the same request hit rate, 2/3, but different reused-token fractions: 40% and about 26.67%. A small hit and a large hit count equally in the first metric. To estimate avoided query work, the token-weighted numerator matters. Neither statistic reveals waiting time or the still-live attention rectangle on its own."}
    </Prose>


    <Prose>
      {""}
      <code>
        {"run_trace"}
      </code>
      {" uses real admissions into the finite store, rather than assuming every common prefix hits. An empty trace reports "}
      <code>
        {"None"}
      </code>
      {" for both fractions, because neither 0/0 denominator defines a rate. Read the event history when a hit is unexpectedly short: inspect first mismatch, first absent block, capacity pressure and final-query policy in that order. Only after those boundaries are understood is it useful to change the eviction policy."}
    </Prose>


    <span 
      id="5-production-implementation" 
      aria-hidden="true" 
    />

    <H2>
      {"9. Reuse a real decoder prefix"}
    </H2>


    <Prose>
      {"The store used token tuples to make ownership easy to inspect. Now carry the same branch discipline into actual K/V tensors. We use the complete decoder from the KV-Cache lesson, with its parameters and attention implementation unchanged."}
    </Prose>


    <PcSnapshot />


    <Prose>
      {""}
      <code>
        {"CachedDecoder"}
      </code>
      {" owns one K tensor and one V tensor per layer plus a current length. A snapshot copies only occupied positions, not stale unused capacity. A fork allocates fresh backing, copies those saved rows and restores the length. Appending a suffix then starts at that length, preserving its absolute positions and allowing each new query to read the full old prefix. Starting a suffix at position 0 would change both positional embeddings and its attention context."}
    </Prose>


    <Program file="prefix_decoder.py" />


    <Prose>
      {"The mechanism is concentrated in "}
      <code>
        {"snapshot"}
      </code>
      {" and "}
      <code>
        {"fork"}
      </code>
      {". Slicing "}
      <code>
        {":decoder.length"}
      </code>
      {" selects valid rows; "}
      <code>
        {".clone()"}
      </code>
      {" isolates the saved snapshot. A new "}
      <code>
        {"CachedDecoder"}
      </code>
      {" receives those rows and the same occupied length. "}
      <code>
        {"equal_prefix"}
      </code>
      {" checks that the original decoder still has exactly that length and those values after both branches append. The complete file includes the fixed comparison and recorded operands, rather than requiring a hidden helper to construct the branches."}
    </Prose>


    <Prose>
      {"The saved TinyLM example uses an untrained, same-weight model: vocabulary 32, width 16, four heads, two layers, context 20, CPU FP64, seed 149. A has IDs 1–12; B shares 1–8 then has 13–16. C changes A's zero-based index 3 to 17. Three full references, one shared prefill, two suffix branches and a fresh C prefill/tail use eight forwards in total. No training or generated continuation is involved."}
    </Prose>


    <Prose>
      {"Both reused-tail comparisons had maximum absolute logit error "}
      <InlineMath>
        {"4.440892098500626\\times10^{-16}"}
      </InlineMath>
      {"; C's correctly recomputed prefix/tail had "}
      <InlineMath>
        {"2.220446049250313\\times10^{-16}"}
      </InlineMath>
      {". All passed the fixed absolute and relative tolerances of "}
      <InlineMath>
        {"2\\times10^{-12}"}
      </InlineMath>
      {", and A/B tail top-1 IDs agreed. The full-reference A/C rows before the edit were exactly equal, as were A/B's common-prefix full logits. The base and parameter digest stayed unchanged. Each branch copied 4096 occupied prefix bytes and reserved 10240 K/V bytes for capacity 20. These values demonstrate isolation and finite numerical compatibility; they do not make the untrained model a useful language system."}
    </Prose>


    <H3>
      {"The ordinary library route"}
    </H3>


    <Prose>
      {"The same lifecycle can use Transformers "}
      <code>
        {"DynamicCache"}
      </code>
      {". Create one cache, prefill the shared prefix once, then deep-copy that cache separately for each suffix. Direct forwards pass only new IDs, the correct position offset and an attention mask spanning past plus new positions. This example does not ask "}
      <code>
        {"generate"}
      </code>
      {" to infer cache ownership or combine an explicit cache object with a conflicting cache-construction option."}
    </Prose>


    <Program file="native_prefix.py" />


    <Prose>
      {""}
      <code>
        {"run"}
      </code>
      {" loads the verified local checkpoint, converts it to FP64 before any forward and creates a "}
      <code>
        {"DynamicCache"}
      </code>
      {" using its configuration. For each saved prefix, it records the original K/V arrays. Each tail gets a fresh full-prompt reference and an independent "}
      <code>
        {"copy.deepcopy(cache)"}
      </code>
      {" branch. "}
      <code>
        {"forward(..., begin=length, last_only=False)"}
      </code>
      {" compares every tail row, not just the last logit vector. Different backing pointers establish that these branches are copies; exact base comparisons establish that neither append mutated the retained prefix."}
    </Prose>


    <Prose>
      {"To reproduce the complete local sequence after the finite and Tiny stages, explicitly acquire the pinned model files, then run the native and allocator stages:"}
    </Prose>


    <CodeBlock language={"sh"}>
      {"python acquire_model.py --output model-cache\npython prefix_study.py --stage native --output results --model model-cache\npython prefix_study.py --stage allocator --output results"}
    </CodeBlock>


    <Prose>
      {"Acquisition is separate from inference. The loader checks the six model files against the supplied identity report and uses local-only loading. The saved run used EleutherAI/pythia-14m revision "}
      <code>
        {"cf967c0a9a04383db6f7b1108d86b2962634b4ac"}
      </code>
      {", Torch 2.14.0+cpu, Transformers 5.19.0 and eager attention. Alice provides an attributed public-domain input: prefix lengths 8 and 32 use the saved leading IDs; the two eight-ID tails use offsets [40, 48) and [48, 56). These spliced inputs test compatible computation, not coherent answers or extraction quality."}
    </Prose>


    <PcNative />


    <NeuralTable 
      caption={"The ordinary library route"} 
      headers={[<>{"Prefix rows"}</>, <>{"Tail slice"}</>, <>{"Maximum absolute error"}</>, <>{"Compared logits"}</>, <>{"Tolerance failures"}</>, <>{"Copied prefix bytes"}</>, <>{"Branch bytes"}</>]} 
      rows={[[<>{"8"}</>, <>{"[40, 48)"}</>, <>{"3.552713678800501e−14"}</>, <>{"402432"}</>, <>{"0"}</>, <>{"98304"}</>, <>{"196608"}</>], [<>{"8"}</>, <>{"[48, 56)"}</>, <>{"9.592326932761353e−14"}</>, <>{"402432"}</>, <>{"0"}</>, <>{"98304"}</>, <>{"196608"}</>], [<>{"32"}</>, <>{"[40, 48)"}</>, <>{"3.197442310920451e−14"}</>, <>{"402432"}</>, <>{"0"}</>, <>{"393216"}</>, <>{"491520"}</>], [<>{"32"}</>, <>{"[48, 56)"}</>, <>{"2.7533531010703882e−14"}</>, <>{"402432"}</>, <>{"0"}</>, <>{"393216"}</>, <>{"491520"}</>]]} 
    />


    <Prose>
      {"Each comparison covers eight positions times 50304 vocabulary columns. All four passed the fixed criterion "}
      <InlineMath>
        {"|a-r|\\le2\\times10^{-9}+2\\times10^{-9}|r|"}
      </InlineMath>
      {" and separately had equal top-1 IDs. The original prefix cache and weights remained unchanged. Two prefills, four full references and four cached-tail forwards account for all ten calls. There is no timed arm: copied storage and all-logit agreement cannot establish a serving speedup. The nonzero differences also explain why causal compatibility should not be described as universal bitwise equality."}
    </Prose>


    <H3>
      {"Observe actual physical sharing"}
    </H3>


    <Prose>
      {"The ordinary cache branch intentionally copied data. To verify the different claim that two request tables share backing addresses, the next program uses the actual pinned Transformers allocator with supplied K/V values and no model."}
    </Prose>


    <PcAllocator />


    <Prose>
      {"The native allocation calls produce tables A="}
      <code>
        {"[5,4,3]"}
      </code>
      {" and B="}
      <code>
        {"[5,4,2]"}
      </code>
      {". Blocks 5 and 4 are shared with two references each; 3 and 2 are private tails. These are observed native IDs, distinct from the illustrative p0–p3 diagram. The read indices for the eight shared positions and their physical K and V addresses agree across A and B at both layers. Writing B's tail preserves A's shared values."}
    </Prose>


    <Program file="native_prefix_allocator.py" />


    <Prose>
      {"The file configures two layers, two KV heads, four features per head and four tokens per page. Its "}
      <code>
        {"supplied"}
      </code>
      {" function encodes layer, position, token, head and feature into deterministic scalar values, so a misplaced row is inspectable. "}
      <code>
        {"allocate_cache_to_request"}
      </code>
      {" reserves A's storage; "}
      <code>
        {"update"}
      </code>
      {" writes those values; "}
      <code>
        {"mark_complete_blocks"}
      </code>
      {" exposes the two full blocks. Only then can "}
      <code>
        {"match_prefix_blocks"}
      </code>
      {" and "}
      <code>
        {"acquire_prefix_blocks"}
      </code>
      {" provide B's shared prefix. B allocates and writes its own tail."}
    </Prose>


    <Prose>
      {"The pointer comparison uses the physical backing views, not the gathered arrays returned by "}
      <code>
        {"update"}
      </code>
      {": an indexed read can produce a copy even when the underlying request tables alias the same storage. The native class calls a one-layer four-token K/V payload a "}
      <strong>
        {"page"}
      </strong>
      {" of 256 bytes; a two-layer "}
      <strong>
        {"block"}
      </strong>
      {" is 512 bytes. Four allocatable blocks plus two required trash sectors occupy 3072 backing bytes."}
    </Prose>


    <Prose>
      {"After A and B release, their tails are free and blocks 5 and 4 remain retained. C can reacquire those retained blocks, release them, and leave them evictable again. Eviction returns all four blocks to their assigned sectors. Returning those sectors to the outer pool leaves "}
      <code>
        {"free_sectors=4"}
      </code>
      {" and "}
      <code>
        {"free_blocks=0"}
      </code>
      {": zero here means no blocks remain assigned to this allocator, not that the capacity leaked. The layer responsible for the counter matters."}
    </Prose>


    <Prose>
      {"This is an executed storage fixture on Transformers 5.19.0 internals, not a live serving-manager hit-rate test. Its BLAKE2b-64 parent index lacks the scratch program's exact collision fallback and trust namespace. Ordinary engine automatic prefix caching, such as "}
      <a href={"https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/"}>
        {"vLLM's maintained APC interface"}
      </a>
      {", must be used with that engine's current options and request lifecycle. We did not launch such a server here; "}
      <a href={"/learn/path/full-curriculum/inference-engines-serving?module=large-language-models"}>
        {"Inference Engines & Serving"}
      </a>
      {" owns that complete deployment path."}
    </Prose>


    <H2>
      {"10. Compress the prefix tree — deeper"}
    </H2>


    <Prose>
      {"Full-block hashing chooses a fixed matching granularity. A radix tree instead represents common token sequences along compressed edges. It can locate divergence inside an edge, then divide that edge without duplicating the shared prefix."}
    </Prose>


    <PcRadix />


    <Prose>
      {"Insert A="}
      <code>
        {"[1,2,3,4,5]"}
      </code>
      {" into an empty tree: one edge can hold the entire sequence. Inserting "}
      <code>
        {"[1,2,3,9]"}
      </code>
      {" shares its first three IDs. Split the old edge into a common "}
      <code>
        {"[1,2,3]"}
      </code>
      {" edge and children "}
      <code>
        {"[4,5]"}
      </code>
      {" and "}
      <code>
        {"[9]"}
      </code>
      {". Inserting "}
      <code>
        {"[1,2,8]"}
      </code>
      {" splits the common edge again into "}
      <code>
        {"[1,2]"}
      </code>
      {", with a "}
      <code>
        {"[3]"}
      </code>
      {" branch for the older descendants and a new "}
      <code>
        {"[8]"}
      </code>
      {" branch. A match may stop partway through a compressed edge; matched length and reached node are not always the same boundary."}
    </Prose>


    <PcPins />


    <Prose>
      {"The path used by a live request must remain pinned. Removing its parent would invalidate the location of its stored continuation even if the leaf itself were marked active. Each pinned path therefore contributes a count to every ancestor it uses. When a pinned edge splits, the new intermediate node inherits the descendants' pins. Existing active endpoint handles continue to identify the same node object."}
    </Prose>


    <Program file="radix_prefix.py" />


    <Prose>
      {""}
      <code>
        {"insert"}
      </code>
      {" finds the common length between the pending IDs and a child edge. A partial match creates an intermediate node and reconnects the old child beneath it. "}
      <code>
        {"match"}
      </code>
      {" reports both total matching tokens and the portion used within each edge. "}
      <code>
        {"pin"}
      </code>
      {" retains the endpoint and increments the path; "}
      <code>
        {"unpin"}
      </code>
      {" follows current parent pointers, so it still works after a split. "}
      <code>
        {"evict_leaf "}
      </code>
      {" chooses an unpinned leaf by access order, then removes just that edge. Its parent can become a later candidate only when it is itself a leaf and unpinned."}
    </Prose>


    <Prose>
      {"The supplied check pins A before either split, then inserts the two other branches. It evicts "}
      <code>
        {"[9]"}
      </code>
      {" and "}
      <code>
        {"[8]"}
      </code>
      {" while A's entire path remains. After A unpins, the remaining nodes can drain to the root. This reference scans leaves in "}
      <InlineMath>
        {"O(\\text{nodes})"}
      </InlineMath>
      {" and stores token identities rather than GPU tensors. It explains "}
      <a href={"https://arxiv.org/html/2312.07104v2"}>
        {"SGLang's radix-cache mechanism"}
      </a>
      {" without representing itself as that engine's allocator or reproducing its system benchmarks."}
    </Prose>


    <span 
      id="8-what-scales-and-what-doesnt" 
      aria-hidden="true" 
    />

    <span 
      id="8-what-scales-and-what-doesn-t" 
      aria-hidden="true" 
    />

    <H2>
      {"11. Schedule reuse without hiding waiting — deeper"}
    </H2>


    <Prose>
      {"A shared-prefix tree also suggests a request order. If all requests are already known and the cache can retain the longest root-to-leaf path, finishing related branches together can avoid rebuilding old prefixes."}
    </Prose>


    <PcDepthFirst />


    <Prose>
      {"For our ten-ID A/B/C prompts, order A,B,C computes 10+2+6=18 new rows. Order A,C,B computes 10+6+6=22 when the cache retains only the previous complete path. A and B share 8; A and C share 4; C and B also share 4. The tree contains 18 distinct token edges, so every edge must be computed at least once. A depth-first traversal attains that lower bound: retain the current path, finish its descendants before moving to a sibling, and never need a completed subtree again."}
    </Prose>


    <Prose>
      {"This proof concerns a fixed offline tree, enough capacity for a longest path, and query-row work only. Unknown future arrivals, growing decode outputs, page boundaries, deadlines and fairness change the problem. The token-granularity "}
      <code>
        {"order_work"}
      </code>
      {" example deliberately allows reuse of a complete previous path; it is not the KV-only final-query page rule from section 3. In the saved reference, capacity is 10 tokens, the distinct-edge lower bound is 18, DFS reaches 18 and the interleaved order uses 22."}
    </Prose>


    <Prose>
      {"An online router must also account for a warm worker's queue. Define "}
      <InlineMath>
        {"W"}
      </InlineMath>
      {" as waiting time before service and "}
      <InlineMath>
        {"S"}
      </InlineMath>
      {" as service until the result of interest, such as the first output token. Compare "}
      <InlineMath>
        {"W+S"}
      </InlineMath>
      {" for the same arrival time and outcome."}
    </Prose>


    <PcWaiting />


    <Prose>
      {"Suppose a warm worker needs 4 ms of service, while a cold worker waits 2 ms then needs 10 ms. These are supplied estimates, not measurements. Cold finishes 12 ms after arrival. Warm wins when its wait is below 8 ms, ties at 8, and loses above 8. At a 20 ms warm queue it finishes at 24 ms, twice the cold estimate, despite the cache hit."}
    </Prose>


    <Program file="prefix_routing.py" />


    <Prose>
      {""}
      <code>
        {"route"}
      </code>
      {" uses nonnegative Decimal inputs and returns both finish times, the tie threshold and the choice. At warm waits 0, 7, 8, 9, 20 it chooses warm,warm,tie,cold,cold. Reuse affinity is one routing input, not permission to ignore waiting. The wider scheduling and tail-latency issues belong with the queueing and serving lessons."}
    </Prose>


    <H2>
      {"12. Use a provider's cache contract"}
    </H2>


    <Prose>
      {"A local engine exposes page allocation. An API exposes a request contract and reported usage. A client cannot infer physical page layout from a cache key, and a provider's billing categories need not correspond one-for-one to our allocator states."}
    </Prose>


    <PcProviders />


    <Prose>
      {"There are three useful shapes. "}
      <strong>
        {"Implicit matching"}
      </strong>
      {" lets the service locate eligible repeated content. An "}
      <strong>
        {"explicit breakpoint"}
      </strong>
      {" identifies a stable boundary in a request, after which the changing question can follow. A "}
      <strong>
        {"named resource"}
      </strong>
      {" is created separately and referenced by later requests until its lifetime ends. In every case, model support, eligible length, scope and retention policy are part of the contract. A requested cache operation is not itself evidence of a hit."}
    </Prose>


    <Prose>
      {"Our optional examples are source-checked against documentation on 9 October 2026. They have not made remote requests. They use a reader-selected supported model and document, then print the actual usage instead of supplying invented hit counts or a universal discount. Keep these current contracts separate from the fixed local scientific examples."}
    </Prose>


    <Program file="provider_cache_examples.py" />


    <Prose>
      {"The Claude branch puts a breakpoint on the stable document block and the varying question after it. It prints complete response usage; "}
      <code>
        {"cache_read_input_tokens"}
      </code>
      {", "}
      <code>
        {"cache_creation_input_tokens"}
      </code>
      {" and uncached "}
      <code>
        {"input_tokens"}
      </code>
      {" describe different portions of the request. Their sum accounts for total input. The provider also documents automatic placement; changing the selected boundary can change reuse. See "}
      <a href={"https://platform.claude.com/docs/en/build-with-claude/prompt-caching"}>
        {"Claude prompt caching"}
      </a>
      {"."}
    </Prose>


    <Prose>
      {"The OpenAI branch is explicitly for the documented GPT-5.6-and-later contract. It sets an explicit content breakpoint and "}
      <code>
        {"prompt_cache_options"}
      </code>
      {" with a 30m lifetime, forwards those wire options through "}
      <code>
        {"extra_body"}
      </code>
      {", and prints "}
      <code>
        {"response.usage"}
      </code>
      {". Separate accounting can use "}
      <code>
        {"prompt_cache_key"}
      </code>
      {"; earlier models have different routing/retention rules. Read cached and cache-write input details rather than assuming all prompt tokens were reused or that writes have no cost. See "}
      <a href={"https://developers.openai.com/api/docs/guides/prompt-caching"}>
        {"OpenAI prompt caching"}
      </a>
      {"."}
    </Prose>


    <Prose>
      {"The Google branch uses the generateContent v1beta named-resource route: create a cache for the document, obtain metadata, reference "}
      <code>
        {"cache.name"}
      </code>
      {" for two different questions, update its lifetime and delete it in "}
      <code>
        {"finally"}
      </code>
      {". "}
      <code>
        {"client.close()"}
      </code>
      {" runs even if deletion raises. Resource expiry and API/model support still bound its use; this is distinct from Interactions implicit caching. See "}
      <a href={"https://ai.google.dev/gemini-api/docs/generate-content/caching"}>
        {"the explicit-resource guide"}
      </a>
      {" and "}
      <a href={"https://github.com/googleapis/python-genai/blob/main/google/genai/caches.py"}>
        {"actual SDK methods"}
      </a>
      {"."}
    </Prose>


    <Prose>
      {"For a resource with an exclusive expiry at time 90, a call at 89 may be eligible while a call at 90 requires recreation or another supported route. Extending metadata does not prove a prior request read cached content. Record resource identity, lifetime, actual usage and application output separately."}
    </Prose>


    <Prose>
      {"To run an optional branch, install that provider's SDK, set its named environment key and supply your own document and two questions:"}
    </Prose>


    <CodeBlock language={"sh"}>
      {"python provider_cache_examples.py --provider google --model YOUR_SUPPORTED_MODEL --document your-document.txt --question \"Summarize the main claim.\" --question \"What evidence supports it?\""}
    </CodeBlock>


    <Prose>
      {"The supported provider choices are "}
      <code>
        {"google"}
      </code>
      {", "}
      <code>
        {"claude"}
      </code>
      {" and "}
      <code>
        {"openai"}
      </code>
      {"; the corresponding variables are "}
      <code>
        {"GEMINI_API_KEY"}
      </code>
      {", "}
      <code>
        {"ANTHROPIC_API_KEY"}
      </code>
      {" and "}
      <code>
        {"OPENAI_API_KEY"}
      </code>
      {". These calls transmit the supplied document and can incur charges. They are separate from the local stage runner. Check current model minima and pricing before choosing a model; this lesson's arithmetic uses explicit illustrative units instead of freezing a provider price table into a general rule."}
    </Prose>


    <span 
      id="7-decision-matrix" 
      aria-hidden="true" 
    />

    <H2>
      {"13. Decide what should stay cached — deeper"}
    </H2>


    <Prose>
      {"Correct reuse may still cost more than computing normally. Separate its initial write, subsequent reads and storage lifetime before making an economic decision."}
    </Prose>


    <PcCost />


    <Prose>
      {"Let "}
      <InlineMath>
        {"C_w"}
      </InlineMath>
      {" be the first request's total write-path charge, "}
      <InlineMath>
        {"C_n"}
      </InlineMath>
      {" a normal request charge and "}
      <InlineMath>
        {"C_h"}
      </InlineMath>
      {" a later hit charge for the same work. Let storage over the selected lifetime cost "}
      <InlineMath>
        {"C_s"}
      </InlineMath>
      {", which can itself be rate times duration. With "}
      <InlineMath>
        {"n"}
      </InlineMath>
      {" later hits,"}
    </Prose>


    <div className="pc-equation">

      <MathBlock>
        {"C_{cache}=C_w+nC_h+C_s,\\qquad C_{normal}=(n+1)C_n."}
      </MathBlock>

    </div>


    <Prose>
      {"The net saving is "}
      <InlineMath>
        {"n(C_n-C_h)-(C_w-C_n+C_s)"}
      </InlineMath>
      {". The per-hit benefit is "}
      <InlineMath>
        {"B=C_n-C_h"}
      </InlineMath>
      {" and the fixed overhead is "}
      <InlineMath>
        {"O=C_w-C_n+C_s"}
      </InlineMath>
      {". When "}
      <InlineMath>
        {"B>0"}
      </InlineMath>
      {", the first non-more-expensive integer is "}
      <InlineMath>
        {"\\max(0,\\lceil O/B\\rceil)"}
      </InlineMath>
      {"; the first strictly cheaper integer is "}
      <InlineMath>
        {"\\max(0,\\lfloor O/B\\rfloor+1)"}
      </InlineMath>
      {". They differ when the threshold itself is an integer."}
    </Prose>


    <Prose>
      {"For illustrative charges write 1.25, normal 1, hit 0.1 and no storage, the initial overhead is 0.25 and each hit saves 0.9. One later hit makes cached cost 1.35 versus normal 2. With storage 0.65, fixed overhead becomes 0.90: one hit ties at 2.00, and two hits save 0.90. These are constructed amounts, not quoted provider prices."}
    </Prose>


    <Program file="prefix_cost.py" />


    <Prose>
      {""}
      <code>
        {"decision"}
      </code>
      {" uses Decimal so an exact monetary tie does not become a rounding accident. It returns current costs, current saving, first non-more-expensive and first strictly cheaper counts. If the per-hit benefit is zero or negative, additional hits cannot improve saving. With positive fixed overhead there is no break-even. If the write path begins cheaper but hits later cost more than normal, a first qualifying count of 0 does not mean all larger counts remain economical: inspect the current saving and "}
      <code>
        {"extra_hits_improve_saving"}
      </code>
      {" as well."}
    </Prose>


    <Prose>
      {"The finite results include 44 hit/storage combinations and those boundary cases. Neither money nor row-work calculations include a measured service queue."}
    </Prose>


    <PcSession />


    <Prose>
      {"Keeping historically popular content is also not always the best policy. In the supplied three-page trace, a five-token A occurs five times and then never returns. New five-token B and C arrive, followed by B again. Each request needs one reusable four-token block plus its private final-query page. Historical frequency can retain A's old hot block and discard B, even though A's session has ended. In this exact trace, inactive LRU reuses 20 of 40 requested rows; the simple frequency policy reuses 16. The last B gets a four-row hit under LRU and zero under frequency."}
    </Prose>


    <Prose>
      {""}
      <code>
        {"FrequencyStore"}
      </code>
      {" changes only victim choice: it sorts inactive, unprotected candidates by historical complete-block count, using inactive order to break ties. It deliberately retains old counts and scans candidates, so this is a concrete counterexample rather than a general ranking of production policies. The recent preprint "}
      <a href={"https://arxiv.org/html/2609.28870v1"}>
        {"When Fancy Eviction Fails"}
      </a>
      {" studies session-related reuse in real traces; its selected mechanism discussion motivates the question, while our values come from the included finite program."}
    </Prose>


    <PcTrust />


    <Prose>
      {"Finally, correctness and privacy require separate reasoning. Two users may supply identical public content and obtain numerically correct reuse. Yet an observer who can test candidate prefixes and distinguish a hit from a miss may learn something about another user's activity. A shared page need not return wrong text for its reuse timing or usage indicator to reveal information."}
    </Prose>


    <Prose>
      {"A trust namespace prevents reuse across the groups it separates, at the cost of missed sharing opportunities. It does not establish every other security property of a service. "}
      <a href={"https://arxiv.org/html/2603.10726v1"}>
        {"CacheSolidarity"}
      </a>
      {" explores selective owner/flag mechanisms under stated distinguishability conditions; it is a research alternative to examine, not a blanket guarantee demonstrated by this lesson. Hybrid recurrent-state snapshots, remote KV transfer and distributed eviction add other state and transport contracts; the later inference architecture material is the right place to implement them."}
    </Prose>


    <Prose>
      {"The resulting decision is concrete: establish exact compatibility, find a resident eligible prefix, preserve ownership during admission, then assess measured work, waiting, memory and charges under the relevant policy. A hit is useful evidence about one boundary. It is not a substitute for the rest of the request's contract."}
    </Prose>

  </section>

  <section 
    className="lesson-ending lesson-ending--practice" 
    data-lesson-ending="practice"
  >

    <span 
      id="11-self-check-exercises" 
      aria-hidden="true" 
    />

    <H2>
      {"14. Practice"}
    </H2>

    <Prose>
      {"First-pass readers can work through tasks 1–12 and 16 after sections 1–9 and 12. Before task 13, read the radix-tree explanation in section 10; before task 14, read the waiting-time comparison in section 11. Task 15 combines expiry from section 12 with the cost calculation in section 13, so read section 13 before its economic half. These deeper sections remain visible and available whenever you need them."}
    </Prose>


    <Prose>
      {"Each task changes the worked example or asks you to combine its boundaries. Try the question before opening its separate hint and solution. The final complete "}
      <code>
        {"practice.py"}
      </code>
      {" computes the core supplied fixtures; the worked solutions also explain their interpretation and storage extensions. It does not call a model."}
    </Prose>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"1. Read the right rows"}
      </H3>


      <Prose>
        {"A new query at zero-based position 6 follows six cached positions. The model has three layers and two KV heads. Which positions must each layer read and write? Can the request reuse a previous answer?"}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" distinguish the query's position from each head's stored K and V rows."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" each layer reads K/V positions 0–6, writes new K and V only at position 6 in both heads, and leaves positions 0–5 unchanged. There are six layer/head pairs. Each pair reads seven K rows and seven V rows, making 42 rows of each kind across those pairs. The suffix-dependent hidden state and output still need computation; a previous answer is not the prefix cache."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"2. Find the earliest invalid state"}
      </H3>


      <Prose>
        {"Two length 9 prompts differ only at zero-based token index 3. Model weights, adapter, positions and masks agree. Which rows remain reusable? How many rows fit reusable complete pages of size 2?"}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" draw the dependency cone from the changed embedding."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" positions 0–2 remain the same causal prefix. Rows 3–8 must be reconsidered at each layer. A complete-page policy can reuse only positions 0–1: one two-row page. The equal row 2 cannot combine with changed row 3 to form a reusable complete page. A future edit would not invalidate earlier positions, but semantic similarity would not repair this earlier edit."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"3. Include the parent"}
      </H3>


      <Prose>
        {"With page size 2, compare "}
        <code>
          {"[2,4,7,9,11]"}
        </code>
        {" and "}
        <code>
          {"[8,6,7,9,12]"}
        </code>
        {". Their second full blocks are both "}
        <code>
          {"[7,9]"}
        </code>
        {". Is that block's K/V interchangeable?"}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" inspect the older keys and values available when its rows were computed."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" no. The exact contexts are "}
          <code>
            {"([2,4],[7,9])"}
          </code>
          {" and "}
          <code>
            {"([8,6],[7,9])"}
          </code>
          {". The second block attends to different parent prefixes, so equal current IDs do not establish equal hidden representations or K/V. A current-block-only key merges incompatible computations. Bind the full causal identity through a parent chain and appropriate exact comparison."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"4. Preserve a final query"}
      </H3>


      <Prose>
        {"An engine reuses only full KV pages of size 3 and leaves at least one prompt query to obtain logits. Find the maximum reusable rows for lengths 5, 6, 10. Then change zero-based index 4 in the length 10 prompt."}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" combine the first changed position with the final-query limit."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" the unedited limits are "}
          <InlineMath>
            {"3\\lfloor4/3\\rfloor=3"}
          </InlineMath>
          {", "}
          <InlineMath>
            {"3\\lfloor5/3\\rfloor=3"}
          </InlineMath>
          {", and "}
          <InlineMath>
            {"3\\lfloor9/3\\rfloor=9"}
          </InlineMath>
          {". After the index 4 edit, only the first complete page, positions 0–2, can be reused: 3 rows. Position 3 remains causally compatible but lies in the partly invalid second page. Saving compatible final logits or permitting finer-grained reuse would be different contracts."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"5. Count the surviving work"}
      </H3>


      <Prose>
        {"For "}
        <InlineMath>
          {"L=12,P=6"}
        </InlineMath>
        {", find new query rows, full causal pairs, avoided pairs and remaining pairs. Repeat at "}
        <InlineMath>
          {"P=0"}
        </InlineMath>
        {"."}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" add the suffix-to-prefix rectangle and suffix triangle."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" six query rows remain. Full pairs are "}
          <InlineMath>
            {"12\\times13/2=78"}
          </InlineMath>
          {"; avoided pairs are "}
          <InlineMath>
            {"6\\times7/2=21"}
          </InlineMath>
          {". Remaining pairs are 57, also "}
          <InlineMath>
            {"6\\times6+6\\times7/2=36+21"}
          </InlineMath>
          {". At "}
          <InlineMath>
            {"P=0"}
          </InlineMath>
          {", all 12 rows and 78 pairs remain. Calling the six reused rows a 50% latency saving would confuse a row count with a measured workload result."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"6. Diagnose a leaked owner"}
      </H3>


      <Prose>
        {"One physical page has owners A and B. A finishes and releases it. B is cancelled, but its release callback is omitted. C needs the only page. Explain the refusal and the correct repair."}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" cancellation text and ownership mutation are separate events."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" the reference count goes 2→1 after A. The missing B release leaves it at 1, so the allocator correctly refuses to evict it. Run exactly one B release to reach 0; a complete page then becomes retained and evictable. Releasing B twice is an ownership bug. The program's "}
          <code>
            {"leaked_owner"}
          </code>
          {" case retains both the unchanged denied state and the explicit duplicate-release refusal."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"7. Deny atomically"}
      </H3>


      <Prose>
        {"A three-page pool contains active p0, retained matching p1 and retained p2. A new request needs p1 plus two new pages. What changes after a failed admission? What if it needs only one new page?"}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" protect every matched page before selecting victims."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" p0 is active and p1 is a needed hit, leaving only p2 evictable. Two new pages cannot fit, so ownership, contents, index and inactive order remain unchanged. For one new page, acquire p1, reclaim p2 for a new generation and leave p0 untouched. Evicting p1 to pass the capacity check would destroy a needed prefix rather than satisfy the original request."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"8. Count unique bytes"}
      </H3>


      <Prose>
        {"Tables are A="}
        <code>
          {"[p0,p2,p4]"}
        </code>
        {", B="}
        <code>
          {"[p0,p3,p4]"}
        </code>
        {", C="}
        <code>
          {"[p1,p4]"}
        </code>
        {". Every physical page occupies 2048 bytes, and no other pages are retained. Find logical-reference bytes and actual physical payload."}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" take the union before multiplying."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" there are eight logical references, representing 16384 bytes if counted separately. Their union has five physical pages, so actual payload is 10240 bytes, or 10 KiB. Page 4 has three owners and page 0 has two. This excludes metadata and any additional backing allocation; it is not process memory usage."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"9. Fork a partial page"}
      </H3>


      <Prose>
        {"A size 4 page contains "}
        <code>
          {"[5,6,7,_]"}
        </code>
        {". Two branches append 8 and 9. Each branch also refers to three earlier complete pages shared by both. Show correct storage, count physical pages versus logical references, and diagnose a faulty shared in-place append."}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" distinguish immutable full pages from a writable tail."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" make independent physical tail copies, producing "}
          <code>
            {"[5,6,7,8]"}
          </code>
          {" and "}
          <code>
            {"[5,6,7,9]"}
          </code>
          {"; preceding full pages can remain shared. With one writable tail, the later append replaces the earlier branch's fourth position, so at least one branch reads the wrong state. The three earlier shared pages plus two private tails occupy five physical pages, while the two four-entry request tables contain eight logical references. Correct allocation and per-branch ownership must precede the writes."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"10. Defeat a forced collision"}
      </H3>


      <Prose>
        {"A teaching hash returns zero for every input. In namespace N, prefixes "}
        <code>
          {"[1,3,5,7]"}
        </code>
        {" and "}
        <code>
          {"[2,4,5,7]"}
        </code>
        {" use two-token pages. A bucket compares only current block "}
        <code>
          {"[5,7]"}
        </code>
        {" and parent digest 0. Diagnose and repair it."}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" a collided parent digest is not an exact parent identity."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" both checked pieces agree even though the causal prefixes differ, so this comparator falsely accepts. Compare the namespace and complete effective prefix, or use an equivalent collision-safe interned parent identity. "}
          <code>
            {"ExactIndex"}
          </code>
          {" in the supplied example refuses the second prefix after indexing the first. Changing trust namespace must also refuse reuse even if the token tuples match. A cryptographic hash's low collision probability and the comparator's exact-equality guarantee are different statements."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"11. Use the right denominator"}
      </H3>


      <Prose>
        {"Three prompts have lengths 6, 10, 14 and reuse 0, 8, 4 rows. Find request hit rate, reused-token fraction and new query count. After pressure removes the first block of the third prompt, a later block remains resident. May lookup skip ahead?"}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" a request hit is a boolean; token work uses a weighted denominator."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" two of three requests hit. Reuse totals 12 of 30 rows, or 40%; 18 new query rows remain. If the first block is absent, lookup for that prompt begins with a miss and returns zero reusable rows. The later resident descendant does not supply its missing ancestor's K/V. The original 40% describes the original three observations, not the changed pressured state."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"12. Keep numerical evidence bounded"}
      </H3>


      <Prose>
        {"Two FP64 cached-tail branches match all reference logits within a declared 2e−9 tolerance, and both have equal top-1 IDs. Does that establish bitwise equality, shared storage or a speedup? What missing observation would establish physical sharing?"}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" numerical, storage and timing claims need different evidence."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" it supports tolerance and top-1 agreement for those cases. Bitwise equality needs an exact element comparison. A copied cache can pass all numerical comparisons while occupying independent arrays. Physical sharing requires common backing addresses together with correct ownership and lifetime; a gathered output tensor is not necessarily the backing. Speed requires a controlled timed comparison. None follows merely from the word “cache.”"}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"13. Split a radix edge"}
      </H3>


      <Prose>
        {"Insert "}
        <code>
          {"[3,1,4,1]"}
        </code>
        {", "}
        <code>
          {"[3,1,5]"}
        </code>
        {", then "}
        <code>
          {"[3,1,4,2]"}
        </code>
        {". Draw the compressed edges. Pin the final request's path. Which other leaf can be evicted safely?"}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" split at each first mismatch and protect the ancestors of a live endpoint."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" root edge "}
          <code>
            {"[3,1]"}
          </code>
          {" has children "}
          <code>
            {"[5]"}
          </code>
          {" and "}
          <code>
            {"[4]"}
          </code>
          {"; the latter has leaves "}
          <code>
            {"[1]"}
          </code>
          {" and "}
          <code>
            {"[2]"}
          </code>
          {". Protect "}
          <code>
            {"[3,1]→[4]→[2]"}
          </code>
          {". Either unpinned leaf "}
          <code>
            {"[5]"}
          </code>
          {" or "}
          <code>
            {"[1]"}
          </code>
          {" is eligible, subject to eviction policy. The parent "}
          <code>
            {"[4]"}
          </code>
          {" cannot be removed while the live "}
          <code>
            {"[2]"}
          </code>
          {" branch depends on it. Splitting an existing pinned edge transfers its protection to the new intermediate parent."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"14. Price affinity's wait"}
      </H3>


      <Prose>
        {"Warm service is 5 ms. Cold wait is 3 ms and cold service 12 ms. Choose for warm waits 7, 10, 13 ms, ignoring network and transfer time."}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" use the same arrival-to-finish clock."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" warm finish times are 12, 15, 18 ms; cold is 15 ms. Choose warm, tie, cold. The warm-wait threshold is 10 ms. The arithmetic uses supplied estimates and does not measure either worker. A cache-affinity rule that always selects the warm worker loses on the last case."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"15. Respect expiry and integer saving"}
      </H3>


      <Prose>
        {"A named resource created at 0 expires at 90 seconds, with exclusive expiry. Which calls at 89 and 90 may use it? Separately, a write path adds 3 units over normal processing, each later hit saves 0.6 units and total storage costs 0.6 units. Find the first non-more-expensive and first strictly cheaper hit counts."}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" compare "}
          <InlineMath>
            {"0.6n"}
          </InlineMath>
          {" with the fixed 3.6 units of overhead."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" the 89-second request is eligible subject to the API contract; at 90 the resource is expired. For cost, six hits recover exactly 3.6 and tie; seven strictly save. "}
          <code>
            {"practice.py"}
          </code>
          {" represents these charges as total write 4, normal 1, hit 0.4 and storage 0.6, which has the same 3.6 fixed overhead and 0.6 per-hit benefit. If per-hit saving is nonpositive and fixed overhead positive, no number of additional hits breaks even."}
        </Prose>

      </details>

    </section>

    <section 
      className="pc-practice" 
      data-lesson-exercise
    >

      <H3>
        {"16. Protect reuse under pressure"}
      </H3>


      <Prose>
        {"A pool holds three full pages of two tokens each. This exercise's pool stores "}
        <strong>
          {"only retained full prefixes"}
        </strong>
        {": the final one-token query's temporary K/V lives outside this three-page budget. At t=0, complete and release A="}
        <code>
          {"[1,2,3,4,9]"}
        </code>
        {", retaining x="}
        <code>
          {"[1,2]"}
        </code>
        {" and y="}
        <code>
          {"[3,4]"}
        </code>
        {", where y depends on x. At t=1, B="}
        <code>
          {"[1,2,7,8,10]"}
        </code>
        {" acquires x, fills z="}
        <code>
          {"[7,8]"}
        </code>
        {", then releases x and z. At t=2, C="}
        <code>
          {"[1,2,3,4,11]"}
        </code>
        {" arrives. Compare matching-first admission with a buggy policy that preallocates unnecessarily and evicts x before lookup. Count C's reusable rows and attention pairs."}
      </Prose>

      <details>

        <summary>Hint</summary>

        <Prose>
          {" list the three physical contents before C and recall that a retained descendant cannot bypass a missing ancestor."}
        </Prose>

      </details>

      <details>

        <summary>Worked solution</summary>

        <Prose>
          {" after A, x and y are retained and one page is free. B reuses x and uses the free page for z. After B, x,y,z are retained; no eviction was needed. Correct C protects x and y and needs no new full prefix page, so it reuses four rows. Its one final query reads five positions: five pairs."}
        </Prose>


        <Prose>
          {"The buggy preallocation evicts x even though no new prefix allocation was needed. C cannot start with y alone, so it reuses zero rows and computes all five queries, giving "}
          <InlineMath>
            {"T(5)=15"}
          </InlineMath>
          {" pairs. The content of y may remain identifiable, but the missing first block prevents prefix reuse. This comparison concerns the stated prefix-only pool; a full-request allocator must also budget the transient query and any decode growth. Preserve exact parent identities, active ownership and atomic refusal before comparing policies by work or measured latency."}
        </Prose>


        <Program file="practice.py" />


        <Prose>
          {""}
          <code>
            {"answers"}
          </code>
          {" combines independent arithmetic with finite ownership traces. "}
          <code>
            {"PrefixOnlyPool"}
          </code>
          {" is confined to task 16 and removes the ordinary final-block restriction only because it receives complete retained prefix IDs, not whole request prompts. "}
          <code>
            {"capstone"}
          </code>
          {" records both correct matching-first and explicitly buggy ancestor-eviction states. This subclass is not a replacement for the full-request store used earlier."}
        </Prose>

      </details>

    </section>

  </section>

  <section 
    className="lesson-ending lesson-ending--resources" 
    data-lesson-ending="further-learning"
  >

    <H2>
      {"15. Further learning"}
    </H2>


    <ul>

      <li>
        {""}
        <a href={"https://mlsysbook.ai/vol1/model_serving/model_serving.html"}>
          {"Machine Learning Systems: Model Serving"}
        </a>
        {" and "}
        <a href={"https://mlsysbook.ai/vol2/inference/inference.html"}>
          {"the inference chapter"}
        </a>
        {" connect shared-prefix state with memory and system costs. Read the serving/KV/prefix sections for a wider explanation of why avoided arithmetic and real latency differ; their illustrative hardware values are not this lesson's measurements."}
      </li>

      <li>
        {""}
        <a href={"https://llmsystem.github.io/llmsystem2025spring/assets/files/llmsys-22-vLLM_woosuk_kwon-1f34697dbb1a1fb5b798daf6eff14b67.pdf"}>
          {"CMU LLM Systems: vLLM lecture slides"}
        </a>
        {" connect repeated prompt content, dependent block hashes and computed-token offsets. The selected slide text complements the page-table diagrams here. No video viewing or reproduced slide-image claim is made."}
      </li>

      <li>
        {""}
        <a href={"https://arxiv.org/html/2312.07104v2"}>
          {"SGLang's paper, section 3 and appendix scheduler discussion"}
        </a>
        {" gives the original radix-cache/scheduling mechanism and fixed-tree DFS argument. Compare its assumptions with the small "}
        <code>
          {"order_work"}
        </code>
        {" model before applying the bound to online traffic."}
      </li>

      <li>
        {""}
        <a href={"https://docs.vllm.ai/en/latest/design/prefix_caching/"}>
          {"vLLM's prefix-caching design"}
        </a>
        {" describes current identity fields, complete blocks, pool lifecycle and duplication choices. Use it to compare the exact finite teaching allocator with a maintained engine, rather than assuming every engine deduplicates or hashes identically."}
      </li>

    </ul>


  </section>

  <section 
    className="lesson-ending lesson-ending--resources" 
    data-lesson-ending="references"
  >

    <span 
      id="10-primary-sources" 
      aria-hidden="true" 
    />

    <H2>
      {"16. Technical references and runnable files"}
    </H2>

    <Prose>Complete orchestration and prerequisite files:</Prose>

    <ul>

      <li>

        <a 
          href="/learn-code/prefix-caching/prefix_study.py" 
          download
        >prefix_study.py</a>

      </li>

      <li>

        <a 
          href="/learn-code/prefix-caching/observations.py" 
          download
        >observations.py</a>

      </li>

      <li>

        <a 
          href="/learn-code/prefix-caching/tiny_causal_lm.py" 
          download
        >tiny_causal_lm.py</a>

      </li>

      <li>

        <a 
          href="/learn-code/prefix-caching/cached_decoder.py" 
          download
        >cached_decoder.py</a>

      </li>

      <li>

        <a 
          href="/learn-code/prefix-caching/native_cache.py" 
          download
        >native_cache.py</a>

      </li>

      <li>

        <a 
          href="/learn-code/prefix-caching/acquire_model.py" 
          download
        >acquire_model.py</a>

      </li>

    </ul>


    <Prose>
      {"The complete bundle includes all twelve subject programs, "}
      <code>
        {"prefix_study.py"}
      </code>
      {", "}
      <code>
        {"observations.py"}
      </code>
      {", the four unchanged prerequisite programs, pinned requirements, model identity, attributed Alice input, fixed token-ID protocol and saved JSON observations. The stage runner checks "}
      <code>
        {"source-manifest.json"}
      </code>
      {", requires earlier stages with the same identity and creates a new stage directory. "}
      <code>
        {"observations.py"}
      </code>
      {" saves completed operands/results before assertions. These helpers explain the reproducible boundary without changing the numerical mechanism."}
    </Prose>


    <Prose>
      {"The four prerequisite files are "}
      <code>
        {"tiny_causal_lm.py"}
      </code>
      {", "}
      <code>
        {"cached_decoder.py"}
      </code>
      {", "}
      <code>
        {"native_cache.py"}
      </code>
      {" and "}
      <code>
        {"acquire_model.py"}
      </code>
      {". Only their required classes, loader, direct-forward, payload and file-acquisition interfaces are reused here; their older training, timing and verification mains were not rerun. The saved local sequence consists of finite checks, eight TinyLM forwards, ten Pythia forwards and the supplied-tensor allocator lifecycle, each once. All stages passed. No optimizer, autoregressive generation, timed workload, GPU execution or provider request is included."}
    </Prose>


    <Prose>
      {"Use the file index to download individual complete sources or the full archive. Inspect "}
      <code>
        {"saved-results/finite/result.json"}
      </code>
      {", "}
      <code>
        {"saved-results/tiny/result.json"}
      </code>
      {", "}
      <code>
        {"saved-results/native/result.json"}
      </code>
      {" and "}
      <code>
        {"saved-results/allocator/result.json"}
      </code>
      {" before deciding whether you need a new run. Binary tensor journals were retained locally for the recorded experiment; the lightweight downloadable result summaries bind their source identities and report the actual outcomes."}
    </Prose>


    <ul>

      <li>
        {""}
        <a href={"https://arxiv.org/abs/2312.07104"}>
          {"Zheng et al., SGLang"}
        </a>
        {", version 2: compressed radix prefixes, state sharing and cache-aware scheduling; system benchmark claims remain those of the paper."}
      </li>

      <li>
        {""}
        <a href={"https://arxiv.org/abs/2309.06180"}>
          {"Kwon et al., PagedAttention"}
        </a>
        {": paged logical/physical cache management and sharing. The earlier Continuous Batching lesson owns the detailed mechanism and accepted prerequisite source."}
      </li>

      <li>
        {""}
        <a href={"https://docs.vllm.ai/en/latest/design/prefix_caching/"}>
          {"vLLM APC design"}
        </a>
        {": maintained full-block identity, namespaces, free queue and lifecycle. Its current implementation is distinct from this lesson's exact-prefix tuple index."}
      </li>

      <li>
        {""}
        <a href={"https://github.com/huggingface/transformers/tree/v5.19.0/src/transformers/generation/continuous_batching/cache_allocators"}>
          {"Transformers 5.19.0 source"}
        </a>
        {": the pinned "}
        <code>
          {"FullAttentionCacheAllocator"}
        </code>
        {", "}
        <code>
          {"CachePool"}
        </code>
        {" and ledger interfaces used for the supplied K/V fixture. The ordinary model example uses "}
        <code>
          {"DynamicCache"}
        </code>
        {" and direct forwards."}
      </li>

      <li>
        {""}
        <a href={"https://platform.claude.com/docs/en/build-with-claude/prompt-caching"}>
          {"Claude caching"}
        </a>
        {", "}
        <a href={"https://developers.openai.com/api/docs/guides/prompt-caching"}>
          {"OpenAI caching"}
        </a>
        {", "}
        <a href={"https://ai.google.dev/gemini-api/docs/generate-content/caching"}>
          {"Gemini generateContent caching"}
        </a>
        {", and "}
        <a href={"https://github.com/googleapis/python-genai/blob/main/google/genai/caches.py"}>
          {"Google SDK cache source"}
        </a>
        {": current source-checked request/lifetime/usage contracts, with optional examples unexecuted remotely."}
      </li>

      <li>
        {""}
        <a href={"https://arxiv.org/html/2609.28870v1"}>
          {"When Fancy Eviction Fails"}
        </a>
        {", selected sections 3.1 and 4.1–4.3: a recent preprint perspective on session-bounded reuse and eviction. Our illustrative comparison is generated by "}
        <code>
          {"prefix_workload.py"}
        </code>
        {", not copied from its measured data."}
      </li>

      <li>
        {""}
        <a href={"https://arxiv.org/html/2603.10726v1"}>
          {"CacheSolidarity"}
        </a>
        {", selected sections 3.1–3.2: owner/flag isolation as a research mechanism under stated conditions. No attack or defense experiment is reproduced here."}
      </li>

    </ul>


  </section>

  <section 
    className="lesson-ending lesson-ending--resources" 
    data-lesson-ending="readiness"
  >

    <H2>
      {"17. Ready to continue"}
    </H2>


    <Prose>
      {"You should now be able to point to the old K/V rows a new query reads, explain why a changed earlier token invalidates later cached states, and separate a compatible prefix from a resident hit. Given two request tables, count the physical union, track owners through cancellation, and refuse an admission without corrupting protected hits. Given a suffix comparison, identify what its numerical tolerance, storage pointers and timing evidence do or do not establish."}
    </Prose>


    <Prose>
      {"For an unfamiliar cache, ask for its exact identity, matching boundary, mutation and release contract before trusting a hit-rate number. For a remote API, inspect reported usage and lifetime instead of projecting a local allocator onto its billing model. "}
      <a href={"/learn/path/full-curriculum/inference-cost-economics-compute-scaling?module=large-language-models"}>
        {"Inference Cost Economics"}
      </a>
      {" broadens the cost model; "}
      <a href={"/learn/path/full-curriculum/inference-engines-serving?module=large-language-models"}>
        {"Inference Engines & Serving"}
      </a>
      {" brings these state and scheduling contracts into a complete serving stack."}
    </Prose>

  </section>
</div>;
}
export default {
  title: 'Prefix Caching & Prompt Caching',
  slug: 'prefix-caching-prompt-caching',
  readTime: '~75 min read + 75 min practice',
  content: PrefixCachingLesson
};
