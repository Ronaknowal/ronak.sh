// Generated from accepted immutable content by scripts/render-kv-cache-lesson.mjs.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock as SharedMathBlock } from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { Table as NeuralTable } from '../../components/lesson-labs/KvCacheShared.jsx';
import { KvTokenLoop, KvCausalCone, KvLayerStores, KvAttentionRead, KvAppend, KvOffsetMask, KvPoisonedCapacity, KvPadding, KvDecoder } from '../../components/lesson-labs/KvCacheFoundations.jsx';
import { KvNativeCache, KvWork, KvTimings, KvPayloadFactors, KvAllocation, KvDeviceBudget, KvGroupedHeads, KvInvalidation, KvPositionMove, KvRetention } from '../../components/lesson-labs/KvCacheMemory.jsx';
import { KvPages, KvSharedPrefix, KvPacking, KvPrecision, KvOffload, KvLatent, KvDiagnosis } from '../../components/lesson-labs/KvCacheStorage.jsx';
import '../../components/lesson-labs/lesson-flow.css';

const MathBlock = ({ children }) => (
  <div className="kv-equation" role="region" tabIndex={0} aria-label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </div>
);
const Program = ({ file }) => (
  <RemoteCodeBlock source={'/learn-code/kv-cache/' + file} language="python" title={file} filename={file} />
);
function KvCacheLesson() {
  return <div className="lesson-flow kv-flow">
    <section>
    <Prose>{
      "A decoder has just read a prompt and selected its next token. To select another, must it run " +
      "the entire prompt through every layer again? A cache lets it keep specific intermediate " +
      "numbers. The useful question is which numbers remain valid, how a new token reads them, and " +
      "when their storage becomes the limit."
    }</Prose>
    
    <Prose opening="route">{
      "We will follow one attention read by hand, extend a complete decoder with cached inference, " +
      "and use the ordinary Transformers cache APIs on real tokenized text. Then we will account " +
      "for memory, move records through a small block pool, pack low-bit values, and inspect the " +
      "algebra behind a latent cache. A smaller amount of arithmetic does not guarantee a faster " +
      "call: the CPU experiment keeps the observed timings and numerical disagreements visible."
    }</Prose>
    
    <Prose opening="prerequisites">{"The "}<a href={
      "/learn/path/full-curriculum/causal-language-modeling-next-token-prediction?module=large-language-models"
    }>{"causal language-modeling lesson"}</a>{" supplies the decoder we extend. The "}<a href={
      "/learn/path/full-curriculum/grouped-query-attention-gqa-multi-query-attention-mqa?module=large-language-models"
    }>{"grouped-query attention lesson"}</a>{
      " supplies the projected attention operator and its preallocated cache. We refresh their " +
      "inputs before using them. For a first pass, read sections 1–10, then 14 and the core " +
      "practices. Sections 11–13 are visible deeper branches on paging, precision and latent state; " +
      "the core path already explains logical positions, physical storage and validity."
    }</Prose>
    
    <span id="1-why-it-exists" aria-hidden="true" />
    <H2>{"1. Follow the token that has actually been processed"}</H2>
    
    <Prose>{"Imagine a vocabulary with whole-word entries "}<code>{"the"}</code>{", "}<code>{"cat"}</code>{", "}<code>{"sat"}</code>{" and "}<code>{"down"}</code>{
      ". These are illustrative token IDs; the real tokenizer later uses different pieces. The " +
      "prompt contains three IDs at positions 0, 1 and 2. Its final output row contains "
    }<strong>{"logits"}</strong>{", one unnormalized score for every vocabulary item. Choosing "}<code>{"down"}</code>{" from those scores produces an ID at position 3."}</Prose>
    
    <KvTokenLoop />
    
    <Prose>{"At this instant, the decoder has processed "}<code>{"the cat sat"}</code>{". It has "}<strong>{"not"}</strong>{" processed "}<code>{"down"}</code>{
      ". The selected ID becomes an input to the next call, which creates its intermediate states " +
      "and produces scores for position 4. Selection and processing are separate events. This " +
      "distinction prevents a common off-by-one error in cache lengths and memory estimates."
    }</Prose>
    
    <Prose>{"Processing the known prompt together is called "}<strong>{"prefill"}</strong>{". Processing new inputs while generating a continuation is usually called "}<strong>{"decode"}</strong>{
      ". With a prompt of length P and G selected output IDs, stopping immediately after the G-th " +
      "selection has processed P + G − 1 IDs. The last selected ID has not been fed back. For P = 3 " +
      "and G = 2, prefill selects "
    }<code>{"down"}</code>{"; one more call processes "}<code>{"down"}</code>{" and selects a fifth-position ID. Four positions have cache records."}</Prose>
    
    <Prose>{
      "A cache stores intermediate results of processing; it is not the output text or the model's " +
      "learned weights. Text IDs still matter because they determine whether a stored intermediate " +
      "result belongs to the current request."
    }</Prose>
    
    <span id="2-core-intuition" aria-hidden="true" />
    <H2>{"2. Prove why the old rows can stay"}</H2>
    
    <Prose>{
      "Each attention layer makes three projections of a row's hidden state. A query, Q, determines " +
      "what the current row asks for. A key, K, participates in matching that query to an earlier " +
      "row. A value, V, supplies the information mixed into the result. These descriptions name " +
      "numerical roles; the coordinates do not come with human-readable meanings such as “noun” or " +
      "“tense.”"
    }</Prose>
    
    <KvCausalCone />
    
    <Prose>{
      "Why can we keep an old key and value? Start at position i in the first layer. Its input " +
      "embedding and positional information are unchanged when a future token is appended. Causal " +
      "attention permits it to read only positions at or before i. Those inputs are unchanged too. " +
      "The attention output, residual addition, row-wise normalization and row-wise feed-forward " +
      "network therefore produce the same output at i."
    }</Prose>
    
    <Prose>{
      "Now apply the same argument to the next layer. Its old input rows are unchanged because the " +
      "preceding layer preserved them. Its causal attention reads that same old prefix, so its old " +
      "output rows are unchanged. Induction over layers establishes "
    }<strong>{"prefix invariance"}</strong>{": appending future inputs does not change the mathematical outputs at existing positions."}</Prose>
    
    <Prose>{
      "The conditions are part of the proof. Keep the model weights, earlier token IDs, position " +
      "rule and attention permissions fixed. Use evaluation mode so dropout does not independently " +
      "discard different coordinates on two calls. An operation that mixes all sequence positions, " +
      "or bidirectional attention that lets an old row read the appended token, breaks this " +
      "argument. An edit to an earlier ID breaks the “same old inputs” step. Floating-point " +
      "execution can also produce small differences between mathematically equivalent computations " +
      "with different shapes; we will measure those separately from semantic correctness."
    }</Prose>
    
    <KvLayerStores />
    
    <Prose>{"There is consequently "}<strong>{"one K/V cache per layer"}</strong>{
      ". Layer 2's keys come from layer 2's input states; they are not copies of layer 1's keys. " +
      "Each layer appends its own projected K and V for the new rows. Old queries are unnecessary: " +
      "their attention reads are finished, and future rows bring their own queries. The cache also " +
      "does not need to retain every old feed-forward activation merely to continue inference."
    }</Prose>
    
    <Prose>{
      "This is why “save the embeddings” is not a complete cache implementation. Embeddings begin " +
      "the computation. The reusable records are the layer-specific projected keys and values, " +
      "together with enough state to interpret their positions and validity."
    }</Prose>
    
    <span id="3-mathematical-foundation" aria-hidden="true" />
    <H2>{"3. Read three records, then append one"}</H2>
    
    <Prose>{
      "Let us inspect a single head with two key coordinates and two value coordinates. The example " +
      "is constructed for arithmetic, not extracted from trained text embeddings. Its current query " +
      "and three stored records are"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "q=\\sqrt2[\\ln2,0],\\quad\n" +
      "K=\\begin{bmatrix}1&0\\\\0&1\\\\1&1\\end{bmatrix},\\quad\n" +
      "V=\\begin{bmatrix}2&0\\\\0&2\\\\1&1\\end{bmatrix}."
    }</MathBlock>
    </div>
    
    <KvAttentionRead />
    
    <Prose>{"Scaled dot-product attention first computes one score for each key:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"s=\\frac{qK^\\mathsf T}{\\sqrt{d_k}}=[\\ln2,0,\\ln2],\\qquad d_k=2."}</MathBlock>
    </div>
    
    <Prose>{
      "Here dₖ is the number of coordinates in each key and query. Exponentiating these scores " +
      "gives [2, 1, 2]. Dividing by their sum gives attention weights [2/5, 1/5, 2/5]. This " +
      "normalization is softmax. The weights specify a weighted sum of "
    }<strong>{"value rows"}</strong>{", not a sum of keys:"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"o=\\tfrac25[2,0]+\\tfrac15[0,2]+\\tfrac25[1,1]\n=[\\tfrac65,\\tfrac45]."}</MathBlock>
    </div>
    
    <Prose>{
      "Now a fourth input arrives. This constructed example gives it the same query as above, but a " +
      "new key [−1, 0] and value [−1, 1]. Keeping the query fixed lets us isolate what the newly " +
      "visible record changes."
    }</Prose>
    
    <KvAppend />
    
    <Prose>{
      "The new key's score is −ln 2, whose exponential is 1/2. The four unnormalized weights [2, 1, " +
      "2, 1/2] sum to 11/2, giving [4/11, 2/11, 4/11, 1/11]. The output is now"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"o'=\\tfrac4{11}[2,0]+\\tfrac2{11}[0,2]\n+\\tfrac4{11}[1,1]+\\tfrac1{11}[-1,1]\n=[1,\\tfrac9{11}]."}</MathBlock>
    </div>
    
    <Prose>{"The old key and value "}<strong>{"coordinates"}</strong>{" stayed fixed. Their "}<strong>{"attention weights"}</strong>{
      " did not: the new record changed the softmax denominator. A KV cache does not cache old " +
      "attention probabilities for reuse with a new query. Each new read still scores its query " +
      "against all permitted stored keys and mixes their values."
    }</Prose>
    
    <Prose>{
      "The new query can also differ from the previous one, as it normally does in a language " +
      "model. Changing it changes the scores even if every cached record is unchanged. The trace " +
      "separates these two causes: new query coordinates and newly available records."
    }</Prose>
    
    <span id="6-visual-walkthrough" aria-hidden="true" />
    <H2>{"4. Make the mask agree with the cache offset"}</H2>
    
    <Prose>{
      "The causal rule is simple when written in logical positions: a key is allowed when its " +
      "position is no later than the query's position. After P old positions, a chunk of T new rows " +
      "has query positions P, P + 1, …, P + T − 1. With S occupied key positions, the mask is a " +
      "T-by-S array. It is not usually a square triangle."
    }</Prose>
    
    <KvOffsetMask />
    
    <Prose>{
      "For P = 3 and T = 2, the queries are at positions 3 and 4. With capacity C = 7, the full " +
      "permission grid, where 1 means allowed, is"
    }</Prose>
    
    <CodeBlock language={"text"}>{"key position       0 1 2 3 4 5 6\nquery position 3   1 1 1 1 0 0 0\nquery position 4   1 1 1 1 1 0 0"}</CodeBlock>
    
    <Prose>{
      "Columns 5 and 6 are unused storage. Row 3 must also exclude the later input at position 4, " +
      "even though the chunk computes both rows in one call. A useful general expression is"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"M_{ij}=\\text{valid}_j\\;\\land\\;(p^{\\text{key}}_j\\le p^{\\text{query}}_i)."}</MathBlock>
    </div>
    
    <Prose>{
      "The subscripts i and j locate rows in the current query and stored-key arrays. Their logical " +
      "positions p need not equal those array indices."
    }</Prose>
    
    <Prose>{"PyTorch 2.14's "}<code>{"scaled_dot_product_attention"}</code>{" treats a Boolean "}<code>{"attn_mask=True"}</code>{" cell as permitted. Its non-square "}<code>{"is_causal=True"}</code>{
      " mask uses an upper-left alignment. With one query and four keys, that particular alignment " +
      "permits only the first key. It would return [2, 0] in our four-record example, instead of " +
      "[1, 9/11]. Supplying the explicit position mask makes the intended operation unambiguous. Do " +
      "not generalize this Boolean convention to every attention API; check the function being " +
      "called."
    }</Prose>
    
    <KvPoisonedCapacity />
    
    <Prose>{
      "A fixed-capacity allocation can contain stale or uninitialized numbers outside the occupied " +
      "prefix. Correctness comes from excluding them, not from assuming they are zeros. Our checks " +
      "deliberately fill unused keys with 123 and unused values with −77. An incorrect read becomes " +
      "visible immediately. Reset can set the occupied length to zero without clearing every " +
      "backing byte, provided no read treats those bytes as valid records."
    }</Prose>
    
    <KvPadding />
    
    <Prose>{
      "Padding adds a second condition. For two left-pad slots followed by three real IDs, physical " +
      "slots are 0 through 4, but valid logical positions can be 0, 1, 2 in slots 2, 3, 4. A mask " +
      "rejects the pad keys, and explicit "
    }<code>{"position_ids"}</code>{
      " give the real tokens their intended positions. Padding and causality solve different " +
      "problems: “this is not a token” versus “this token is still in the future.”"
    }</Prose>
    
    <H3>{"Run the projected trace"}</H3>
    
    <Prose>{
      "Download the complete file bundle from this lesson's file index and extract it into one " +
      "directory. The finite programs use Python 3.12, NumPy 2.3.5 and PyTorch 2.14.0; these are " +
      "the tested versions. In a fresh virtual environment:"
    }</Prose>
    
    <CodeBlock language={"sh"}>{"python -m venv .venv"}</CodeBlock>
    
    <Prose>{"Activate it with "}<code>{".venv\\Scripts\\Activate.ps1"}</code>{" in PowerShell, or "}<code>{"source .venv/bin/activate"}</code>{" in a POSIX shell, then install and run:"}</Prose>
    
    <CodeBlock language={"sh"}>{"python -m pip install numpy==2.3.5 torch==2.14.0\npython cache_trace.py\npython cached_decoder.py"}</CodeBlock>
    
    <Prose>{
      "The README lists each file, the native model setup and separate commands. These two commands " +
      "do not download data or train a model. Keep the supplied "
    }<code>{"grouped_attention_cache.py"}</code>{" and "}<code>{"tiny_causal_lm.py"}</code>{
      " beside the new programs so their imports resolve. The latter contains the prerequisite's " +
      "training entry point, but this lesson imports its "
    }<code>{"TinyLM"}</code>{" class and does not run that entry point."}</Prose>
    
    <Prose>
    <a href="/learn-code/kv-cache/kv-cache-programs.zip" download>Download the complete program bundle</a>{' · '}<a href="/learn-code/kv-cache/README.md">Setup and file guide</a>
    </Prose>
    <Program file="cache_trace.py" />
    
    <Prose>{""}<code>{"cache_trace.py"}</code>{" makes the projections concrete. Each hidden row has six constructed coordinates, "}<code>{"[qx, qy, kx, ky, vx, vy]"}</code>{
      ". Three six-by-two selection matrices extract the three roles. This deliberately simple " +
      "projection lets us inspect the whole path without pretending that hand-chosen vectors are " +
      "learned embeddings. It appends the first three K/V rows, reads them, appends the fourth, and " +
      "checks the fractions derived above."
    }</Prose>
    
    <Prose>{"The ordinary PyTorch call receives those same Q, K and V arrays, the explicit position mask, and "}<code>{"dropout_p=0"}</code>{
      ". Its result matches the NumPy read. The program also executes the incorrect upper-left " +
      "alternative, so the [2, 0] counterexample is a computed result rather than a warning " +
      "inferred from an API name."
    }</Prose>
    
    <Program file="grouped_attention_cache.py" />
    
    <Prose>{"This full prerequisite program owns the vectorized attention operation. Its query shape is "}<code>{"[B, Hq, T, dk]"}</code>{": batch, query heads, new rows and key coordinates. Keys have "}<code>{"[B, Hkv, S, dk]"}</code>{"; values have "}<code>{"[B, Hkv, S, dv]"}</code>{
      ", where dv is the value width. The grouped layout maps multiple query heads to each compact " +
      "K/V head without requiring a full repeated K/V copy for the NumPy calculation. "
    }<code>{"ProjectedKVCache.append"}</code>{" validates capacity before a write; "}<code>{"read"}</code>{
      " applies logical positions and key validity. The trace uses one batch and one head to keep " +
      "the arithmetic visible."
    }</Prose>
    
    <Prose>{
      "With four occupied rows, one head, two K coordinates, two V coordinates and eight-byte " +
      "float64 elements, the trace holds 128 occupied payload bytes. Capacity six reserves 192 " +
      "bytes. Neither count includes the arrays for logical positions and validity or Python object " +
      "overhead. This distinction will become more consequential when we count a whole decoder."
    }</Prose>
    
    <span id="4-from-scratch-implementation" aria-hidden="true" />
    <H2>{"5. Cache every layer of a complete decoder"}</H2>
    
    <Prose>{
      "The small projected trace establishes the attention rule. A real decoder must also preserve " +
      "the computation around attention. We now extend the exact "
    }<code>{"TinyLM"}</code>{
      " class from the causal language-modeling lesson. It has learned token and position " +
      "embeddings, pre-normalized attention and feed-forward blocks, and a final vocabulary head. " +
      "It is intentionally small enough to inspect."
    }</Prose>
    
    <KvDecoder />
    
    <Prose>{"Suppose the cache already holds P rows. The new chunk's input is"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"X_0=E_{\\text{token}}[\\text{ids}]+E_{\\text{position}}[P:P+T]."}</MathBlock>
    </div>
    
    <Prose>{
      "The position offset matters. Reusing position embeddings 0 through T − 1 on every call would " +
      "change the model. Within a block, normalize the new hidden rows, project Q/K/V, append only " +
      "the new K/V, and read the occupied cache with the offset mask. Merge the head outputs, apply " +
      "the existing output projection, and add the residual. Apply the existing second " +
      "normalization and feed-forward network, with its residual, before moving to the next block."
    }</Prose>
    
    <Prose>{
      "We reuse the model's modules directly; there is no second set of randomly initialized " +
      "weights to confuse the comparison. The only new persistent state is a pair of tensors per " +
      "layer and an occupied length. The adapter reserves capacity once, writes slices in place, " +
      "and reads up to the current end. Growing the prefix therefore avoids repeatedly " +
      "concatenating every old K/V row in this reference implementation."
    }</Prose>
    
    <Program file="tiny_causal_lm.py" />
    
    <Prose>{
      "The complete prerequisite source is included so that the adapter's imports and full " +
      "reference are inspectable. Its ordinary full forward recomputes all rows. Its separate " +
      "text-training and cropping-generation routines are not invoked here. Cropping a prefix and " +
      "restarting its learned absolute positions would be a changed computation, not an exact " +
      "extension of our current cache."
    }</Prose>
    
    <Program file="cached_decoder.py" />
    
    <Prose>{""}<code>{"CachedDecoder.__call__"}</code>{" validates the incoming IDs and capacity before touching any layer. "}<code>{"begin"}</code>{" is the old occupied length; "}<code>{"end = begin + chunk_length"}</code>{". Every layer writes "}<code>{"[begin:end]"}</code>{" into its own key/value store. The attention score matrix has T query rows and "}<code>{"end"}</code>{
      " key columns. Broadcasting the same position mask across batch and heads does not merge " +
      "their numerical data."
    }</Prose>
    
    <Prose>{
      "Only after all layers and the output head finish does the adapter commit the new occupied " +
      "length. The documented atomic failure is the checked capacity error: a too-large chunk is " +
      "rejected before a single layer is modified. This does not promise transactional recovery " +
      "from an arbitrary device failure in the middle of a forward pass; discard or reset the state " +
      "after such a failure."
    }</Prose>
    
    <Prose>{
      "The executed comparison uses two sequences, eight IDs each, three layers, four heads and " +
      "width 16 in float64, a 64-bit floating-point representation. A full eight-row call, eight " +
      "one-row calls, chunks [3, 2, 3], and chunks [2, 5, 1] all match the same full-model logits. " +
      "The largest absolute difference is 5.55 × 10⁻¹⁶. Occupied payload is 12,288 bytes; capacity " +
      "ten reserves 15,360 bytes. These are random fixed weights for a computation check, not a " +
      "trained text-quality demonstration."
    }</Prose>
    
    <Prose>{
      "The test then tries to append three more rows into capacity ten. It verifies that the length " +
      "and all cache tensors are unchanged. Finally it resets, edits an earlier token, and checks " +
      "the new full-prefix result. A valid cache belongs to one specific history; resetting is the " +
      "simple correct answer when that history changes. Later we will identify which prefix can be " +
      "retained safely."
    }</Prose>
    
    <Prose>{
      "This adapter accepts equal-length, unpadded batches and stays within the learned position " +
      "table. The projected operator already exposed padding's mask semantics; the next ordinary " +
      "library example executes a padded native case as well. Neither route requires running a " +
      "training loop to demonstrate cached inference."
    }</Prose>
    
    <span id="5-production-implementation" aria-hidden="true" />
    <H2>{"6. Drive an ordinary library cache on real text"}</H2>
    
    <Prose>{
      "We now change from a small fixed random decoder to the public Pythia-14M checkpoint. Its six " +
      "layers use four attention heads, hidden width 128 and partial rotary positional encoding. " +
      "Each head has 32 key and 32 value coordinates. Unlike TinyLM's learned position lookup, " +
      "Pythia rotates part of its Q/K coordinates according to position. The invariant is still " +
      "“same IDs, weights, positions and permissions,” but the positional computation differs."
    }</Prose>
    
    <KvNativeCache />
    
    <Prose>{
      "The text is the supplied public-domain Alice passage already used in the " +
      "causal-language-modeling example. Its provenance file records the source and text hash. Here " +
      "it is only an inference workload. We do not fit Pythia, estimate held-out quality, or assume " +
      "the passage was absent from its pretraining data. Tokenization uses no added special tokens " +
      "and saves the first 104 IDs before the comparison. Prompt lengths 8, 32 and 96 leave eight " +
      "observed continuation IDs available from the same saved sequence."
    }</Prose>
    
    <Prose>{"Add the tested native dependencies and acquire the pinned model:"}</Prose>
    
    <CodeBlock language={"sh"}>{
      "python -m pip install transformers==5.19.0 tokenizers==0.23.2 huggingface-hub==1.33.0 " +
      "safetensors==0.8.0\n" +
      "python acquire_model.py --output model-cache\n" +
      "python native_cache.py --model model-cache"
    }</CodeBlock>
    
    <Program file="acquire_model.py" />
    
    <Prose>{"The acquisition program reads "}<code>{"model-source-report.json"}</code>{", which names revision "}<code>{"cf967c0a9a04383db6f7b1108d86b2962634b4ac"}</code>{
      " and the exact hashes of six files. It verifies existing files and downloads missing ones " +
      "explicitly. The forward program loads from that directory with "
    }<code>{"local_files_only=True"}</code>{
      "; it does not silently substitute another checkpoint when a file is missing. The weights " +
      "remain separate from the small lesson bundle."
    }</Prose>
    
    <Program file="native_cache.py" />
    
    <Prose>{"The "}<code>{"forward"}</code>{" helper keeps the important arguments visible. With no cache, "}<code>{"ids"}</code>{" contains the whole prefix and "}<code>{"use_cache=False"}</code>{". With a cache, "}<code>{"ids"}</code>{" contains only new rows, "}<code>{"begin"}</code>{" is their starting offset, and "}<code>{"past_key_values"}</code>{" is the mutable cache object. "}<code>{"position_ids"}</code>{
      " describes the new rows. The attention mask spans the entire key history, including earlier " +
      "rows that are absent from the current "
    }<code>{"ids"}</code>{" tensor. "}<code>{"logits_to_keep=1"}</code>{
      " returns only the last vocabulary-score row for ordinary next-token calls; the finite chunk " +
      "check requests every new row so it can compare all of them."
    }</Prose>
    
    <Prose>{""}<code>{"DynamicCache(config=model.config)"}</code>{" grows its tensors as rows arrive. "}<code>{"StaticCache(config=model.config, max_cache_len=capacity)"}</code>{
      " reserves a fixed sequence capacity, with tensor allocation initialized when needed. Static " +
      "storage still changes on every append. Its stable capacity can help shape- sensitive " +
      "execution strategies, but the eager CPU example neither compiles the model nor claims a " +
      "compilation speedup."
    }</Prose>
    
    <Prose>{
      "The native model uses FP32, a 32-bit floating-point representation. For twelve processed " +
      "IDs, each dynamic layer has key and value shapes "
    }<code>{"[1, 4, 12, 32]"}</code>{
      ". Across six layers in FP32, occupied and backing payload both equal 73,728 bytes. A static " +
      "capacity of sixteen has shapes "
    }<code>{"[1, 4, 16, 32]"}</code>{
      ", so its backing payload is 98,304 bytes while only 73,728 bytes are occupied. The " +
      "checkpoint's FP32 parameter tensors occupy 56,270,848 bytes. Parameters, cache payload, " +
      "temporary tensors and process memory are different quantities; the program reports the first " +
      "two rather than presenting their sum as measured resident memory."
    }</Prose>
    
    <H3>{"Interpret the numerical result honestly"}</H3>
    
    <Prose>{
      "The first native chunk comparison, [4, 3, 5] versus one twelve-ID forward, failed the " +
      "predeclared FP32 criterion"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"|z_{\\text{cache}}-z_{\\text{full}}|\n\\le 2\\times10^{-4}+2\\times10^{-4}|z_{\\text{full}}|."}</MathBlock>
    </div>
    
    <Prose>{
      "The dynamic maximum absolute difference was 0.002812, with 21,589 of 603,648 logit elements " +
      "outside that criterion. Static's maximum was 0.002238, with 17,206 outside. The tolerance " +
      "was not increased to convert those failures into a pass. The initial attempt stopped before " +
      "timing; the continuation records the original criterion's pass/fail counts explicitly."
    }</Prose>
    
    <Prose>{
      "A bounded diagnostic repeated the same full FP32 call exactly, then promoted the same loaded " +
      "weights to FP64. Full-call replay was identical. In FP64, dynamic and static chunk " +
      "differences fell to approximately 3.82 × 10⁻¹⁴ and 3.91 × 10⁻¹⁴. This supports a " +
      "floating-point explanation for this tested prefix, rather than an offset or causal-mask " +
      "error. It does not prove that every later cache case is correct or that FP32 met the failed " +
      "criterion."
    }</Prose>
    
    <Prose>{
      "For the three study prefixes, all six cached teacher-forced comparisons also failed that " +
      "same tolerance. Their maximum absolute errors ranged from 0.001513 to 0.004725. " +
      "Nevertheless, each tested highest-scoring next-token ID (argmax) matched the full reference, " +
      "and every separately generated eight-ID greedy continuation matched its reference. At prompt " +
      "length 32, all three routes selected "
    }<code>{"[562, 13, 703, 369, 1335, 275, 253, 4766]"}</code>{", decoded as "}<code>{" out, she was still in the middle"}</code>{"."}</Prose>
    
    <Prose>{
      "Equal selected IDs are a weaker observation than equal logit arrays. The highest and " +
      "second-highest scores can be separated by a margin larger than the numerical perturbation. " +
      "If a future pair is nearly tied, that protection can disappear. The saved results retain the " +
      "top-two margins as well as the IDs; the minimum observed greedy margin across these routes " +
      "was about 0.01189. No general guarantee follows from one set of continuations."
    }</Prose>
    
    <Prose>{
      "The native checks also reset the cache and append left-padded inputs. The two padding slots " +
      "are masked and real-token position IDs begin at zero. All tested top choices still agree, " +
      "but the padded FP32 comparisons fail the original logit tolerance too: maximum errors are " +
      "about 0.003287 and 0.003402. These outcomes stay visible alongside the shape and length " +
      "checks. A useful diagnostic distinguishes “the intended state was constructed,” “a specified " +
      "numerical tolerance passed,” and “the observed decoding decisions matched.”"
    }</Prose>
    
    <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
    <H2>{"7. Count saved work, then measure the actual calls"}</H2>
    
    <Prose>{
      "Caching avoids recomputing old projection and feed-forward rows. It does not make reading a " +
      "growing prefix constant-time. Trace a three-token prompt that leads to four selected " +
      "outputs, counting the rows computed by each route."
    }</Prose>
    
    <KvWork />
    
    <Prose>{
      "The full route processes 3 + 4 + 5 + 6 = 18 rows; the cached route processes 3 + 1 + 1 + 1 = " +
      "6. The first rectangle is the same prefill on both routes. Each later cached call adds just " +
      "the previously selected token's row, while full recomputation repeats every earlier row. For " +
      "P prompt tokens and G selected outputs, this pattern gives"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"R_{\\text{full}}=\\sum_{i=0}^{G-1}(P+i)\n=GP+\\frac{G(G-1)}2,\\qquad R_{\\text{cache}}=P+G-1."}</MathBlock>
    </div>
    
    <Prose>{
      "Attention work has another unit: a legal query–key pair. In the drawing, the full causal " +
      "triangles contain 6 + 10 + 15 + 21 = 52 pairs. Cached prefill has the first six; its later " +
      "single-row reads contain four, five and six, for 6 + 4 + 5 + 6 = 21 pairs. Reading the " +
      "growing prefix still costs work. In general a causal prefix of length n contains n(n + 1)/2 " +
      "legal pairs, so"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "A_{\\text{full}}=\\sum_{i=0}^{G-1}\\frac{(P+i)(P+i+1)}2,\n" +
      "\\qquad A_{\\text{cache}}=\\frac{P(P+1)}2+\n" +
      "\\sum_{i=1}^{G-1}(P+i)."
    }</MathBlock>
    </div>
    
    <Prose>{
      "These counts explain which work disappears. They are not floating-point operation (FLOP) " +
      "counts for the entire model: widths, heads, layers and matrix operations still matter. Nor " +
      "does a dense implementation necessarily skip every masked upper-triangle product; “legal " +
      "pairs” is an algorithmic comparison, not a promise about the exact kernel instruction count."
    }</Prose>
    
    <Prose>{
      "For a decode query and S stored positions, attention must still read enough K/V data to form " +
      "scores and the weighted sum. Payload grows linearly with S, and per-step attention reading " +
      "grows with it. Generating a long continuation therefore accumulates more than constant total " +
      "work. Calling cache-based generation simply “O(N)” loses the growing attention read."
    }</Prose>
    
    <Prose>{"At small batch sizes, moving model weights and cache data can matter as much as arithmetic. "}<strong>{"Bandwidth"}</strong>{" is bytes transferred per unit time; "}<strong>{"latency"}</strong>{
      " is elapsed time for a stated operation. An arithmetic reduction can coexist with Python " +
      "overhead, memory allocation, unfavorable matrix shapes or bandwidth limits. The scaling-book " +
      "treatment analyzes those relationships for hardware models; our CPU observations answer a " +
      "narrower local question."
    }</Prose>
    
    <KvTimings />
    
    <Program file="cache_study.py" />
    
    <Prose>{
      "The program first saves a prospective record with source hashes and exact IDs. The run " +
      "checks those identities before loading one FP32 CPU model in evaluation mode, with eager " +
      "attention and two Torch threads. Each arm uses "
    }<code>{"logits_to_keep=1"}</code>{
      ", so the vocabulary head computes one output row per call in all arms. Giving the " +
      "full-prefix arm an unnecessary vocabulary projection for every old row would make the " +
      "comparison unfair."
    }</Prose>
    
    <Prose>{
      "Timing uses the same observed continuation IDs for every arm: prefill followed by seven " +
      "one-ID steps. The greedy comparison is separate because differently selected IDs could " +
      "otherwise change the timed workload. The end-to-end timer includes cache construction, " +
      "prefill and the seven steps; tokenization, downloads, disk writes and printing are outside " +
      "it. Every arm/length has one warmup and five measured repetitions, rotating the arm order " +
      "across repetitions. The saved file includes each prefill and step time, not only aggregate " +
      "ratios."
    }</Prose>
    
    <Prose>{"These are the recorded CPU end-to-end medians and ranges, in milliseconds:"}</Prose>
    
    <NeuralTable caption={"7. Count saved work, then measure the actual calls"} headers={[<>{"Prompt IDs"}</>,<>{"Full recomputation"}</>,<>{"Dynamic cache"}</>,<>{"Static cache"}</>]} rows={[[<>{"8"}</>,<>{"62.248 [49.009, 185.085]"}</>,<>{"49.329 [42.260, 85.987]"}</>,<>{"54.886 [50.384, 71.701]"}</>],[<>{"32"}</>,<>{"56.172 [52.811, 61.486]"}</>,<>{"42.649 [40.483, 50.866]"}</>,<>{"44.626 [42.516, 53.633]"}</>],[<>{"96"}</>,<>{"79.758 [71.136, 90.611]"}</>,<>{"46.642 [44.434, 52.105]"}</>,<>{"48.997 [43.238, 51.431]"}</>]]} />
    
    <Prose>{
      "The machine identified itself as Intel64 Family 6 Model 165 Stepping 2. At length 96 the " +
      "full/dynamic median ratio was 1.710; full/static was 1.628. Both cached medians were lower " +
      "for all three lengths. The broad length-eight range, including a 185.085 ms full call, " +
      "remains in the record. Five repetitions on a shared CPU are not a precise estimate of a " +
      "universal speedup. In particular, the full length-32 median being lower than length eight " +
      "does not establish that longer inputs are intrinsically cheaper."
    }</Prose>
    
    <Prose>{
      "All 45 observations came from one timing campaign after the recorded pre-timing numerical " +
      "failure and its reporting correction. No repeat was discarded to produce the table. The " +
      "result measures this eager CPU setup; it does not estimate GPU serving throughput, compiled " +
      "static-cache behavior, or the performance of a fused attention kernel."
    }</Prose>
    
    <H2>{"8. Count occupied records and reserved space separately"}</H2>
    
    <Prose>{
      "We can now count memory without conflating it with elapsed time. A single stored position in " +
      "one head contains dₖ key coordinates and dᵥ value coordinates. If each coordinate occupies b " +
      "bytes, its payload is b(dₖ + dᵥ). Multiplying by stored heads, layers and positions gives " +
      "the cache payload."
    }</Prose>
    
    <KvPayloadFactors />
    
    <Prose>{"For identical layers and B equal-length requests with S positions each,"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"M_{\\text{KV}}=B\\,S\\,L\\,H_{\\text{kv}}\\,(d_k+d_v)\\,b."}</MathBlock>
    </div>
    
    <Prose>{
      "Here L is layer count and Hₖᵥ is the number of stored K/V heads. If dₖ = dᵥ = d, the " +
      "familiar factor two comes from storing both K and V: 2BSLHₖᵥdb. It is not an extra factor " +
      "for two attention operations. When widths or head counts vary by layer, sum each layer's " +
      "contribution instead of multiplying by one representative layer."
    }</Prose>
    
    <Prose>{
      "Pythia's FP32 example uses L = 6, Hₖᵥ = 4, dₖ = dᵥ = 32 and b = 4, so each occupied token " +
      "contributes 6,144 bytes across all layers. After P = 96 and G = 8 selections, the cache has " +
      "103 processed positions and 632,832 occupied bytes. Static capacity 104 reserves 638,976 " +
      "bytes. The last selected ID explains the one-position gap; it has not yet been fed."
    }</Prose>
    
    <Prose>{
      "For a larger constructed architecture with 80 layers, 8 K/V heads, widths 128, 8,192 " +
      "positions and two-byte elements, one request's payload is 2,684,354,560 bytes. A decimal GB " +
      "is 10⁹ bytes, so that is 2.68435456 GB. A binary GiB is 2³⁰ bytes, so it is exactly 2.5 GiB. " +
      "Use explicit units in capacity calculations; rounding both quantities to “GB” can hide a " +
      "real gap."
    }</Prose>
    
    <KvAllocation />
    
    <Prose>{
      "Serving requests need not have equal lengths. With lengths [3, 5, 8], live payload " +
      "corresponds to sixteen positions. A rectangular allocation with capacity eight per request " +
      "reserves twenty-four. Blocks of four allocate 4 + 8 + 8 = 20 positions, leaving four unused " +
      "cells in last blocks. Paging can reduce wasted reservation while still having last-block " +
      "slack."
    }</Prose>
    
    <Prose>{"For request lengths Sᵣ and block size Cᵦ, the allocated position count is"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"N_{\\text{paged}}=\\sum_r C_b\\left\\lceil\\frac{S_r}{C_b}\\right\\rceil."}</MathBlock>
    </div>
    
    <Prose>{
      "Multiply it by bytes per position to obtain block payload. Block tables, reference counts, " +
      "allocator bookkeeping and alignment are additional storage. A dynamically grown tensor may " +
      "also incur temporary copies during append; its final "
    }<code>{"numel × element_size"}</code>{
      " does not measure its peak allocation. These distinctions explain why payload accounting and " +
      "process-memory measurement answer different questions."
    }</Prose>
    
    <Program file="memory_budget.py" />
    
    <Prose>{
      "The complete program computes live, static and paged payload, then verifies the dimensional " +
      "formula against actual small NumPy arrays. It accepts a separate head/key/value width for " +
      "each layer. "
    }<code>{"allocation"}</code>{
      " reports slot counts as well as bytes, making an incorrect padding assumption easier to " +
      "locate. Changing a request length to a multiple of the block size removes that request's " +
      "final-block slack; it does not make metadata disappear."
    }</Prose>
    
    <span id="7-decision-matrix" aria-hidden="true" />
    <H2>{"9. Ask which device owns each head"}</H2>
    
    <Prose>{
      "A global cache total does not automatically belong on one accelerator. A deployment may " +
      "shard heads across devices or replicate some state. The right budget follows the actual " +
      "ownership of each layer's K/V heads."
    }</Prose>
    
    <KvDeviceBudget />
    
    <Prose>{
      "If the 80-layer example splits eight K/V heads evenly over two devices, each owns four heads " +
      "and holds 1,342,177,280 bytes per request. Their sum is the earlier 2.5 GiB. But a single " +
      "shared K/V head can be replicated on both devices so that each device's query heads can read " +
      "it. Dividing its global one-copy payload by two would then undercount both devices. A " +
      "parallelism name alone does not determine the cache layout."
    }</Prose>
    
    <Prose>{""}<code>{"per_device"}</code>{
      " therefore takes explicit owned-head counts rather than silently dividing by the number of " +
      "devices. Under a simplified fixed-shape budget, the maximum number of equal-size resident " +
      "requests is bounded by"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "B_{\\max}=\\left\\lfloor\n" +
      "\\frac{M_{\\text{device}}-M_{\\text{weights}}-M_{\\text{workspace}}-M_{\\text{reserve}}}\n" +
      "{M_{\\text{KV per request on device}}}\\right\\rfloor,"
    }</MathBlock>
    </div>
    
    <Prose>{
      "provided the numerator is nonnegative. A negative remainder means the proposed non-cache " +
      "allocations already exceed the budget. Workspace may change with batch and sequence shape, " +
      "so a fixed-workspace calculation is a stated model, not a guarantee that the resulting batch " +
      "fits at runtime."
    }</Prose>
    
    <KvGroupedHeads />
    
    <Prose>{
      "Grouped-query attention reduces the number of stored K/V heads relative to query heads. With " +
      "four query heads, ordinary multi-head attention might store four K/V heads, GQA two, and " +
      "multi-query attention one. Their output can still contain four query-head results because " +
      "each query reads its assigned stored head. The grouping changes the representation and " +
      "weights; unrelated four-head and one-head models do not become output-equivalent merely " +
      "because their output shapes match."
    }</Prose>
    
    <Prose>{
      "The GQA paper studies conversion by pooling K/V parameters and further training. That is an " +
      "architecture/adaptation decision with measured quality tradeoffs, not a cache allocator " +
      "option that can be switched freely on an unchanged trained MHA model. Conversely, exact " +
      "storage reuse of a model's existing K/V does not itself intentionally change its attention " +
      "architecture. The prerequisite grouped-attention program supplies the compact numerical " +
      "operator; here the ownership counts show why that choice affects serving memory."
    }</Prose>
    
    <H2>{"10. Preserve meaning when records move or history changes"}</H2>
    
    <Prose>{
      "Memory management moves bytes. Model semantics depend on what those bytes represent. A cache " +
      "record belongs to a particular model, prefix, layer and logical position. Its current " +
      "address is only a storage location."
    }</Prose>
    
    <KvInvalidation />
    
    <Prose>{
      "If token j changes, positions before j still have the same causal inputs. Position j and its " +
      "suffix may change, including later tokens whose IDs happen to be unchanged. At a later " +
      "layer, a repeated token's hidden state includes attention to the edited history. “Same token " +
      "spelling” is therefore not a sufficient cache key. The conservative simple implementation " +
      "resets everything; an implementation that retains the prefix must truncate every layer " +
      "consistently at j and recompute from there."
    }</Prose>
    
    <Prose>{
      "Changing weights or adapters can invalidate the entire cache. Changing a position convention " +
      "or mask rule can do the same. A reusable prefix needs agreement on all inputs that affect " +
      "its computation, not only a text substring. The later prefix-caching lesson develops lookup, " +
      "sharing and lifetime policy for many requests; this section establishes the validity rule " +
      "those policies must respect."
    }</Prose>
    
    <KvPositionMove />
    
    <Prose>{"Consider a two-coordinate rotary example. Let"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"R(\\theta)=\\begin{bmatrix}\\cos\\theta&-\\sin\\theta\\\\\n\\sin\\theta&\\cos\\theta\\end{bmatrix}."}</MathBlock>
    </div>
    
    <Prose>{
      "Rotating the base vector [1, 0] by pθ represents position p in this simplified pair. A query " +
      "at position 3 and key at position 1 have dot product cos((3 − 1)θ). At θ = π/6 this is 1/2. " +
      "Moving that already rotated key from one physical slot to another, while preserving its " +
      "logical identity and permissions, leaves the dot product unchanged. Reinterpreting it as a " +
      "key at position 0 would instead give cos(3θ) = 0."
    }</Prose>
    
    <Prose>{
      "The physical slot can therefore change without changing the position. Some implementations " +
      "store already rotated keys; others organize rotation differently. The rule is to preserve " +
      "the intended function, not to assume that every cache buffer has the same representation. " +
      "Pythia's native path stores keys after its rotary operation."
    }</Prose>
    
    <KvRetention />
    
    <Prose>{
      "What about dropping old records? For full attention, deleting a permitted old key/value " +
      "changes the available scores and usually the output. A cache cannot make that exact merely " +
      "by reusing the same allocation. For an architecture whose attention is genuinely restricted " +
      "to a sliding window, a row outside all future dependencies can be discarded under that " +
      "architecture's position and mask rules. The window restriction, rather than the memory " +
      "allocator, provides the justification."
    }</Prose>
    
    <Prose>{
      "StreamingLLM studies another route: keeping initial attention-sink tokens alongside a recent " +
      "window to alter long-stream inference. Its proposed cache-relative position handling is part " +
      "of that algorithm, not the ordinary “move the same record” operation above. It does not " +
      "restore arbitrary recall of discarded content or establish equality with full-history " +
      "attention. Distinguish an exact cache for a local model from an approximate retention policy " +
      "for a full-attention model before deciding what an eviction can mean."
    }</Prose>
    
    <H2>{"11. Deeper: give a sequence a block table"}</H2>
    
    <Prose>{
      "An exact cache need not be contiguous in physical memory. Divide its logical sequence into " +
      "blocks of Cᵦ positions and keep a table that maps each logical block to a physical block. " +
      "Reading the sequence follows the table, preserving logical order even when the physical " +
      "blocks are scattered."
    }</Prose>
    
    <KvPages />
    
    <Prose>{"For logical position p,"}</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\text{logical block}=\\lfloor p/C_b\\rfloor,\n\\qquad \\text{offset}=p\\bmod C_b."}</MathBlock>
    </div>
    
    <Prose>{
      "At p = 9 with blocks of four, the logical block is 2 and the offset is 1. If table entry 2 " +
      "contains physical block 7, the address is physical block 7, offset 1. Nothing here changes " +
      "the token's logical position from 9 to 1 or 7."
    }</Prose>
    
    <Prose>{
      "A pool can give a request another block when its current tail fills. Releasing a request " +
      "returns its blocks to the free list; their stale contents are no longer reachable through " +
      "that request's table. A newly allocated block must receive valid writes before those cells " +
      "are read. The table and occupied length, rather than cleared memory, define the request's " +
      "live records."
    }</Prose>
    
    <Program file="paged_storage.py" />
    
    <Prose>{""}<code>{"PagedStorage"}</code>{
      " holds a fixed NumPy pool and a list of free block IDs. Appending computes the number of " +
      "additional blocks before mutating any state. If the free list is too short, it raises an " +
      "error with the existing sequence intact. Otherwise it pops blocks, computes vectorized " +
      "physical addresses, and writes the new rows. "
    }<code>{"gather"}</code>{
      " follows the same address translation to return the logical sequence for comparison with a " +
      "contiguous reference."
    }</Prose>
    
    <Prose>{
      "The demonstration starts with three blocks of four records. Request A writes five records " +
      "into physical blocks 0 and 1. B writes four into block 2. A can still append three records " +
      "in its partially used block 1. Its ninth record requires a third block, so that append fails " +
      "while B is live. Releasing B returns block 2, after which A can append its ninth record at " +
      "address (2, 0). The program verifies the returned sequence and the failed append's unchanged " +
      "state."
    }</Prose>
    
    <Prose>{
      "Gathering materializes a new contiguous array and therefore costs a copy. PagedAttention's " +
      "systems contribution includes attention kernels that follow the block organization during " +
      "attention, rather than requiring this teaching gather on every read. The later " +
      "continuous-batching/PagedAttention lesson develops those request and execution concerns. A " +
      "finite allocator demonstrates addressing and lifetime; it does not establish GPU kernel " +
      "throughput."
    }</Prose>
    
    <KvSharedPrefix />
    
    <Prose>{
      "Two requests with the same valid prefix could copy its blocks or share them read-only. " +
      "Sharing saves duplicate payload until their histories diverge. Appending into a shared " +
      "partially filled last block requires ownership rules: one request must not overwrite bytes " +
      "another still expects. Reference counts, copy-on-write and reusable-prefix lookup are " +
      "developed in the later prefix- caching lesson. Our allocator deliberately owns each " +
      "request's blocks exclusively, so its "
    }<code>{"release"}</code>{" can return them without a shared-reference check."}</Prose>
    
    <H2>{"12. Deeper: store fewer bits or move state to another tier"}</H2>
    
    <Prose>{
      "So far each cache coordinate has used a floating-point element. Quantization stores a " +
      "coarser code plus information for reconstructing an approximate value. It changes numerical " +
      "values deliberately, unlike an exact move of an existing record to a different address."
    }</Prose>
    
    <KvPacking />
    
    <Prose>{
      "For one nonconstant group x, take offset m = min(x), maximum M and bᵩ code bits. There are " +
      "2ᵇᵩ possible codes, so a simple affine scale is"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{
      "s=\\frac{M-m}{2^{b_q}-1},\\quad\n" +
      "c_i=\\operatorname{clip}\\left(\\operatorname{round}\\frac{x_i-m}{s},0,2^{b_q}-1\\right),\n" +
      "\\quad \\widehat x_i=m+s c_i."
    }</MathBlock>
    </div>
    
    <Prose>{
      "The scale is the step between reconstruction levels. The offset locates the lowest level. " +
      "For a constant group, the program stores scale zero and code zero; reconstruction returns " +
      "its offset without dividing by zero. Values in the programs are finite, moderate-range " +
      "arrays, with metadata stored in FP32."
    }</Prose>
    
    <Prose>{"A four-bit code can represent integers 0 through 15, but placing it in an "}<code>{"int32"}</code>{
      " array still uses four bytes per element. Real storage reduction requires packing. Our " +
      "program places the first code in a byte's low nibble and the second in its high nibble:"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"\\text{byte}=c_{2j}\\;|\\;(c_{2j+1}\\ll4)."}</MathBlock>
    </div>
    
    <Prose>{
      "Thus codes [0, 15, 7, 8, 3] become uint8 bytes [240, 135, 3], where each uint8 element is " +
      "one unsigned eight-bit integer. Five codes occupy three bytes because the final high nibble " +
      "is unused. One FP32 scale and one FP32 offset add eight bytes, bringing this tiny group's " +
      "total to eleven. The original five FP16 values would occupy ten. Low code precision alone " +
      "did not save space here; group size and metadata matter."
    }</Prose>
    
    <Program file="cache_precision.py" />
    
    <Prose>{""}<code>{"quantize_group"}</code>{" treats each supplied array as one flattened group and preserves its shape for reconstruction. "}<code>{"pack_codes"}</code>{" and "}<code>{"unpack_codes"}</code>{
      " operate on actual uint8 buffers. The supplied checks cover every four-bit and eight-bit " +
      "code, odd lengths, constants and changed groups. The ordinary NumPy bitwise operations are " +
      "the implementation of packing, rather than a library call that only pretends to store a " +
      "smaller dtype."
    }</Prose>
    
    <Prose>{
      "A practical cache quantizer must choose grouping axes and a policy for newly arriving " +
      "records. KIVI motivates asymmetric treatment: key channels and value tokens have different " +
      "distributions and useful grouping patterns, with a full-precision residual region for recent " +
      "state. Our one-group example is a packing/error reference, not an implementation of KIVI's " +
      "grouping or fused execution. The byte counter therefore shows packed groups, FP32 metadata " +
      "and a separate full-precision residual explicitly. One example has six packed bytes, sixteen " +
      "metadata bytes and eight residual bytes: thirty payload and metadata bytes before any " +
      "index/shape bookkeeping."
    }</Prose>
    
    <KvPrecision />
    
    <Prose>{
      "Quantizing K and V affects different parts of the read. K error changes qKᵀ, which changes " +
      "softmax weights. V error changes the vectors those weights mix. For fixed q = [0.7, −0.4] " +
      "and the program's three two-coordinate rows, the original output is approximately [0.010215, " +
      "0.501301]. Quantizing only K gives [0.007990, 0.501776]; only V gives [0.026956, 0.507035]; " +
      "both give [0.024619, 0.507590]. The combined error need not equal the sum of the two " +
      "individual absolute errors because the weighted computation changes jointly. PyTorch SDPA on " +
      "the same reconstructed arrays checks this NumPy attention path."
    }</Prose>
    
    <Prose>{
      "If all value rows are the same vector, changing normalized attention weights cannot change " +
      "their weighted sum. That is a useful null case for K perturbations. At the other extreme, a " +
      "close downstream decision boundary can turn a small coordinate error into a different " +
      "choice. The constructed group [0, 0.49, 1] reconstructs to approximately [0, 0.466667, 1] at " +
      "four bits. Root-mean-square error (RMSE) averages the squared coordinate errors and then " +
      "takes the square root. Here it is only 0.01347, yet a threshold of 0.48 changes the middle " +
      "coordinate's decision. This is a sensitivity witness, not a measured language-model quality " +
      "result. Task quality requires an appropriate task evaluation, not just reconstruction error " +
      "or cache compression ratio."
    }</Prose>
    
    <KvOffload />
    
    <Prose>{"Another way to reduce device-resident state is "}<strong>{"offloading"}</strong>{
      ": keep some cache on host memory and transfer the layer state needed for computation. If a " +
      "step must transfer M bytes over a link with effective bandwidth β bytes per second, M/β is " +
      "the idealized transfer time before fixed latency and other overhead. With D seconds of " +
      "compute and no overlap, the two contributions add: approximately D + M/β. With ideal " +
      "overlap, a lower model is max(D, M/β), but dependencies, prefetch timing and memory capacity " +
      "can prevent that overlap. State clearly whether M counts one direction or both; “send then " +
      "return” can move twice a one-way payload."
    }</Prose>
    
    <Prose>{
      "Transformers' documented offloaded cache routes coordinate per-layer movement and " +
      "prefetching, while quantized-cache routes require compatible backends and configuration. " +
      "These are useful extensions once the local cache contracts are understood. This lesson's " +
      "executed native route is CPU dynamic/static caching; we did not run GPU offload, measure " +
      "PCIe bandwidth, or test a fused quantized backend. Consult the versioned cache documentation " +
      "before choosing those options for a particular model/device. Their implementation and " +
      "hardware requirements cannot be inferred from a cache class name alone."
    }</Prose>
    
    <H2>{"13. Deeper: cache a latent description and absorb projections"}</H2>
    
    <Prose>{
      "Reducing coordinate precision keeps the same basic state at lower resolution. A different " +
      "architecture can instead create a smaller shared state from which keys and values are " +
      "derived. Call that state C, a matrix with one row per cached token and d꜀ latent " +
      "coordinates. In a content-only linear example,"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"K=CU_K,\\qquad V=CU_V."}</MathBlock>
    </div>
    
    <KvLatent />
    
    <Prose>{
      "Take C of shape 2-by-2, Uₖ of shape 2-by-3, Uᵥ of shape 2-by-2 and a query q of shape " +
      "1-by-3. Expanding K gives two three-coordinate key rows; expanding V gives two " +
      "two-coordinate value rows. But associativity lets us rearrange the content score:"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"qK^\\mathsf T=q(CU_K)^\\mathsf T\n=(qU_K^\\mathsf T)C^\\mathsf T."}</MathBlock>
    </div>
    
    <Prose>{"The "}<strong>{"absorbed query"}</strong>{
      " qUₖᵀ has two latent coordinates. It reads C directly, without storing all expanded key " +
      "rows. If a is the one-by-two attention-weight row, the output can likewise be computed as"
    }</Prose>
    
    <div className="neural-equation">
    <MathBlock>{"aV=a(CU_V)=(aC)U_V."}</MathBlock>
    </div>
    
    <Prose>{
      "The mix aC occurs in latent coordinates and is projected once afterward. These equalities " +
      "concern the linear content path; the same score scaling and softmax must be used on both " +
      "routes. The program deliberately uses unscaled content scores for its tiny arithmetic " +
      "comparison, using the same score scale on both paths."
    }</Prose>
    
    <Program file="latent_cache.py" />
    
    <Prose>{
      "With C = [[1, 2], [−1, 1]], Uₖ = [[1, 0, 2], [0, 1, −1]], Uᵥ = [[1, 2], [3, −1]] and q = [2, " +
      "−1, 0.5], the expanded keys are [[1, 2, 0], [−1, 1, −3]]. Both routes produce scores [0, " +
      "−4.5]. The absorbed query is [3, −1.5]. Softmax gives approximately [0.989013, 0.010987], " +
      "and both outputs are [6.945065, −0.032961]. The code compares the two complete matrix paths."
    }</Prose>
    
    <Prose>{
      "Position-dependent rotation complicates absorption. In general, projecting then rotating " +
      "does not equal rotating then projecting. For row x and projection U, "
    }<code>{"(x @ U) @ R.T"}</code>{" and "}<code>{"(x @ R.T) @ U"}</code>{
      " can differ. With x = [1, 2], U = [[2, 1], [0, 1]] and a π/3 rotation, the program obtains " +
      "[−1.598076, 3.232051] versus [−2.464102, 0.633975]. At rotation zero, the identity matrix " +
      "removes that difference. Moving a rotation through an arbitrary learned projection therefore " +
      "requires a justification; it is not ordinary reassociation."
    }</Prose>
    
    <Prose>{
      "DeepSeek-V2's multi-head latent attention, MLA, separates a content compression path from a " +
      "rotary positional-key branch. Its cache accounting includes both latent coordinates and the " +
      "retained rotary-key coordinates. For the paper's example d꜀ = 512 and dᴿ = 64, that is 576 " +
      "elements per token per layer, not just 512. Across L layers at b bytes per element the " +
      "corresponding term is L(d꜀ + dᴿ)b per token. These are architecture-specific state " +
      "dimensions; our small program verifies the algebra and the need to treat position " +
      "separately, not DeepSeek's training quality or optimized inference performance."
    }</Prose>
    
    <span id="9-failure-modes-and-gotchas" aria-hidden="true" />
    <H2>{"14. Diagnose the first disagreement before optimizing"}</H2>
    
    <Prose>{
      "Return to the four-record example. The NumPy cache returns [1, 9/11], but an SDPA call " +
      "returns [2, 0]. Which change is justified? Increasing the cache capacity, switching " +
      "precision or buying more memory would not repair this case. Inspect the permitted key cells " +
      "first: the one-query upper-left mask allows only key zero. Replacing it with the " +
      "logical-position mask restores the intended weighted sum."
    }</Prose>
    
    <KvDiagnosis />
    
    <Prose>{
      "For a complete model, compare the same weights, IDs, evaluation state and positions before " +
      "interpreting logit differences. Inspect each layer's cache length and shape, then a short " +
      "chunk schedule. Poison unused storage to expose an accidental read; reset after a changed " +
      "prefix. A numerical disagreement under a fixed tolerance is evidence to investigate, not a " +
      "reason to redefine the tolerance until it passes. Our Pythia case shows why both " +
      "higher-precision diagnosis and discrete decoding results can help explain that evidence " +
      "while leaving the original failure intact."
    }</Prose>
    
    <Prose>{
      "Once the function is understood, count the state actually owned by each device, including " +
      "capacity slack and the distinction between payload and metadata. Then measure matching " +
      "workloads and keep the slow runs too. Correctness, capacity and speed ask different " +
      "questions; a convincing cache comparison supplies evidence for each one it claims."
    }</Prose>
    
    <Prose>{"The next lesson on "}<a href={
      "/learn/path/full-curriculum/decoding-strategies-greedy-beam-top-k-top-p-temperature?module=large-language-models"
    }>{"decoding strategies"}</a>{
      " starts from these vocabulary logits: greedy selection, sampling and constraints decide " +
      "which ID is fed next. "
    }<a href={"/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models"}>{"Continuous batching"}</a>{" will coordinate many live requests with different lengths, and "}<a href={"/learn/path/full-curriculum/prefix-caching-prompt-caching?module=large-language-models"}>{"prefix caching"}</a>{
      " will decide when separate requests can share already valid state. Their policies rely on " +
      "the same distinction established here: the logical computation must remain identifiable even " +
      "when the physical execution and storage arrangement change."
    }</Prose>
    </section>
    <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
    <span id="11-self-check-exercises" aria-hidden="true" />
    <H2>{"Practice"}</H2>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"A. Count selected IDs and processed IDs"}</H3>
    
    <Prose>{
      "A prompt has four IDs. You select three more, stopping immediately after the third " +
      "selection. List the input lengths of the emitting calls and the final cache length. Does the " +
      "final selected ID have a K/V row?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " Prefill already emits the first selected ID. Only subsequent selections require feeding a " +
      "previously selected ID."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The logical prefix lengths are 4, 5 and 6. Full recomputation would feed those whole " +
      "prefixes; cached execution feeds chunks of 4, 1 and 1. The final cache has six processed " +
      "positions, 0 through 5. The output sequence contains seven IDs, but its last ID at position " +
      "6 has not been fed. Counting all seven as cached would include an intermediate state that " +
      "does not exist."
    }</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"B. Keep only a causally valid prefix"}</H3>
    
    <Prose>{
      "A two-layer decoder has cached five IDs. Change the ID at position 1 while leaving positions " +
      "0, 2, 3 and 4 unchanged. Which cached positions can remain? Why is an identical ID at " +
      "position 4 insufficient to reuse its old state?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Follow the dependency cone at each layer, not just the embedding lookup."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Position 0 remains valid in every layer. Recompute positions 1 through 4. The changed " +
      "position affects its own projections and can affect later attention reads. At later layers, " +
      "position 4's input state contains information from the changed earlier context even though " +
      "its token ID is unchanged. Truncate all layer caches consistently at length one, or use the " +
      "simpler reset-and-recompute route. Keeping layer 1 truncated while leaving layer 2's stale " +
      "suffix available would not implement that correction."
    }</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"C. Repair a chunk mask"}</H3>
    
    <Prose>{
      "There are P = 2 old positions, T = 3 new rows and capacity C = 7. Write the three-by-seven " +
      "permission grid and explain what an upper-left triangle gets wrong."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " The new query positions are 2, 3 and 4. Two capacity columns remain unoccupied even after " +
      "the append."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <CodeBlock language={"text"}>{"       key 0 1 2 3 4 5 6\nquery 2    1 1 1 0 0 0 0\nquery 3    1 1 1 1 0 0 0\nquery 4    1 1 1 1 1 0 0"}</CodeBlock>
    
    <Prose>{
      "The upper-left triangle would allow one, two and three keys rather than three, four and " +
      "five. Construct "
    }<code>{"key_positions <= query_positions[:, None]"}</code>{
      ", then combine it with occupied/padding validity. For these contiguous positions, the causal " +
      "comparison already excludes slots 5 and 6, but explicit validity is still needed when " +
      "physical slots and logical IDs differ or padding occurs."
    }</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"D. Reject an append before mutation"}</H3>
    
    <Prose>{
      "A decoder cache has capacity six and length five. Append a two-row chunk. Implement the " +
      "expected error and show what must remain unchanged. Then reset and reuse the same allocation " +
      "for a two-row prompt."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Capacity validation belongs before the first layer write."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" Compute "}<code>{"end = 5 + 2"}</code>{". Because seven exceeds six, raise before writing "}<code>{"[5:7]"}</code>{
      " in any layer or updating the occupied length. Save each K/V tensor and length before the " +
      "call and compare them after the caught error. "
    }<code>{"CachedDecoder.__call__"}</code>{" contains this ordering. "}<code>{"reset()"}</code>{" sets length zero; the next two-row call writes "}<code>{"[0:2]"}</code>{
      ", uses positions [0, 1], and reads only those two rows. Stale bytes in slots 2–5 are " +
      "excluded. The supplied verification uses the analogous changed case length eight, capacity " +
      "ten, append three."
    }</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"E. Control a native chunk schedule"}</H3>
    
    <Prose>{
      "Use the first thirteen saved Alice IDs. Process twelve as chunks [4, 3, 5], then append the " +
      "thirteenth. Compare every real output row with the corresponding full thirteen-ID reference. " +
      "Specify the positions, masks, cache shapes and what a failed tolerance means."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" A cached call receives only its new IDs, but its key mask includes the whole occupied prefix. Use "}<code>{"last_only=False"}</code>{" for the row comparison."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The successive query positions are 0–3, 4–6, 7–11 and 12; the key-mask lengths are 4, 7, 12 " +
      "and 13. Dynamic layer K and V shapes after the final append are "
    }<code>{"[1, 4, 13, 32]"}</code>{". Static capacity sixteen keeps "}<code>{"[1, 4, 16, 32]"}</code>{
      " backing shapes while its occupied length is thirteen. The following complete script " +
      "composes the supplied native helper:"
    }</Prose>
    
    <CodeBlock language={"python"}>{"import torch\nfrom native_cache import load_model, make_cache, forward, compare_logits, HERE\n\ntorch.set_num_threads(2)\nmodel, tokenizer = load_model(\"model-cache\")\ntext = (HERE / \"alice-train.txt\").read_text(encoding=\"utf-8\")\nids = tokenizer(text, add_special_tokens=False, return_tensors=\"pt\").input_ids[:, :13]\nreference = forward(model, ids, last_only=False)\nfor kind in (\"dynamic\", \"static\"):\n    cache = make_cache(model, kind, 16)\n    pieces, begin = [], 0\n    for end in (4, 7, 12, 13):\n        pieces.append(forward(model, ids[:, begin:end], begin, cache, last_only=False))\n        begin = end\n    result = torch.cat(pieces, dim=1)\n    print(kind, compare_logits(result, reference), int(cache.get_seq_length()))"}</CodeBlock>
    
    <Prose>{
      "Do not substitute an asserted pass for the printed comparison: this new thirteen-ID " +
      "extension is an independent exercise, not an executed row in the supplied twelve-ID " +
      "diagnostic. Use the unchanged criterion and record its actual result on your machine. " +
      "Shape/position agreement and unchanged argmax are separate checks; neither automatically " +
      "passes a failed logit tolerance."
    }</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"F. Distinguish row work from attention reads"}</H3>
    
    <Prose>{
      "For P = 4 and G = 3, derive full and cached projection-row counts and legal query–key pair " +
      "counts. What happens when the same prompt yields only G = 1?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " The first output is selected from prefill. Later calls process prefixes of lengths five and " +
      "six, or only their new row with a cache."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Full rows are 4 + 5 + 6 = 15; cached rows are 4 + 1 + 1 = 6. Full legal pairs are 10 + 15 + " +
      "21 = 46; cached pairs are 10 + 5 + 6 = 21. For G = 1 both routes compute four rows and ten " +
      "legal pairs. No later computation can yet be reused. Cache allocation can still cost " +
      "something, so these work counts alone do not predict elapsed time."
    }</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"G. Count ragged payload and device ownership"}</H3>
    
    <Prose>{
      "Use four layers, two K/V heads, key and value widths eight, two-byte elements, request " +
      "lengths [5, 9] and blocks of four. Compute live and paged payload. Compare two-way head " +
      "sharding with full replication on two devices."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" First count bytes per occupied token across all layers."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Each token uses 4 × 2 × (8 + 8) × 2 = 256 bytes. Fourteen live tokens use 3,584 bytes. The " +
      "two requests reserve 8 and 12 block slots, so paged payload is 20 × 256 = 5,120 bytes, " +
      "including 1,536 bytes of slack. With one of the two heads owned on each device, each stores " +
      "1,792 live bytes and 2,560 paged bytes. With both heads replicated on each device, each " +
      "stores the full 3,584/5,120 bytes and the physical sum across devices doubles. Metadata and " +
      "other model/workspace allocations are additional."
    }</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"H. Move a record without changing its position"}</H3>
    
    <Prose>{
      "An already rotated key at logical position 7 moves from physical slot 7 to slot 0. Explain " +
      "when the attention result stays unchanged. Would discarding all earlier keys be equally " +
      "harmless?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" A physical address is not an instruction to rerotate the key."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Preserve the same key/value numbers, their logical identity and the mask's permissions, and " +
      "update the address mapping. The dot products and weighted sum then see the same records in " +
      "logical order. Reassigning the key to logical position 0 changes the intended " +
      "relative-position computation. Dropping other keys also changes a full-attention read unless " +
      "those keys were already outside its architectural dependency. An exact local-window eviction " +
      "and an approximate full-attention retention policy therefore need different justifications."
    }</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"I. Trace a full block pool"}</H3>
    
    <Prose>{
      "A four-block pool uses three records per block. Starting empty, append four records to A, " +
      "three to B and three to C, allocating the lowest free block first. Append two more to A, " +
      "then try one more. Explain the failure and show what changes after releasing B while C " +
      "remains live."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " A's second block initially has two unused slots. Releasing B must not invalidate C even " +
      "though A later reuses B's physical block."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " A's table is [0, 1], B's [2] and C's [3]. A's two new records fill block 1, reaching six " +
      "occupied records. The seventh needs another block; the free list is empty, so append fails " +
      "with A's length/table/data unchanged. Releasing B makes block 2 free. The retry extends A to " +
      "[0, 1, 2] and writes at physical (2, 0). A occupies seven of its nine allocated slots. C's " +
      "table [3] and three stored records stay intact. This is a changed input for "
    }<code>{"PagedStorage"}</code>{"; the program's original "}<code>{"demonstrate()"}</code>{" uses different lengths."}</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"J. Check whether four-bit storage actually saves bytes"}</H3>
    
    <Prose>{
      "Pack codes [2, 12, 5, 9, 1, 14, 6] with the low-nibble-first convention. Include one FP32 " +
      "scale and offset. Compare with seven FP16 values, then explain what removing the final code " +
      "changes."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" Each pair fills one byte; an odd last code still needs a full byte."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " The bytes are 2 + 16 × 12 = 194, 5 + 16 × 9 = 149, 1 + 16 × 14 = 225, and 6. Four payload " +
      "bytes plus eight metadata bytes total twelve, versus fourteen for seven FP16 values: two " +
      "bytes saved before other metadata. Removing the last code leaves three packed bytes and " +
      "eleven total, versus twelve FP16 bytes, saving one. Group size changes metadata amortization " +
      "as well as which values share a quantization scale."
    }</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"K. Construct a small-error decision change"}</H3>
    
    <Prose>{
      "Quantize [-1, -0.26, 1] as one four-bit affine group. A downstream rule chooses A when the " +
      "middle coordinate exceeds -0.23. Does small RMSE preserve the choice? In a separate " +
      "attention case every V row is [2, -1]; can changing K alone alter the output?"
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{" The offset is -1, scale 2/15, and the middle code rounds from 5.55."}</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " Codes are [0, 6, 15], giving reconstructed values [-1, -0.2, 1] up to floating-point " +
      "rounding. The middle error is +0.06, and RMSE across three coordinates is 0.06/√3 ≈ " +
      "0.034641. The original middle value fails the threshold while the reconstructed value " +
      "passes, so the decision changes. Small average error alone cannot protect a close boundary. " +
      "In the separate attention case, normalized weights sum to one, so the output remains [2, -1] " +
      "for every permitted weight distribution. Neither witness measures language quality; they " +
      "demonstrate two different sensitivity conditions."
    }</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"L. Absorb a projection, then test a rotation"}</H3>
    
    <Prose>{
      "Use C = [[2, -1], [0, 3]], Uₖ = [[1, 0, 2], [0, 1, -1]], Uᵥ = [[1, 2], [3, -1]] and q = [1, " +
      "2, -0.5]. Compute content scores directly and through the absorbed query. For supplied " +
      "attention weights a = [1/4, 3/4], compute aV and (aC)Uᵥ. Separately, take row x = [1, 1], " +
      "projection P = [[2, 0], [0, 1]] and a 90-degree counterclockwise rotation R. Compare (xP)Rᵀ " +
      "with (xRᵀ)P. Do not treat the supplied a as softmax of these scores."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " Associativity changes parentheses without swapping matrix order. For row vectors the " +
      "rotation multiplies by Rᵀ on the right."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{
      " C is 2×2 and Uₖ is 2×3, giving K = [[2, -1, 5], [0, 3, -3]]. The direct 1×2 scores are " +
      "[-2.5, 7.5]. The absorbed query qUₖᵀ = [0, 2.5] gives those same scores against Cᵀ. V = " +
      "[[-1, 5], [9, -3]], so aV = [6.5, -1]. Also aC = [0.5, 2], whose product with Uᵥ is [6.5, " +
      "-1]. For the separate rotation, xP = [2, 1] becomes [-1, 2], whereas xRᵀ = [-1, 1] then " +
      "projects to [-2, 1]. The unequal results show why projection and rotation cannot generally " +
      "commute. An identity rotation would agree but cannot prove the general claim. These changed " +
      "matrices are an algebra exercise, not a rerun of "
    }<code>{"latent_cache.py"}</code>{"'s original fixture."}</Prose>
    </details>
    </section>
    <section className="kv-practice" data-lesson-exercise>
    <H3>{"M. Build a cached-generation diagnostic"}</H3>
    
    <Prose>{
      "Using fixed TinyLM weights, generate five IDs after a four-ID prompt with prefill schedules " +
      "[4], [1, 1, 1, 1] and [1, 3]. Compare with full-prefix greedy generation. Include an " +
      "edited-prefix reset, an over-capacity append, payload accounting and a clearly scoped CPU " +
      "timer. Do not train another model."
    }</Prose>
    <details>
    <summary>Hint</summary>
    <Prose>{
      " Every prefill chunk except the final one creates logits you do not need for selection. " +
      "After selecting the fifth output, stop before feeding it."
    }</Prose>
    </details>
    <details>
    <summary>Worked solution</summary>
    <Prose>{" "}<code>{"generate_cached"}</code>{" in the supplied "}<code>{"cached_decoder.py"}</code>{
      " is a complete implementation. It verifies that the chunk lengths cover the prompt, " +
      "processes them in order, and keeps the final chunk's logits. Each iteration selects the last " +
      "row's argmax, appends that ID to the returned history, and feeds it only when another " +
      "selection remains. It returns generated IDs plus occupied length, payload bytes and a local " +
      "elapsed time. The processed length is eight, while the returned history has nine IDs."
    }</Prose>
    
    <Prose>{"The accompanying "}<code>{"verify()"}</code>{
      " builds one fixed random model, computes the full greedy reference and checks all three " +
      "schedules against it. Its earlier checks also exercise the changed prefix after reset, " +
      "poisoned storage and atomic capacity rejection. Calling "
    }<code>{"python cached_decoder.py"}</code>{
      " runs the complete solution. For a larger capacity, reserved bytes can grow while the " +
      "generated IDs remain unchanged: unused storage is not extra context. The small timer " +
      "includes cache construction and calls on this CPU; use the separately frozen repeated study " +
      "when drawing a timing comparison. No text-quality conclusion follows from a random-weight " +
      "generation check."
    }</Prose>
    </details>
    </section>
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="further-learning">
    <H2>{"Further learning"}</H2>
    
    <ul>
    <li>{""}<a href={"https://jax-ml.github.io/scaling-book/inference/"}>{"The Scaling Book: LLM inference"}</a>{
      " connects prefill/decode, memory traffic and arithmetic intensity to hardware limits. Read " +
      "it after section 7 to understand why operation counts and latency need different models; " +
      "distinguish its hardware assumptions from this CPU run."
    }</li>
    <li>{""}<a href={"https://github.com/stanford-cs336/lectures/blob/main/lecture_10.py"}>{"Stanford CS336 inference lecture source"}</a>{
      " offers another workload-first treatment of inference and cache choices. Its worked " +
      "arithmetic is useful for practising units and bottleneck reasoning."
    }</li>
    <li>{""}<a href={"https://huggingface.co/docs/transformers/v5.19.0/kv_cache"}>{"Transformers 5.19 cache guide"}</a>{
      " is the practical companion for cache implementations, model compatibility, offloading and " +
      "quantized extensions. Use the versioned API contract before adapting the native example to a " +
      "different runtime."
    }</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="references">
    <span id="10-primary-sources" aria-hidden="true" />
    <H2>{"Technical references"}</H2>
    
    <ul>
    <li>{""}<a href={"https://arxiv.org/abs/1911.02150"}>{"Fast Transformer Decoding: One Write-Head is All You Need"}</a>{
      " introduces multi-query attention and analyzes incremental decoding's memory traffic. It " +
      "motivates the stored-head factor in the byte count."
    }</li>
    <li>{""}<a href={"https://arxiv.org/abs/2305.13245"}>{"GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints"}</a>{
      " describes grouped-query attention and checkpoint conversion/uptraining; its reported " +
      "quality tradeoffs are empirical, not guarantees for arbitrary models."
    }</li>
    <li>{""}<a href={"https://arxiv.org/abs/2309.06180"}>{"Efficient Memory Management for Large Language Model Serving with PagedAttention"}</a>{
      " develops block-based cache management and attention execution. The finite pool here " +
      "isolates addressing; the paper covers the serving system around it."
    }</li>
    <li>{""}<a href={"https://arxiv.org/abs/2402.02750"}>{"KIVI: A Tuning-Free Asymmetric 2bit Quantization for KV Cache"}</a>{
      " explains asymmetric grouping and residual storage beyond the simple affine packing example " +
      "used here."
    }</li>
    <li>{""}<a href={"https://arxiv.org/abs/2405.04434"}>{"DeepSeek-V2"}</a>{
      " gives the MLA content/rotary construction and architecture-specific cache dimensions behind " +
      "the latent-state discussion."
    }</li>
    <li>{""}<a href={"https://arxiv.org/abs/2309.17453"}>{"Efficient Streaming Language Models with Attention Sinks"}</a>{
      " studies a changed retention and positional strategy for streaming. Read its assumptions " +
      "before treating a sink/window cache as an exact full-history cache."
    }</li>
    <li>{""}<a href={"https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html"}>{"PyTorch 2.14 SDPA reference"}</a>{
      " specifies mask alignment, Boolean permissions, dropout and numerical execution " +
      "qualifications used in the projected trace."
    }</li>
    <li>{""}<a href={"https://github.com/huggingface/transformers/blob/v5.19.0/src/transformers/cache_utils.py"}>{"Transformers 5.19 cache implementation"}</a>{" and "}<a href={"https://huggingface.co/EleutherAI/pythia-14m/tree/cf967c0a9a04383db6f7b1108d86b2962634b4ac"}>{"Pythia-14M model card"}</a>{" identify the ordinary library state and immutable checkpoint used in the run."}</li>
    </ul>
    
    </section>
    <section className="lesson-ending lesson-ending--resources" data-lesson-ending="readiness">
    <H2>{"Readiness"}</H2>
    
    <Prose>{
      "You are ready to continue when you can distinguish a selected ID from a processed cache row, " +
      "construct a chunk's position mask, explain why every layer has separate K/V, and repair a " +
      "failed continuation without changing the model's intended history. You should also be able " +
      "to count live versus reserved and per-device bytes, and explain what a timing or numerical " +
      "comparison actually establishes. Those skills let the next decoding lesson change the choice " +
      "of token while preserving the computation that produced its scores."
    }</Prose>
    </section>
  </div>;
}
export default {
  title: 'KV-Cache & Memory Management',
  slug: 'kv-cache-memory-management',
  readTime: '~80 min read + 90 min practice', content: KvCacheLesson,
};
