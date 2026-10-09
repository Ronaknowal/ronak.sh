// Static projection of the accepted whole manuscript; no scientific rerun.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import {
  Math as InlineMath,
  MathBlock as SharedMathBlock,
} from '../../components/content/Math.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {
  Local,
  Table,
} from '../../components/lesson-labs/InferenceEngineElements.jsx';
import { EngineFigure } from '../../components/lesson-labs/InferenceEngineFlow.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const MathBlock = ({ children }) => (
  <Local label="Mathematical relationship">
    <SharedMathBlock>{children}</SharedMathBlock>
  </Local>
);
const NeuralTable = ({ headers, rows, caption }) => (
  <Table headers={headers} rows={rows} label={caption} />
);
const Program = ({ file }) => (
  <RemoteCodeBlock
    source={'/learn/examples/inference-engines/' + file}
    filename={file}
    title={file}
    language="python"
  />
);
function EngineLesson() {
  return (
    <div className="lesson-flow engine-flow">
      <Prose>
        {
          'A model can predict the next token without knowing who requested it, how long that request has waited, or whether its client has disconnected. An inference engine supplies that missing organization. It owns unfinished requests, chooses work for the model, manages state between steps and delivers outputs through an interface.'
        }
      </Prose>

      <Prose>
        {
          'We will follow one request across those boundaries, then build a small engine whose decisions are inspectable. Its runner returns declared token IDs so that admission, cancellation and cleanup can be checked exactly. We will also use a real, pinned CPU engine and a small pretrained checkpoint. The two routes answer different questions: the finite engine exposes the ownership rules; the native route exposes actual artifacts, endpoint behavior and stream records.'
        }
      </Prose>

      <Prose opening="prerequisites">
        {
          'You should be able to explain why the first output follows prompt processing, why an output token may not yet have cached keys and values, and why stream events are not necessarily tokens. The '
        }
        <a
          href={
            '/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models'
          }
        >
          {'KV-cache lesson'}
        </a>
        {', '}
        <a
          href={
            '/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models'
          }
        >
          {'continuous batching lesson'}
        </a>
        {' and '}
        <a
          href={
            '/learn/path/full-curriculum/queueing-theory-for-llm-serving?module=large-language-models'
          }
        >
          {'queueing lesson'}
        </a>
        {' develop the underlying mechanisms. We refresh the needed parts here.'}
      </Prose>

      <Prose>
        {
          'For a first pass, follow sections 1–10, 12 and 14–16. Sections 11 and 13 are visible deeper branches about interacting features and fair comparisons; read them before practice tasks 11 and 13 respectively. All other tasks belong to the first pass. The code needs Python 3.12 or later. No GPU is required for the finite examples or the recorded native CPU route.'
        }
      </Prose>

      <span id="1-start-with-the-problem" aria-hidden="true" />
      <span id="1-why-it-exists" aria-hidden="true" />
      <span id="2-build-the-intuition" aria-hidden="true" />
      <span id="2-core-intuition" aria-hidden="true" />
      <H2>{'1. One completion has an owner'}</H2>

      <Prose>
        {
          'Consider a client sending the text “The capital of France is”. There are three separate objects: model files on disk, a process capable of executing the model, and a connection carrying this request. Downloading the files does not start a process. Loading a model inside a Python program does not automatically create an HTTP endpoint.'
        }
      </Prose>

      <EngineFigure id="D01" />

      <Prose>
        {
          'At startup, the process reads model metadata and weights into memory. For each request, an entrypoint parses input and assigns an identity. The engine can then hold that identity while the request waits, runs through several model steps, streams output and finally releases resources. The connection is one delivery path; it is not the owner of every resource by itself.'
        }
      </Prose>

      <Prose>
        {'An '}
        <strong>{'entrypoint'}</strong>
        {' is the interface that accepts a job. A '}
        <strong>{'runner'}</strong>
        {' executes the selected model work. A '}
        <strong>{'scheduler'}</strong>
        {' decides which requests contribute work to an iteration. An '}
        <strong>{'engine'}</strong>
        {
          ' coordinates these pieces and their persistent state. Some libraries expose them through one Python object; others place the HTTP frontend, engine core and workers in separate processes. A shared conceptual role does not imply identical internals.'
        }
      </Prose>

      <EngineFigure id="D02" />

      <Prose>
        {'For the pinned native completion endpoint, '}
        <code>{'prompt'}</code>
        {' supplies text or token IDs, '}
        <code>{'n_predict'}</code>
        {' requests a maximum number of new tokens, and '}
        <code>{'stream'}</code>
        {
          ' chooses incremental delivery. Output records include content and stop information. These field names belong to that endpoint. An OpenAI-compatible chat endpoint has another schema, including messages and a chat-formatting step; compatibility at that interface does not make its scheduler or cache the same implementation.'
        }
      </Prose>

      <Prose>
        {
          'Our finite request uses an immutable ID such as A, prompt IDs and a positive output cap. We will keep A cyan, B violet and C rose through all diagrams. Colour identifies the request; outlines, hatching and explicit labels identify waiting, reserved, live and terminal states. A request does not turn into a different entity when it finishes.'
        }
      </Prose>

      <H2>{'2. Text becomes a bounded job'}</H2>

      <Prose>
        {
          "The tokenizer converts text to vocabulary IDs. Chat formatting, when used, first adds the model's expected role markers and separators. Both operations affect the exact prompt sequence and its length. Counting characters or words cannot replace counting the final IDs sent to the model."
        }
      </Prose>

      <EngineFigure id="D03" />

      <Prose>
        {'For our teaching request A, use prompt IDs '}
        <code>{'[11, 12, 13]'}</code>
        {
          " and cap 3. These numbers are constructed, not Pythia's encoding of the example sentence. The runner will emit "
        }
        <code>{'[21, 22, 0]'}</code>
        {
          ', with 0 declared as EOS, the end-of-sequence token. A real tokenizer may insert a beginning token, split an accented word into several pieces, or map a single ID to bytes that need neighboring bytes before they form visible text.'
        }
      </Prose>

      <Prose>
        {'The cap counts '}
        <strong>{'new outputs'}</strong>
        {
          ", not prompt positions. It is also an upper bound, not a promise: EOS may arrive earlier. Our scratch contract requires at least one prompt ID and a positive integer cap. It refuses 0, negative numbers, fractions and Boolean values before admission. That local rule does not describe every native engine's zero-cap convention."
        }
      </Prose>

      <EngineFigure id="D04" />

      <Prose>
        {
          'Processing the three prompt positions produces the score row that selects 21. Feeding 21 produces 22. Feeding 22 produces EOS. At that point there are five cached input positions, while the sixth position—the final output EOS—has not been fed. Stopping needs no extra forward for that output.'
        }
      </Prose>

      <Prose>
        {'With prompt length P and exactly G outputs, this convention materializes at most'}
      </Prose>

      <div className="neural-equation">
        <MathBlock>{'L_{\\max}=P+G-1,\\qquad P\\ge1,\\ G\\ge1.'}</MathBlock>
      </div>

      <Prose>
        {
          'For P = 3 and G = 3, the bound is 5. For G = 1, the prompt alone produces the only output, so there is no decode forward. If EOS arrives after two outputs, the actual cached length is P + 1, even when the reservation was made for a larger cap. Live state and reserved future capacity must therefore be recorded separately.'
        }
      </Prose>

      <Prose>
        {'Download the '}
        <a href={'/learn/examples/inference-engines/inference-engines-examples.zip'}>
          {'complete examples archive'}
        </a>
        {', extract it and read '}
        <code>{'README.md'}</code>
        {'. Create a virtual environment, install '}
        <code>{'numpy==2.3.5'}</code>
        {', then run '}
        <code>{'python finite_study.py --output results/finite'}</code>
        {
          '. Use a new output path: the program refuses to overwrite a prior observation. Individual files and the full native setup are indexed at the end.'
        }
      </Prose>

      <Program file="request_contract.py" />

      <Prose>
        {''}
        <code>{'Request'}</code>
        {
          ' freezes the ID and token tuple. Its validation keeps nonfinite clocks and deadlines before arrival out of the state machine. '
        }
        <code>{'requests_by_id'}</code>
        {
          ' rejects duplicate IDs before building an ownership table: otherwise two jobs could alias one state entry. The ordinary native counterpart is the recorded '
        }
        <code>{'/tokenize'}</code>
        {' response followed by a completion whose prompt is exactly those IDs.'}
      </Prose>

      <span id="4-from-scratch-implementation" aria-hidden="true" />
      <H2>{'3. A state machine owns unfinished work'}</H2>

      <Prose>
        {
          'A request needs more than a string buffer. It needs a current phase, emitted IDs, cache length, reserved pages and a terminal reason. These fields tell the engine which operation is legal next.'
        }
      </Prose>

      <EngineFigure id="D05" />

      <Prose>
        {
          'A begins queued. After admission it enters prefill, where the entire prompt is consumed. Its first output changes it to decode unless that output already ends the request. Decode steps consume the last emitted ID, commit a new output and check EOS or cap. Cancellation, expiry and execution error have explicit terminal paths too.'
        }
      </Prose>

      <Prose>
        {
          'Terminal means this local engine no longer owns active work for that request. It does not mean the user received every byte: an HTTP connection can fail after the engine has committed an output. Local resource cleanup and delivery guarantees are different obligations.'
        }
      </Prose>

      <EngineFigure id="D06" />

      <Prose>
        {
          'Immediately before the first commit, A has consumed three prompt IDs and emitted none. Immediately afterward, the cache still contains three positions but the output list contains 21. On the next forward, consuming 21 raises cache length to four; the following commit appends 22. Incrementing cache length when merely appending an output would count an uncomputed position.'
        }
      </Prose>

      <Prose>
        {"The finite engine's "}
        <code>{'finish'}</code>
        {
          " checks whether a state is already terminal. Only the first terminal transition returns the logical reserved pages, clears the record's page/cache counters, removes active membership and records finalization. "
        }
        <code>{'ScriptedRunner'}</code>
        {
          ' keeps its declared token tables; it has no physical cache or separate release operation. A late cancellation after EOS is harmless. An error from the runner follows the same logical release path, preserving the event trace rather than leaving the reservation stranded.'
        }
      </Prose>

      <Program file="engine_lifecycle.py" />

      <Prose>
        {''}
        <code>{'ScriptedRunner'}</code>
        {
          ' verifies the inputs it is asked to consume and returns a declared next-token table. It is deliberately not a Transformer. '
        }
        <code>{'Engine.step'}</code>
        {
          ' composes arrival, safe-point checks, admission, execution and commit. The deterministic outputs let us ask whether B progresses after A releases pages without confounding the answer with model quality or timing noise.'
        }
      </Prose>

      <Prose>
        {
          'Read the actual loops before assigning a complexity bound. Each tick scans the tracked states and waiting work as well as active requests; retaining terminal states means the cost can grow with total tracked requests. A useful accounting is O(total tracked requests + waiting requests + active work), plus the costs of emitted events and stored outputs. Using a deque for one queue does not make the whole engine O(active requests).'
        }
      </Prose>

      <span id="6-visual-walkthrough" aria-hidden="true" />
      <H2>{'4. Schedule rows, execute, then commit'}</H2>

      <Prose>
        {
          "The scheduler selects work; the runner computes scores for that work; token selection converts the appropriate score row into an output ID; commit updates the request. Mixing these boundaries makes it easy to sample from the wrong position or attach B's output to A."
        }
      </Prose>

      <EngineFigure id="D07" />

      <Prose>
        {
          "Pack A's three prompt IDs followed by B's four. The flat array has seven rows and offsets "
        }
        <code>{'[0, 3, 7]'}</code>
        {'. Its local positions are '}
        <code>{'[0, 1, 2, 0, 1, 2, 3]'}</code>
        {
          ". The final prompt rows are 2 for A and 6 for B. Those rows predict each request's first output. Row 0 is not a general “first-output row”: it conditions on only A's first prompt token."
        }
      </Prose>

      <Prose>
        {
          'The attention mask has a three-by-three causal triangle for A and a four-by-four causal triangle for B. Every cross-request cell is blocked. Concatenating tokens without that isolation would make B depend on A. Position IDs alone are not a substitute for the mask.'
        }
      </Prose>

      <Program file="packed_requests.py" />

      <Prose>
        {
          'The scratch builder exposes tokens, offsets, row owners, positions, last rows and mask. The NumPy route constructs the same objects independently. '
        }
        <code>{'scatter_last'}</code>
        {
          " restores the association between sampled rows and request IDs. Reordering the packed requests changes offsets but should preserve each request's result after correct scattering. An incomplete prompt chunk cannot yet provide that request's prompt-end sample."
        }
      </Prose>

      <EngineFigure id="D08" />

      <Prose>
        {
          'In the retained anchor trace, A arrives at logical tick 0 and B at tick 1. A emits at ticks 0, 1 and 2. With six reserved pages available, B emits at ticks 1 and 2. With five pages, it waits and emits at ticks 3 and 4. These are scheduling iterations, not milliseconds. They establish the order of work and release, not native throughput.'
        }
      </Prose>

      <Prose>
        {
          "Iteration-level membership allows a newly admitted request to join continuing requests. That is the central continuous-batching idea developed in the earlier lesson and in Orca's iteration scheduling. A real runner may use packed tensors, kernels and worker processes very different from this finite model. Our trace makes the ownership boundary testable without claiming to reproduce those implementations."
        }
      </Prose>

      <H2>{'5. Admission is a resource test'}</H2>

      <Prose>
        {
          'A runnable request needs state that fits. Our conservative policy reserves enough pages for the largest cached length allowed by the cap before beginning execution. Other engines grow allocations incrementally or preempt work; their policies require their own progress and recovery rules.'
        }
      </Prose>

      <EngineFigure id="D09" />

      <Prose>
        {
          "With page size 2, A's maximum five cached rows need three pages. B has prompt length 4 and cap 2, also requiring at most five cached rows and three pages. A pool of five cannot reserve both jobs simultaneously. A pool of six can. The unused cell in each three-page reservation is rounding slack, not an extra prompt token."
        }
      </Prose>

      <Prose>{'If pages hold b rows, the reservation is'}</Prose>

      <div className="neural-equation">
        <MathBlock>{'R(P,G,b)=\\left\\lceil\\frac{P+G-1}{b}\\right\\rceil.'}</MathBlock>
      </div>

      <Prose>
        {
          'The inequality used for admission is total reserved pages plus new demand no greater than the pool. It uses reservations, not just rows already written. A request that needs more pages than the entire pool is rejected under this policy; waiting cannot make it feasible.'
        }
      </Prose>

      <EngineFigure id="D10" />

      <Prose>
        {
          'Logical pages acquire a byte meaning only after the model layout is specified. For ordinary dense K/V storage, bytes per cached token on one device are '
        }
        <code>{'2 × layers × local KV heads × head dimension × bytes per element'}</code>
        {
          ". The factor 2 counts keys and values. The heads resident on that device matter; a global model number can overcount or undercount a shard's local budget."
        }
      </Prose>

      <Prose>
        {
          'Subtract weights, workspace and an explicit reserve from device capacity before dividing by bytes per page. Use GiB = 2³⁰ bytes when that unit is printed. A negative remainder means the proposed budget is infeasible, not negative cache capacity. Even a positive arithmetic budget does not establish that a native allocation, graph workspace and allocator fragmentation will fit.'
        }
      </Prose>

      <Program file="capacity_accounting.py" />

      <Prose>
        {''}
        <code>{'reservation'}</code>
        {' validates its positive integer inputs before rounding. '}
        <code>{'device_budget'}</code>
        {
          " returns a device-local accounting result. The finite check uses 512 bytes per page and a residual budget of 4,096 bytes, giving eight pages. These small byte counts are supplied operands, not a measurement of Pythia's server memory. A setting such as memory utilization is an engine-specific budget input, not a universal percentage of free KV safety margin."
        }
      </Prose>

      <H2>{'6. A stream crosses a byte pipe'}</H2>

      <Prose>
        {
          'An output ID, its decoded text, a Server-Sent Events (SSE) message and a network read are four different units. SSE is the text framing protocol used by this streaming endpoint. A transport may split one event across many reads or return several events in one read. A multibyte character may be split too.'
        }
      </Prose>

      <EngineFigure id="D11" />

      <Prose>
        {'UTF-8 encodes “é” as the bytes '}
        <code>{'C3 A9'}</code>
        {
          '. If a read ends after C3, the incremental decoder retains that incomplete character. It cannot emit a valid “é” until A9 arrives. Decoding every read independently can fail even when the complete byte stream is valid.'
        }
      </Prose>

      <Prose>
        {'Next comes SSE framing. Lines beginning with '}
        <code>{'data:'}</code>
        {
          ' contribute text to an event. A blank line dispatches the accumulated data, joining repeated data fields with a newline. Comments beginning with '
        }
        <code>{':'}</code>
        {
          ' do not become data. LF, CR and CRLF line endings need to work even when CR and LF arrive in separate reads.'
        }
      </Prose>

      <EngineFigure id="D12" />

      <Prose>
        {
          'Only after an event is assembled do we parse its JSON. Our native adapter validates the types of '
        }
        <code>{'stop'}</code>
        {', '}
        <code>{'content'}</code>
        {
          ' and token IDs when those fields are supplied; the stream supervisor separately requires a terminal '
        }
        <code>{'stop:true'}</code>
        {' event. The literal '}
        <code>{'[DONE]'}</code>
        {
          ' used by some compatible interfaces is not native JSON and is refused by this adapter. An event with empty content can carry metadata without being first visible text.'
        }
      </Prose>

      <Program file="sse_records.py" />

      <Prose>
        {''}
        <code>{'SSEDataParser'}</code>
        {
          ' uses an incremental UTF-8 decoder, handles one leading BOM, buffers line endings and dispatches data events at blank lines. It is a teaching subset: it does not implement reconnection or EventSource event-ID behavior. It deliberately refuses invalid UTF-8 rather than using the standard browser EventSource replacement-decoding policy. An unfinished final event at EOF is discarded, not silently promoted to a complete record.'
        }
      </Prose>

      <Prose>
        {
          'The finite driver checks every two-chunk split of three literal fixtures, including non-ASCII and CRLF boundaries. It also retains explicit malformed-input and partial-EOF cases. Passing those cases establishes the declared parser contract; it does not establish every browser EventSource feature.'
        }
      </Prose>

      <Program file="stream_client.py" />

      <Prose>
        {
          'The HTTP client writes each received byte and its local elapsed time before feeding the parser. It separately stores raw SSE data, JSON records, content arrivals, nonterminal token arrays, the terminal array and EOF. One-byte reads make the framing visible but add instrumentation overhead. Their timestamps are client observations, not the physical packet-arrival times or GPU token-production clocks.'
        }
      </Prose>

      <Prose>
        {
          'The client has a five-second read timeout, a 55-second elapsed check and a two-MiB response bound; the parent imposes a 60-second wall timeout. It closes its response in cleanup and preserves partial files on failure. It does not retry a completion automatically, because a repeat could generate and bill another answer after some output had already escaped.'
        }
      </Prose>

      <H2>{'7. Cancellation frees the right things'}</H2>

      <Prose>
        {
          'Closing a client connection expresses that the client no longer wants the result. The engine still needs to observe that fact and stop at a safe point. Work already submitted to a device may not disappear instantaneously.'
        }
      </Prose>

      <EngineFigure id="D13" />

      <Prose>
        {
          'In this constructed timeline, cancellation arrives at 0.45 seconds and the next safe point occurs at 0.50. The extra 0.05 seconds is work or delay before acknowledgement. It is not a measured cancellation latency from our four native completions. Moving the safe point changes the interval; making the delay zero removes it.'
        }
      </Prose>

      <Prose>
        {
          'The finite engine checks cancellation before admission and execution at a tick. Its recorded cancellation case stops A at tick 1 and lets B use the released reservation at that same tick. Another case cancels A after it has finished; no second terminal event or release occurs. These checks concern local state transitions, not cancellation behavior of every native engine.'
        }
      </Prose>

      <EngineFigure id="D14" />

      <Prose>
        {
          "Suppose A and B share a prefix page P but have private tails. Canceling A removes A's reference and frees its private tail. P remains live for B. After B finishes, P has no active request references, but a reusable-prefix cache may keep it resident until eviction. Zero active references permits reclamation under a policy; it does not imply immediate deletion."
        }
      </Prose>

      <Prose>
        {
          'This shared-page diagram extends the ownership idea. The finite engine in this lesson reserves private logical pages and does not implement shared K/V storage. The '
        }
        <a
          href={
            '/learn/path/full-curriculum/prefix-caching-prompt-caching?module=large-language-models'
          }
        >
          {'prefix-caching lesson'}
        </a>
        {
          ' owns the actual prefix matching and lifetime implementation. Do not infer physical sharing from two requests having the same text prefix.'
        }
      </Prose>

      <span id="3-make-the-idea-precise" aria-hidden="true" />
      <span id="3-mathematical-foundation" aria-hidden="true" />
      <H2>{'8. Measure the clocks you actually see'}</H2>

      <Prose>
        {
          'Use one clock domain for a subtraction. A client arrival timestamp and an unsynchronized server timestamp cannot be subtracted just because both are labelled seconds. You can compare durations measured locally, or use an explicit synchronization method when a cross-boundary calculation requires it.'
        }
      </Prose>

      <Prose>
        {
          'TTFT means time to first token. TPOT means time per output token, commonly calculated over the gaps after that first token. When only text delivery is observable, explicitly call the first interval first-content latency and the gap statistic a content-event proxy.'
        }
      </Prose>

      <EngineFigure id="D15" />

      <Prose>
        {
          'For a constructed request arriving at 0, starting at 0.10 and producing output tokens at 0.30, 0.50 and 0.70 seconds, queue time is 0.10, TTFT is 0.30 and average time per output-token gap is 0.20 seconds. If the terminal event arrives at 0.80, terminal completion latency is 0.80 while last-output latency is 0.70. Name the endpoint of the measurement.'
        }
      </Prose>

      <Prose>{'For N ≥ 2 observed output-token timestamps,'}</Prose>

      <div className="neural-equation">
        <MathBlock>{'\\operatorname{TPOT}=\\frac{t_N-t_1}{N-1}.'}</MathBlock>
      </div>

      <Prose>
        {
          'For one token, this gap average is undefined. For three content events whose token correspondence is unknown, the same arithmetic is an average '
        }
        <strong>{'content-event gap'}</strong>
        {
          ', not token TPOT. Empty content does not establish client TTFT; connection EOF is not necessarily the terminal event.'
        }
      </Prose>

      <EngineFigure id="D16" />

      <Prose>
        {
          'A service-level objective, or SLO, states the conditions a request should meet, such as a TTFT limit and a required quality result. Now take four offered requests over a two-second arrival window. Two complete, one of those meets all required latency and quality conditions, one request is rejected and one is canceled. Goodput is 1/2 = 0.5 good requests per second. Offered success is 1/4 = 25%. Conditional success among completed requests is 1/2 = 50%. Reporting only the last fraction would hide the failed offers.'
        }
      </Prose>

      <Prose>
        {
          'An observation cutoff may leave requests unfinished. Those requests are censored at that cutoff, not successful. A quality requirement with no quality observation is unknown, not automatically passed. For an empty offered cohort the success fraction is undefined; zero observations do not prove perfect reliability.'
        }
      </Prose>

      <Program file="request_metrics.py" />

      <Prose>
        {''}
        <code>{'RequestTrace'}</code>
        {' validates ordered coherent timestamps and compatible outcomes. '}
        <code>{'request_metrics'}</code>
        {' calculates only available quantities. '}
        <code>{'cohort_metrics'}</code>
        {
          ' selects arrivals in a half-open window and observes outcomes through a stated cutoff. It keeps all offers in the denominator and reports missingness. Its finite fixture uses the same two-second denominator as the drawing: 0.25 is the success fraction, while 0.5 has units of good requests per second.'
        }
      </Prose>

      <H2>{'9. Run one native CPU server'}</H2>

      <Prose>
        {
          'A native route starts with compatible artifacts, not an engine name. We use the existing EleutherAI Pythia-14m checkpoint at revision '
        }
        <code>{'cf967c0a9a04383db6f7b1108d86b2962634b4ac'}</code>
        {', the llama.cpp Windows CPU release '}
        <code>{'b11429'}</code>
        {', and its matching source commit '}
        <code>{'d81235049384534c167caea52b85a694f6103d14'}</code>
        {
          '. The six checkpoint files, executable and dependent libraries are hash-bound in the retained records.'
        }
      </Prose>

      <EngineFigure id="D17" />

      <Prose>
        {
          "Pythia's six GPTNeoX blocks have hidden width 128, four attention heads and MLP width 512. Each block adds parallel pre-normalized attention and MLP branches to its residual. The checkpoint stores attention projection rows grouped by head: each head contributes its Q, K and V channels. The converter reshapes weights to "
        }
        <code>{'[4, 3, 32, 128]'}</code>
        {
          ' and concatenates all Q rows, then all K rows, then all V rows. The corresponding bias permutation uses '
        }
        <code>{'[4, 3, 32]'}</code>
        {
          ". Changing the order without changing the consumer's interpretation would mix the projections."
        }
      </Prose>

      <Prose>
        {
          'The exported rotary dimension is 0.25 × (128/4) = 8. Parallel-residual and layer-normalization metadata must also survive conversion. F16 describes the main tensor storage type; small normalization tensors may remain F32. This conversion is not low-bit quantization and does not prove that a different runtime produces bit-identical logits.'
        }
      </Prose>

      <Prose>
        {
          'The actual file contains 26 F16 tensors and 50 F32 tensors, totaling 28,155,904 tensor bytes. Its '
        }
        <code>{'general.file_type'}</code>
        {
          ' metadata key is absent. The native properties/models endpoints consequently report the literal string '
        }
        <code>{'(guessed) all F32'}</code>
        {
          ": the pinned loader guesses from the most frequent tensor type by tensor count, so the fifty smaller F32 tensors win that vote. This label is not an accurate description of every tensor's storage. The read-only GGUF inventory and converter tensor log establish the mixed storage; the requested "
        }
        <code>{'--outtype f16'}</code>
        {' flag alone would not have proved it.'}
      </Prose>

      <Program file="acquire_engine.py" />

      <Prose>
        {
          'Acquisition downloads the exact CPU archive and matching source archive into a new directory. It verifies the published binary digest, bounds download and extraction sizes, rejects path traversal and symlinks, and preserves partial downloads if a failure occurs. It does not execute the downloaded binary. The learner bundle contains this helper and identities, not an embedded executable or another copy of model weights.'
        }
      </Prose>

      <Program file="convert_checkpoint.py" />

      <Prose>
        {
          'Conversion verifies the existing checkpoint files and acquired Python source hashes, then invokes the matching complete converter with '
        }
        <code>{'--outtype f16'}</code>
        {' and offline flags. The converter depends on its neighboring '}
        <code>{'conversion'}</code>
        {' and '}
        <code>{'gguf-py'}</code>
        {
          " packages; copying only the entrypoint is insufficient. Read the dependency requirements before invoking it. Use an isolated environment rather than replacing an unrelated project's packages."
        }
      </Prose>

      <Prose>
        {'Our first conversion failed at '}
        <code>{'rotary_pct'}</code>
        {'. The original config retained that field, but Transformers 5.19 moved it into '}
        <code>{'rope_parameters.partial_rotary_factor'}</code>
        {' when '}
        <code>{'AutoConfig.to_dict()'}</code>
        {
          ' normalized the config. The pinned converter expected the older top-level field. Tensor preparation had completed, but no valid GGUF was produced. Successful imports were therefore weaker evidence than end-to-end conversion. The failed command, complete stderr and environment record remain part of the observation.'
        }
      </Prose>

      <Prose>
        {
          "The source recommends Transformers 4.57.6. The bounded correction used that version with tokenizers 0.22.2 and huggingface-hub 0.36.2 in a separate private target, preserving the converter and checkpoint bytes. A config-only probe confirmed the original architectural fields, and the single corrected conversion passed. It produced a 29,929,408-byte GGUF, whose full SHA256 is in the observation file. Torch 2.14 CPU and NumPy 2.3.5 were retained and explicitly differ from the converter's recommended full requirements. This successful route establishes compatibility for the recorded conversion; neither the version number nor the earlier import check alone established it."
        }
      </Prose>

      <Program file="native_cpu_route.py" />

      <Prose>
        {'The native supervisor starts only its own process on a free loopback port. '}
        <code>{'-ngl 0'}</code>
        {' keeps model layers on CPU; '}
        <code>{'-c 512'}</code>
        {' sets the context envelope; '}
        <code>{'-np 1'}</code>
        {' selects one slot; '}
        <code>{'-t 2'}</code>
        {' and '}
        <code>{'-tb 2'}</code>
        {' select two generation and prompt-processing threads. '}
        <code>{'--no-warmup'}</code>
        {
          ' avoids an extra warmup run. These flags describe this experiment, not universally optimal settings. The supervisor records startup, waits for health, inspects properties/models, and tokenizes four fixed prompts before generation.'
        }
      </Prose>

      <Prose>
        {
          'It passes those exact token ID arrays to completion, including the recorded special-token policy. Each request asks for 16 new tokens, temperature 0, only the temperature sampler, seed 0, no prompt-cache reuse, raw IDs and streaming. In the pinned implementation, nonpositive temperature keeps the highest-logit candidate and suppresses the others; the sampler chain then selects from the resulting distribution. This does not promise cross-build output identity. The documented native cap can be exceeded to finish a multibyte character, so the raw result must be retained rather than cropped to make a count assertion pass.'
        }
      </Prose>

      <EngineFigure id="D18" />

      <Prose>
        {'All four native requests completed. The table reports client '}
        <code>{'perf_counter'}</code>
        {
          " elapsed times in seconds; it does not mix them with the server's internal timing fields."
        }
      </Prose>

      <NeuralTable
        caption={'9. Run one native CPU server'}
        headers={[
          <>{'Request'}</>,
          <>{'Prompt IDs'}</>,
          <>{'Output IDs'}</>,
          <>{'SSE events'}</>,
          <>{'First nonempty content (s)'}</>,
          <>{'Terminal event (s)'}</>,
          <>{'Connection EOF (s)'}</>,
        ]}
        rows={[
          [
            <>{'A, capital sentence'}</>,
            <>{'5'}</>,
            <>{'16'}</>,
            <>{'17'}</>,
            <>{'0.068716'}</>,
            <>{'0.189938'}</>,
            <>{'0.190698'}</>,
          ],
          [
            <>{'B, colour list'}</>,
            <>{'10'}</>,
            <>{'16'}</>,
            <>{'17'}</>,
            <>{'0.084245'}</>,
            <>{'0.239314'}</>,
            <>{'0.240369'}</>,
          ],
          [
            <>{'C, Python prefix'}</>,
            <>{'10'}</>,
            <>{'16'}</>,
            <>{'17'}</>,
            <>{'0.063839'}</>,
            <>{'0.228774'}</>,
            <>{'0.229663'}</>,
          ],
          [
            <>{'D, accented sentence'}</>,
            <>{'4'}</>,
            <>{'16'}</>,
            <>{'17'}</>,
            <>{'0.078131'}</>,
            <>{'0.213309'}</>,
            <>{'0.214128'}</>,
          ],
        ]}
      />

      <Prose>
        {
          'Each request had sixteen nonterminal events carrying one ID each, followed by one terminal event with empty content and an empty token array. Thus these particular records establish a one-ID-per-nonterminal-event correspondence; the parser never assumes it for arbitrary streams. There is no cumulative terminal array to count again. Every stop reason was '
        }
        <code>{'limit'}</code>
        {
          ', and each server timing record reported zero reused prompt-cache tokens. Cached input lengths were 20, 25, 25 and 19, respectively—prompt length plus fifteen previously emitted inputs. The requested special-token policy inserted no additional beginning token in these actual tokenizations.'
        }
      </Prose>

      <Prose>
        {
          'The complete saved output for A begins “ the United States.” B repeats “ blue,” eight times; C returns “ b.b.b.b.b.b.b.b.”; D continues with a list of restaurants. These are actual poor continuations, not a validated factual answer, a correct function or a measured quality score. The raw streams and full strings remain available in '
        }
        <a href={'/learn/examples/inference-engines/evidence/observations.json'}>
          {'observations.json'}
        </a>
        {'. Successful transport and token accounting do not imply useful model behavior.'}
      </Prose>

      <Prose>
        {
          'After the fourth request, the supervisor terminated its owned Windows process and waited for exit. The recorded final exit code is 1 from that termination; the established fact is that the process exited, not that the engine performed an application-level graceful shutdown. No request or conversion was repeated to improve the displayed output.'
        }
      </Prose>

      <Prose>
        {
          'The four source strings are a sentence completion, a colour list, a small Python function prefix and a sentence containing “café”. They are authored probes, not representative traffic or a quality benchmark. No conclusion about concurrency, native cancellation, GPU acceleration, prefix-hit rates or p99 latency follows from them. The server is terminated and waited for in '
        }
        <code>{'finally'}</code>
        {'; closing a client alone would not prove process cleanup.'}
      </Prose>

      <span id="5-production-implementation-the-engine-landscape" aria-hidden="true" />
      <H2>{'10. Six engines expose different boundaries'}</H2>

      <Prose>
        {
          'An engine choice combines model support, hardware, an interface and operational requirements. Separate the roles in the architecture from the names of particular implementations. A model-family support list does not establish every combination of backend, precision, grammar and platform.'
        }
      </Prose>

      <EngineFigure id="D19" />

      <Prose>
        {'The pinned '}
        <strong>{'vLLM'}</strong>
        {' architecture separates the offline '}
        <code>{'LLM'}</code>
        {
          ' class from the serving entrypoint. Its V1 serving description distinguishes the API process, engine core and GPU workers. The API handles input/output, the core owns scheduling and KV management, and workers perform model execution. This separation explains why an HTTP symptom and a worker computation problem may require different instrumentation. '
        }
        <a
          href={
            'https://github.com/vllm-project/vllm/blob/2ddde19e8e0ba1b9d06a3f9b6201f7fc915d27ab/docs/design/arch_overview.md'
          }
        >
          {'vLLM architecture'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {''}
        <strong>{'SGLang'}</strong>
        {' exposes chat-compatible requests and a native '}
        <code>{'/generate'}</code>
        {
          ' route. In the pinned request tutorial, the native streaming example carries cumulative text. To recover each new suffix, the client tracks the previous length. Treating every cumulative record as a delta would repeat already delivered text. The same HTTP content type does not select the correct response adapter for you. '
        }
        <a
          href={
            'https://github.com/sgl-project/sglang/blob/d8448d2e6212920eb816390a37e7f8b40cbf0a3a/docs/docs/basic_usage/send_request.mdx'
          }
        >
          {'SGLang request tutorial'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {''}
        <strong>{'TensorRT-LLM'}</strong>
        {
          ' illustrates why version-specific sources matter. At the inspected revision, its migration guide removes the TensorRT engine backend and identifies PyTorch as the sole execution backend. The current quick-start serves a checkpoint directly. An older architecture page or remembered '
        }
        <code>{'trtllm-build'}</code>
        {
          ' command must not override that explicit migration document. This is a dated source statement, not a claim about every release bearing the name. '
        }
        <a
          href={
            'https://github.com/NVIDIA/TensorRT-LLM/blob/ce2e2f8b7023f385711c2395ac83e046fbcbea84/docs/source/legacy/tensorrt-backend-removal.md'
          }
        >
          {'Backend migration'}
        </a>
        {', '}
        <a
          href={
            'https://github.com/NVIDIA/TensorRT-LLM/blob/ce2e2f8b7023f385711c2395ac83e046fbcbea84/docs/source/quick-start-guide.md'
          }
        >
          {'quick-start'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {''}
        <strong>{'Text Generation Inference'}</strong>
        {
          ', TGI, documents an HTTP serving stack and supported hardware/model routes. The pinned README also states maintenance mode. Maintenance changes the expectation for new development; it does not prove an existing supported model cannot run. The Docker image actually executed needs its own digest: a documentation commit and a container image are different identities. '
        }
        <a
          href={
            'https://github.com/huggingface/text-generation-inference/blob/b4adbf2f6e2e721280bd0ea5f91d70f7d033f5ed/README.md'
          }
        >
          {'TGI README'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {''}
        <strong>{'llama.cpp'}</strong>
        {
          " supplies an ordinary local CPU route as well as other backends. GGUF packages tensors and metadata for its runtime. The server's native "
        }
        <code>{'/completion'}</code>
        {
          ' interface has explicit tokenizer, sampler and streaming controls. Our observation supports only the exact checkpoint, conversion, executable and settings in its record; a broad CPU feature statement would be weaker evidence. '
        }
        <a
          href={
            'https://github.com/ggml-org/llama.cpp/blob/d81235049384534c167caea52b85a694f6103d14/tools/server/README.md'
          }
        >
          {'Pinned server documentation'}
        </a>
        {'.'}
      </Prose>

      <Prose>
        {''}
        <strong>{'DeepSpeed-MII'}</strong>
        {
          ' distinguishes a nonpersistent Python pipeline from a persistent deployment and client. The pinned README describes DeepSpeed-FastGen technology and a supported NVIDIA/CUDA environment. Ending a one-shot process and shutting down a persistent deployment are different cleanup operations. Its ordinary recipe must use its documented response fields and deployment shutdown rather than assuming chat-completion JSON. '
        }
        <a
          href={
            'https://github.com/deepspeedai/DeepSpeed-MII/blob/8abdd987421988a9d50d8b1dfa71ca6283a30f6c/README.md'
          }
        >
          {'MII README'}
        </a>
        {'.'}
      </Prose>

      <EngineFigure id="D20" />

      <Prose>
        {'Read '}
        <a href={'/learn/examples/inference-engines/engine-recipes.md'}>{'engine-recipes.md'}</a>
        {
          ' for complete ordinary launch and client examples for all six. Those optional recipes are source-inspected and unexecuted here; only the separate controlled CPU route has local execution evidence. Each recipe explains the required environment and cleanup. GPU-oriented instructions are not silently presented as Windows CPU commands.'
        }
      </Prose>

      <Program file="engine_requirements.py" />

      <Prose>
        {
          'The evidence manifest attaches a precise proposition, source, scope and status to each claim. '
        }
        <code>{'select_candidates'}</code>
        {
          ' requires the conjunction of your requirements. A missing claim is unknown, while explicit incompatible evidence excludes a candidate. A source that documents streaming in general does not establish that your chosen model, precision and platform stream correctly together. The observed native result is a separate evidence layer; the original source-only manifest remains recoverable.'
        }
      </Prose>

      <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
      <H2>{'11. Features interact through shared state'}</H2>

      <Prose>
        {
          'This deeper branch connects the preceding inference lessons. Each feature changes particular work and state. They cannot be combined safely by multiplying separate advertised speedups.'
        }
      </Prose>

      <EngineFigure id="D21" />

      <Prose>
        {
          'A reusable prefix requires compatible model weights, tokenization, adapters, position semantics and preceding token IDs. A matching string suffix is insufficient: attention state depends on the earlier prefix. If an adapter changes, identical IDs can produce different K/V. The '
        }
        <a
          href={
            '/learn/path/full-curriculum/prefix-caching-prompt-caching?module=large-language-models'
          }
        >
          {'prefix-caching implementation'}
        </a>
        {' traces these identities and page lifetimes explicitly.'}
      </Prose>

      <EngineFigure id="D22" />

      <Prose>
        {
          'Constrained decoding changes which IDs are allowed at each grammar state. Speculative decoding proposes several IDs and verifies them against the target policy, then discards a rejected suffix. Their composition must keep the grammar state, the processed distributions and the committed cache frontier aligned. Checking the target under one grammar history while keeping draft state from another is not a valid shortcut. The '
        }
        <a
          href={
            '/learn/path/full-curriculum/structured-output-constrained-decoding-outlines-xgrammar?module=large-language-models'
          }
        >
          {'constrained-decoding lesson'}
        </a>
        {' and '}
        <a href={'/learn/path/full-curriculum/speculative-decoding?module=large-language-models'}>
          {'speculative-decoding lesson'}
        </a>
        {' own those full algorithms.'}
      </Prose>

      <EngineFigure id="D23" />

      <Prose>
        {
          'For a deliberately separable timing example, suppose prefill costs 20 ms and decode costs 80 ms. Halving prefill gives 90 ms total. Halving decode gives 60 ms. Applying both assumptions gives 50 ms, a 2× total speedup. Multiplying the separately measured speedups, (100/90) × (100/60), gives only about 1.852×. Both single-feature ratios used the same 100 ms baseline and affected different portions of it.'
        }
      </Prose>

      <Prose>
        {
          'Real interactions can be less separable. A larger batch changes memory traffic and kernel shape; speculation may compute rejected positions; a prefix hit changes the mix of prefill and decode; grammar work may move between CPU and GPU. Draw the operations and state affected, then measure the combined configuration. Counting saved rows is useful evidence about work, but it is not elapsed time.'
        }
      </Prose>

      <span id="9-failure-modes-and-gotchas" aria-hidden="true" />
      <H2>{'12. Diagnose at the boundary that can explain the symptom'}</H2>

      <Prose>
        {
          'A health endpoint can answer while a model is unavailable, a request is waiting, or a stream is delayed. A successful network connection establishes only that part of the path. Diagnose by pairing a symptom with a measurement that distinguishes plausible causes.'
        }
      </Prose>

      <EngineFigure id="D24" />

      <Prose>
        {
          'The constructed baseline has 100 ms queue delay, 200 ms compute and 50 ms transport/delivery delay, for 350 ms total. If compute stays 200 ms but client first-content latency rises, measuring compute more precisely will not by itself locate the increase. Inspect preprocessing, queue admission and delivery/proxy intervals with compatible clocks.'
        }
      </Prose>

      <Prose>
        {
          'Repeated generated text may be a cumulative-stream adapter error, not a model repetition problem. A tokenizer mismatch changes inputs even when prompts look identical. A model load failure can come from incompatible tensor metadata. A request that never progresses may be infeasible under the admission policy rather than merely unlucky in a queue. Preserve the raw request and response before changing sampling settings.'
        }
      </Prose>

      <EngineFigure id="D25" />

      <Prose>
        {
          'A cumulative output counter grows at each recorded output; its slope over an interval is an aggregate rate. Queue occupancy rises on arrival and falls on admission or removal. Neither is a per-request latency percentile. Scraped histogram buckets estimate distributions under their bucket scheme; raw individual completion times answer a different question. Label clock origin, interval and units before interpreting a curve.'
        }
      </Prose>

      <Prose>
        {
          'The finite campaign passed 146 declared cases in one execution, covering request validation, admission and cleanup traces, packing, every selected SSE split, metrics, source-backed eligibility and matched comparisons. These are correctness cases, not 146 timed engine runs. The retained conversion failure demonstrates another boundary: valid checkpoint bytes and successful tensor preparation did not establish compatible configuration metadata.'
        }
      </Prose>

      <Program file="finite_study.py" />

      <Prose>
        {
          "The driver writes each case's operands and returned result before checking its independent expected value. A failure preserves the started case and traceback and stops the sequence. Read "
        }
        <code>{'result.json'}</code>
        {
          ' alongside the journal to distinguish “the operation ran and disagreed” from “the operation never returned”. Repeating a test into the same output directory is refused, preventing an accidental overwrite of the original result.'
        }
      </Prose>

      <H2>{'13. Compare matched workloads'}</H2>

      <Prose>
        {
          'This deeper branch starts with a ledger, not a bar chart. If two runs changed their prompts, output caps or cache state, a difference in elapsed time cannot be attributed solely to the engine setting named in the chart.'
        }
      </Prose>

      <EngineFigure id="D26" />

      <Prose>
        {
          'Hold model and tokenizer identity, prompt IDs, requested caps, sampler and stop policy, precision, cache conditions, load schedule, quality requirement and metric definition fixed when comparing a treatment. Record the runtime configuration that intentionally differs. A text hash alone cannot detect different chat templates or special-token insertion; keep the IDs too.'
        }
      </Prose>

      <Prose>
        {
          'An open-arrival workload submits requests according to a schedule independent of completion. A closed-concurrency workload sends another job after one finishes. They put different pressure on the queue. Warming the cache in only one run or dropping failed requests before analysis also changes the comparison.'
        }
      </Prose>

      <EngineFigure id="D27" />

      <Prose>
        {
          'Every offered request needs a receipt, including rejection, cancellation, error or censoring. “Completed in both” can be a useful paired subset, but it is conditional: it may omit exactly the jobs one configuration handles poorly. Keep its count and the all-offered result alongside it.'
        }
      </Prose>

      <EngineFigure id="D28" />

      <Prose>
        {
          'For the finite matched fixture, both records use the same controls and request identities; the independently expected mean completion-latency difference is 0.10 seconds. Changing the cache mode produces a confound rather than a new performance conclusion. Removing an offered receipt blocks the aggregate. These supplied values test the comparator; they are not a measured two-engine benchmark.'
        }
      </Prose>

      <Program file="compare_traces.py" />

      <Prose>
        {''}
        <code>{'validate_run'}</code>
        {' checks the manifest and receipts before '}
        <code>{'compare_runs'}</code>
        {
          ' calculates summaries. Identity hashes make changed controls visible; they cannot guarantee that an inaccurate manifest describes reality. Preserve raw outputs, exact commands and provenance so the ledger can be audited. Four sequential native requests can illustrate that audit, but cannot establish a stable tail percentile or rank six engines.'
        }
      </Prose>

      <H2>{'14. Build a bounded service policy'}</H2>

      <Prose>
        {
          'A service must decide what happens when it cannot admit more work. An unbounded queue hides overload by turning it into growing latency and memory use. A finite waiting limit, an explicit rejection and a deadline make the behavior observable.'
        }
      </Prose>

      <EngineFigure id="D29" />

      <Prose>
        {
          'Our finite engine checks deadlines at a safe point. A deadline equal to the current tick has expired: the comparison is '
        }
        <code>{'deadline <= now'}</code>
        {
          '. A queued expired request is removed before runner submission. Cancellation and expiry produce distinct reasons, even when both free the same reservation. The native four-request route does not test these finite policy choices.'
        }
      </Prose>

      <EngineFigure id="D30" />

      <Prose>
        {
          'If the first queued job requires seven pages and the whole pool has six, no amount of waiting can satisfy it. Reject it under the declared policy and continue scanning for a feasible two-page job. This avoids a specific progress failure without inventing preemption or spilling K/V to another device. A bounded scan and queue also need a stated fairness policy; this teaching engine demonstrates progress for the declared cases, not a universal starvation theorem.'
        }
      </Prose>

      <Prose>
        {
          'Admission, scheduling and termination are connected. Reserving growth avoids one mid-request capacity failure, but can lower utilization when many requests stop early. Incremental allocation may admit more work but needs a response when expansion fails. Choose the policy with its recovery behavior, not just the most appealing occupancy number.'
        }
      </Prose>

      <span id="7-decision-matrix" aria-hidden="true" />
      <H2>{'15. Choose from explicit constraints'}</H2>

      <Prose>
        {
          'Write the required joint route first. For example: offline Windows CPU, one supported small checkpoint, a verified conversion and an inspectable streaming endpoint. That question has a different candidate set from high-concurrency GPU serving with a particular quantization and grammar backend.'
        }
      </Prose>

      <EngineFigure id="D31" />

      <Prose>
        {
          "The pinned llama.cpp CPU route is a candidate for the first question. It is not thereby fastest or cheapest. If another engine's inspected documents do not establish the exact joint route, mark it unknown rather than globally incompatible. Seek the missing compatibility evidence or conduct a bounded test in the appropriate environment."
        }
      </Prose>

      <Prose>
        {
          'Hard constraints remove infeasible candidates; soft preferences help choose which feasible candidate to investigate. Maintenance status, operations familiarity and ecosystem integration may matter alongside latency. A weighted feature score invented without measurements would conceal these judgments rather than justify them.'
        }
      </Prose>

      <Prose>
        {
          'If no candidate satisfies every hard requirement, the correct result is an empty set with reasons. You might change a requirement, obtain better evidence or choose another deployment environment. Returning an arbitrary engine just to fill the UI would teach the wrong decision procedure.'
        }
      </Prose>

      <span id="closing-the-complete-inference-optimization-arc" aria-hidden="true" />
      <H2>{'16. Explain the single-engine boundary'}</H2>

      <Prose>
        {
          'Return to A. Its bytes became IDs, its validated job entered a queue, admission reserved state, scheduler iterations selected input rows, the runner supplied scores, token selection chose IDs and commits updated the record. Streaming delivered records while terminal handling released local ownership.'
        }
      </Prose>

      <EngineFigure id="D32" />

      <Prose>
        {
          'You should now be able to point to where a duplicated output, a leaked reservation, a wrong last-row index, an invalid UTF-8 split or a misleading latency number enters that path. Repairing each requires evidence at its own boundary. Changing an engine name or sampler temperature is not a general diagnosis.'
        }
      </Prose>

      <Prose>
        {
          'The next boundary is outside this process: routing among replicas, retries after partial output, idempotency, autoscaling and cross-device transfer. If a replica dies after delivering two chunks, the local exactly-once cleanup rule does not tell a gateway whether to replay the request or what the client should display. Continue with '
        }
        <a
          href={
            '/learn/path/full-curriculum/inference-system-architecture-end-to-end?module=large-language-models'
          }
        >
          {'Inference System Architecture'}
        </a>
        {' for that larger ownership problem.'}
      </Prose>

      <Prose>
        {
          "You are ready to continue when you can trace the five cached inputs behind A's three outputs, explain why B waits with five reserved pages, reconstruct events across arbitrary read boundaries, calculate a metric with its denominator and clock domain, and state what the native observation does—and does not—establish."
        }
      </Prose>

      <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
        <span id="11-self-check-exercises" aria-hidden="true" />
        <H2>{'Practice with changed situations'}</H2>

        <Prose>
          {
            'These tasks change operands or failure conditions. Each hint and worked solution is available immediately. First-pass learners should return to section 11 before task 11 and section 13 before task 13; the other tasks use the main route.'
          }
        </Prose>

        <section className="lesson-exercise" data-lesson-exercise="1">
          <H3>{'1. A model object is not a route'}</H3>

          <Prose>
            {'Your Python model produces text offline, but '}
            <code>{'POST /v1/chat/completions'}</code>
            {
              ' returns HTTP 404. Name two facts the offline result establishes and two things it does not establish. What should you inspect next?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'Separate file loading and inference from HTTP process ownership and route registration.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The offline result shows that this process loaded a usable artifact and completed that inference call. It does not show that a server is running at the requested address or that this path is registered. Inspect the actual listening process, base URL, health response and documented route. A native '
              }
              <code>{'/completion'}</code>
              {' endpoint is not automatically '}
              <code>{'/v1/chat/completions'}</code>
              {'. Changing the sampling temperature cannot repair a missing route.'}
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="2">
          <H3>{'2. Early EOS changes live state'}</H3>

          <Prose>
            {
              'A prompt has five IDs, cap 4 and EOS as its second output. Count prompt rows, decode-forward rows, actual cached rows and maximum reserved rows. Then set the cap to 0: does our scratch engine admit it?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'The prompt produces output one. The last output is not fed again after stopping.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'There are five prompt rows and one decode-forward row, for six actual cached rows and two outputs. The cap-based bound was 5 + 4 − 1 = 8 rows. Early EOS leaves two reserved rows unused before release. Cap 0 is refused by the request contract before admission. Applying the positive-cap formula to 0 and claiming four cached rows would use it outside its domain. Native zero-cap behavior must be checked separately.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="3">
          <H3>{'3. A cancellation arrives too late'}</H3>

          <Prose>
            {'A terminal trace already contains '}
            <code>{'emit EOS'}</code>
            {', '}
            <code>{'release A'}</code>
            {', '}
            <code>{'finish A:eos'}</code>
            {
              '. A cancellation arrives afterward. A faulty handler appends another release and terminal event. Repair the transition rule and write the correct additional events.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Check terminal status before changing ownership.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'If A is already terminal, the terminal transition returns without releasing or emitting again. There are no additional ownership or terminal events; a separate diagnostic may record that a late cancellation was ignored. The pool must not gain pages twice. This idempotent local transition does not prove exactly-once network delivery.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="4">
          <H3>{'4. Scatter the right logits'}</H3>

          <Prose>
            {
              'Pack request A of length 2 and B of length 3. A developer samples row 0 for both. Give the offsets, local positions and correct last rows. What changes if B is packed first?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'For each request, use the end offset minus one.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {'A then B gives offsets '}
              <code>{'[0, 2, 5]'}</code>
              {', positions '}
              <code>{'[0, 1, 0, 1, 2]'}</code>
              {' and last rows 1 and 4. B then A gives offsets '}
              <code>{'[0, 3, 5]'}</code>
              {', positions '}
              <code>{'[0, 1, 2, 0, 1]'}</code>
              {
                ' and last rows 2 for B and 4 for A. Scatter by request identity after the permutation. Row 0 conditions on only the first token of whichever request is first; it is not the complete-prompt output row for either request here.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="5">
          <H3>{'5. Reserve whole pages'}</H3>

          <Prose>
            {
              'Page size is 4 and the pool contains five pages. A has P = 5, G = 4; B has P = 4, G = 3. Can both reserve? Calculate page use, free pages and maximum-row slack.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Round each request separately before summing.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'A needs eight rows and two pages. B needs six rows and two pages. Four pages are reserved, one remains free, and the reserved capacity is 16 rows for 14 maximal live rows: two rows of slack. Rounding the combined 14 rows happens to give four pages here, but is not generally a valid substitute for separate allocations. Current live rows may be below these maxima before either job finishes.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="6">
          <H3>{'6. Repair a per-read parser'}</H3>

          <Prose>
            {
              'One read ends at the first byte of UTF-8 “é”. Another read contains the rest of that event plus an entire second SSE event. The client calls JSON parsing once per read. Give the correct processing stages and the EOF rule for a final event with no blank line.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'There are two independent boundaries before JSON: characters and events.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Feed bytes into an incremental UTF-8 decoder; feed decoded characters into a line buffer; accumulate '
              }
              <code>{'data'}</code>
              {
                " fields until a blank line dispatches an event; then parse that event's data as native JSON. The split character waits for its second byte. The merged read may dispatch two events. Under this parser's contract, the unfinished final event is discarded at EOF. Neither “one read equals one event” nor “one event equals one token” is valid."
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="7">
          <H3>{'7. Cancel one shared owner'}</H3>

          <Prose>
            {
              'A and B both reference prefix page P. A owns private tail X and B owns private tail Y. A disconnects and the engine acknowledges cancellation. List the active references afterward, then explain what may happen when B also finishes.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Count references separately from reusable-cache residency.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Remove A→P and A→X, freeing X. Keep B→P and B→Y; P still has one active owner. After B finishes, remove those references and free Y. P now has zero active references and can be evicted, but a reusable-prefix cache may retain it under its policy. Client disconnect alone is not proof that the engine has already performed these transitions.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="8">
          <H3>{'8. Three content events are not three known tokens'}</H3>

          <Prose>
            {
              'Arrival is 0.2 seconds; nonempty content arrives at 0.5, 0.9 and 1.0; a terminal event arrives at 1.2. Calculate client first-content latency, mean content-event gap and terminal completion latency. Is token TPOT known?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'There are two gaps between three events. Use arrival for latency but first content for the gap span.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'First-content latency is 0.5 − 0.2 = 0.3 seconds. Mean content-event gap is (1.0 − 0.5)/2 = 0.25 seconds. Terminal latency is 1.2 − 0.2 = 1.0 second. Last-content latency would be 0.8 seconds and must be named separately. Token TTFT and token TPOT are unknown without the token-to-event correspondence; one event may contain several IDs or only a fragment of visible text.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="9">
          <H3>{'9. Same model, different engine build'}</H3>

          <Prose>
            {
              'Two runs use identical GGUF bytes but different executable hashes. Both request temperature 0. Which identity is established, and which output or performance claim remains unproved?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'Deterministic selection operates on logits that another build may compute differently.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The model artifact matches. The runtime does not: kernels, numerical behavior or defaults may differ. Neither equal generated text nor equal latency follows from temperature 0. Record executable/dependency hashes, flags, effective sampler settings, prompt IDs and outputs. A bounded new comparison would be a separate recorded experiment, not permission to relabel an old result as a run of the new build.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="10">
          <H3>{'10. A family name is incomplete compatibility evidence'}</H3>

          <Prose>
            {
              'A source lists your model family as supported. Your desired quantization on the chosen backend is unmentioned; a second source documents that quantization on a different family. May the requirement filter mark the joint route supported?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'Two separate supported propositions do not necessarily prove their conjunction.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'No. The required proposition is this model family with this precision on this backend. Keep it unknown until a source or bounded observation establishes the combination. Explicit evidence that the combination is unsupported would exclude it; absence alone should not be converted into a global incompatibility claim. Retain both narrower sources because they explain which pieces are known.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="11">
          <H3>{'11. Combine work savings'}</H3>

          <Prose>
            {
              'Return to section 11 first. In a new separable example, prefill takes 30 ms and decode 90 ms. A prefix change removes two thirds of prefill; a decode change removes one third of decode. Compute each individual total and the combined total. Compare combined speedup with the product of individual speedups.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'Apply each reduction to its own portion of the 120 ms baseline.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Prefix alone gives 10 + 90 = 100 ms. Decode alone gives 30 + 60 = 90 ms. Together they give 10 + 60 = 70 ms. Combined speedup is 120/70 ≈ 1.7143×. Multiplying 120/100 by 120/90 gives 1.6×, a different quantity. The separability was supplied for this exercise; actual caching, batching and speculation may interact, so their combined latency needs measurement.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="12">
          <H3>{'12. Find a delayed boundary'}</H3>

          <Prose>
            {
              'Server compute remains 200 ms, while client first-content latency increases by 400 ms. A dashboard labels the model “three times slower”. Explain the attribution error and propose measurements that could distinguish two other causes.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>{'The missing time can precede or follow model work.'}</Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The unchanged compute interval does not support that model-slowdown claim. Measure admission/preprocessing/queue durations to test whether work waits longer before execution. Measure server emission and client receipt or local transport/proxy durations to test delayed delivery. Use synchronized clocks for cross-process differences or compare coherent local durations. More detailed kernel timing alone cannot locate time outside the kernel.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="13">
          <H3>{'13. Restore the denominator'}</H3>

          <Prose>
            {
              'Return to section 13 first. Six requests are offered over three seconds: four complete, one is rejected and one canceled. Three meet all required SLO and quality conditions. A report says “100% success” after displaying only those three. Calculate goodput, offered success and conditional completed success.'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'The three successes appear in every numerator; the denominators answer different questions.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'Goodput is 3/3 = 1 good request per second. Offered success is 3/6 = 50%. Conditional completed success is 3/4 = 75%. The one completed failure, rejected request and canceled request do not vanish because they are inconvenient. If the observation cutoff leaves additional offered work unfinished, report censoring rather than treating it as success or excluding it silently.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="14">
          <H3>{'14. An impossible head request'}</H3>

          <Prose>
            {
              'A waiting job requires seven pages but the entire pool has six. The next job requires two pages. The policy cannot preempt or spill state. Explain why waiting on the first job forever is wrong and describe a progressing policy. What happens at deadline equal to the current tick?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {'Distinguish temporarily unavailable capacity from a request that can never fit.'}
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The seven-page request is permanently infeasible under this pool and reservation policy. Reject it explicitly, then consider the feasible job subject to the remaining reservations. Merely waiting for currently active work cannot enlarge the pool. At '
              }
              <code>{'deadline <= now'}</code>
              {
                ', expire the request before runner submission. This policy addresses this progress case without claiming a universal fairness guarantee.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="15">
          <H3>{'15. Select a candidate, not a winner'}</H3>

          <Prose>
            {
              'You require offline Windows CPU use, a supported small model and inspectable streaming. Which lesson route is a candidate, what evidence is still needed for another checkpoint, and what ranking cannot follow?'
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'Use the exact native route as scoped evidence and keep changed artifacts outside that scope.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                'The pinned llama.cpp CPU route is a candidate. For another checkpoint, verify architecture, tokenizer, conversion metadata, executable compatibility and the intended endpoint, then retain an appropriately bounded observation. The existing small-model route cannot certify that new combination. It also cannot establish fastest, cheapest or best quality among six engines. Other source-only stacks remain unknown for an unverified joint route rather than universally unsuitable.'
              }
            </Prose>
          </details>
        </section>

        <section className="lesson-exercise" data-lesson-exercise="16">
          <H3>{'16. A replica fails after partial output'}</H3>

          <Prose>
            {
              "A server replica emits two chunks, then dies. A gateway automatically repeats the request on another replica and concatenates the new stream. Does the engine's exactly-once local cleanup guarantee justify this behavior? State the missing contract."
            }
          </Prose>
          <details>
            <summary>Hint</summary>
            <Prose>
              {
                'Ask who owns already delivered output and who decides whether a second generation is a duplicate.'
              }
            </Prose>
          </details>
          <details>
            <summary>Worked solution</summary>
            <Prose>
              {
                "No. Local cleanup governs that process's reservations and terminal transitions. It does not define distributed retries, idempotency, whether generation can be reproduced, or how the client handles partial output. The gateway needs an explicit request identity and retry/partial-output policy; blindly concatenating a restarted answer can duplicate or contradict text. The next architecture lesson owns this cross-replica contract."
              }
            </Prose>
          </details>
        </section>
      </section>

      <section
        className="lesson-ending lesson-ending--further-learning"
        data-lesson-ending="further-learning"
      >
        <span id="10-primary-sources" aria-hidden="true" />
        <H2>{'Programs and further reading'}</H2>

        <Prose>
          {'The '}
          <a href={'/learn/examples/inference-engines/inference-engines-examples.zip'}>
            {'examples archive'}
          </a>
          {
            ' contains the complete files below, setup instructions, pinned source inventories and retained observations. Model weights, native binaries and the full converter repository remain separate reproducible acquisitions. Program displays present complete source, and the raw links are useful for local execution and comparison.'
          }
        </Prose>

        <NeuralTable
          caption={'Programs and further reading'}
          headers={[<>{'File'}</>, <>{'Role'}</>]}
          rows={[
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/README.md'}>{'README.md'}</a>
                {''}
              </>,
              <>{'Environment, exact commands, limitations and file map.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/request_contract.py'}>
                  {'request_contract.py'}
                </a>
                {''}
              </>,
              <>{'Validate immutable pretokenized requests.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/engine_lifecycle.py'}>
                  {'engine_lifecycle.py'}
                </a>
                {''}
              </>,
              <>{'Own admission, steps, commits and terminal release.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/packed_requests.py'}>
                  {'packed_requests.py'}
                </a>
                {''}
              </>,
              <>{'Pack complete prompts, isolate attention and scatter output rows.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/capacity_accounting.py'}>
                  {'capacity_accounting.py'}
                </a>
                {''}
              </>,
              <>{'Count reserved rows/pages and device-local bytes.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/sse_records.py'}>{'sse_records.py'}</a>
                {''}
              </>,
              <>{'Assemble UTF-8 and native data events.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/stream_client.py'}>
                  {'stream_client.py'}
                </a>
                {''}
              </>,
              <>{'Preserve raw HTTP bytes, events and clocks.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/request_metrics.py'}>
                  {'request_metrics.py'}
                </a>
                {''}
              </>,
              <>{'Calculate observable request/cohort metrics.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/engine_requirements.py'}>
                  {'engine_requirements.py'}
                </a>
                {''}
              </>,
              <>{'Filter scoped evidence without inventing support.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/compare_traces.py'}>
                  {'compare_traces.py'}
                </a>
                {''}
              </>,
              <>{'Guard matched comparisons and retain offered outcomes.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/acquire_engine.py'}>
                  {'acquire_engine.py'}
                </a>
                {''}
              </>,
              <>{'Fetch and verify the pinned binary and complete source.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/convert_checkpoint.py'}>
                  {'convert_checkpoint.py'}
                </a>
                {''}
              </>,
              <>{'Verify and convert the existing checkpoint to F16 GGUF.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/native_cpu_route.py'}>
                  {'native_cpu_route.py'}
                </a>
                {''}
              </>,
              <>{'Supervise a bounded CPU server and four clients.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/finite_study.py'}>
                  {'finite_study.py'}
                </a>
                {''}
              </>,
              <>{'Execute the declared finite correctness cases.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/engine-recipes.md'}>
                  {'engine-recipes.md'}
                </a>
                {''}
              </>,
              <>{'Complete ordinary usage routes for six engines, with execution status.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/engine-evidence.json'}>
                  {'engine-evidence.json'}
                </a>
                {''}
              </>,
              <>{'Exact primary sources and scoped propositions.'}</>,
            ],
            [
              <>
                {''}
                <a href={'/learn/examples/inference-engines/model-source-report.json'}>
                  {'model-source-report.json'}
                </a>
                {''}
              </>,
              <>{'Six-file checkpoint identity.'}</>,
            ],
          ]}
        />

        <Prose>
          {'For the scheduling foundations, '}
          <a href={'https://www.usenix.org/conference/osdi22/presentation/yu'}>
            {'Orca, OSDI 2022'}
          </a>
          {' develops iteration-level scheduling and selective batching. '}
          <a href={'https://arxiv.org/abs/2309.06180'}>{'PagedAttention'}</a>
          {
            ' develops block-based KV management and sharing; its experiments do not supply universal modern-engine performance ratios. '
          }
          <a href={'https://arxiv.org/abs/2312.07104'}>{'SGLang'}</a>
          {
            ' connects execution to structured language-model programs and prefix reuse. The maintained, pinned implementation sources linked in section 10 establish the specific interfaces discussed here.'
          }
        </Prose>

        <Prose>
          {'The '}
          <a
            href={
              'https://html.spec.whatwg.org/multipage/server-sent-events.html#interpreting-an-event-stream'
            }
          >
            {'WHATWG event-stream interpretation'}
          </a>
          {
            " supplies the framing rules behind the parser's declared subset. Return to the local source and retained byte fixtures when changing an adapter: protocol correctness is easier to check with literal records than with a model-generated paragraph alone."
          }
        </Prose>

        <Prose>
          {'For an alternate route through resource arithmetic, '}
          <a
            href={
              'https://github.com/stanford-cs336/spring2025-lectures/blob/b98b08a98d9d47a69bbdcb4e96a58aa48ee4d13b/lecture_10.py'
            }
          >
            {"Stanford CS336's inference lecture"}
          </a>
          {
            ' connects workload shape, arithmetic intensity, KV state and scheduling. Its simplified bounds should not be mistaken for measured end-to-end latency. '
          }
          <a href={'https://arxiv.org/html/2407.12391v1'}>{"Li et al.'s serving survey"}</a>
          {
            ' broadens the map to memory, scheduling, parallelism and cloud operation; its 2024 literature snapshot does not certify current API support. Use the exact implementation sources for that last step.'
          }
        </Prose>
      </section>
    </div>
  );
}
export default {
  title: 'Inference Engines & Serving',
  readTime: '75 min',
  hasIntegratedGuide: true,
  content: EngineLesson,
};
