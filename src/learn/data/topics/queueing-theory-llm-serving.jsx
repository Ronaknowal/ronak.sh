import {
  Prose,
  H2,
  H3 as SharedH3,
  CodeBlock,
} from '../../components/content';
import {
  Math as SharedInlineMath,
  MathBlock as SharedMathBlock,
} from '../../components/content/Math.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import { useCodeDownload } from '../../components/content/LessonCodeDownloads.jsx';
import {
  Table,
  Scroller,
  ClockFigure,
  WaitingFigure,
  AreaFigure,
  ArrivalFigure,
  ClientFigure,
  BirthDeathFigure,
  MeanFigure,
  TailFigure,
  ResidualFigure,
  VariabilityFigure,
  KingmanFigure,
  SharingFigure,
  PoolingFigure,
  ErlangFigure,
  FiniteFigure,
} from '../../components/lesson-labs/ServingQueueFigures.jsx';
import {
  MemoryFigure,
  IterationFigure,
  CostClockFigure,
  RoutingFigure,
  DeadlineFigure,
  RetryFigure,
  CapacityFigure,
  TraceFigure,
  ReplayFigure,
  SloFigure,
  HistogramFigure,
  LibraryFigure,
  MetricFigure,
} from '../../components/lesson-labs/ServingQueueWorkFigures.jsx';
import '../../components/lesson-labs/lesson-flow.css';
const InlineMath = ({ children }) => (
  <span className="sq-inline-math">
    <SharedInlineMath>{children}</SharedInlineMath>
  </span>
);
const MathBlock = ({ children }) => (
  <Scroller className="sq-math" label="Mathematical expression">
    <SharedMathBlock>{children}</SharedMathBlock>
  </Scroller>
);
const NeuralTable = ({ caption, headers, rows }) => (
  <Table label={caption} headers={headers} rows={rows} />
);
const headingSlug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const H3 = ({ children }) => (
  <div id={headingSlug(children)}>
    <SharedH3>{children}</SharedH3>
  </div>
);
function SupportingFile({ file }) {
  useCodeDownload({
    filename: file,
    kind: 'asset',
    downloadUrl: '/learn/examples/llm-serving-queues/' + file,
    title: file,
  });
  return null;
}

function QueueingLesson() {
  return (
    <div className="lesson-flow sq-lesson">
      <SupportingFile file="queueing-programs.zip" />
      <SupportingFile file="queueing-observations.zip" />
      <SupportingFile file="README.md" />
      <SupportingFile file="FILES.md" />
      <SupportingFile file="requirements.txt" />
      <SupportingFile file="azure-conversation-512.csv" />
      <SupportingFile file="AZURE-DATA-LICENSE.txt" />
      <LessonIntro exampleKind="Python CPU simulations">
        {
          'A request can be cheap to compute and still arrive behind a long line. A server can be busy and still spend that capacity on requests that have already timed out. To reason about serving, we need to follow both the work and the people waiting for it.'
        }
      </LessonIntro>

      <Prose>
        {
          'This lesson builds that picture from a small request timeline, then uses queue models to explain means, tails and overload. We will keep a mathematical model, a CPU simulation and a measured inference system distinct. A model helps answer a conditional question; a deployment measurement tells us whether its conditions match the system we actually serve.'
        }
      </Prose>

      <Prose opening="route">
        {
          'For a first pass, follow sections 1–6, keep the main consequences of sections 7–10, and continue through sections 11–18. The locally marked deeper mathematics develops variability, work sharing and parallel servers. You can return to those derivations after you can trace a request and identify a measurement boundary. '
        }
        <a
          href={
            '/learn/path/full-curriculum/queueing-theory-m-m-1-m-g-1-little-s-law?module=math-foundations'
          }
        >
          {"Queueing Theory: M/M/1, M/G/1 and Little's Law"}
        </a>
        {' offers additional foundations. '}
        <a
          href={
            '/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models'
          }
        >
          {'Continuous Batching'}
        </a>
        {' and '}
        <a
          href={
            '/learn/path/full-curriculum/kv-cache-memory-management?module=large-language-models'
          }
        >
          {'KV-Cache & Memory Management'}
        </a>
        {
          ' explain the broader serving mechanisms; the calculations here are self-contained.'
        }
      </Prose>

      <span id="1-why-it-exists" aria-hidden="true" />
      <span id="1-start-with-the-problem" aria-hidden="true" />
      <span id="6-visual-walkthrough" aria-hidden="true" />
      <H2>{"1. Follow one request's clocks"}</H2>

      <ClockFigure />

      <Prose>
        {
          'Request A arrives at time 0. It first receives execution at time 1. Its output tokens arrive at times 3, 3.4 and 4 seconds. The ruler shows these events on one clock. The gap before execution is different from the time before the first response, and neither is the complete response time.'
        }
      </Prose>

      <Prose>
        {'The request waited 1 second before execution. Its '}
        <strong>{'time to first token'}</strong>
        {', or TTFT, is 3 seconds. Its two '}
        <strong>{'inter-token latencies'}</strong>
        {
          ', or ITLs, are 0.4 and 0.6 seconds. The average over these two gaps is 0.5 seconds per subsequent output token. We call this request-average quantity '
        }
        <strong>{'time per output token'}</strong>
        {', or TPOT. Its '}
        <strong>{'end-to-end response time'}</strong>
        {', from arrival to the last output, is 4 seconds.'}
      </Prose>

      <Prose>
        {'For output timestamps '}
        <InlineMath>{'t_1,\\ldots,t_O'}</InlineMath>
        {' and arrival '}
        <InlineMath>{'a'}</InlineMath>
        {', the relations are:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {'\\mathrm{TTFT}=t_1-a,\\qquad \\mathrm{ITL}_j=t_{j+1}-t_j.'}
        </MathBlock>
      </div>

      <div className="sq-equation">
        <MathBlock>
          {'\\mathrm{TPOT}=\\frac{t_O-t_1}{O-1}\\quad(O>1),\\qquad T=t_O-a.'}
        </MathBlock>
      </div>

      <Prose>
        {
          'A one-token output has a TTFT and a complete response time, but no between-token gap. Its TPOT is undefined, not zero. A canceled request with no output has no TTFT. That distinction matters when a report silently excludes requests that never produce a first token.'
        }
      </Prose>

      <Prose>
        {
          'Prefill processes the prompt and produces the first output token. Subsequent decode iterations consume the previously generated token and produce the next one. These are sequential phases of one request; they do not prove that the distribution of whole-request service times has two modes. Workloads, lengths, batches and hardware determine that distribution.'
        }
      </Prose>

      <Prose>
        {
          'Choose a clock boundary before comparing measurements. A client can include network and transport time. An engine can begin its clock when tokenization starts or when the scheduler receives a request. These are different intervals even for the same request. We will return to actual vLLM metric boundaries in section 16.'
        }
      </Prose>

      <Prose>
        {'The complete '}
        <code>{'queue_trace.py'}</code>
        {' program implements '}
        <code>{'token_clocks(arrival, scheduled, outputs)'}</code>
        {'. It subtracts the actual timestamps, retains each gap, and returns '}
        <code>{'None'}</code>
        {
          ' when a quantity does not exist. Move the middle output on the ruler: a later token lengthens one gap and may shorten the next. Move it past the final output and the input becomes invalid; the program does not report a negative latency.'
        }
      </Prose>

      <span id="4-from-scratch-implementation" aria-hidden="true" />
      <H2>{'2. Construct the waiting line'}</H2>

      <WaitingFigure />

      <Prose>
        {
          'Now give one server four requests. A arrives at 0 and needs 3 seconds of uninterrupted service. B arrives at 1 and needs 1 second. C arrives at 2 and needs 2 seconds. D arrives at 6 and needs 1 second. Each hue identifies the same request throughout the timeline: dashed waiting strokes, solid occupied intervals and departure dots.'
        }
      </Prose>

      <Prose>
        {
          'The server runs A from 0 to 3. B waits until 3, then runs to 4. C starts at 4 and finishes at 6. D arrives exactly when C finishes and runs to 7. This is '
        }
        <strong>{'first come, first served'}</strong>
        {
          ', or FCFS: an arrival joins the tail, and the oldest waiting request takes the next available service slot.'
        }
      </Prose>

      <NeuralTable
        caption={'2. Construct the waiting line'}
        headers={[
          <>{'Request'}</>,
          <>{'Arrival'}</>,
          <>{'Service'}</>,
          <>{'Start'}</>,
          <>{'Departure'}</>,
          <>{'Wait'}</>,
          <>{'Residence'}</>,
        ]}
        rows={[
          [
            <>{'A'}</>,
            <>{'0'}</>,
            <>{'3'}</>,
            <>{'0'}</>,
            <>{'3'}</>,
            <>{'0'}</>,
            <>{'3'}</>,
          ],
          [
            <>{'B'}</>,
            <>{'1'}</>,
            <>{'1'}</>,
            <>{'3'}</>,
            <>{'4'}</>,
            <>{'2'}</>,
            <>{'3'}</>,
          ],
          [
            <>{'C'}</>,
            <>{'2'}</>,
            <>{'2'}</>,
            <>{'4'}</>,
            <>{'6'}</>,
            <>{'2'}</>,
            <>{'4'}</>,
          ],
          [
            <>{'D'}</>,
            <>{'6'}</>,
            <>{'1'}</>,
            <>{'6'}</>,
            <>{'7'}</>,
            <>{'0'}</>,
            <>{'1'}</>,
          ],
        ]}
      />

      <Prose>
        {'Times are seconds. '}
        <strong>{'Residence'}</strong>
        {', or total response time '}
        <InlineMath>{'T'}</InlineMath>
        {', includes wait plus service. '}
        <strong>{'Queue wait'}</strong> <InlineMath>{'T_q'}</InlineMath>
        {' ends when service starts. The service duration '}
        <InlineMath>{'S'}</InlineMath>
        {' is how long this fixed server needs after starting. Here '}
        <InlineMath>{'T=T_q+S'}</InlineMath>
        {' for each request.'}
      </Prose>

      <Prose>
        {'Let '}
        <InlineMath>{'a_i'}</InlineMath>
        {' be arrival, '}
        <InlineMath>{'s_i'}</InlineMath>
        {' service, '}
        <InlineMath>{'b_i'}</InlineMath>
        {' start and '}
        <InlineMath>{'d_i'}</InlineMath>
        {' departure. Chronological FCFS requests obey:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>{'b_i=\\max(a_i,d_{i-1}),\\qquad d_i=b_i+s_i.'}</MathBlock>
      </div>

      <div className="sq-equation">
        <MathBlock>{'T_{q,i}=b_i-a_i,\\qquad T_i=d_i-a_i.'}</MathBlock>
      </div>

      <Prose>
        {
          'The maximum has a physical meaning: a request cannot start before it arrives or before the previous occupant leaves. '
        }
        <code>{'fcfs()'}</code>
        {' in '}
        <code>{'queue_trace.py'}</code>
        {
          ' is that recurrence, using clear records rather than an unexplained latency multiplier. Tied arrivals keep input order. A departure at the same time as an arrival frees capacity first in the event simulator.'
        }
      </Prose>

      <Prose>
        {'Another useful form tracks wait from one arrival to the next. If '}
        <InlineMath>{'x_{i+1}=a_{i+1}-a_i'}</InlineMath>
        {' is the next interarrival gap,'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>{'T_{q,i+1}=\\max(0,T_{q,i}+s_i-x_{i+1}).'}</MathBlock>
      </div>

      <Prose>
        {
          "This is Lindley's recurrence. Work accumulates when the gap is too short to drain the work already ahead. A long gap drains the queue, after which the server can sit idle. Increase A's service to 5 seconds and watch the later waiting strokes grow. Move D far enough right and an idle interval appears; the server is not continuously busy merely because four requests were submitted."
        }
      </Prose>

      <Prose>
        {'Download the complete '}
        <a href={'/learn/examples/llm-serving-queues/queueing-programs.zip'}>
          {'program archive'}
        </a>
        {', '}
        <a href={'/learn/examples/llm-serving-queues/FILES.md'}>
          {'file index'}
        </a>
        {' and '}
        <a href={'/learn/examples/llm-serving-queues/README.md'}>
          {'setup guide'}
        </a>
        {
          ' before reproducing the examples. The nine programs use Python 3.12, NumPy 2.3.5 and SimPy 4.1.2 on CPU. The full files, including their imports and executable entry points, appear beside the relevant sections. They simulate declared queue mechanisms; they do not invoke a model or measure GPU speed.'
        }
      </Prose>

      <CodeBlock language={'text'}>
        {'python queue_trace.py --left 0 --right 7'}
      </CodeBlock>

      <Prose>
        {'Read the '}
        <code>{'records'}</code>
        {' output against the timeline. '}
        <code>{'arrival'}</code>
        {', '}
        <code>{'start'}</code>
        {' and '}
        <code>{'departure'}</code>
        {' determine each interval. '}
        <code>{'wait'}</code>
        {' and '}
        <code>{'residence'}</code>
        {
          ' are derived from those events, not independently supplied estimates. Next we will compute the population through a second route.'
        }
      </Prose>

      <span id="2-core-intuition" aria-hidden="true" />
      <span id="2-build-the-intuition" aria-hidden="true" />
      <H2>{"3. Count area before invoking Little's law"}</H2>

      <AreaFigure />

      <Prose>
        {'At a time '}
        <InlineMath>{'t'}</InlineMath>
        {', let '}
        <InlineMath>{'N(t)'}</InlineMath>
        {' count requests inside our boundary: arrived but not departed. Let '}
        <InlineMath>{'Q(t)'}</InlineMath>
        {
          ' count those still waiting for service. Both are instantaneous counts. The staircase changes when requests enter, start or leave.'
        }
      </Prose>

      <Prose>
        {
          'Each resident contributes one unit of height while it is inside. Its rectangle has area equal to its residence time. A contributes 3 request-seconds, B 3, C 4 and D 1: the system area is 11 request-seconds. Waiting rectangles contribute 0, 2, 2 and 0: the queue area is 4 request-seconds. The time-average populations on '
        }
        <InlineMath>{'[0,7]'}</InlineMath>
        {' are therefore '}
        <InlineMath>{'11/7'}</InlineMath>
        {' in the system and '}
        <InlineMath>{'4/7'}</InlineMath>
        {' waiting.'}
      </Prose>

      <Prose>
        {'These counts are not constant. A mean of '}
        <InlineMath>{'11/7'}</InlineMath>
        {
          ' does not mean there are 1.571 requests present “at all times.” The actual count is an integer staircase, whose area determines the mean.'
        }
      </Prose>

      <Prose>
        {
          'In this fully drained fixture, four requests complete in seven seconds. Their mean residence is '
        }
        <InlineMath>{'11/4'}</InlineMath>
        {' seconds. The same data give:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {'\\frac{11}{7}=\\frac{4}{7}\\times\\frac{11}{4}.'}
        </MathBlock>
      </div>

      <Prose>
        {
          "Little's law generalizes this accounting to a long-run mean: under matching boundaries and appropriate finite limits,"
        }
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            'L=\\lambda_{\\mathrm{eff}}\\,\\mathbb E[T],\\qquad L_q=\\lambda_{\\mathrm{eff}}\\,\\mathbb E[T_q].'
          }
        </MathBlock>
      </div>

      <Prose>
        {''}
        <InlineMath>{'L'}</InlineMath>
        {' and '}
        <InlineMath>{'L_q'}</InlineMath>
        {' are mean populations. '}
        <InlineMath>{'\\lambda_{\\mathrm{eff}}'}</InlineMath>
        {
          ' is throughput through the population being counted, in requests per second. '
        }
        <InlineMath>{'\\mathbb E[T]'}</InlineMath>
        {
          " denotes the average residence under the corresponding long-run law. Units check the relation: requests/second multiplied by seconds gives requests. Little's law is a conservation relationship; it does not require exponential service, FCFS or a Poisson arrival model when its limiting conditions hold."
        }
      </Prose>

      <Prose>
        {'Finite windows need more care. On '}
        <InlineMath>{'[u,v]'}</InlineMath>
        {', request '}
        <InlineMath>{'i'}</InlineMath>
        {' contributes only its clipped residence:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\int_u^v N(t)\\,dt=\\sum_i\\max\\bigl(0,\\min(d_i,v)-\\max(a_i,u)\\bigr).'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'The sum includes residents arriving before the left boundary and still inside after the right boundary. On '
        }
        <InlineMath>{'[2,5]'}</InlineMath>
        {', A contributes 1 second, B 2 and C 3: area 6. On '}
        <InlineMath>{'[1,5]'}</InlineMath>
        {
          ', the area is 8, while the full residences of the two requests completing in that window sum to 6. A completion-only average and a clipped time-average population have different finite boundaries. Their product need not agree.'
        }
      </Prose>

      <Prose>
        {"The program's "}
        <code>{'occupancy_sweep()'}</code>
        {' builds counts from arrival/departure event deltas. '}
        <code>{'measure()'}</code>
        {
          ' also sums independently clipped residence intervals and compares the areas. Calculating '
        }
        <InlineMath>{'L=\\lambda\\bar T'}</InlineMath>
        {
          ' and then calling that same calculation a validation would be circular. The event sweep gives us a separate route.'
        }
      </Prose>

      <Prose>
        {
          'The chosen serving boundary matters just as much. An external CPU waiting queue may hold requests that have no GPU KV allocation. Another population may count only admitted requests with resident cache state. A mean of 200 requests in an API boundary does not prove 200 simultaneously allocated GPU sequences. Memory needs actual admitted lengths, block ownership, sharing and reservations, which section 12 draws separately.'
        }
      </Prose>

      <RemoteCodeBlock
        source="/learn/examples/llm-serving-queues/queue_trace.py"
        filename="queue_trace.py"
        language="python"
        title="queue_trace.py"
      />

      <H2>{'4. Describe arrivals beyond their mean'}</H2>

      <ArrivalFigure />
      <ClientFigure />

      <Prose>
        {
          'Two workloads can offer the same number of requests in a minute and produce different waiting. Regularly spaced arrivals give the server repeated opportunities to drain work. Bunched arrivals can fill the waiting line at once and then leave capacity idle later. The dots on the clock retain actual positions; the mean arrival rate alone cannot reconstruct them.'
        }
      </Prose>

      <Prose>
        {'An '}
        <strong>{'interarrival time'}</strong>
        {
          ' is the gap between successive requests. Its coefficient of variation is standard deviation divided by mean. We usually work with its square,'
        }
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {'C_a^2=\\frac{\\operatorname{Var}(X)}{\\mathbb E[X]^2},'}
        </MathBlock>
      </div>

      <Prose>
        {'where '}
        <InlineMath>{'X'}</InlineMath>
        {
          ' is an interarrival gap. Do not calculate this from absolute timestamp variance. An ideal Poisson arrival process has independent exponential gaps and '
        }
        <InlineMath>{'C_a^2=1'}</InlineMath>
        {'. Constant independent gaps have '}
        <InlineMath>{'C_a^2=0'}</InlineMath>
        {
          '. A large observed value indicates variable gaps, but it does not by itself identify the arrival process or prove a stationary burst model.'
        }
      </Prose>

      <Prose>
        {
          'Counts in bins offer another view. Their variance-to-mean ratio depends on bin width, the observation window and traffic changes. The real trace later contains a partial final bin; we will report that limitation instead of using a dispersion statistic as a Poisson certificate. Correlated bursts also contain information that an independent-gap model discards.'
        }
      </Prose>

      <Prose>
        {'Load tests can change the input process. In an '}
        <strong>{'open'}</strong>
        {
          ' test, an external schedule continues to submit requests at its planned times. In a '
        }
        <strong>{'closed'}</strong>
        {
          ' test, a fixed set of clients submits replacements only after prior requests finish. Slow responses then delay later arrivals. The closed test may keep a fixed concurrency while hiding how an independently arriving workload would overload the system. This is a form of coordinated omission: missing arrivals remove precisely the work that would have arrived during a slowdown.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'generate_requests()'}</code>
        {' in '}
        <code>{'event_queues.py'}</code>
        {
          ' creates a declared Poisson stream and an independent service stream from separate seeded generators. '
        }
        <code>{'closed_client_arrivals()'}</code>
        {
          ' constructs the different offered schedule for a fixed-concurrency fixture. Change service duration in the drawing: the open schedule stays fixed; the closed replacement timestamps move. Simulated parallel time is an event coordinate, not Python thread parallelism or elapsed CPU benchmark time.'
        }
      </Prose>

      <span id="3-mathematical-foundation" aria-hidden="true" />
      <span id="3-make-the-idea-precise" aria-hidden="true" />
      <H2>{'5. Model one fixed-rate stochastic server'}</H2>

      <BirthDeathFigure />
      <MeanFigure />

      <Prose>
        {
          'The state chain counts residents: 0, 1, 2 and onward. Arrivals increase the state by one; service completions decrease it. This simple object becomes analytically tractable under specific assumptions. An '
        }
        <strong>{'M/M/1'}</strong>
        {' queue has Poisson arrivals at rate '}
        <InlineMath>{'\\lambda'}</InlineMath>
        {', independent exponential service times with mean '}
        <InlineMath>{'1/\\mu'}</InlineMath>
        {
          ', and one server. We additionally choose FCFS, unlimited waiting capacity and a constant service rate independent of the state.'
        }
      </Prose>

      <Prose>
        {
          'The exponential distribution is memoryless: conditional on a service still running, its remaining duration has the same distribution as a fresh duration. This is a model assumption, not a claim about every LLM request. Prompt/output lengths and batching can make actual work very different.'
        }
      </Prose>

      <Prose>
        {'The traffic intensity is '}
        <InlineMath>{'\\rho=\\lambda/\\mu=\\lambda\\mathbb E[S]'}</InlineMath>
        {'. With '}
        <InlineMath>{'\\rho<1'}</InlineMath>
        {', stationary probabilities exist. A stationary probability '}
        <InlineMath>{'\\pi_n'}</InlineMath>
        {' is the long-run probability of '}
        <InlineMath>{'n'}</InlineMath>
        {' residents. The adjacent flow balance is:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\pi_n\\lambda=\\pi_{n+1}\\mu\\quad\\Rightarrow\\quad \\pi_{n+1}=\\rho\\pi_n.'
          }
        </MathBlock>
      </div>

      <H3>{'Deeper mathematics: normalize the count law'}</H3>

      <Prose>
        {'Iterating gives '}
        <InlineMath>{'\\pi_n=\\pi_0\\rho^n'}</InlineMath>
        {'. The geometric sum is finite only when '}
        <InlineMath>{'\\rho<1'}</InlineMath>
        {', and normalization gives '}
        <InlineMath>{'\\pi_0=1-\\rho'}</InlineMath>
        {'. Thus:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\pi_n=(1-\\rho)\\rho^n,\\quad L=\\frac{\\rho}{1-\\rho},\\quad L_q=\\frac{\\rho^2}{1-\\rho}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {'The population mean is the probability-weighted count '}
        <InlineMath>{'\\sum n\\pi_n'}</InlineMath>
        {'; differentiating the geometric sum gives '}
        <InlineMath>{'\\sum n\\rho^n=\\rho/(1-\\rho)^2'}</InlineMath>
        {'. The server is occupied with probability '}
        <InlineMath>{'1-\\pi_0=\\rho'}</InlineMath>
        {', so subtracting that one possible occupant from '}
        <InlineMath>{'L'}</InlineMath>
        {' gives '}
        <InlineMath>{'L_q=L-\\rho'}</InlineMath>
        {
          '. The distinction between residents and waiting residents is doing the work in the derivation.'
        }
      </Prose>

      <Prose>
        {'Using the matching mean relation and subtracting mean service gives:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\mathbb E[T]=\\frac{1}{\\mu-\\lambda},\\qquad \\mathbb E[T_q]=\\frac{\\rho}{\\mu-\\lambda}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {'With '}
        <InlineMath>{'\\mu=1'}</InlineMath>
        {' request/second and '}
        <InlineMath>{'\\lambda=.9'}</InlineMath>
        {
          ' requests/second, mean total response is 10 seconds; mean queue wait is 9 seconds. They are not the same “wait.” The denominator measures spare capacity in this model. As it approaches zero from above, both means grow without bound.'
        }
      </Prose>

      <Prose>
        {'At '}
        <InlineMath>{'\\rho\\ge1'}</InlineMath>
        {
          ', this unlimited system has no finite stationary population law. A finite simulation can still produce an average, but that average is not evidence of stationary stability. At '
        }
        <InlineMath>{'\\lambda=0'}</InlineMath>
        {
          ', the population is empty; an isolated test request can still have exponential service of mean '
        }
        <InlineMath>{'1/\\mu'}</InlineMath>
        {
          '. Dividing zero population by zero measured throughput does not estimate a residence time.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'mm1()'}</code>
        {' in '}
        <code>{'queue_formulas.py'}</code>
        {
          ' reports the stationary assumptions and refuses to invent finite stationary values at overload. Move the load marker along the curve while keeping '
        }
        <InlineMath>{'\\mu'}</InlineMath>
        {' fixed, then change '}
        <InlineMath>{'\\mu'}</InlineMath>
        {
          '. A utilization target alone cannot guarantee a fixed number of seconds: the service time scale matters, and the assumptions may not match a real engine.'
        }
      </Prose>

      <H2>{'6. Separate response tails from waiting tails'}</H2>

      <TailFigure />

      <Prose>
        {
          'A survival curve answers “what fraction takes longer than this time?” At time zero, total response survival begins at 1: an exponential positive service takes some time. Queue wait is different. A stationary FCFS M/M/1 arrival finds an idle server with probability '
        }
        <InlineMath>{'1-\\rho'}</InlineMath>
        {
          ' and waits zero seconds. That mass at zero is visible beside the waiting curve.'
        }
      </Prose>

      <Prose>
        {'For nonnegative '}
        <InlineMath>{'t'}</InlineMath>
        {', the exact stationary FCFS relations are:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\Pr(T>t)=e^{-(\\mu-\\lambda)t},\\qquad \\Pr(T_q>t)=\\rho e^{-(\\mu-\\lambda)t}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {'To connect this with the state chain, an arrival seeing '}
        <InlineMath>{'n'}</InlineMath>
        {' residents must wait through '}
        <InlineMath>{'n'}</InlineMath>
        {
          " service phases and then its own. Memorylessness gives an exponential remaining phase even for the currently busy request. Mixing these phase sums over the geometric resident probabilities from Section 5 yields the exponential total-response law. Waiting omits the request's own phase and includes arrivals seeing an empty system, which explains its separate zero atom."
        }
      </Prose>

      <Prose>
        {'The prefactor belongs to queue wait, not total response. A '}
        <strong>{'p99'}</strong>
        {
          ' is a time below which 99% of the named quantity falls; it is not an average. For a probability '
        }
        <InlineMath>{'0\\le p<1'}</InlineMath>
        {':'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>{'t_p=\\frac{-\\ln(1-p)}{\\mu-\\lambda}.'}</MathBlock>
      </div>

      <div className="sq-equation">
        <MathBlock>
          {
            't_{q,p}=\\begin{cases}0,&p\\le1-\\rho,\\\\[2pt]\\frac{\\ln(\\rho/(1-p))}{\\mu-\\lambda},&p>1-\\rho.\\end{cases}'
          }
        </MathBlock>
      </div>

      <Prose>
        {'At '}
        <InlineMath>{'\\lambda=.9'}</InlineMath>
        {' and '}
        <InlineMath>{'\\mu=1'}</InlineMath>
        {
          ', total p99 is about 46.052 seconds and queue-wait p99 about 44.998 seconds. At sufficiently low percentile, waiting quantile is exactly zero because the idle-arrival mass already covers that fraction. The distribution has unbounded support: a theoretical p100 is not a finite maximum.'
        }
      </Prose>

      <Prose>
        {'The ratio total p99/p50 is '}
        <InlineMath>{'\\ln(100)/\\ln(2)\\approx6.644'}</InlineMath>
        {
          ' for this exponential total-response law. It is not a universal ratio for serving systems. Changing distributions, policy, admission, batching or a clock boundary can change tails without preserving that ratio.'
        }
      </Prose>

      <Prose>
        {'Suppose this model must satisfy '}
        <InlineMath>{'\\Pr(T>d)\\le\\epsilon'}</InlineMath>
        {', a miss probability target at deadline '}
        <InlineMath>{'d'}</InlineMath>
        {'. Rearranging gives:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>{'\\lambda\\le\\mu+\\frac{\\ln\\epsilon}{d}.'}</MathBlock>
      </div>

      <Prose>
        {
          'If the right side is negative, even an isolated exponential service misses the target too often. Adding an unlimited number of identical replicas does not change the isolated service distribution. Faster service or a different service law would be needed. If the bound is positive, it is a conditional capacity calculation for this model; real SLO planning still needs actual traffic/service measurements and the correct architecture.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'mm1()'}</code>
        {' reports both quantiles and deadline survival. '}
        <code>{'mm1_slo_capacity()'}</code>
        {
          ' separately identifies an infeasible isolated-service target. Change deadline, load or service rate and read the selected point on the same curve. Do not use a mean value where the decision asks for a tail probability.'
        }
      </Prose>

      <H2>{'7. A long job is seen more often'}</H2>

      <ResidualFigure />
      <VariabilityFigure />

      <Prose>
        {
          'Imagine observing the server at a uniformly chosen busy instant. A long job occupies more clock time, so it is more likely to be the job you encounter. This is the '
        }
        <strong>{'inspection paradox'}</strong>
        {
          ': sampling jobs and sampling occupied time produce different distributions.'
        }
      </Prose>

      <Prose>
        {
          'The first-pass consequence is that equal mean service times can produce different waits. The longer jobs occupy disproportionate time, delaying arrivals behind them. The next derivation explains which moment captures this effect.'
        }
      </Prose>

      <H3>{'Deeper mathematics: service variability and residual work'}</H3>

      <Prose>
        {'On a job of duration '}
        <InlineMath>{'s'}</InlineMath>
        {', remaining service falls from '}
        <InlineMath>{'s'}</InlineMath>
        {' to zero. Its residual triangle has area '}
        <InlineMath>{'s^2/2'}</InlineMath>
        {
          '. Summing those triangles and dividing by occupied time explains the mean remaining service seen at a random busy instant:'
        }
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {'\\mathbb E[R]=\\frac{\\mathbb E[S^2]}{2\\mathbb E[S]}.'}
        </MathBlock>
      </div>

      <Prose>
        {''}
        <InlineMath>{'\\mathbb E[S^2]'}</InlineMath>
        {
          ' is the second moment, not the square of the mean. Compare three distributions with mean 1 second. Constant service has second moment 1 s². Exponential service with mean 1 second has second moment 2 s². A two-point mixture gives .5 seconds with probability .9 and 5.5 seconds with probability .1; its second moment is 3.25 s². Although only 10% of jobs are long, those jobs occupy 55% of the expected service work. A time observation sees them disproportionately often.'
        }
      </Prose>

      <Prose>
        {
          'Poisson arrivals see the time-average state under the appropriate independence conditions, a property called '
        }
        <strong>{'PASTA'}</strong>
        {
          ': Poisson arrivals see time averages. An arrival finds a busy server with probability '
        }
        <InlineMath>{'\\rho'}</InlineMath>
        {', contributing mean residual work '}
        <InlineMath>
          {'\\rho\\mathbb E[R]=\\lambda\\mathbb E[S^2]/2'}
        </InlineMath>
        {'. It also waits for the queued jobs, whose expected work is '}
        <InlineMath>{'L_q\\mathbb E[S]'}</InlineMath>
        {'. The mean area relation gives '}
        <InlineMath>{'L_q=\\lambda\\mathbb E[T_q]'}</InlineMath>
        {'. Therefore:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\begin{aligned}\n\\mathbb E[T_q]&=\\lambda\\mathbb E[S^2]/2+\\lambda\\mathbb E[T_q]\\mathbb E[S],\\\\\n(1-\\rho)\\mathbb E[T_q]&=\\lambda\\mathbb E[S^2]/2.\n\\end{aligned}'
          }
        </MathBlock>
      </div>

      <Prose>
        {'Dividing by the remaining load fraction yields the FCFS M/G/1 '}
        <strong>{'Pollaczek–Khinchine'}</strong>
        {', or P-K, mean relation:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\mathbb E[T_q]=\\frac{\\lambda\\mathbb E[S^2]}{2(1-\\rho)},\\qquad \\rho=\\lambda\\mathbb E[S].'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'Here the arrival process remains Poisson but service is general, independent and has a finite second moment. At '
        }
        <InlineMath>{'\\lambda=.8'}</InlineMath>
        {
          ' and mean service 1 second, the three mean waits are 2, 4 and 6.5 seconds. Equal average work does not imply equal average waiting.'
        }
      </Prose>

      <Prose>
        {'The service squared coefficient of variation is '}
        <InlineMath>{'C_s^2=\\mathbb E[S^2]/\\mathbb E[S]^2-1'}</InlineMath>
        {'. Rewriting the relation gives '}
        <InlineMath>{'(1+C_s^2)/2'}</InlineMath>
        {
          ' times the corresponding M/M/1 mean wait. A very variable service law can produce large waits even at modest utilization. With an infinite second moment, this finite-mean waiting formula no longer yields a finite wait, despite finite mean service and '
        }
        <InlineMath>{'\\rho<1'}</InlineMath>
        {'.'}
      </Prose>

      <Prose>
        {''}
        <code>{'pk()'}</code>
        {
          ' validates the moments and calculates the mean. It leaves the tail quantile unknown. The stationary simulations later compare all three declared distributions using the same prospective seeds and budgets. Their finite deviations are observations, not a reason to tune the example until every row matches a theorem.'
        }
      </Prose>

      <H2>{'8. Estimate a general single-server mean'}</H2>

      <KingmanFigure />

      <Prose>
        {
          'If arrival gaps vary too, both arrival and service variability matter. The same mean offered load can conceal a very different line of waiting work. The useful first-pass rule is to inspect both sources of variability and the single-server assumptions before relying on a mean approximation.'
        }
      </Prose>

      <H3>{'Deeper mathematics: the variability, load and time factors'}</H3>

      <Prose>
        {
          'An independent renewal arrival process can have nonexponential gaps. The general GI/G/1 queue has independent identically distributed interarrival gaps and independent general service durations. The familiar Kingman heavy-traffic approximation expresses mean queue wait through three factors:'
        }
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\mathbb E[T_q]\\approx\\frac{C_a^2+C_s^2}{2}\\;\\frac{\\rho}{1-\\rho}\\;\\mathbb E[S].'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'The first factor measures arrival/service variability. The second amplifies congestion near capacity. The third restores seconds. With '
        }
        <InlineMath>{'C_a^2=4'}</InlineMath>
        {', '}
        <InlineMath>{'C_s^2=1'}</InlineMath>
        {', '}
        <InlineMath>{'\\rho=.8'}</InlineMath>
        {
          ' and mean service 1 second, the approximate mean wait is 10 seconds. The figure changes these operands directly rather than suggesting that “bursty traffic” has one universal multiplier.'
        }
      </Prose>

      <Prose>
        {'For exponential arrivals, '}
        <InlineMath>{'C_a^2=1'}</InlineMath>
        {
          ' and the expression agrees with the exact FCFS P-K mean. Constant arrivals and service at a feasible regular spacing can have zero wait. General independent inputs require an approximation; there is no universal rho threshold at which its error becomes guaranteed small.'
        }
      </Prose>

      <Prose>
        {
          'Correlated arrivals, state-dependent service, infinite variances or multiple servers do not automatically satisfy this model. Dividing service time by a server count and retaining the same congestion expression is not a general multiserver theorem. We will model pooled exponential servers with Erlang C instead.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'kingman()'}</code>
        {
          ' names the approximate output and its assumptions. Mark the arrival process as correlated in the drawing and its applicability changes; the lab must not invent an unexplained correlation correction. The measured workload can still be simulated from its actual timestamps, provided we clearly specify the service model.'
        }
      </Prose>

      <H2>{'9. Share work without creating capacity'}</H2>

      <SharingFigure />

      <Prose>
        {'FCFS makes a small job wait behind a long one. '}
        <strong>{'Processor sharing'}</strong>
        {
          ', or PS, instead divides a fixed aggregate work rate equally among active jobs. Preemption is costless and arbitrarily fine in this ideal model.'
        }
      </Prose>

      <Prose>
        {
          'Let the server complete one work unit per second. A arrives at 0 with 4 work units. At 1, A has 3 left and B arrives with 1. Each now receives half a work unit per second. B finishes at 3; A has 1 left, receives the full rate and finishes at 5. FCFS would finish A at 4 and B at 5. Sharing changes who completes first, while total submitted work stays 5.'
        }
      </Prose>

      <Prose>
        {
          "The drawing's slopes make this conservation visible. Each active request has slope "
        }
        <InlineMath>{'v/n'}</InlineMath>
        {' when aggregate capacity is '}
        <InlineMath>{'v'}</InlineMath>
        {' work units/second and there are '}
        <InlineMath>{'n'}</InlineMath>
        {' active requests. Summing the slopes gives '}
        <InlineMath>{'v'}</InlineMath>
        {', not '}
        <InlineMath>{'nv'}</InlineMath>
        {
          ". Doubling the number of active requests cannot double this model's aggregate throughput."
        }
      </Prose>

      <Prose>
        {
          'The next event is either a new arrival or the earliest completion under current shares. '
        }
        <code>{'processor_sharing.py'}</code>
        {
          ' advances directly to that event, subtracts attained work from every active job and updates the sharing set. It does not use a coarse fixed timestep that overshoots completion. Work units and service-time seconds remain distinct when capacity changes.'
        }
      </Prose>

      <H3>{'Deeper mathematics: ideal processor sharing'}</H3>

      <Prose>
        {'In the stationary ideal M/G/1 PS model with '}
        <InlineMath>{'\\rho=\\lambda\\mathbb E[S]<1'}</InlineMath>
        {', where '}
        <InlineMath>{'S'}</InlineMath>
        {' is isolated service time at the fixed capacity,'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\mathbb E[T\\mid S=s]=\\frac{s}{1-\\rho},\\qquad \\mathbb E[T]=\\frac{\\mathbb E[S]}{1-\\rho}.'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'These are total residence means, not “time before service starts.” Every positive PS job begins receiving a share immediately. Means alone do not supply its p99. Real token batches have discrete iterations, memory limits and batch-dependent execution cost. Calling them ideal PS because they interleave requests would hide the mechanism we need to measure. Section 12 draws that mechanism directly.'
        }
      </Prose>

      <Prose>
        {
          "Change B's arrival or work and reconstruct the completion order. A zero-work job completes immediately. Scaling aggregate capacity changes the time axis but preserves total work. The complete program independently integrates population and checks attained work rather than defining its own population from Little's product."
        }
      </Prose>

      <RemoteCodeBlock
        source="/learn/examples/llm-serving-queues/processor_sharing.py"
        filename="processor_sharing.py"
        language="python"
        title="processor_sharing.py"
      />

      <span id="8-what-scales-and-what-doesn-t" aria-hidden="true" />
      <H2>{'10. Pool servers, rather than just their specifications'}</H2>

      <PoolingFigure />

      <Prose>
        {
          'Suppose two identical workers can each serve one request at a time. With '
        }
        <strong>{'separate queues'}</strong>
        {
          ", a new request chooses a worker and waits behind that worker's requests. One worker can be idle while the other has a queue. With a "
        }
        <strong>{'pooled queue'}</strong>
        {
          ', either idle worker takes the next waiting request. Pooling removes that particular imbalance; it does not make either worker individually faster.'
        }
      </Prose>

      <Prose>
        {
          "Trace the same arrivals and service requirements through both drawings. Waiting ends when a specific service lane becomes available. A third drawing replaces the two workers with one faster worker. This is a different system: it cannot serve two requests simultaneously, but it can complete one isolated request sooner. Adding up workers' service rates does not make all three diagrams equivalent."
        }
      </Prose>

      <Prose>
        {''}
        <code>{'event_queues.py'}</code>
        {
          " represents a pooled FIFO queue using a deque and a heap of idle server IDs. Each departure releases its actual server; only then can an admitted waiting request start there. The heap's stable server IDs resolve ties reproducibly. The simulator can also stop at a cutoff, retaining unfinished records and their planned departure separately from a departure that was actually observed."
        }
      </Prose>

      <H3>{'Deeper mathematics: M/M/c and Erlang C'}</H3>

      <ErlangFigure />

      <Prose>
        {'An '}
        <strong>{'M/M/c'}</strong>
        {' queue has Poisson arrivals at rate '}
        <InlineMath>{'\\lambda'}</InlineMath>
        {', '}
        <InlineMath>{'c'}</InlineMath>
        {' identical independent workers, exponential service at rate '}
        <InlineMath>{'\\mu'}</InlineMath>
        {
          ' per worker, and one infinite FCFS waiting queue. Its population state '
        }
        <InlineMath>{'n'}</InlineMath>
        {' loses requests at rate '}
        <InlineMath>{'\\min(n,c)\\mu'}</InlineMath>
        {'. Up to '}
        <InlineMath>{'c'}</InlineMath>
        {
          ' requests can be in service; additional residents wait. Stability requires '
        }
        <InlineMath>{'\\lambda<c\\mu'}</InlineMath>
        {'.'}
      </Prose>

      <Prose>
        {'Write '}
        <InlineMath>{'a=\\lambda/\\mu'}</InlineMath>
        {' for offered work in worker units and '}
        <InlineMath>{'\\rho=a/c'}</InlineMath>
        {'. The probability an arriving request must wait is '}
        <strong>{'Erlang C'}</strong>
        {', denoted '}
        <InlineMath>{'C'}</InlineMath>
        {':'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\begin{aligned}\np_0^{-1}&=\\sum_{n=0}^{c-1}\\frac{a^n}{n!}+\\frac{a^c}{c!(1-\\rho)},\\\\\nC&=p_0\\frac{a^c}{c!(1-\\rho)},\\\\\n\\mathbb E[T_q]&=\\frac{C}{c\\mu-\\lambda},\\\\\n\\mathbb E[T]&=\\frac1\\mu+\\mathbb E[T_q].\n\\end{aligned}'
          }
        </MathBlock>
      </div>

      <Prose>
        {'At '}
        <InlineMath>{'c=2'}</InlineMath>
        {', '}
        <InlineMath>{'\\lambda=3'}</InlineMath>
        {' requests/s and '}
        <InlineMath>{'\\mu=2'}</InlineMath>
        {' requests/s per worker, '}
        <InlineMath>{'a=1.5'}</InlineMath>
        {', '}
        <InlineMath>{'\\rho=.75'}</InlineMath>
        {' and '}
        <InlineMath>{'C=9/14'}</InlineMath>
        {'. Mean queue wait is '}
        <InlineMath>{'9/14'}</InlineMath>
        {' seconds and mean residence is '}
        <InlineMath>{'8/7'}</InlineMath>
        {' seconds. Each service still has mean '}
        <InlineMath>{'.5'}</InlineMath>
        {' seconds. The waiting survival for '}
        <InlineMath>{'t\\geq0'}</InlineMath>
        {' is'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>{'\\Pr(T_q>t)=C\\exp[-(c\\mu-\\lambda)t].'}</MathBlock>
      </div>

      <Prose>
        {'There is a zero-wait atom '}
        <InlineMath>{'1-C'}</InlineMath>
        {'. This is a '}
        <strong>{'queue-wait'}</strong>
        {
          ' tail, not a total-response tail: service must still be added, and its random duration cannot be replaced with its mean when computing a percentile.'
        }
      </Prose>

      <Prose>
        {
          'Computing large factorials directly is a poor numerical implementation. '
        }
        <code>{'erlang_c()'}</code>
        {' builds the Erlang B recurrence '}
        <InlineMath>{'B_0=1'}</InlineMath>
        {', '}
        <InlineMath>{'B_j=aB_{j-1}/(j+aB_{j-1})'}</InlineMath>
        {', then computes '}
        <InlineMath>{'C=B_c/(1-\\rho+\\rho B_c)'}</InlineMath>
        {
          '. Here Erlang B is a stable computational intermediate; we have not changed the waiting model into a loss system. Setting '
        }
        <InlineMath>{'c=1'}</InlineMath>
        {
          ' recovers M/M/1; unstable inputs return an explicit unavailable stationary result.'
        }
      </Prose>

      <Prose>
        {'For a concrete architecture comparison, take '}
        <InlineMath>{'\\lambda=2'}</InlineMath>
        {' and '}
        <InlineMath>{'\\mu=2'}</InlineMath>
        {'. Two pooled workers have '}
        <InlineMath>{'C=1/3'}</InlineMath>
        {' and mean residence '}
        <InlineMath>{'2/3'}</InlineMath>
        {
          ' seconds. Independent random splitting produces two M/M/1 queues of arrival rate '
        }
        <InlineMath>{'1'}</InlineMath>
        {', each with mean residence '}
        <InlineMath>{'1'}</InlineMath>
        {' second. A single exponential worker at rate '}
        <InlineMath>{'4'}</InlineMath>
        {' has mean residence '}
        <InlineMath>{'.5'}</InlineMath>
        {
          " seconds. These values follow their stated models. A batched GPU's cost changes with the batch, so replacing it with any of these workers requires calibration rather than a convenient label."
        }
      </Prose>

      <RemoteCodeBlock
        source="/learn/examples/llm-serving-queues/event_queues.py"
        filename="event_queues.py"
        language="python"
        title="event_queues.py"
      />

      <H2>{'11. Bound admission and keep the denominator'}</H2>

      <FiniteFigure />

      <Prose>
        {
          'An overloaded service needs a decision for requests it cannot currently accept. A finite population limit changes that decision, and therefore changes which requests appear in its latency sample. Let '
        }
        <InlineMath>{'K'}</InlineMath>
        {' mean the maximum '}
        <strong>{'total resident population'}</strong>
        {', including service. At '}
        <InlineMath>{'K=1'}</InlineMath>
        {', one request may be in service and no request may wait.'}
      </Prose>

      <Prose>
        {'For an M/M/1/K model, arrivals at state '}
        <InlineMath>{'K'}</InlineMath>
        {' are rejected. States '}
        <InlineMath>{'0'}</InlineMath>
        {' through '}
        <InlineMath>{'K'}</InlineMath>
        {' have stationary probabilities'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\begin{aligned}\np_n&=\\frac{\\rho^n}{\\sum_{j=0}^{K}\\rho^j},\\qquad \\rho=\\lambda/\\mu,\\\\\np_n&=\\frac1{K+1}\\quad\\text{when }\\rho=1.\n\\end{aligned}'
          }
        </MathBlock>
      </div>

      <Prose>
        {
          'Unlike the infinite queue, this finite chain has a stationary population even at '
        }
        <InlineMath>{'\\rho\\geq1'}</InlineMath>
        {
          '. That does not mean every offered request is served. Poisson arrivals see the full-state probability '
        }
        <InlineMath>{'p_K'}</InlineMath>
        {', so admitted rate is '}
        <InlineMath>{'\\lambda_{\\mathrm{adm}}=\\lambda(1-p_K)'}</InlineMath>
        {'. Mean admitted residence follows '}
        <InlineMath>{'L/\\lambda_{\\mathrm{adm}}'}</InlineMath>
        {', where '}
        <InlineMath>{'L=\\sum n p_n'}</InlineMath>
        {'. Using offered '}
        <InlineMath>{'\\lambda'}</InlineMath>
        {
          ' would mix a resident population with requests that never entered it.'
        }
      </Prose>

      <Prose>
        {'At '}
        <InlineMath>{'K=3'}</InlineMath>
        {' and '}
        <InlineMath>{'\\rho=1'}</InlineMath>
        {', all four states have probability '}
        <InlineMath>{'.25'}</InlineMath>
        {'. Mean population is '}
        <InlineMath>{'1.5'}</InlineMath>
        {', blocking is '}
        <InlineMath>{'.25'}</InlineMath>
        {', admitted rate is '}
        <InlineMath>{'.75\\mu'}</InlineMath>
        {', and mean admitted residence is '}
        <InlineMath>{'2/\\mu'}</InlineMath>
        {'. At very high offered load, computing '}
        <InlineMath>{'1-p_K'}</InlineMath>
        {' can lose numerical precision. '}
        <code>{'finite_mm1()'}</code>
        {' uses the equivalent departure-rate identity '}
        <InlineMath>{'\\mu(1-p_0)'}</InlineMath>
        {' in that branch.'}
      </Prose>

      <Prose>
        {
          'A population bound is not a hard latency guarantee. Even a request alone in this model has an exponential service duration with unbounded support. A production service can reject, time out, cancel or provide a probabilistic latency target, but those are different policies with different outcomes.'
        }
      </Prose>

      <Prose>
        {
          "There are also different *places* to impose bounds: an external HTTP queue, the engine's waiting requests, active sequences, processed tokens per iteration, and available KV blocks. A server may maintain several at once. Draw the offered, admitted, rejected and unfinished records separately before choosing a throughput or latency denominator."
        }
      </Prose>

      <RemoteCodeBlock
        source="/learn/examples/llm-serving-queues/queue_formulas.py"
        filename="queue_formulas.py"
        language="python"
        title="queue_formulas.py"
      />

      <span id="5-production-implementation" aria-hidden="true" />
      <H2>{'12. Reconstruct a token iteration'}</H2>

      <MemoryFigure />

      <Prose>
        {
          'Return to actual language-model work. A request has prompt tokens, produces output tokens, and retains key/value states for tokens whose model computation has occurred. '
        }
        <strong>{'KV cache'}</strong>
        {
          ' means those retained attention keys and values. Request count alone cannot determine its memory use: two requests with context lengths 5 and 9 require more blocks than two requests of length 1 each, at the same block size.'
        }
      </Prose>

      <Prose>
        {
          'In the drawing, a CPU waiting list is outside the admitted block grid. Reservation means capacity promised to a request; committed blocks contain already processed token states. Both affect admission, but they are not the same count. Shared prefixes and KV precision would add further rules; this particular model excludes them.'
        }
      </Prose>

      <Prose>
        {'The complete '}
        <code>{'iteration_scheduler.py'}</code>
        {' uses block size 4 tokens and a conservative reservation of '}
        <InlineMath>{'\\lceil(P+O-1)/4\\rceil'}</InlineMath>
        {' blocks for a request with prompt length '}
        <InlineMath>{'P'}</InlineMath>
        {' and supplied output target '}
        <InlineMath>{'O'}</InlineMath>
        {
          ". The target is known in this constructed model. A real request's eventual output length is usually unknown, and production allocation policies differ. We make the reservation visible rather than silently predicting that length."
        }
      </Prose>

      <Prose>
        {'Why '}
        <InlineMath>{'P+O-1'}</InlineMath>
        {
          '? The final prompt computation emits the first output token. To emit the second output, the model processes the first output as a decode input; to emit the third, it processes the second. Once a request ends after its '
        }
        <InlineMath>{'O'}</InlineMath>
        {
          'th output, that last output need not be processed in a subsequent iteration. Thus the trace has '
        }
        <InlineMath>{'P'}</InlineMath>
        {' prompt inputs and '}
        <InlineMath>{'O-1'}</InlineMath>
        {
          ' subsequent decode inputs. The visible outputs are not interchangeable with processed inputs.'
        }
      </Prose>

      <IterationFigure />

      <Prose>
        {'An '}
        <strong>{'iteration token budget'}</strong>
        {
          ' limits how many model input tokens this scheduler processes in one iteration. With prompt length 10 and budget 4, chunked prefill can process chunks 4, 4 and 2. Chunking divides prompt computation; it does not shorten the prompt. The first output arrives after the final chunk. A full-prefill policy cannot start this request under an unchanged budget of 4. Our program rejects that impossible configuration explicitly instead of looping forever.'
        }
      </Prose>

      <Prose>
        {
          'The default requests have prompt lengths 9, 4 and 3 and output targets 3, 2 and 1. Admission is strict FIFO, subject to an active-sequence limit and total reserved blocks. Each iteration first schedules one input token for each decoding request that fits, then gives remaining token budget to prompt chunks. A request whose peak requirement exceeds all available blocks is impossible; a request temporarily blocked by occupied memory waits. An output target of zero is a labelled constructed cancellation state, rather than an invented first token.'
        }
      </Prose>

      <Prose>
        {
          "Inspect the slab's operands before its duration: which request contributes prompt tokens, which contributes a decode input, how much context is read, and which completion releases blocks? The complete program records all these choices. It checks each completed request's prompt count and decode-input count and exposes reserved versus committed blocks before work, after work and before release."
        }
      </Prose>

      <CostClockFigure />

      <Prose>
        {'To give the model a time axis, supply '}
        <strong>{'fictional'}</strong>
        {' coefficients:'}
      </Prose>

      <div className="sq-equation">
        <MathBlock>
          {
            '\\begin{aligned}\n\\Delta t&=h+\\alpha P_{\\mathrm{iter}}+\\beta D_{\\mathrm{iter}}+\\gamma C_{\\mathrm{iter}},\\\\\nh&=.02\\text{ s},\\quad \\alpha=.005\\text{ s/prompt token},\\\\\n\\beta&=.01\\text{ s/decode request},\\quad \\gamma=.0001\\text{ s/context token}.\n\\end{aligned}'
          }
        </MathBlock>
      </div>

      <Prose>
        {'Here '}
        <InlineMath>{'P_{\\mathrm{iter}}'}</InlineMath>
        {' counts scheduled prompt inputs, '}
        <InlineMath>{'D_{\\mathrm{iter}}'}</InlineMath>
        {' counts decoding requests, and '}
        <InlineMath>{'C_{\\mathrm{iter}}'}</InlineMath>
        {' sums their processed context lengths. The constant '}
        <InlineMath>{'h'}</InlineMath>
        {
          ' is an iteration overhead. These coefficients are a teaching cost model, not measured hardware parameters. Batch shape, attention implementation and memory bandwidth can make real costs nonlinear.'
        }
      </Prose>

      <Prose>
        {
          "Changing the budget can advance a prompt's first output while making an individual iteration longer. The same change can alter gaps for already decoding requests. Changing available blocks may affect admission without changing a worker's arithmetic rate. These are mechanisms to inspect, rather than a promise that one knob improves every metric."
        }
      </Prose>

      <Prose>
        {'The pinned vLLM v0.27.0 optimization guidance also distinguishes '}
        <code>{'max_num_seqs'}</code>
        {' from '}
        <code>{'max_num_batched_tokens'}</code>
        {
          ', documents chunked prefill with decode priority, and explains KV pressure/preemption. Their concrete defaults can depend on configuration construction. '
        }
        <code>{'max_num_seqs'}</code>
        {
          ' is an iteration scheduling constraint; it is not automatically the external M/M/1/K population limit from Section 11. The detailed '
        }
        <a
          href={
            '/learn/path/full-curriculum/continuous-batching-pagedattention?module=large-language-models'
          }
        >
          {'continuous batching and PagedAttention lesson'}
        </a>
        {' supplies the engine mechanism that this queueing model simplifies.'}
      </Prose>

      <RemoteCodeBlock
        source="/learn/examples/llm-serving-queues/iteration_scheduler.py"
        filename="iteration_scheduler.py"
        language="python"
        title="iteration_scheduler.py"
      />

      <span id="7-decision-matrix" aria-hidden="true" />
      <H2>{'13. Route remaining work and honor deadlines'}</H2>

      <RoutingFigure />

      <Prose>
        {''}
        <strong>{'Join the shortest queue'}</strong>
        {
          ', or JSQ, routes a new request to the smallest resident count. The count is observable and cheap, but it is not a measurement of unfinished work. In the constructed example, worker 0 has one job with 8 work units remaining; worker 1 has two jobs with 1 unit each. JSQ chooses worker 0. An oracle that knows the actual remaining work chooses worker 1. A new job of 2 units finishes after 10 versus 4 units of FCFS work, respectively.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'route_snapshot()'}</code>
        {
          ' makes the selected assignment, tie rule and predicted residence explicit. The work-based choice is an '
        }
        <strong>{'oracle fixture'}</strong>
        {
          ", not a deployable predictor: a language model's future output length is generally unknown. Replace actual remaining work with an estimate and the route can be wrong. Network transfer, cache affinity and worker-specific capacity can also matter. There is no universal percentage improvement supplied by queue length alone."
        }
      </Prose>

      <DeadlineFigure />

      <Prose>
        {'Let an absolute deadline be '}
        <InlineMath>{'d'}</InlineMath>
        {', elapsed time be '}
        <InlineMath>{'e'}</InlineMath>
        {', estimated queued work be '}
        <InlineMath>{'\\widehat q'}</InlineMath>
        {', and estimated own service be '}
        <InlineMath>{'\\widehat s'}</InlineMath>
        {', all in seconds since the request began. The estimated finish is '}
        <InlineMath>{'e+\\widehat q+\\widehat s'}</InlineMath>
        {', and its margin is '}
        <InlineMath>{'d-(e+\\widehat q+\\widehat s)'}</InlineMath>
        {
          '. A negative margin predicts a miss; it does not prove one when the estimates are uncertain.'
        }
      </Prose>

      <Prose>
        {
          'A deadline policy also needs to state what happens after expiry. If a queued request is canceled before it starts, its work may be removed entirely. If cancellation is ignored, it can still consume capacity after the client has stopped waiting. Canceling a running request can save its remaining work, provided the worker actually honors the cancellation. A timed-out client and stopped GPU computation are different events.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'deadline_trace()'}</code>
        {
          ' retains canceled, completed and wasted-work records for these explicit policies. It refuses to treat an already expired queued job as negative work when running cancellation is enabled. Use the outcome records to count logical success separately from work consumed.'
        }
      </Prose>

      <span id="9-failure-modes-and-gotchas" aria-hidden="true" />
      <H2>{'14. Make retries and startup delays visible'}</H2>

      <RetryFigure />

      <Prose>
        {'A failed attempt may cause the client to try again. A '}
        <strong>{'logical request'}</strong>
        {" is the user's original operation; an "}
        <strong>{'attempt'}</strong>
        {
          " is one submission of that operation. Counting both as requests hides load amplification. An ancestry drawing keeps A's first and second attempts attached to the same A, rather than counting them as two independent successes."
        }
      </Prose>

      <Prose>
        {'If attempts fail independently with fixed probability '}
        <InlineMath>{'r'}</InlineMath>
        {', and at most three attempts are allowed, expected attempt count is '}
        <InlineMath>{'1+r+r^2'}</InlineMath>
        {'. Eventual success probability is '}
        <InlineMath>{'1-r^3'}</InlineMath>
        {'. Independence and fixed '}
        <InlineMath>{'r'}</InlineMath>
        {
          ' are strong assumptions. Under overload, retries increase offered load, which changes failure probability; the simple geometric model no longer describes that feedback.'
        }
      </Prose>

      <Prose>
        {''}
        <code>{'retry_trace()'}</code>
        {
          ' offers four logical requests to a single server with service duration .3 seconds and total resident limit 2. It compares no retry, a capped second attempt with synchronized delay, and a capped second attempt with seeded jitter. '
        }
        <strong>{'Jitter'}</strong>
        {
          ' varies the delay so that clients do not all reappear at the same instant. The exact fixture can reveal different admissions; it cannot establish a general production improvement. Every attempt retains its parent, time and outcome. The cap also makes an all-rejected case terminate.'
        }
      </Prose>

      <CapacityFigure />

      <Prose>
        {
          'Adding capacity has a clock too. A worker requested at time 10 and ready at time 15 provides no service during those five seconds. The drawing therefore separates pending workers from ready workers. A backlog accumulated before readiness must still be processed; readiness does not erase it.'
        }
      </Prose>

      <Prose>
        {'In a simple '}
        <strong>{'fluid approximation'}</strong>
        {
          ', continuously divisible incoming work at 3 jobs/s against current capacity 2 jobs/s adds one job of queued work per second. Eight seconds of startup delay adds 8 jobs before new capacity begins. This is an approximation to discrete events, not a prediction of the exact stochastic backlog. '
        }
        <code>{'delayed_capacity()'}</code>
        {
          ' separately traces discrete arrivals, actual worker readiness, completions and queue area.'
        }
      </Prose>

      <Prose>
        {'The sample controller in '}
        <code>{'hysteresis_trace()'}</code>
        {' uses different up/down thresholds and a minimum hold period. '}
        <strong>{'Hysteresis'}</strong>
        {
          ' means a small oscillation around one threshold does not immediately reverse the last decision. Its state includes ready and pending workers, observations, previous action time and whether a worker is idle enough to remove. A scale-up action schedules future readiness; a scale-down action cannot quietly remove a busy worker. The supplied observations and policy are constructed, not an autoscaler trained from this trace. Production startup latency, cost and scale rules must be measured for the actual deployment.'
        }
      </Prose>

      <RemoteCodeBlock
        source="/learn/examples/llm-serving-queues/overload_controls.py"
        filename="overload_controls.py"
        language="python"
        title="overload_controls.py"
      />

      <H2>{'15. Separate an observed trace from a service model'}</H2>

      <TraceFigure />

      <Prose>
        {
          "Microsoft's Azure public inference dataset contains request timestamps, context-token counts and generated-token counts. We retain the first 512 rows of "
        }
        <code>{'AzureLLMInferenceTrace_conv.csv'}</code>
        {
          ' at the pinned repository revision, in their source order, with original fields and an added '
        }
        <code>{'source_row'}</code>
        {
          ' address. The accompanying licence is CC BY 4.0. This gives us an actual arrival/token workload without inventing prompt text.'
        }
      </Prose>

      <Prose>
        {'The retained rows run from '}
        <code>{'2023-11-16 18:15:46.6805900'}</code>
        {' through '}
        <code>{'2023-11-16 18:17:57.1639350'}</code>
        {
          ", spanning 130.483345 seconds at Python's microsecond precision. Raw seven-digit fractional timestamps remain in the CSV; parsing truncates the final fractional digit. The upstream README describes a different November date, so the lesson uses the CSV's actual timestamps rather than silently relabelling them."
        }
      </Prose>

      <Prose>
        {''}
        <code>{'diagnostics()'}</code>
        {
          ' computes arrival gaps, token-count quantiles and fixed-bin count variability. A singleton has no arrival-gap variation estimate. A partial edge bin is not comparable to a full-width bin without an exposure correction. Arrival count divided by first-to-last elapsed time is a descriptive sample rate; it is not proof of a stationary Poisson process.'
        }
      </Prose>

      <Prose>
        {'Crucially, these rows do '}
        <strong>{'not'}</strong>
        {
          ' contain request service time, first-token time, token emission clocks, model identity, batch state or GPU measurements. A large output count is not itself a measured long service duration. The trace supplies inputs for a declared model, not the missing outputs of a benchmark.'
        }
      </Prose>

      <ReplayFigure />

      <Prose>{'For a reproducible replay, assign the supplied proxy'}</Prose>

      <div className="sq-equation">
        <MathBlock>
          {'S_i=.0002\\,P_i+.003\\,O_i\\quad\\text{seconds},'}
        </MathBlock>
      </div>

      <Prose>
        {'where '}
        <InlineMath>{'P_i'}</InlineMath>
        {' and '}
        <InlineMath>{'O_i'}</InlineMath>
        {
          ' are the observed context and generated counts. The coefficients are fictional isolated FCFS service seconds per token. The proxy ignores batching, caching, parallel workers and per-token attention cost; a zero-output row can still have prompt work. '
        }
        <code>{'replay()'}</code>
        {' then applies exactly the FCFS recurrence from Section 2.'}
      </Prose>

      <Prose>
        {
          "Arrival stretches .5, 1 and 2 use the same retained requests and service proxy. A stretch of .5 halves every relative timestamp, making offered work denser; it does not change the observed token counts. Compare the drained cohort's response times with the population clipped at the last arrival. They answer different questions, especially when many requests are unfinished at that cutoff."
        }
      </Prose>

      <Prose>
        {'The fixed CPU replay produced these '}
        <strong>{'modelled'}</strong>
        {
          ' outcomes for all 512 requests, including drain after the final arrival:'
        }
      </Prose>

      <NeuralTable
        caption={'15. Separate an observed trace from a service model'}
        headers={[
          <>{'Arrival stretch'}</>,
          <>{'Mean residence, seconds'}</>,
          <>{'Raw sample p99, seconds'}</>,
        ]}
        rows={[
          [<>{'.5'}</>, <>{'203.395'}</>, <>{'436.193'}</>],
          [<>{'1'}</>, <>{'171.807'}</>, <>{'376.687'}</>],
          [<>{'2'}</>, <>{'121.309'}</>, <>{'271.108'}</>],
        ]}
      />

      <Prose>
        {
          "Even stretching arrivals by 2 leaves a large backlog under this particular service proxy. That is evidence about the proxy and offered work, not an observed failure of Azure serving. Change the coefficients and a different modelled result follows. The exact replay retains each request's start, departure and cutoff status; inspect those events rather than presenting this table as a hardware benchmark."
        }
      </Prose>

      <RemoteCodeBlock
        source="/learn/examples/llm-serving-queues/trace_replay.py"
        filename="trace_replay.py"
        language="python"
        title="trace_replay.py"
      />

      <H2>{'16. Count service targets before computing a percentile'}</H2>

      <SloFigure />

      <Prose>
        {'A '}
        <strong>{'service-level objective'}</strong>
        {
          ', or SLO, is a stated target for service outcomes and its denominator. A useful service may need a first output within .5 seconds, every subsequent gap within .3 seconds, and total completion within 1 second. “Fast” cannot identify which clock or which exclusions those numbers describe.'
        }
      </Prose>

      <Prose>
        {'The constructed records in '}
        <code>{'slo_metrics.py'}</code>
        {
          ' include A and B completing within all three targets, C rejected, D canceled, and E completing late. With five offered logical requests over the two-second arrival window, offered rate is 2.5 requests/s and goodput is 1 successful in-target request/s. Good fraction is 2/5 of offered requests, or 2/4 of accepted requests. Both fractions can be useful, but their denominators must be printed. Measuring only completed requests would hide C and D.'
        }
      </Prose>

      <Prose>
        {''}
        <strong>{'Goodput'}</strong>
        {
          ' here counts completed logical requests satisfying all targets per window second. It is distinct from accepted throughput, completed throughput, output-token throughput and worker busy fraction. The program explicitly uses an arrival cohort and tests completion by the window end. It is not silently a completion-window stationary estimator. E arrives within the cohort and finishes at its boundary; a later unfinished request would be censored for this window.'
        }
      </Prose>

      <Prose>
        {
          "For B's one-output response, there is no inter-token gap and mean TPOT is undefined. It has no gap violation, so it can satisfy this particular all-gaps requirement. That does not give it a measured ITL of zero. A zero-output failure has no TTFT and cannot satisfy a first-token requirement. Empty cohorts return undefined fractions instead of reporting artificial 100% success."
        }
      </Prose>

      <HistogramFigure />

      <Prose>
        {'A latency '}
        <strong>{'quantile'}</strong>
        {
          ' locates a fraction of a distribution; a finite sample needs an estimator. '
        }
        <code>{'quantile()'}</code>
        {' uses linear/type-7 interpolation: with sorted values '}
        <InlineMath>{'x_0,\\ldots,x_{n-1}'}</InlineMath>
        {' and requested fraction '}
        <InlineMath>{'p'}</InlineMath>
        {', interpolate at index '}
        <InlineMath>{'(n-1)p'}</InlineMath>
        {
          '. This estimator can differ from selecting the nearest ranked observation.'
        }
      </Prose>

      <Prose>
        {'Histograms retain less information. A cumulative bucket at boundary '}
        <InlineMath>{'b'}</InlineMath>
        {' counts observations at or below '}
        <InlineMath>{'b'}</InlineMath>
        {
          '. If replicas use compatible boundaries and the same observation interval, sum their bucket counts first, then estimate the fleet quantile. Do not average replica p99 values: quantiles are not linear summaries, and replicas may contribute different sample sizes.'
        }
      </Prose>

      <Prose>
        {
          "Our replicas retain raw latencies (.2, .4, 2) and (.3, .5, 4), with cumulative boundaries (.5, 1, 3, 5, +Inf). The exact merged raw sample's type-7 p99 is 3.9 seconds. Interpolating uniformly inside the target histogram bucket gives 4.88 seconds. The mean of the two local raw p99 estimates is 2.949 seconds. These are different computations over the same fixture, not three competing precise fleet measurements. The histogram estimate assumes a within-bucket distribution that the counts do not establish."
        }
      </Prose>

      <Prose>
        {''}
        <code>{'parse_histogram()'}</code>
        {
          " validates each replica's monotonic counts and compatible boundaries before merging. A target in the +Inf bucket cannot yield a finite interpolated latency; only a lower bound is known. The parser's fixture consists of same-interval cumulative counts. Real scrape counters require interval differencing or appropriate rate calculations, reset handling and consistent labels; merging raw lifetime totals from unlike windows would change the question."
        }
      </Prose>

      <MetricFigure />

      <Prose>
        {
          'Pinned vLLM v0.27.0 metric documentation defines engine/frontend event boundaries for metrics such as '
        }
        <code>{'vllm:time_to_first_token_seconds'}</code>
        {', '}
        <code>{'vllm:inter_token_latency_seconds'}</code>
        {', '}
        <code>{'vllm:e2e_request_latency_seconds'}</code>
        {', running/waiting request gauges and '}
        <code>{'vllm:kv_cache_usage_perc'}</code>
        {
          ". Read those boundaries before comparing them with a client's stopwatch. Network transport, frontend work and engine queueing need not start or stop at the same events. A preempted/requeued request can have more than one queue interval. The figure uses a constructed event ruler matched to documented names, not a captured production endpoint."
        }
      </Prose>

      <RemoteCodeBlock
        source="/learn/examples/llm-serving-queues/slo_metrics.py"
        filename="slo_metrics.py"
        language="python"
        title="slo_metrics.py"
      />

      <H2>{'17. Reproduce the model, then measure the engine'}</H2>

      <LibraryFigure />

      <Prose>
        {''}
        <code>{'simpy_reference.py'}</code>
        {' supplies the ordinary-library route. A SimPy '}
        <code>{'Environment'}</code>
        {' owns simulated time and its event queue. A '}
        <code>{'Resource(capacity=c)'}</code>
        {' represents the pooled workers. A request process yields '}
        <code>{'resource.request()'}</code>
        {' until admitted to a worker, yields '}
        <code>{'env.timeout(service)'}</code>
        {
          ' while occupying it, then releases the resource on leaving the context manager. '
        }
        <code>{'yield'}</code>
        {
          ' suspends this simulated process; it does not create a new CPU thread or perform model inference.'
        }
      </Prose>

      <Prose>
        {
          "The fixture independently monitors arrivals, starts and releases and compares their rows and integrated population with the scratch scheduler. The resource queue is FIFO for these ordinary requests. Equal-time events still have a definite insertion order; the library's internal microsteps need not match the scratch heap's event list entry for entry. What must match here is the actual unbounded FCFS allocation and its request clocks. A pending request canceled before service leaves the queue; canceling that request object is not the same operation as interrupting an already running computation."
        }
      </Prose>

      <Prose>
        {
          'The actual SimPy 4.1.2 run matched the scratch request clocks and system/queue areas for the default four-request trace and a tied-event two-worker fixture. Every compared difference was zero in these cases. The pending-cancellation example removed its queued request at simulated time 1.5 and ended with no queued request or held worker. This agreement tests the declared resource semantics; it does not verify a GPU cost law.'
        }
      </Prose>

      <Prose>
        {
          'The stationary CPU comparison used seeds 17, 29 and 43, 30,000 arrivals per case, and discarded the first 5,000 arrivals from each drained response cohort. The arrival/service streams were generated independently. Matching FCFS and PS cases used the same saved inputs. The table prints the '
        }
        <strong>{'range across three finite runs'}</strong>
        {
          ', not a confidence interval; serially correlated queue outcomes cannot be treated as 25,000 independent measurements.'
        }
      </Prose>

      <NeuralTable
        caption={'17. Reproduce the model, then measure the engine'}
        headers={[
          <>{'Model'}</>,
          <>{'Analytic mean residence, seconds'}</>,
          <>{'Simulated mean range'}</>,
          <>{'Simulated raw p99 range'}</>,
        ]}
        rows={[
          [
            <>
              {'FCFS exponential, '}
              <InlineMath>{'\\rho=.5'}</InlineMath>
              {''}
            </>,
            <>{'2'}</>,
            <>{'1.993–2.029'}</>,
            <>{'8.837–9.763'}</>,
          ],
          [
            <>
              {'FCFS exponential, '}
              <InlineMath>{'\\rho=.8'}</InlineMath>
              {''}
            </>,
            <>{'5'}</>,
            <>{'5.066–5.108'}</>,
            <>{'22.797–27.890'}</>,
          ],
          [
            <>
              {'FCFS exponential, '}
              <InlineMath>{'\\rho=.9'}</InlineMath>
              {''}
            </>,
            <>{'10'}</>,
            <>{'10.445–10.722'}</>,
            <>{'45.781–72.301'}</>,
          ],
          [
            <>
              {'FCFS constant, '}
              <InlineMath>{'\\rho=.8'}</InlineMath>
              {''}
            </>,
            <>{'3'}</>,
            <>{'2.880–3.037'}</>,
            <>{'9.939–12.483'}</>,
          ],
          [
            <>
              {'FCFS two-point mixture, '}
              <InlineMath>{'\\rho=.8'}</InlineMath>
              {''}
            </>,
            <>{'7.5'}</>,
            <>{'7.373–7.884'}</>,
            <>{'33.493–46.869'}</>,
          ],
          [
            <>
              {'Ideal PS constant, '}
              <InlineMath>{'\\rho=.8'}</InlineMath>
              {''}
            </>,
            <>{'5'}</>,
            <>{'4.760–5.074'}</>,
            <>{'17.499–22.270'}</>,
          ],
          [
            <>
              {'Ideal PS exponential, '}
              <InlineMath>{'\\rho=.8'}</InlineMath>
              {''}
            </>,
            <>{'5'}</>,
            <>{'5.075–5.124'}</>,
            <>{'37.399–41.369'}</>,
          ],
          [
            <>
              {'Ideal PS two-point mixture, '}
              <InlineMath>{'\\rho=.8'}</InlineMath>
              {''}
            </>,
            <>{'5'}</>,
            <>{'4.914–5.227'}</>,
            <>{'54.778–58.192'}</>,
          ],
        ]}
      />

      <Prose>
        {
          'FCFS means change with the service second moment, while ideal PS has the same analytic mean for these three distributions. Their finite PS tails differ substantially. The exponential FCFS '
        }
        <InlineMath>{'\\rho=.9'}</InlineMath>
        {
          " tail reference is 46.052 seconds, yet seed 17's empirical p99 is 72.301 seconds. We retain that discrepancy: a finite warmup does not prove stationarity, and a noisy tail estimate is not forced to equal a theorem. The clipped time-window population and busy fraction are retained separately from the drained cohort's residence mean."
        }
      </Prose>

      <H3>{'Deeper implementation: a clock-rounding failure'}</H3>

      <Prose>
        {
          'The original fixed campaign completed all nine small program examples and fifteen FCFS cases, then failed during the first PS case. Its absolute-time calculation rounded a tiny remaining completion interval back to the current timestamp. With 1.455×10⁻¹² work units left at simulated time 16,520.735 seconds, the old loop removed no job and repeatedly appended a zero-duration segment until memory allocation failed.'
        }
      </Prose>

      <Prose>
        {'The current complete PS program computes elapsed work in '}
        <strong>{'relative event coordinates'}</strong>
        {
          ' and dispatches the actual selected completion even when its displayed absolute timestamp cannot resolve that interval. Completion wins an arrival tie; exactly equal remaining-work minima complete together. It records relative elapsed versus represented elapsed, attained work and any completion roundoff. A strict event-progress guard bounds history growth. It does not create an artificial epsilon time or loosen the work-conservation tolerance.'
        }
      </Prose>

      <Prose>
        {
          'An independently reviewed continuation ran only the nine unfinished PS cases on the existing saved arrays, the two unreached trace stretches and the original deterministic boundaries. The fifteen completed FCFS cases and nine original program runs were not repeated. The original failure and old PS source remain in the '
        }
        <a
          href={'/learn/examples/llm-serving-queues/queueing-observations.zip'}
        >
          {'observation archive'}
        </a>
        {
          " alongside the separately labelled corrected continuation. All 33 boundary checks passed. For the corrected seed-17 constant PS case, nominal work was 30,000.000000000244 units and attained work 30,000.000000000193 units, within the unchanged conservation tolerance. A machine clock's quantization is an implementation limit to expose, not a change to the queueing theorem."
        }
      </Prose>

      <Prose>
        {'All programs use seconds and a declared model. Start with the '}
        <a href={'/learn/examples/llm-serving-queues/README.md'}>{'README'}</a>
        {' and '}
        <a href={'/learn/examples/llm-serving-queues/FILES.md'}>
          {'complete file index'}
        </a>
        {
          '. Install the pinned dependencies in a separate Python environment, then run from the extracted program directory:'
        }
      </Prose>

      <CodeBlock language={'text'}>
        {
          'python -m venv .venv\n# Windows PowerShell\n.venv\\Scripts\\python -m pip install -r requirements.txt\n.venv\\Scripts\\python queue_trace.py\n# macOS/Linux\n.venv/bin/python -m pip install -r requirements.txt\n.venv/bin/python queue_trace.py'
        }
      </CodeBlock>

      <Prose>
        {
          'The nine visible complete files are organized by what they reconstruct:'
        }
      </Prose>

      <NeuralTable
        caption={'Deeper implementation: a clock-rounding failure'}
        headers={[
          <>{'Program'}</>,
          <>{'Main operation and example command'}</>,
        ]}
        rows={[
          [
            <>
              {''}
              <code>{'queue_trace.py'}</code>
              {''}
            </>,
            <>
              {'Clocks, FCFS recurrence and independently clipped population; '}
              <code>{'python queue_trace.py'}</code>
              {'.'}
            </>,
          ],
          [
            <>
              {''}
              <code>{'queue_formulas.py'}</code>
              {''}
            </>,
            <>
              {'Exact stationary formulas and named approximations; '}
              <code>{'python queue_formulas.py'}</code>
              {'.'}
            </>,
          ],
          [
            <>
              {''}
              <code>{'event_queues.py'}</code>
              {''}
            </>,
            <>
              {'Stable event heap, pooled workers, admission/cutoff; '}
              <code>{'python event_queues.py --help'}</code>
              {'.'}
            </>,
          ],
          [
            <>
              {''}
              <code>{'processor_sharing.py'}</code>
              {''}
            </>,
            <>
              {'Exact work-sharing event advances; '}
              <code>{'python processor_sharing.py'}</code>
              {'.'}
            </>,
          ],
          [
            <>
              {''}
              <code>{'iteration_scheduler.py'}</code>
              {''}
            </>,
            <>
              {'Token/sequence/KV admission and derived token clocks; '}
              <code>{'python iteration_scheduler.py --budget 4'}</code>
              {'.'}
            </>,
          ],
          [
            <>
              {''}
              <code>{'overload_controls.py'}</code>
              {''}
            </>,
            <>
              {'Cancellation, retry ancestry and delayed capacity; '}
              <code>{'python overload_controls.py'}</code>
              {'.'}
            </>,
          ],
          [
            <>
              {''}
              <code>{'trace_replay.py'}</code>
              {''}
            </>,
            <>
              {'Exact licensed inputs and fictional FCFS replay; '}
              <code>{'python trace_replay.py'}</code>
              {'.'}
            </>,
          ],
          [
            <>
              {''}
              <code>{'simpy_reference.py'}</code>
              {''}
            </>,
            <>
              {'Actual library fixture against scratch clocks/areas; '}
              <code>{'python simpy_reference.py'}</code>
              {'.'}
            </>,
          ],
          [
            <>
              {''}
              <code>{'slo_metrics.py'}</code>
              {''}
            </>,
            <>
              {'SLO membership and cumulative histogram merging; '}
              <code>{'python slo_metrics.py'}</code>
              {'.'}
            </>,
          ],
        ]}
      />

      <Prose>
        {
          'The CPU experiments are simulations and formula checks. A production engine experiment needs a supported accelerator environment, a chosen model and precision, enough device memory, an identified engine revision, an explicit arrival plan and retained per-request clocks. The queueing model does not supply those hardware measurements. The '
        }
        <a
          href={
            '/learn/path/full-curriculum/inference-engines-serving?module=large-language-models'
          }
        >
          {'inference engines lesson'}
        </a>
        {' covers the engine setup choices; the '}
        <a
          href={
            '/learn/path/full-curriculum/inference-cost-economics-compute-scaling?module=large-language-models'
          }
        >
          {'cost lesson'}
        </a>
        {' connects measured capacity with billing boundaries.'}
      </Prose>

      <H3>{'Optional GPU measurement route — not executed here'}</H3>

      <Prose>
        {
          'On Linux with a compatible NVIDIA driver/device and sufficient free memory, the following pinned example installs vLLM and downloads a specific model snapshot. This is separate from the CPU environment. Native Windows is not this installation route; use a supported Linux environment. Check the versioned '
        }
        <a
          href={
            'https://docs.vllm.ai/en/v0.27.0/getting_started/installation/gpu/'
          }
        >
          {'GPU installation guide'}
        </a>
        {' against your driver and wheel stack.'}
      </Prose>

      <CodeBlock language={'bash'}>
        {
          "python3.12 -m venv .engine-venv\nsource .engine-venv/bin/activate\npython -m pip install 'vllm==0.27.0'\npython -c \"from huggingface_hub import snapshot_download; snapshot_download('Qwen/Qwen2.5-0.5B-Instruct', revision='7ae557604adf67be50417f59c2c2f167def9a775', local_dir='queue-example-model')\"\nvllm serve ./queue-example-model --served-model-name queue-example \\\n  --host 127.0.0.1 --port 8000 --max-model-len 2048 \\\n  --max-num-seqs 16 --max-num-batched-tokens 512"
        }
      </CodeBlock>

      <Prose>
        {
          'After the server is ready, use a second terminal with the same environment:'
        }
      </Prose>

      <CodeBlock language={'bash'}>
        {
          'source .engine-venv/bin/activate\nvllm bench serve --backend openai --host 127.0.0.1 --port 8000 \\\n  --model queue-example --tokenizer ./queue-example-model \\\n  --dataset-name random --random-input-len 128 --random-output-len 32 \\\n  --num-prompts 100 --request-rate 1 --seed 17 \\\n  --percentile-metrics ttft,tpot,itl,e2el --metric-percentiles 50,90,99 \\\n  --save-result --save-detailed --result-dir queue-results \\\n  --result-filename fixed-rate.json\ncurl http://127.0.0.1:8000/metrics > queue-results/metrics.txt'
        }
      </CodeBlock>

      <Prose>
        {'The '}
        <a href={'https://docs.vllm.ai/en/v0.27.0/cli/bench/serve/'}>
          {'versioned benchmark CLI'}
        </a>
        {
          ' generates a Poisson offer schedule at the supplied finite rate by default. Adding a client concurrency cap can throttle actual offers; infinite request rate instead starts a burst. Retain detailed failures and clocks, warmup/startup choices and hardware/configuration. Random-token prompts are a synthetic workload, not the licensed Azure replay. No installation, model download, engine inference or GPU result from these commands was performed for this lesson.'
        }
      </Prose>

      <RemoteCodeBlock
        source="/learn/examples/llm-serving-queues/simpy_reference.py"
        filename="simpy_reference.py"
        language="python"
        title="simpy_reference.py"
      />

      <span id="11-self-check-exercises" aria-hidden="true" />
      <section
        className="lesson-ending lesson-ending--practice"
        data-lesson-ending="practice"
      >
        <H2>{'18. Independent practice'}</H2>

        <Prose>
          {
            'Work from the request events or model assumptions first. The hints point to a representation; each solution shows the computation and its limits. These inputs differ from the worked defaults.'
          }
        </Prose>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'1. Reconstruct a new FCFS trace'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              ' A, B and C arrive at 0, .5 and 4 seconds and need 2, 1 and 1 seconds of service. Find starts, departures, queue waits, residence times and idle intervals. What changes if A needs 3 seconds?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                ' A request starts at the later of its arrival and the preceding departure.'
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {
                " Original starts are 0, 2 and 4; departures are 2, 3 and 5. Waits are 0, 1.5 and 0, while residence times are 2, 2.5 and 1 seconds. The server is idle from 3 to 4. Changing A's duration to 3 gives starts 0, 3 and 4 and departures 3, 4 and 5. B's wait rises to 2.5 and residence to 3.5; C still starts at 4. The idle interval disappears. The recurrence propagates the change only until the busy period meets an existing idle gap."
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'2. Clip residents rather than completed samples'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              ' Clip the original trace from Problem 1 to the window [1, 3]. Compute mean resident population. Compare it with the product of completion rate in that window and the full residence mean of requests completing there.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                ' A contributes only its overlap with the window, while B contributes both waiting and service.'
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {
                ' A occupies [0, 2], contributing 1 second inside the window. B occupies [.5, 3], contributing 2 seconds. C contributes nothing. Area is therefore 3 request-seconds and mean population is '
              }
              <InlineMath>{'3/2=1.5'}</InlineMath>
              {
                ' requests. A and B complete within this window, giving completion rate '
              }
              <InlineMath>{'2/2=1'}</InlineMath>
              {' request/s and full residence mean '}
              <InlineMath>{'(2+2.5)/2=2.25'}</InlineMath>
              {
                ' seconds. Their product is 2.25 requests, different from 1.5. The full sample includes residence before the left boundary; the clipped area does not. This finite-window mismatch does not contradict the long-run law with compatible boundaries.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'3. Use admitted throughput'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              ' A stable service receives 50 offers/s, rejects 10%, and has mean admitted residence .4 seconds. What mean admitted population follows? Can you infer KV bytes?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {' Rejected requests never join the resident population.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {' Admitted throughput is '}
              <InlineMath>{'50(1-.1)=45'}</InlineMath>
              {' requests/s. Mean admitted population is '}
              <InlineMath>{'45\\times .4=18'}</InlineMath>
              {
                ' requests. Multiplying 50 by .4 would count rejected offers as residents. KV bytes remain unknown: context lengths, layers, KV-head count, head dimension, precision, block rounding, sharing and which residents are allocated are not given.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'4. Separate response and waiting tails'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {' An M/M/1 FCFS model has '}
            <InlineMath>{'\\lambda=4'}</InlineMath>
            {' and '}
            <InlineMath>{'\\mu=5'}</InlineMath>
            {
              ' requests/s. Compute mean residence, mean queue wait and their p99 values. State the assumptions that make the tail calculations applicable.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {' The total tail has no leading '}
              <InlineMath>{'\\rho'}</InlineMath>
              {'; the waiting tail does.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>{' '}
              <InlineMath>{'\\rho=.8'}</InlineMath>
              {' and '}
              <InlineMath>{'\\mu-\\lambda=1'}</InlineMath>
              {' request/s. Mean residence is '}
              <InlineMath>{'1'}</InlineMath>
              {' second; mean wait is '}
              <InlineMath>{'.8'}</InlineMath>
              {' seconds. Total p99 is '}
              <InlineMath>{'\\ln(100)/1\\approx4.605170'}</InlineMath>
              {' seconds. Waiting p99 is '}
              <InlineMath>
                {'\\ln(100\\rho)/1=\\ln(80)\\approx4.382027'}
              </InlineMath>
              {
                ' seconds. This assumes stationary Poisson input, independent exponential service at a constant rate, one FCFS worker, infinite waiting capacity and '
              }
              <InlineMath>{'\\rho<1'}</InlineMath>
              {
                '. A measured GPU batch changing its service rate does not inherit these tails automatically.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'5. Find a quantile in the zero-wait atom'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {' With '}
            <InlineMath>{'\\rho=.6'}</InlineMath>
            {', '}
            <InlineMath>{'\\mu=2'}</InlineMath>
            {' and requested quantile fraction '}
            <InlineMath>{'.2'}</InlineMath>
            {', compute waiting and total-response quantiles.'}
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {' Compare '}
              <InlineMath>{'.2'}</InlineMath>
              {' with the zero-wait probability '}
              <InlineMath>{'.4'}</InlineMath>
              {'.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {
                ' At least 40% of arrivals have zero queue wait, so the waiting quantile is 0. Total service remains positive. Since '
              }
              <InlineMath>{'\\lambda=1.2'}</InlineMath>
              {' and '}
              <InlineMath>{'\\mu-\\lambda=.8'}</InlineMath>
              {', its response quantile is '}
              <InlineMath>{'-\\ln(1-.2)/.8\\approx .278929'}</InlineMath>
              {
                ' seconds. Substituting directly into a logarithmic waiting formula without checking the atom would incorrectly produce a negative time.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'6. Hold the mean and change the second moment'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {' Two FCFS M/G/1 services both have '}
            <InlineMath>{'\\mathbb E[S]=2'}</InlineMath>
            {' seconds, with arrival rate '}
            <InlineMath>{'.3'}</InlineMath>
            {'/s. One has '}
            <InlineMath>{'\\mathbb E[S^2]=4'}</InlineMath>
            {' s²; the other has '}
            <InlineMath>{'10'}</InlineMath>
            {' s². Compare mean waits and decide whether p99 is determined.'}
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {' First check '}
              <InlineMath>{'\\rho'}</InlineMath>
              {'; then insert the second moment into P-K.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>{' '}
              <InlineMath>{'\\rho=.3\\times2=.6'}</InlineMath>
              {'. The denominator '}
              <InlineMath>{'2(1-\\rho)'}</InlineMath>
              {' is '}
              <InlineMath>{'.8'}</InlineMath>
              {'. Mean waits are '}
              <InlineMath>{'.3\\times4/.8=1.5'}</InlineMath>
              {' seconds and '}
              <InlineMath>{'.3\\times10/.8=3.75'}</InlineMath>
              {
                ' seconds. Mean residences are 3.5 and 5.75 seconds. Neither second moment supplies the full response distribution, so p99 remains unknown. A second moment of 4 with mean 2 implies zero service variance; the other distribution has variance 6 s².'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'7. Apply an approximation within its scope'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {' A GI/G/1 queue has mean service .5 seconds, '}
            <InlineMath>{'\\rho=.7'}</InlineMath>
            {', '}
            <InlineMath>{'C_a^2=2'}</InlineMath>
            {' and '}
            <InlineMath>{'C_s^2=.5'}</InlineMath>
            {
              '. Estimate mean queue wait. What if successive arrival gaps are strongly correlated?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                ' Keep the variability multiplier separate from the load multiplier.'
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {" Kingman's estimate is "}
              <InlineMath>
                {'(2+.5)/2\\times .7/.3\\times .5=35/24\\approx1.458333'}
              </InlineMath>
              {
                ' seconds. Approximate mean residence is 1.958333 seconds. Independent renewal gaps and the stated single-server finite-variance model support this approximation; strong serial gap correlation falls outside those assumptions. The program should show that limitation rather than manufacture an arbitrary correction factor.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'8. Trace shared work'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              ' At aggregate capacity 1 unit/s, A arrives at 0 with 3 units and B at 1 with 1 unit. Find PS and FCFS completion times and check total work.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                ' A consumes one unit before B arrives, then both receive half the capacity.'
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {
                " At time 1, A has 2 units left. From 1 to 3 each receives .5 unit/s; B completes at 3 and A has 1 unit left. A completes at 4. Under FCFS, A completes at 3 and B at 4. Both policies consume 4 units of total work. PS changes ordering and each request's residence; it creates no extra aggregate capacity."
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'9. Compare three parallel architectures'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              ' Poisson rate is 4 requests/s. Compare two pooled exponential workers at rate 3 each, independent random splitting to those workers, and one exponential worker at rate 6. All three architectures have nominal aggregate capacity 6 requests/s. Does that make their mean residence equal?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                " Pooling has a waiting-probability factor; random splitting changes each worker's input rate."
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {' Pooled M/M/2 has '}
              <InlineMath>{'a=4/3'}</InlineMath>
              {' and '}
              <InlineMath>{'\\rho=2/3'}</InlineMath>
              {'. Its normalization is '}
              <InlineMath>{'1+4/3+(4/3)^2/[2(1-2/3)]=5'}</InlineMath>
              {', giving '}
              <InlineMath>{'p_0=1/5'}</InlineMath>
              {' and '}
              <InlineMath>{'C=(8/3)(1/5)=8/15'}</InlineMath>
              {'. Mean wait is '}
              <InlineMath>{'C/(6-4)=4/15'}</InlineMath>
              {' second; adding mean service '}
              <InlineMath>{'1/3'}</InlineMath>
              {' gives residence '}
              <InlineMath>{'3/5=.6'}</InlineMath>
              {
                ' second. Random splitting gives rate 2 to each rate-3 worker, hence residence '
              }
              <InlineMath>{'1/(3-2)=1'}</InlineMath>
              {' second. The fast single worker gives '}
              <InlineMath>{'1/(6-4)=.5'}</InlineMath>
              {
                ' second. Equal nominal aggregate capacity does not determine residence: pooling changes access to idle workers, while the fast single worker has a different per-request service process. These specified exponential systems are not interchangeable real-device benchmarks.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'10. Interpret a finite critical queue'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {' An M/M/1/K queue has '}
            <InlineMath>{'K=2'}</InlineMath>
            {', '}
            <InlineMath>{'\\lambda=\\mu=2'}</InlineMath>
            {
              '/s. Find blocking probability, population, admitted throughput and mean admitted residence. Is latency bounded?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {' The three finite states are uniform at '}
              <InlineMath>{'\\rho=1'}</InlineMath>
              {'.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {' Each state has probability '}
              <InlineMath>{'1/3'}</InlineMath>
              {'. Blocking is '}
              <InlineMath>{'1/3'}</InlineMath>
              {', mean population is '}
              <InlineMath>{'(0+1+2)/3=1'}</InlineMath>
              {', admitted throughput is '}
              <InlineMath>{'2(1-1/3)=4/3'}</InlineMath>
              {'/s, and mean residence is '}
              <InlineMath>{'1/(4/3)=.75'}</InlineMath>
              {
                ' second. Population is bounded, but exponential service has unbounded duration; a hard latency bound does not follow.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'11. Count KV blocks'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              ' With block size 8 tokens and no prefix sharing, compare allocated contexts A/B of lengths 8/17 with contexts C/D of lengths 9/9. Count blocks and unused token slots in each pair. With capacity limited to four blocks, can A grow by one token? What changes if B is canceled and its cancellation is honored?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                ' Round each request separately before adding. Unused slots equal allocated block capacity minus the tokens whose states are retained.'
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {' A/B needs '}
              <InlineMath>
                {'\\lceil8/8\\rceil+\\lceil17/8\\rceil=1+3=4'}
              </InlineMath>
              {' blocks, with '}
              <InlineMath>{'32-25=7'}</InlineMath>
              {' unused slots. C/D also needs '}
              <InlineMath>{'2+2=4'}</InlineMath>
              {' blocks, but has '}
              <InlineMath>{'32-18=14'}</InlineMath>
              {
                " unused slots. Equal request count and block count can therefore conceal different retained context and internal unused capacity. A's growth from 8 to 9 tokens needs a second block, raising A/B to five blocks; it cannot fit under the four-block bound while B remains allocated. Honoring B's cancellation releases its three blocks, after which the grown A needs only two blocks and fits. A client timeout without worker cancellation need not release those blocks. KV geometry and precision are still needed to convert blocks to bytes."
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'12. Distinguish prompt inputs and emitted outputs'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              " A prompt has 13 tokens, the iteration budget is 5, and the request ends after four outputs. Another admitted request consumes one decode input at the start of every iteration; no other work or memory limit intervenes. Reconstruct the new request's prompt chunks and subsequent decode input count. What happens if full prefill is required under the same budget?"
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                " Subtract the other request's decode input from each iteration budget before assigning prompt work. The last prompt chunk produces the first output."
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {' Each prompt iteration has '}
              <InlineMath>{'5-1=4'}</InlineMath>
              {
                " inputs available after the existing decode input. Prompt chunks are 4, 4, 4 and 1, so the first output arrives after the fourth iteration. Three later decode inputs produce outputs 2, 3 and 4; the new request's total input work is "
              }
              <InlineMath>{'13+3=16'}</InlineMath>
              {
                ' tokens. The existing request contributes four separate decode inputs during those four prompt iterations, so those iterations process '
              }
              <InlineMath>{'13+4=17'}</InlineMath>
              {
                " inputs in total. Neither those four inputs nor the four emitted outputs should be added to the new request's prompt count. Full prefill would require all 13 prompt inputs together, which already exceeds the total budget of 5 and also exceeds the 4 slots left after decode priority. It cannot start under this unchanged policy; the teaching program marks the configuration impossible."
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'13. Diagnose a count-based route'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              " Worker 0 has one job with 12 units left. Worker 1 has three jobs with 1 unit each. Both have capacity 1 and the new job needs 2 units. Compare JSQ and an exact-work oracle, then give an estimation error that reverses the oracle's practical decision."
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                ' The new job waits for total unfinished FCFS work, not the number of IDs.'
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {' JSQ chooses worker 0 because '}
              <InlineMath>{'1<3'}</InlineMath>
              {', giving the new job residence '}
              <InlineMath>{'12+2=14'}</InlineMath>
              {' seconds. Exact-work routing chooses worker 1 because '}
              <InlineMath>{'3<12'}</InlineMath>
              {
                ", giving 5 seconds. If worker 0's unfinished work is incorrectly estimated as 1 while worker 1 is estimated as 3, the estimator chooses worker 0 and loses the oracle advantage. Future output lengths are not magically known from resident counts."
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'14. Calculate an estimated deadline margin'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              ' A request has deadline 5 seconds after its start, elapsed time 1 second, estimated queue work 2.5 seconds and estimated service 2 seconds. Find the margin and say what conclusion is justified.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                ' Keep all terms on the same origin and distinguish an estimate from a bound.'
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {' Estimated finish is '}
              <InlineMath>{'1+2.5+2=5.5'}</InlineMath>
              {' seconds and margin is '}
              <InlineMath>{'5-5.5=-.5'}</InlineMath>
              {
                ' second. The model predicts a miss. Actual queued work or service may differ, so this is not a guaranteed failure. A rejection or cancellation policy can act on the estimate, but its errors and saved/consumed work must be recorded.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'15. Keep retry ancestry'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              ' Independent attempts fail with probability .2 and at most three attempts are allowed. Compute expected attempts and success probability. Explain why the calculation can fail during overload.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {' A second attempt is reached only after the first fails.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {' Expected attempts are '}
              <InlineMath>{'1+.2+.2^2=1.24'}</InlineMath>
              {'. Eventual success is '}
              <InlineMath>{'1-.2^3=.992'}</InlineMath>
              {
                '. These are logical-request quantities. Under overload, extra attempts alter queueing and failure probability, and failures can be correlated; the fixed independent .2 assumption then fails. Backoff, caps and jitter change the offered event stream but do not guarantee these probabilities.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'16. Count work before readiness'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              ' Incoming divisible work is 5 jobs/s and current capacity is 3 jobs/s. A new worker providing 3 jobs/s takes 6 seconds to start. Starting with no queue, find the backlog at readiness, the backlog three seconds later, and the earliest time at which it drains if all rates remain fixed.'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                ' Integrate the rate difference before readiness, then use the excess ready capacity to drain the retained backlog.'
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {' Before readiness, backlog grows at '}
              <InlineMath>{'5-3=2'}</InlineMath>
              {
                ' jobs/s for 6 seconds, reaching 12 jobs at time 6. Ready capacity then becomes '
              }
              <InlineMath>{'3+3=6'}</InlineMath>
              {' jobs/s, leaving a net drain rate of '}
              <InlineMath>{'6-5=1'}</InlineMath>
              {' job/s while the queue is positive. At time 9 the backlog is '}
              <InlineMath>{'12-3=9'}</InlineMath>
              {
                ' jobs. It takes 12 seconds after readiness to drain, so the earliest empty time is '
              }
              <InlineMath>{'6+12=18'}</InlineMath>
              {
                ' seconds. Pending capacity provides no service before time 6, and the new worker does not erase the accumulated work. These deterministic fluid quantities do not determine a stochastic backlog distribution or latency percentile.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'17. Merge before estimating a fleet quantile'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              ' Replica A has raw latencies (.1, 1, 3), replica B (.2, .8, 6), and both use cumulative bucket edges (1, 2, 4, 8, +Inf). Compute merged raw type-7 p99, a uniform-within-bucket p99 estimate and the mean of local raw p99 values. Where do censored requests belong?'
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {' The merged bucket target is '}
              <InlineMath>{'.99\\times6=5.94'}</InlineMath>
              {', while the raw sample interpolation index is '}
              <InlineMath>{'.99\\times5=4.95'}</InlineMath>
              {'.'}
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {' Sorted raw values are (.1, .2, .8, 1, 3, 6). The raw p99 is '}
              <InlineMath>{'3+.95(6-3)=5.85'}</InlineMath>
              {
                ' seconds. Merged cumulative counts are (4, 4, 5, 6, 6); the target lies in (4, 8], so the bucket estimate is '
              }
              <InlineMath>{'4+.94(8-4)=7.76'}</InlineMath>
              {
                ' seconds. Local raw p99 values are 2.96 and 5.896, averaging 4.428 seconds. Their average is not the merged quantile. An unfinished/canceled request cannot be fabricated as a completed latency value: retain its outcome in the offered-cohort SLO denominator and handle its censored timing explicitly.'
              }
            </Prose>
          </details>
        </div>

        <div className="lesson-exercise" data-lesson-exercise="">
          <H3>{'18. Design an actual serving measurement'}</H3>

          <Prose>
            {''}
            <strong>{'Problem.'}</strong>
            {
              " You receive only arrival timestamps and input/output token counts. Propose the additional measurements needed to calibrate this lesson's proxy for a real engine and evaluate latency targets."
            }
          </Prose>

          <details>
            <summary>Hint</summary>
            <Prose>
              {''}
              <strong>{'Hint.'}</strong>
              {
                ' Separate request clocks, batch work and resource state; decide whether arrivals are open or closed.'
              }
            </Prose>
          </details>

          <details>
            <summary>Worked solution</summary>
            <Prose>
              {''}
              <strong>{'Solution.'}</strong>
              {
                ' Pin model/tokenizer revisions, engine version, precision, hardware, parallelism and cache policy. Retain actual offered timestamps and all admitted/rejected/canceled outcomes; collect engine queue/start events, client first-output and subsequent-output clocks, finish and cancellation acknowledgement. Record iteration shapes, prompt/decode work, active sequences, KV usage, preemptions and cache hits. Use a declared open arrival plan if testing sensitivity to overload; a fixed-concurrency closed client can reduce input as latency rises. Calibrate costs on separately retained measurements and check held-out workloads rather than selecting coefficients to make the same benchmark look good. Report offered and successful-in-target denominators, observation window and unfinished requests. Token counts alone do not establish Azure GPU latency or a production capacity.'
              }
            </Prose>
          </details>
        </div>
      </section>
      <H3>{'Summary'}</H3>

      <Prose>
        {
          "Queueing starts with a request's clocks and a precisely named population. Integrating that population counts the same residence intervals that Little's law relates in a stable long-run model. Capacity sets the work rate, while arrival and service variability determine how work piles up; identical means or nominal capacity need not produce identical waits or tails. In token serving, iteration budgets and KV admission also decide when a request can receive work, so request counts alone cannot reconstruct either its computation or its memory. Measure the resulting clocks against declared latency targets while retaining every offered request, including rejected, canceled and unfinished outcomes. Together, these mechanisms turn a latency report into an account of where time and work went."
        }
      </Prose>

      <section
        className="lesson-ending lesson-ending--further-learning"
        data-lesson-ending="further-learning"
        data-lesson-resource-list=""
      >
        <H3>{'Continue studying'}</H3>

        <ul>
          <li>
            {''}
            <a href={'https://www.cs.cmu.edu/~harchol/ISCA15show.pdf'}>
              {"CMU's queueing tutorial"}
            </a>
            {
              ' develops variability, residual life and parallel architectures with concrete diagrams. The complete 84-slide tutorial informed the sequence here. It is a useful next explanation after reconstructing the simple traces. The '
            }
            <a
              href={
                'https://www.cs.cmu.edu/~harchol/PerformanceModeling/book.html'
              }
            >
              {'book page'}
            </a>
            {
              " gives the textbook's chapter map; the paid book body was not the accessible source used for this lesson."
            }
          </li>
          <li>
            {''}
            <a
              href={
                'https://ocw.mit.edu/courses/1-203j-logistical-and-transportation-planning-methods-fall-2006/a9235f5e4e0aee12a55778e5beaf0ddb_lec5.pdf'
              }
            >
              {'MIT 1.203J Lecture 5'}
            </a>
            {
              ' offers a compact eight-page queue anatomy, area and birth–death treatment. Read it for a second explanation of what each population actually counts.'
            }
          </li>
          <li>
            {''}
            <a
              href={
                'https://ocw.mit.edu/courses/6-262-discrete-stochastic-processes-spring-2011/a7bf41d8764f2d0fd7fc0810f823ec2c_pOhZUJ5BQXk.pdf'
              }
            >
              {'MIT 6.262 Lecture 13 transcript'}
            </a>
            {
              ', particularly pages 15–24, connects the area law with renewal and residual-service reasoning. The spoken transcript has occasional transcription errors; use the units and equations here to check a suspicious line.'
            }
          </li>
          <li>
            {''}
            <a
              href={
                'https://simpy.readthedocs.io/en/stable/topical_guides/resources.html'
              }
            >
              {'SimPy resources'}
            </a>
            {' and '}
            <a
              href={
                'https://simpy.readthedocs.io/en/stable/topical_guides/time_and_scheduling.html'
              }
            >
              {'time/scheduling'}
            </a>
            {
              " explain the ordinary-library mechanisms used in the executable route. The lesson's actual package is 4.1.2; simulated concurrency does not make it an accelerator benchmark."
            }
          </li>
        </ul>

        <span id="10-primary-sources" aria-hidden="true" />
      </section>
      <section
        className="lesson-ending lesson-ending--references"
        data-lesson-ending="references"
        data-lesson-resource-list=""
      >
        <H3>{'Technical sources and boundaries'}</H3>

        <ul>
          <li>
            {''}
            <a
              href={
                'https://www.columbia.edu/~ks20/stochastic-I/stochastic-I-LL.pdf'
              }
            >
              {"Sigman's notes on Little's law"}
            </a>
            {
              ', pages 1–3, state the pathwise/limiting accounting conditions behind the population law. Use them when a finite-window product appears to disagree with integrated occupancy.'
            }
          </li>
          <li>
            {''}
            <a
              href={
                'https://www.cambridge.org/core/journals/mathematical-proceedings-of-the-cambridge-philosophical-society/article/abs/single-server-queue-in-heavy-traffic/81C55BC00A68FE6D5385638AA0B0AF37'
              }
            >
              {"Kingman's 1961 publisher record"}
            </a>
            {
              ' identifies the original heavy-traffic work. Its full body was access-limited; the inspected modern '
            }
            <a
              href={
                'https://shashaani.wordpress.ncsu.edu/files/2024/05/wsc24-kingman.pdf'
              }
            >
              {'WSC 2024 treatment'}
            </a>
            {
              ', Section 2.3 equation 4, supplies the explicitly approximate GI/G/1 formula used here.'
            }
          </li>
          <li>
            {''}
            <a
              href={
                'https://www.cs.cmu.edu/~harchol/Perfclass/NotesFall25/chpt30prep.pdf'
              }
            >
              {'CMU Chapter 30 notes'}
            </a>
            {
              ', pages 1–5, specify ideal PS and its conditional response mean. The zero-overhead fixed-capacity model is narrower than token batching.'
            }
          </li>
          <li>
            {''}
            <a href={'https://www.usenix.org/system/files/osdi24-agrawal.pdf'}>
              {'Sarathi-Serve, OSDI 2024'}
            </a>
            {
              ', Sections 2.2/2.4, 3.2 and 4, motivates chunked prefill and its interaction with decoding. '
            }
            <a
              href={
                'https://www.microsoft.com/en-us/research/uploads/prodnew/2023/12/Splitwise_ISCA24.pdf'
              }
            >
              {'Splitwise, ISCA 2024'}
            </a>
            {
              ', Section II.B–D, supplies the prefill/first-output/decode clock distinction. Their evaluated performance and historical engine policies do not define every current deployment.'
            }
          </li>
          <li>
            {'Pinned vLLM v0.27.0 '}
            <a
              href={
                'https://github.com/vllm-project/vllm/blob/v0.27.0/vllm/config/scheduler.py'
              }
            >
              {'SchedulerConfig'}
            </a>
            {', '}
            <a
              href={
                'https://github.com/vllm-project/vllm/blob/v0.27.0/vllm/v1/core/sched/scheduler.py'
              }
            >
              {'V1 scheduler'}
            </a>
            {', '}
            <a
              href={
                'https://docs.vllm.ai/en/v0.27.0/configuration/optimization/'
              }
            >
              {'optimization guidance'}
            </a>
            {' and '}
            <a
              href={
                'https://github.com/vllm-project/vllm/blob/v0.27.0/docs/design/metrics.md'
              }
            >
              {'metric definitions'}
            </a>
            {
              ' ground the implementation-specific constraints and clocks. They are versioned source readings; the toy scheduler has its own declared reservation and cost policy.'
            }
          </li>
          <li>
            {'The '}
            <a
              href={
                'https://github.com/Azure/AzurePublicDataset/blob/215becdacba1ce682c7368642ce97d5a332de7a6/AzureLLMInferenceDataset2023.md'
              }
            >
              {'Azure dataset description'}
            </a>
            {' and pinned '}
            <a
              href={
                'https://github.com/Azure/AzurePublicDataset/blob/215becdacba1ce682c7368642ce97d5a332de7a6/data/AzureLLMInferenceTrace_conv.csv'
              }
            >
              {'conversation CSV'}
            </a>
            {
              ' supply the observed workload fields. The download retains its attribution, licence, original timestamps and row addresses. The FCFS replay adds explicitly fictional service assumptions.'
            }
          </li>
        </ul>
      </section>

      <section
        className="lesson-ending lesson-ending--next"
        data-lesson-ending="next"
      >
        <H3>{'Ready to continue'}</H3>

        <Prose>
          {
            'Before moving on, explain why a mean resident count cannot directly determine KV bytes, reconstruct the changed FCFS trace without a formula lookup, and diagnose why a completed-only p99 report can conceal rejected requests. You should be able to name the model and clock boundary behind each result and distinguish its exact, approximate, simulated or measured status.'
          }
        </Prose>

        <Prose>
          {'Next, '}
          <a
            href={
              '/learn/path/full-curriculum/speculative-decoding?module=large-language-models'
            }
          >
            {'speculative decoding'}
          </a>
          {
            ' changes the work needed to produce outputs through draft/verify execution. Then '
          }
          <a
            href={
              '/learn/path/full-curriculum/prefix-caching-prompt-caching?module=large-language-models'
            }
          >
            {'prefix caching and prompt caching'}
          </a>
          {
            ' changes which prompt work is repeated. Both alter service work and memory state; the population and clock discipline from this lesson still applies.'
          }
        </Prose>
      </section>
    </div>
  );
}
export default {
  title: 'Queueing Theory for LLM Serving',
  readTime: '65 min',
  content: () => <QueueingLesson />,
};
