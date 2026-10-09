// Exact accepted manuscript projection, with complete code bound to prepared assets.
import { CodeBlock, H2, H3, Prose } from '../../components/content';
import { MathBlock, Math as InlineMath } from '../../components/content/Math.jsx';
import {
  Checkpoint,
  LessonIntro,
  LessonTable as NeuralTable,
} from '../../components/lesson-labs/LessonElements';
import RemoteCodeBlock from '../../components/content/RemoteCodeBlock.jsx';
import {
  QueueingReadingFigure,
  QueueingAreaProvider,
} from '../../components/lesson-labs/QueueingReadingFigures.jsx';
export default {
  title: 'Queueing Theory (M/M/1, M/G/1, Little’s Law)',
  readTime: '~90 min read + 3 hours practice',
  hasIntegratedGuide: true,
  content: () => (
    <QueueingAreaProvider>
      <div className="lesson-pilot queue-reading">
        <LessonIntro
          exampleKind="Python, NumPy, SciPy and SimPy"
          prerequisites={
            <>
              {
                'Read means, variance, conditional probability and exponential/Poisson distributions. Probability Distributions and Stochastic Processes develop these ideas; we refresh each assumption here. You need basic algebra and geometric series. Integrals first mean area; optional tail proofs use densities and limits. Python is optional.'
              }
            </>
          }
          sections={[
            ['1-follow-jobs-through-a-worker', 'Jobs & boundaries'],
            ['2-count-the-same-area-two-ways', 'Little’s Law'],
            ['3-explain-the-random-clock-model', 'Clocks & sampling'],
            ['4-derive-the-m-m-1-load-response', 'Stationary congestion'],
            ['5-separate-a-mean-from-a-tail', 'Wait & response tails'],
            ['6-inspect-the-job-already-in-service', 'Variability & residuals'],
            ['7-derive-the-general-service-wait', 'P–K & deeper cases'],
            ['8-pool-workers-without-changing-the-question', 'Parallel capacity'],
            ['9-account-for-admission-and-loss', 'Finite buffers'],
            ['10-measure-test-and-practise', 'Evidence & practice'],
          ]}
        >
          {
            'A worker needs 0.1 seconds for a job on average. Why might a customer spend half a second in the system? Why can rare long jobs dominate everyone’s wait? We will follow individual jobs, count their shared occupancy, and build models that connect service capacity to delay. Every formula will name the population, the clock assumptions and the quantity it predicts.'
          }
        </LessonIntro>
        <Prose opening="route">
          {
            'The first pass follows the ten sections in order. The capped-tail proof and repeated-vacation example are visible deeper branches in section 7; you can return to them after reaching the measurement example. The '
          }
          <a href={'/learn/topic/probability-distributions-bayes-theorem'}>
            {'probability lesson'}
          </a>
          {' supplies moments and quantiles, and '}
          <a href={'/learn/topic/stochastic-processes-markov-chains-brownian-motion-poisson'}>
            {'Stochastic Processes'}
          </a>
          {
            ' supplies random clocks and state transitions. We will connect each of those objects to a particular worker and population here.'
          }
        </Prose>

        <H2>{'1. Follow jobs through a worker'}</H2>

        <Prose>
          {
            'A waiting line and the worker together form the object we will measure. Follow a job across the two drawn boundaries before assigning it a duration.'
          }
        </Prose>

        <QueueingReadingFigure id="Q01" />

        <Prose>
          {'A '}
          <strong>{'job'}</strong>
          {
            ' is one item needing service: an API request, a repair order or a part awaiting inspection. A '
          }
          <strong>{'server'}</strong>
          {' is the worker or resource doing that service. The '}
          <strong>{'waiting queue'}</strong>
          {' contains jobs that have arrived but have not started. The '}
          <strong>{'system'}</strong>
          {
            ' includes both waiting and in-service jobs. A queueing discipline decides who starts next; here '
          }
          <strong>{'first-come-first-served (FCFS)'}</strong>
          {' means arrival order, without interrupting a job already running.'}
        </Prose>

        <Prose>
          {
            'Our empty worker receives A at 0 s with service demand 3 s, B at 1 s with demand 1 s, C at 2 s with demand 2 s, and D at 6 s with demand 1 s. First isolate B.'
          }
        </Prose>

        <QueueingReadingFigure id="Q02" />

        <Prose>
          {
            "B's arrival at 1 s happens inside A's service interval. The worker frees at 3 s, so B waits from 1 to 3, then uses the worker from 3 to 4. Its two-second wait and one-second service make a three-second total. A's zero wait is a coincident arrival/start marker: a zero length is a real outcome, not a missing job."
          }
        </Prose>

        <Prose>
          {
            'Now put the jobs back on one common clock. Each next start chooses the later of its arrival and the preceding departure.'
          }
        </Prose>

        <QueueingReadingFigure id="Q03" />

        <Prose>
          {
            "For C, those candidates are arrival 2 and B's departure 4; choosing 4 gives departure 6. For D, both candidates equal 6, so it starts immediately. From 7 to 8 the worker is idle. The worker lane shows service only, while a job's residence lane also includes its waiting."
          }
        </Prose>

        <Prose>
          {
            'Use aᵢ for arrival time, bᵢ for start, dᵢ for departure and sᵢ for service demand of job i. Its queue wait is wq,ᵢ and its total duration is tᵢ. Take d₀=0 for this initially empty example.'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}b_i&=\\max(a_i,d_{i-1}),\\\\ d_i&=b_i+s_i,\\\\ w_{q,i}&=b_i-a_i,\\\\ t_i&=d_i-a_i=w_{q,i}+s_i.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <Prose>
          {
            'The maximum enforces two requirements: the job must have arrived and the worker must be free. Departure frees the worker at that instant. Simultaneous arrivals keep their listed order. We count residence on [arrival, departure), so a departure endpoint contributes no extra duration.'
          }
        </Prose>

        <Prose>{'The complete deterministic trace; every time is in seconds'}</Prose>

        <NeuralTable
          caption={'1. Follow jobs through a worker'}
          headers={[
            <>{'Job'}</>,
            <>{'Arrival'}</>,
            <>{'Start'}</>,
            <>{'Departure'}</>,
            <>{'Queue wait'}</>,
            <>{'Total'}</>,
          ]}
          rows={[
            [<>{'A'}</>, <>{'0'}</>, <>{'0'}</>, <>{'3'}</>, <>{'0'}</>, <>{'3'}</>],
            [<>{'B'}</>, <>{'1'}</>, <>{'3'}</>, <>{'4'}</>, <>{'2'}</>, <>{'3'}</>],
            [<>{'C'}</>, <>{'2'}</>, <>{'4'}</>, <>{'6'}</>, <>{'2'}</>, <>{'4'}</>],
            [<>{'D'}</>, <>{'6'}</>, <>{'6'}</>, <>{'7'}</>, <>{'0'}</>, <>{'1'}</>],
          ]}
        />

        <Prose>
          {
            'We can discard the large calendar clock and carry only unfinished duration to the next arrival.'
          }
        </Prose>

        <QueueingReadingFigure id="Q04" />

        <Prose>
          {
            "A leaves three seconds of total work at its own arrival. One second later B arrives: subtract that elapsed second, clamp the remaining two seconds at zero if necessary, and add B's one-second service. B's total is three seconds. If the gap had been four seconds, the subtraction would leave no unfinished work and the next total would be just its own one-second service."
          }
        </Prose>

        <Prose>
          {'The same mechanism can be written as '}
          <strong>{'Lindley’s recursion'}</strong>
          {
            '. If the gap between arrivals i and i+1 is gᵢ=aᵢ₊₁−aᵢ, then wq,ᵢ₊₁=max(0,wq,ᵢ+sᵢ−gᵢ). Existing unfinished work plus this service demand is reduced by time until the next arrival; spare time cannot create a negative wait. This equation works on a concrete trace before any Poisson assumption is made.'
          }
        </Prose>

        <Checkpoint
          prompt={
            <>{'If D arrives at 5 s instead of 6 s, does its one-second service become slower?'}</>
          }
        >
          <Prose>
            {
              'No. Its service still lasts 1 s. C holds the worker until 6 s, so D waits 1 s and spends 2 s in the system. The changed response comes from unfinished work ahead of D. '
            }
          </Prose>
        </Checkpoint>

        <H2>{'2. Count the same area two ways'}</H2>

        <Prose>
          {
            'The four duration lanes also tell us how crowded the system is. At time 2.5, A, B and C overlap, so the vertical count is three.'
          }
        </Prose>

        <QueueingReadingFigure id="Q05" />

        <Prose>
          {
            'Let N(t) be the number of jobs inside our chosen boundary at time t. During each interval with constant occupancy, width in seconds times height in jobs gives '
          }
          <strong>{'job-seconds'}</strong>
          {
            '. Alternatively, each job contributes one job for every second it remains inside. Adding by time slices or by jobs counts the same area.'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}A_H&=\\int_0^H N(t)\\,dt,\\\\ A_H&=\\sum_i\\bigl[\\min(d_i,H)-a_i\\bigr]_+,\\\\ \\overline N_H&=A_H/H.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <Prose>
          {
            'Here A_H names the total area. The positive part [x]₊=max(0,x) excludes jobs not yet arrived. This displayed form assumes no jobs were present before time 0. With earlier arrivals, clip the left endpoint to max(aᵢ,0) as well. For a waiting-only boundary, replace departure dᵢ by start bᵢ. This is an exact finite-window identity, including unfinished jobs.'
          }
        </Prose>

        <QueueingReadingFigure id="Q06" />

        <Prose>
          {
            'Move the horizon to 5 s. C is still present and D has not arrived. The selected job keeps its letter and colour in both its clipped lane and its area contribution; selection adds an outline.'
          }
        </Prose>

        <QueueingReadingFigure id="Q07" />

        <Prose>
          {
            'Switching to the waiting boundary cuts every interval off at service start. A and D still belong to the four-job cohort but each contributes zero queue duration. Reset returns to horizon 7, the system boundary and selected job C.'
          }
        </Prose>

        <Prose>
          {
            'At H=7, all four jobs have left. Their total residence is 3+3+4+1=11 job-seconds. Mean occupancy is 11/7 jobs, cohort throughput is 4/7 jobs/s, and the mean of those four total durations is 11/4 s. Waiting-only area is 0+2+2+0=4 job-seconds.'
          }
        </Prose>

        <Prose>
          {
            'At H=5, the observed area is 9 job-seconds. Only A and B have completed, contributing 6; unfinished C contributes 3 observed seconds. Completion rate 2/5 times completed-customer mean 3 gives 1.2 jobs, while the actual observed average is 9/5=1.8. The missing term is 3/5. Mixing an occupancy window with a censored completed-customer mean breaks the finite calculation.'
          }
        </Prose>

        <Prose>
          {
            'A window need not begin with an empty worker. Here is a separate finite cohort, chosen to expose both edges of a window.'
          }
        </Prose>

        <QueueingReadingFigure id="Q08" />

        <Prose>
          {
            "The window is [2,6). A resides on [0,3), B on [1,5), C on [4,7), and D on [6,8). Clip both ends: A contributes 1 second, B 3, C 2 and D 0, for 6 job-seconds. The four unit slabs have occupancies 2, 1, 2 and 1, giving the same area. Counting only jobs that depart inside the window instead sums A's full 3 and B's full 4 seconds: 7 includes time before the window while missing C's time before the cutoff. An arrival exactly at 6 contributes no duration to [2,6)."
          }
        </Prose>

        <Prose>{'For a general window [u,v), the same accounting is'}</Prose>

        <div className="neural-equation">
          <MathBlock>{'A_{u,v}=\\sum_i[\\min(d_i,v)-\\max(a_i,u)]_+.'}</MathBlock>
        </div>

        <Prose>
          {
            'The earlier four-job example happens to give a complete cohort by time 7. Its product follows by multiplying and dividing the total area by that cohort’s customer count.'
          }
        </Prose>

        <QueueingReadingFigure id="Q09" />

        <Prose>
          {
            'The units cancel as (4 jobs / 7 s) × (11 job·s / 4 jobs) = 11/7 jobs. This is exact finite algebra. A long-run statement needs the limits of those matched quantities and control of the boundary terms.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>{'Little’s Law'}</strong>
          {
            ' is the corresponding long-run relation L=λW: average population equals the matched flow rate times average residence. It does not require Poisson arrivals or exponential service. A pathwise formulation requires a finite positive limiting arrival rate and a finite limiting average customer residence, with the matched observation boundary; stationary ergodic queue models with finite means provide familiar sufficient settings. Boundary contributions must be handled in taking limits, not discarded in an arbitrary short window. When the customer mean is infinite or the system is growing without a steady regime, a finite stationary number cannot be inferred by multiplying two estimates.'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>{'L=\\lambda W,\\qquad L_q=\\lambda W_q.'}</MathBlock>
        </div>

        <Prose>
          {
            'A process completing 50 jobs/minute with mean residence 6 minutes has 300 jobs inside *on average*; its instantaneous population need not equal 300. If a database queue lies outside your API boundary, its duration belongs outside both that boundary’s W and L. Count admitted jobs with admitted throughput, or include abandonment as an exit with its own matched residence population. An empty observation supplies no customer mean to divide by.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>{'Running the examples:'}</strong>
          {' save each complete program as its own Python file and run '}
          <code>{'python filename.py'}</code>
          {
            " from a terminal in that directory. The core trace, formula and simulation examples use Python 3.12.14's standard library without extra packages. The later FCFS/SimPy comparison lists its NumPy and SimPy installation requirements separately. The first trace is exact integer arithmetic. Later floating-point outputs are rounded where the program says so. The browser investigations calculate bounded models, rather than executing Python."
          }
        </Prose>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'trace.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/trace.py'}
          filename={'trace.py'}
          language="python"
          title={'trace.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'trace.py.stdout.txt'}
          title={'Output: trace.py'}
          downloadUrl={'/learn-code/queueing-theory/trace.py.stdout.txt'}
        >
          {
            'A start 0 depart 3 wait 0 total 3\nB start 3 depart 4 wait 2 total 3\nC start 4 depart 6 wait 2 total 4\nD start 6 depart 7 wait 0 total 1\nhorizon 5 area 9 completed residence 6 mean number 1.8\nhorizon 7 area 11 completed residence 11 mean number 1.571429\ncomplete-cohort Little product: 1.571429'
          }
        </CodeBlock>

        <Prose>
          {
            'The program separately clips each residence interval and counts the completed cohort. Its two horizons expose why the incomplete-window correction matters. Change arrivals or service times and inspect every start/departure before trusting any average. '
          }
        </Prose>

        <H2>{'3. Explain the random clock model'}</H2>

        <Prose>
          {
            "Knowing “8 arrivals per second on average” does not tell us whether arrivals are evenly spaced, clustered or synchronized with the worker. Use λ for an arrival rate in jobs/s and μ for a worker's service rate. A mean service duration of 1/μ seconds corresponds to that capacity; a rate and a duration have reciprocal units."
          }
        </Prose>

        <Prose>
          {
            'We first distinguish two ways of inspecting the same population path. A time inspection chooses an instant; an arrival inspection chooses one of the arrival events.'
          }
        </Prose>

        <QueueingReadingFigure id="Q10" />

        <Prose>
          {
            "Place an arrival's dot on N(t−), the population immediately before it adds itself. The time fraction at a given height comes from the horizontal lengths of the path, whereas the arrival fraction comes from the dots. They are different counting operations. Under a homogeneous Poisson input whose future increments do not anticipate the state, arrivals occur at the same rate λ during each state. With the usual stationary/ergodic conditions, the limiting arrival fractions then equal the time fractions. This is "
          }
          <strong>{'PASTA: Poisson arrivals see time averages'}</strong>
          {
            '. The state may depend on past arrivals; PASTA does not require successive waits to be independent.'
          }
        </Prose>

        <QueueingReadingFigure id="Q11" />

        <Prose>
          {
            'A concrete failure is easier to see than a slogan. Put deterministic arrivals at 0, 2, 4, 6, … and give each job one second of service. Every arrival sees an empty system just before joining, but the worker is busy for half of each two-second cycle. An idle-triggered dispatcher similarly samples a selected state. Counting state changes also differs from counting time. Routing to the shortest queue creates state-dependent per-worker input, so independent Poisson splitting cannot simply be assumed for it.'
          }
        </Prose>

        <Prose>
          {'In '}
          <strong>{'M/M/1'}</strong>
          {
            ', the first M specifies Poisson arrivals at constant λ, equivalently independent exponential gaps of mean 1/λ. The second M specifies iid exponential service of mean 1/μ, independent of arrivals; the final 1 specifies one worker. We additionally require FCFS, infinite waiting space, and a work-conserving worker that does not idle while jobs wait.'
          }
        </Prose>

        <Prose>
          {'An exponential clock is '}
          <strong>{'memoryless'}</strong>
          {
            ': given that it is still running, its remaining duration has the law of a fresh clock. Thus a nonempty system completes service with probability μ dt + o(dt) during a small interval dt. Arrivals occur with probability λ dt + o(dt). Count transitions consequently have the following rates.'
          }
        </Prose>

        <QueueingReadingFigure id="Q12" />

        <Prose>
          {
            'An arrival takes state n to n+1 at rate λ. When n>0, the one active worker takes n to n−1 at rate μ. There is no departure out of state zero. There is also no nμ departure rate: n counts jobs, not simultaneously working servers. This '
          }
          <strong>{'birth–death chain'}</strong>
          {' uses the same row/departure-state convention introduced in Stochastic Processes.'}
        </Prose>

        <Prose>
          {
            'Utilization ρ=λ/μ=λE[S] is dimensionless. In the stable work-conserving one-server models below, it is the long-run busy fraction. Matching two average rates alone does not establish the independence or stationary assumptions; those came from the stated clock model.'
          }
        </Prose>

        <H2>{'4. Derive the M/M/1 load response'}</H2>

        <Prose>
          {'A '}
          <strong>{'stationary distribution'}</strong>
          {' assigns time probabilities π₀,π₁,… to all job counts.'}
        </Prose>

        <QueueingReadingFigure id="Q13" />

        <Prose>
          {
            'Across the drawn boundary between n and n+1 jobs, stationary upward and downward probability flows must balance: λπₙ=μπₙ₊₁. Therefore πₙ₊₁=ρπₙ and πₙ=π₀ρⁿ. The probabilities must sum to one.'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}1&=\\pi_0\\sum_{n=0}^{\\infty}\\rho^n=\\frac{\\pi_0}{1-\\rho},\\\\ \\pi_n&=(1-\\rho)\\rho^n,\\qquad 0<\\lambda<\\mu.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <Prose>
          {
            'The geometric series converges only when ρ<1. The normalization supplies each bar πₙ=(1−ρ)ρⁿ. The last drawn bucket contains all states n≥12, with probability ρ¹²; it is not another ordinary state.'
          }
        </Prose>

        <QueueingReadingFigure id="Q15" />

        <Prose>
          {
            'To find the mean population, slice a column of height n into n unit contributions. The first slice is present whenever N≥1, the second whenever N≥2, and so on. Each tail row therefore has mass P(N≥k)=ρᵏ. Adding the rows gives E[N]=ρ+ρ²+…=ρ/(1−ρ), agreeing with the direct sum Σnπₙ. The finite drawing retains a labelled remainder instead of silently dropping the infinite tail. Little’s Law yields W=L/λ=1/(μ−λ). Subtract mean service 1/μ to obtain Wq. The in-service population is either zero or one, with mean ρ, so Lq=L−ρ.'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}L&=\\frac{\\rho}{1-\\rho},&L_q&=\\frac{\\rho^2}{1-\\rho},\\\\ W&=\\frac{1}{\\mu-\\lambda},&W_q&=\\frac{\\rho}{\\mu-\\lambda}.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <Prose>
          {
            'For λ=8 and μ=10 jobs/s, ρ=0.8, W=1/2=0.5 s, Wq=0.4 s and L=4 jobs. Mean service is only 0.1 s. Congestion accounts for the other 0.4 s; the worker has not become five times slower. Doubling unused capacity μ−λ halves W in this particular model.'
          }
        </Prose>

        <QueueingReadingFigure id="Q14" />

        <Prose>
          {
            'Raise the arrival rate from 8 to 9 with μ fixed at 10: the headroom μ−λ halves from 2 to 1 jobs/s and mean total duration doubles from .5 to 1 s. At 9.5 it becomes 2 s. Crossing λ=10 removes the stationary law from this infinite-buffer model; the drawing reports that missing regime instead of extending a curve into negative delays.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'original-mm1.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/original-mm1.py'}
          filename={'original-mm1.py'}
          language="python"
          title={'original-mm1.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'original-mm1.py.stdout.txt'}
          title={'Output: original-mm1.py'}
          downloadUrl={'/learn-code/queueing-theory/original-mm1.py.stdout.txt'}
        >
          {'0.8 0.5 4.0'}
        </CodeBlock>

        <Prose>
          {
            'The three printed values are utilization, mean total duration and mean population. Keep their units separate.'
          }
        </Prose>

        <Prose>
          {
            'At λ=μ this infinite-state M/M/1 chain has no normalizable stationary distribution; for λ>μ the stationary geometric formula also fails. Returning a negative “mean delay” would be using a formula outside its domain. This is not a theorem that every conceivable system at utilization 1 must fail: perfectly phased deterministic arrivals and services can produce a bounded D/D/1 queue at critical load. A finite-buffer system can also remain stationary above offered capacity by rejecting jobs. We will distinguish those cases explicitly.'
          }
        </Prose>

        <Checkpoint
          prompt={
            <>
              {
                'Does a fixed target such as 70% utilization guarantee an acceptable p99 for every service?'
              }
            </>
          }
        >
          <Prose>
            {
              'No. A utilization ratio omits service-time scale, service variability, arrival structure and scheduling. Even within M/M/1, multiplying both rates by 10 preserves utilization but divides durations by 10. A target must be tied to a declared workload and latency objective. '
            }
          </Prose>
        </Checkpoint>

        <H2>{'5. Separate a mean from a tail'}</H2>

        <Prose>
          {
            'Use T for a random customer’s total duration and Tq for its queue wait. W=E[T] and Wq=E[Tq] are means. A 99th percentile is a threshold with at least 99% of durations at or below it; it is neither a mean nor a guaranteed maximum. Under the stationary FCFS M/M/1 assumptions, we can derive the entire two duration distributions.'
          }
        </Prose>

        <Prose>
          {
            'Count service stages ahead of the tagged arrival. An arrival that finds nobody still needs its own service; one that finds two jobs needs two stages before its own stage.'
          }
        </Prose>

        <QueueingReadingFigure id="Q16" />

        <Prose>
          {
            'PASTA gives an arriving customer a geometric number N of existing jobs. If N=n, the customer must wait for n remaining service stages and then its own stage. Memorylessness makes these n+1 independent exponential stages of rate μ, so their sum has an Erlang density. Multiplying by P(N=n) and summing cancels the factorial series:'
          }
        </Prose>

        <QueueingReadingFigure id="Q17" />

        <Prose>
          {
            'For example, the n=2 branch has weight (1−ρ)ρ² and three total-service stages. Mixing branches means multiplying each conditional density or survival by its weight and adding. A finite computation through n=80 retains the true branch weights and leaves a known missing mass ρ⁸¹. At ρ=.9 this is .00019662705; at time zero its total-time survival sum is .999803373. It remains below 1 because of truncation, not because some jobs have zero total service.'
          }
        </Prose>

        <Prose>
          {'The ordinary SciPy route uses '}
          <code>{'gamma.sf(t, a=n+1, scale=1/μ)'}</code>
          {
            ' for these total-service branches. Integer gamma shape is the number of exponential stages, and scale is reciprocal rate. Direct survival avoids subtracting a CDF close to one. For a waiting branch with n>0 use shape n; for n=0 retain the point mass at zero. The full scratch-versus-SciPy programme appears in section 9 after its second application, finite generator matrices. First finish the infinite mixture algebra:'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}f_{T\\mid N=n}(t)&=\\frac{\\mu^{n+1}t^n e^{-\\mu t}}{n!},\\\\ f_T(t)&=(1-\\rho)\\mu e^{-\\mu t}\\\\ &\\quad\\times\\sum_{n=0}^{\\infty}\\frac{(\\rho\\mu t)^n}{n!}\\\\ &=(\\mu-\\lambda)e^{-(\\mu-\\lambda)t},\\\\ &\\hspace{1em}t>0.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <QueueingReadingFigure id="Q18" />

        <Prose>
          {
            'If N=0, queue wait is exactly zero, with probability 1−ρ. Conditional on N≥1, the geometric distribution of the remaining number of stages gives the same exponential positive-wait law. Thus:'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}P(T>t)&=e^{-(\\mu-\\lambda)t},\\\\ P(T_q>t)&=\\rho e^{-(\\mu-\\lambda)t},\\quad t\\ge0,\\\\ P(T_q=0)&=1-\\rho.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <Prose>
          {
            'The factor ρ belongs to queue-wait survival, not total-time survival. At t=0, total survival is 1 because positive service is still needed, while queue survival is ρ. For a percentile probability 0<p<1, invert the CDF as follows. These formulas use FCFS and exponential service; the M/G/1 mean formula alone does not give this exponential tail for general service.'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}q_p(T)&=\\frac{-\\log(1-p)}{\\mu-\\lambda},\\\\ q_p(T_q)&=0\\quad\\text{if }p\\le1-\\rho,\\\\ q_p(T_q)&=\\frac{\\log\\!\\bigl(\\rho/(1-p)\\bigr)}{\\mu-\\lambda}\\\\ &\\hspace{1em}\\text{if }p>1-\\rho.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <QueueingReadingFigure id="Q19" />

        <Prose>
          {
            'The horizontal guide is survival 1−p. Its crossings locate the two p-quantiles. If p lies inside the zero-wait mass, the queue guide stops at zero before any logarithm is taken. The overview shares [0,100] seconds across the offered inputs; a labelled [0,10] detail exposes low-load changes without altering the probability scale.'
          }
        </Prose>

        <Prose>
          {
            'At λ=0.9 and μ=1 job/s, the total mean is 10 s but total p99 is −log(0.01)/0.1≈46.0517 s. Queue p99 is log(0.9/0.01)/0.1≈44.9981 s; queue mean is 9 s. Subtracting mean service from a total percentile does not generally produce a queue percentile: quantiles do not add or subtract like expectations.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'tails.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/tails.py'}
          filename={'tails.py'}
          language="python"
          title={'tails.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'tails.py.stdout.txt'}
          title={'Output: tails.py'}
          downloadUrl={'/learn-code/queueing-theory/tails.py.stdout.txt'}
        >
          {
            'idle 0.1\nmean_total 10.0\nmean_wait 9.0\nqueue_quantile 44.998097\ntotal_quantile 46.051702\nP(total > 10): 0.367879\nP(queue > 10): 0.331091\nqueue median at load 0.2: 0.0\nNeed 0 < arrival < service and 0 < probability < 1'
          }
        </CodeBlock>

        <Prose>
          {
            'At load 0.2, the queue median is zero because the empty-state probability is 0.8. The program handles that atom before taking a logarithm, and rejects a critical-load stationary calculation. '
          }
        </Prose>

        <H2>{'6. Inspect the job already in service'}</H2>

        <Prose>
          {'In '}
          <strong>{'M/G/1'}</strong>
          {
            ', arrivals remain Poisson and there is one FCFS worker, but service has a general distribution. Let S≥0 be an independent service demand with mean E[S] and second moment E[S²]. Why should a squared duration affect a customer’s wait? A random busy instant is more likely to fall inside a long job than a short one.'
          }
        </Prose>

        <Prose>
          {
            'Consider 95% of jobs lasting 0.05 s and 5% lasting 1.05 s. The mean is 0.95×0.05+0.05×1.05=0.1 s. Yet long jobs occupy 0.05×1.05/0.1=52.5% of service time. Sampling by job count and sampling by occupied time answer different questions. The time-biased probability of a duration sᵢ is pᵢsᵢ/E[S].'
          }
        </Prose>

        <QueueingReadingFigure id="Q20" />

        <Prose>
          {
            'Change only the service law here. Constant, equal .05/.15, exponential, and rare-long all have mean .1 s. The discrete class strips show customer-count shares and occupied-time shares together. For the equal mixture, long jobs are half the customers but three quarters of busy time. Exponential service instead has a continuous density: busy-time sampling weights that density by s/E[S]. It must not be drawn as a few discrete service atoms. This selector is local; the later waiting investigation has its own selection and arrival rate.'
          }
        </Prose>

        <QueueingReadingFigure id="Q21" />

        <Prose>
          {
            'While one service of length s runs, its remaining time decreases linearly from s to zero. The area under that residual curve is a triangle: s×s/2=s²/2. Over a long busy-time record, total triangle area divided by total service time approaches E[S²]/(2E[S]). This is the mean residual *conditional on inspecting a busy worker*. It is not yet the residual seen at an arbitrary instant, which is zero when the worker is idle.'
          }
        </Prose>

        <Prose>{'Before taking an expectation, perform the geometry on a finite record.'}</Prose>

        <QueueingReadingFigure id="Q22" />

        <Prose>
          {
            'Let the service intervals be [0,2), [3,4) and [4,7), observed through 8 s. Their residual triangles have areas 2, 1/2 and 9/2 seconds², totalling 7. There are 6 busy seconds, so inspection conditional on being busy gives 7/6 s. There are 8 observed seconds including two idle seconds with residual zero, so unconditional inspection gives 7/8 s. Dividing by the right exposure is the whole distinction.'
          }
        </Prose>

        <Prose>
          {
            'For those three completed services, the sample mean is 2 and sample second moment is 14/3. Their algebraic ratio (14/3)/(2×2)=7/6 matches the busy calculation; observed completion frequency 3/8 times (14/3)/2 gives 7/8. These are finite-record identities. Under the stationary service and arrival assumptions, the corresponding limiting quantities become:'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}E[R\\mid\\text{busy}]&=\\frac{E[S^2]}{2E[S]},\\\\ E[R]&=\\rho\\frac{E[S^2]}{2E[S]}\\\\ &=\\frac{\\lambda E[S^2]}{2},\\\\ \\rho&=\\lambda E[S].\\end{aligned}'
            }
          </MathBlock>
        </div>

        <Prose>
          {
            'For the rare-long mixture, E[S²]=0.95×0.05²+0.05×1.05²=0.0575 s². The busy-conditional residual is 0.2875 s. At λ=8, ρ=0.8, so the time-average residual including idle zeroes is 0.23 s. In contrast, constant 0.1 s jobs give busy residual 0.05 s. The second moment captures the combined effects of seeing longer jobs more often and finding more remaining time inside them.'
          }
        </Prose>

        <H2>{'7. Derive the general-service wait'}</H2>

        <QueueingReadingFigure id="Q23" />

        <Prose>
          {
            'An arriving FCFS customer must finish the current residual service plus the full service demands of customers waiting ahead. Assume iid service requirements independent of arrivals, no interruption, and a stable regime with ρ<1 and finite E[S²]. Under FCFS, the queued customers’ unrevealed service requirements have the original service distribution; a customer’s own service duration has not determined whether it is still waiting. PASTA supplies the time-average residual and queue count, and Little’s waiting-only law supplies Lq=λWq.'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}W_q&=E[R]+L_qE[S]\\\\&=\\frac{\\lambda E[S^2]}{2}+\\lambda W_qE[S],\\\\ (1-\\rho)W_q&=\\frac{\\lambda E[S^2]}{2},\\\\ W_q&=\\frac{\\lambda E[S^2]}{2(1-\\rho)},\\\\ W&=E[S]+W_q.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <Prose>
          {'This is the '}
          <strong>{'Pollaczek–Khinchine (P–K) mean-wait formula'}</strong>
          {
            '. The second moment can be computed as E[S]²+Var(S). If mean service is 0.1 s and standard deviation is 0.05 s, E[S²]=0.0125 s². At λ=8, Wq=8×0.0125/(2×0.2)=0.25 s and W=0.35 s.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'original-mg1.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/original-mg1.py'}
          filename={'original-mg1.py'}
          language="python"
          title={'original-mg1.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'original-mg1.py.stdout.txt'}
          title={'Output: original-mg1.py'}
          downloadUrl={'/learn-code/queueing-theory/original-mg1.py.stdout.txt'}
        >
          {'0.25 0.35'}
        </CodeBlock>

        <Prose>
          {
            'These outputs are queue wait and total time. The standard deviation is in seconds, and its square is in seconds squared; adding a standard deviation directly to a squared mean would be dimensionally wrong. '
          }
        </Prose>

        <Prose>
          {
            'Now the service selector can answer a waiting question, because residual work and the P–K equation have been derived.'
          }
        </Prose>

        <QueueingReadingFigure id="Q24" />

        <Prose>
          {
            'This later investigation has an independent service-law selector and an arrival-rate control. At λ=8, the rare-long busy residual .2875 s becomes a full-time residual .23 s, then a queue wait .23/(1−.8)=1.15 s. Constant service instead gives .05, .04 and .2 s. Raise λ toward 9.5 and the shared .1-second mean makes the same small denominator amplify every residual contribution. Reset here restores two-size service and λ=8; it does not change the earlier share-only selector.'
          }
        </Prose>

        <Prose>
          {'Same mean service 0.1 s, same arrival rate 8 jobs/s, different FCFS congestion'}
        </Prose>

        <NeuralTable
          caption={'7. Derive the general-service wait'}
          headers={[
            <>{'Service distribution'}</>,
            <>{'E[S²] in s²'}</>,
            <>{'Mean wait in s'}</>,
            <>{'Mean total in s'}</>,
          ]}
          rows={[
            [<>{'Constant'}</>, <>{'0.01'}</>, <>{'0.2'}</>, <>{'0.3'}</>],
            [<>{'Equal 0.05 / 0.15 s'}</>, <>{'0.0125'}</>, <>{'0.25'}</>, <>{'0.35'}</>],
            [<>{'Exponential'}</>, <>{'0.02'}</>, <>{'0.4'}</>, <>{'0.5'}</>],
            [<>{'95% 0.05 / 5% 1.05 s'}</>, <>{'0.0575'}</>, <>{'1.15'}</>, <>{'1.25'}</>],
          ]}
        />

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'mixtures.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/mixtures.py'}
          filename={'mixtures.py'}
          language="python"
          title={'mixtures.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'mixtures.py.stdout.txt'}
          title={'Output: mixtures.py'}
          downloadUrl={'/learn-code/queueing-theory/mixtures.py.stdout.txt'}
        >
          {
            'constant mean 0.1 second 0.01\nbusy-time shares: [1.0]\nresidual if busy / at random time: 0.05 0.04\nmean wait / total: 0.2 0.3\ntwo sizes mean 0.1 second 0.0125\nbusy-time shares: [0.25, 0.75]\nresidual if busy / at random time: 0.0625 0.05\nmean wait / total: 0.25 0.35\nrare long mean 0.1 second 0.0575\nbusy-time shares: [0.475, 0.525]\nresidual if busy / at random time: 0.2875 0.23\nmean wait / total: 1.15 1.25'
          }
        </CodeBlock>

        <Prose>
          {
            'The long class in the rare-long distribution is a minority of jobs but a majority of occupied time. Compare the two residual averages before the final delay; this identifies what changes rather than treating P–K as a black box. Reducing rare expensive work can improve FCFS waiting even if the mean barely changes. Splitting classes or adding priorities changes who waits, and can introduce starvation or different fairness tradeoffs; do not keep using a single FCFS formula after changing its discipline. Bursty correlated arrivals also break the Poisson part of this derivation. A service-time histogram alone cannot validate the complete model.'
          }
        </Prose>

        <H3>{'Deeper: stable need not mean a finite average delay'}</H3>

        <Prose>
          {
            'Take a Pareto service demand with P(S>s)=(xₘ/s)³ᐟ² for s≥xₘ=1/30 s, and probability 1 below xₘ. Its mean is 3xₘ=0.1 s but its second moment is infinite. At λ=8, ρ=0.8<1; this M/G/1 workload has a proper stationary regime, yet the mean FCFS wait is infinite.'
          }
        </Prose>

        <QueueingReadingFigure id="Q25" />

        <Prose>
          {
            'A cap M creates an atom at M of size P(S≥M): all larger original durations are mapped to the endpoint. Below that endpoint the survival is unchanged. Thus, for M≥xₘ,'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              'E[S^M]=3x_m-\\frac{2x_m^{3/2}}{\\sqrt M},\\qquad\nE[(S^M)^2]=4x_m^{3/2}\\sqrt M-3x_m^2.'
            }
          </MathBlock>
        </div>

        <Prose>
          {
            'The first comes from integrating survival; the second weights survival by twice the duration. The second integral keeps increasing like √M while the mean approaches .1. That difference explains why stable load and finite average waiting separate.'
          }
        </Prose>

        <Prose>
          {
            'To justify the mean claim without substituting infinity into an unexplained algebra step, cap every service at M using Sᴹ=min(S,M). Each capped queue has shorter or equal waits under the same arrivals, by the workload recursion. Its finite second moment increases without bound, while its mean approaches 0.1 and its utilization approaches 0.8. P–K makes these lower-bound means diverge. Therefore the original stationary mean wait cannot be finite. Individual waits can still be finite almost surely.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'heavy-tail.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/heavy-tail.py'}
          filename={'heavy-tail.py'}
          language="python"
          title={'heavy-tail.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'heavy-tail.py.stdout.txt'}
          title={'Output: heavy-tail.py'}
          downloadUrl={'/learn-code/queueing-theory/heavy-tail.py.stdout.txt'}
        >
          {
            'cap 1 mean 0.087828 load 0.702627 mean wait 0.282607\ncap 10 mean 0.096151 load 0.769208 mean wait 1.276417\ncap 100 mean 0.098783 load 0.790263 mean wait 4.579041\ncap 1000 mean 0.099615 load 0.796921 mean wait 15.096908'
          }
        </CodeBlock>

        <Prose>
          {'Untruncated mean service = 0.1; load = 0.8; second moment and mean wait are infinite.'}
        </Prose>

        <Prose>
          {
            'For a nonnegative variable, E[S]=∫P(S>t)dt and E[S²]=∫2tP(S>t)dt. Integrating the capped survival yields the formulas in this program. The growing finite values illustrate the proof; four caps or a finite simulation do not prove the limiting statement by themselves.'
          }
        </Prose>

        <H3>{'Another application: polling and repeated server vacations'}</H3>

        <Prose>
          {
            'Suppose a worker, whenever the system empties, takes an independent vacation V. If it returns to an empty system it takes another; if jobs are present it serves exhaustively until empty again. Arrivals are independent Poisson, service is iid FCFS and vacations are iid, independent of both, with positive finite first and second moments. This models a particular repeated polling mechanism, not arbitrary load-dependent device wake-up behavior.'
          }
        </Prose>

        <QueueingReadingFigure id="Q26" />

        <Prose>
          {
            'At a nonservice instant the mean residual vacation is E[V²]/(2E[V]). Nonservice occupies fraction 1−ρ. Consequently the residual-work decomposition becomes Wq=λE[S²]/2+(1−ρ)E[V²]/(2E[V])+ρWq. Solving leaves:'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}W_q&=\\frac{\\lambda E[S^2]}{2(1-\\rho)}\\\\ &\\quad+\\frac{E[V^2]}{2E[V]}.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'vacations.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/vacations.py'}
          filename={'vacations.py'}
          language="python"
          title={'vacations.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'vacations.py.stdout.txt'}
          title={'Output: vacations.py'}
          downloadUrl={'/learn-code/queueing-theory/vacations.py.stdout.txt'}
        >
          {
            'arrival 8 congestion / vacation / total wait: (0.2, 0.2, 0.4)\narrival 1 congestion / vacation / total wait: (0.005556, 0.2, 0.205556)\narrival 0.01 congestion / vacation / total wait: (5e-05, 0.2, 0.20005)'
          }
        </CodeBlock>

        <Prose>
          {
            'A constant 0.4 s polling cycle adds a 0.2 s mean residual vacation. As positive arrival rate approaches zero, the congestion term vanishes but this polling delay remains. Zero arrival rate itself supplies no customer population; this statement is a limiting tagged-arrival prediction. '
          }
        </Prose>

        <H2>{'8. Pool workers without changing the question'}</H2>

        <Prose>
          {
            'Adding a second worker allows two jobs to receive service simultaneously. It does not halve the service time of one job. In '
          }
          <strong>{'M/M/c'}</strong>
          {
            ', c identical workers share one FCFS queue, each with exponential service rate μ. All service demands and the Poisson arrivals are independent. When n jobs are present, min(n,c) workers are busy, so the total completion rate is min(n,c)μ.'
          }
        </Prose>

        <QueueingReadingFigure id="Q27" />

        <Prose>
          {
            "In the separate-queue snapshot, worker 1 serves A with B and C waiting while worker 2 is idle. A shared queue can immediately send B to worker 2. The gain comes from reallocating free capacity; it does not shorten B's own service demand. This structural snapshot introduces the architecture before a stationary probability is assigned to it."
          }
        </Prose>

        <QueueingReadingFigure id="Q28" />

        <Prose>
          {
            'Put a=λ/μ and ρ=a/c. Repeating the birth/death balance gives relative stationary weights wₙ=aⁿ/n! through n=c. Above c, all workers stay busy and successive weights have ratio ρ. Normalize the finite prefix plus the geometric tail. The probability that all workers are busy is also, by PASTA, the probability C that an arrival must wait. This is the '
          }
          <strong>{'Erlang C'}</strong>
          {' probability.'}
        </Prose>

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}Z&=\\sum_{n=0}^{c-1}\\frac{a^n}{n!}+\\frac{a^c}{c!(1-\\rho)},\\\\ C&=\\frac{a^c}{c!(1-\\rho)Z},\\\\ L_q&=\\frac{C\\rho}{1-\\rho},\\\\ W_q&=\\frac{C}{c\\mu-\\lambda},\\\\ W&=W_q+\\frac1\\mu,\\qquad \\rho<1.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <Prose>
          {
            'To see the Lq expression, write states above c as c+k with probability (w_c/Z)ρᵏ and queue length k. Sum kρᵏ to obtain (w_c/Z)ρ/(1−ρ)²=Cρ/(1−ρ), then divide by λ. Waiting probability and waiting duration are different: multiplying a dimensionless probability by a duration scale produces the mean.'
          }
        </Prose>

        <Prose>
          {
            'At λ=8, c=2 and per-worker μ=5, a=1.6 and ρ=0.8. We obtain Z=1+1.6+1.6²/(2×0.2)=9, C=6.4/9=32/45, Wq=C/2=16/45 s, and W=5/9≈0.5556 s. If instead each Poisson arrival independently chooses one of two separate queues with equal probability, Poisson splitting gives independent rate-4 inputs. Each separate M/M/1 has W=1/(5−4)=1 s.'
          }
        </Prose>

        <QueueingReadingFigure id="Q29" />

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'pooling.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/pooling.py'}
          filename={'pooling.py'}
          language="python"
          title={'pooling.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'pooling.py.stdout.txt'}
          title={'Output: pooling.py'}
          downloadUrl={'/learn-code/queueing-theory/pooling.py.stdout.txt'}
        >
          {
            'pooled probability of waiting: 0.711111\npooled mean wait / total: 0.355556 0.555556\nuniform independent split, mean total: 1.0\none server twice as fast, mean total: 0.5\none-server check: (0.8, 0.4, 0.5)'
          }
        </CodeBlock>

        <Prose>
          {
            'A single worker twice as fast has μ=10 and W=0.5 s, because its own service is shorter. All three architectures have total nominal capacity 10 jobs/s, yet their mean response differs. These conclusions depend on the stated exponential job model and routing. Deterministic round-robin or shortest-queue dispatch does not produce the same independent Poisson inputs. '
          }
        </Prose>

        <H2>{'9. Account for admission and loss'}</H2>

        <Prose>
          {
            'A buffer limit prevents the job count from growing indefinitely, but it may do so by rejecting work. In '
          }
          <strong>{'M/M/1/K'}</strong>
          {
            ', K is the total number of jobs allowed inside, including the one in service. An offered Poisson arrival finding n=K is rejected immediately. For n<K, admission increments the count; departures occur at rate μ when n>0.'
          }
        </Prose>

        <QueueingReadingFigure id="Q30" />

        <Prose>
          {
            'The fourth offered job meets all three occupied slots and follows the rejection branch. Only an admitted job enters the population used in residence accounting.'
          }
        </Prose>

        <QueueingReadingFigure id="Q31" />

        <div className="neural-equation">
          <MathBlock>
            {
              '\\begin{aligned}\\pi_n&=\\frac{\\rho^n}{\\sum_{j=0}^K\\rho^j},\\\\ &n=0,\\ldots,K,\\\\ \\rho&=\\lambda/\\mu,\\\\ \\lambda_{\\rm eff}&=\\lambda(1-\\pi_K)\\\\ &=\\mu(1-\\pi_0),\\\\ L&=\\sum_{n=0}^K n\\pi_n,\\\\ W_{\\rm admitted}&=\\frac{L}{\\lambda_{\\rm eff}}.\\end{aligned}'
            }
          </MathBlock>
        </div>

        <Prose>
          {
            'The finite sum normalizes for every positive λ and μ; when ρ=1 it simply yields a uniform distribution. With K=3 and λ=μ=10, πₙ=1/4. Offered rate is 10 jobs/s, rejection probability is 1/4, admitted throughput is 7.5 jobs/s, L=1.5 jobs and admitted mean response is 1.5/7.5=0.2 s. Using offered throughput would incorrectly give 0.15 s for this admitted-customer population.'
          }
        </Prose>

        <Prose>
          {
            'In the admission investigation, keep the offered and accepted arrows separate. At equal rates the four state bars are equal. At K=1 the waiting population is always zero; a one-slot worker still spends time serving each admitted job.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'finite-capacity.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/finite-capacity.py'}
          filename={'finite-capacity.py'}
          language="python"
          title={'finite-capacity.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'finite-capacity.py.stdout.txt'}
          title={'Output: finite-capacity.py'}
          downloadUrl={'/learn-code/queueing-theory/finite-capacity.py.stdout.txt'}
        >
          {
            'offered 8 probabilities [0.338753, 0.271003, 0.216802, 0.173442]\ndrop / admitted rate: 0.173442 6.612466\nL / W / Wq: 1.224932 0.185246 0.085246\noffered 10 probabilities [0.25, 0.25, 0.25, 0.25]\ndrop / admitted rate: 0.25 7.5\nL / W / Wq: 1.5 0.2 0.1\noffered 12 probabilities [0.186289, 0.223547, 0.268256, 0.321908]\ndrop / admitted rate: 0.321908 8.137109\nL / W / Wq: 1.725782 0.212088 0.112088\none-slot queue wait: 0.0'
          }
        </CodeBlock>

        <Prose>
          {
            'At offered λ=12>μ=10, the finite chain still has a stationary distribution: it rejects about 32.19% of offered jobs. This is not an infinite-buffer stability guarantee or a successful-service guarantee. At K=1, admitted jobs never wait in a queue but still receive mean service 0.1 s. Retries can increase offered traffic and introduce dependence; a rejection that triggers another request is not automatically an independent Poisson arrival. Finite populations, priorities, batches, affinity, fan-out and shared downstream contention can each change the model. A service with c devices is not necessarily c independent identical exponential servers. Track admitted and rejected work together so a falling latency does not conceal worsening admission.'
          }
        </Prose>

        <Prose>
          {
            'The finite queue also gives us a small matrix problem we can inspect completely. Use a changed fixture λ=2 jobs/s, μ=3 jobs/s, K=2: states 0, 1 and 2 count jobs inside, including the worker.'
          }
        </Prose>

        <QueueingReadingFigure id="Q32" />

        <Prose>
          {'Each row describes departures '}
          <strong>{'from'}</strong>
          {
            ' its state. Row 0 has rate 2 to state 1 and diagonal −2. Row 1 has rate 3 to state 0, rate 2 to state 2, and diagonal −5. Row 2 has rate 3 to state 1 and diagonal −3. An offered arrival while full is rejected without changing the state, so it creates no off-diagonal transition. The row sum is zero in every case:'
          }
        </Prose>

        <div className="neural-equation">
          <MathBlock>{'Q=\\begin{bmatrix}-2&2&0\\\\3&-5&2\\\\0&3&-3\\end{bmatrix}.'}</MathBlock>
        </div>

        <Prose>
          {
            'Let the probability row be π=(π₀,π₁,π₂). Stationarity means πQ=0: the probability flowing into each state equals the probability flowing out. Equivalently, a column solver uses Qᵀπᵀ=0. The first equation gives 2π₀=3π₁; the last gives 2π₁=3π₂. Relative weights are 1, 2/3, 4/9. Their sum is 19/9, so π=(9,6,4)/19.'
          }
        </Prose>

        <Prose>
          {
            'The balance equations are redundant because the rows of Q sum to zero. To obtain a unique normalized probability column, replace one equation in the transposed system by π₀+π₁+π₂=1, then call '
          }
          <code>{'scipy.linalg.solve'}</code>
          {' on that ordinary linear system. Afterwards check '}
          <strong>{'all'}</strong>
          {
            ' original balances, nonnegative probabilities and their sum. A small residual verifies the solved equation; the independent arrival/service assumptions remain the modelling premise.'
          }
        </Prose>

        <Prose>
          {
            'Stationarity concerns a queue observed after its distribution has settled. We can also start empty and ask for its law one second later. Recall the matrix semigroup from the earlier '
          }
          <a href={'/learn/topic/stochastic-processes-markov-chains-brownian-motion-poisson'}>
            {'finite-process explanation'}
          </a>
          {': a row distribution at time t is p(0) exp(tQ).'}
        </Prose>

        <QueueingReadingFigure id="Q33" />

        <Prose>
          {
            "Return now to the four-state K=3 queue used in the admission investigation, with λ=12 and μ=10. The empty-start row is (1,0,0,0); multiplying it by the one-second transition matrix selects that matrix's first row. The recorded result is approximately (.186976588, .223924497, .268016275, .321082640), while the invariant law is (.186289121, .223546945, .268256334, .321907601). Both rows refer to states 0 through 3, but one is a finite-time distribution and the other solves balance."
          }
        </Prose>

        <Prose>
          {''}
          <code>{'scipy.linalg.expm(Q)'}</code>
          {' computes the '}
          <strong>{'matrix'}</strong>
          {
            ' exponential for one second. Entrywise exponentials would ignore paths through intermediate states and fail to produce this transition law. The companion uniformization route instead sets ν=maxᵢ(−Qᵢᵢ), constructs a stochastic step matrix I+Q/ν, and mixes its powers with Poisson weights of mean νt. At λ=12, μ=10 the largest leaving rate is 22; the one-second mixture therefore uses mean 22. Keeping terms 0 through 80 leaves Poisson mass about 3.5770×10⁻²², reported separately. No renormalization hides that truncation.'
          }
        </Prose>

        <Prose>
          {
            'Use Python 3.12 for the complete tool route. Install its packages with the same Python interpreter that will run the programme:'
          }
        </Prose>

        <CodeBlock language={'bash'}>{'python -m pip install numpy==2.3.5 scipy'}</CodeBlock>

        <Prose>
          {
            'The displayed SciPy run recorded Python 3.12.14 but did not retain its SciPy patch version. This command leaves SciPy unpinned; the linked current documentation is an API reference, not a record of the executed release. Compare the stated residuals and tolerances rather than requiring identical final floating-point digits.'
          }
        </Prose>

        <Prose>
          {'Download the complete earlier '}
          <a
            href={
              '/learn-code/stochastic-processes-markov-chains-brownian-motion-poisson/finite_process_library.py'
            }
          >
            {'finite_process_library.py'}
          </a>
          {
            ' alongside the following programme. It supplies the existing uniformization implementation; importing the file does not execute its guarded example main. Run '
          }
          <code>{'python queue_stationary_tools.py finite_process_library.py'}</code>
          {
            '. NumPy and SciPy supply the array, gamma survival, linear solve and matrix exponential routes. The programme itself implements the finite queue generator, normalized stationary solve, and explicit Erlang-survival sum.'
          }
        </Prose>

        <Prose>
          {
            "The first three output groups revisit section 5's mixture. For n exponential stages and x=μt, the scratch survival is exp(−x) times 1+x+…+xⁿ⁻¹/(n−1)!. Updating each term from the previous one avoids explicitly computing factorials. Its bounded x≤80 and n≤201 keep this direct teaching implementation in a modest range. "
          }
          <code>{'gamma.sf'}</code>
          {
            ' evaluates the same branches. The two routes agree to the shown precision, while their finite sums fall short of the closed infinite tail by no more than the omitted geometric mass. At t=0, queue survival starts near .9; the missing .1 is the separate zero-wait atom, and the additional .00019662705 is omitted mixture mass.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'queue_stationary_tools.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/queue_stationary_tools.py'}
          filename={'queue_stationary_tools.py'}
          language="python"
          title={'queue_stationary_tools.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'queue_stationary_tools.py.stdout.txt'}
          title={'Output: queue_stationary_tools.py'}
          downloadUrl={'/learn-code/queueing-theory/queue_stationary_tools.py.stdout.txt'}
        >
          {
            'time / scratch wait / SciPy wait / scratch total / SciPy total: 0.0 0.899803373 0.899803373 0.999803373 0.999803373\r\nomitted mixture mass / zero-wait atom: 0.00019662705047555332 0.09999999999999998\r\ntime / scratch wait / SciPy wait / scratch total / SciPy total: 1.0 0.814157049 0.814157049 0.904640791 0.904640791\r\nomitted mixture mass / zero-wait atom: 0.00019662705047555332 0.09999999999999998\r\ntime / scratch wait / SciPy wait / scratch total / SciPy total: 4.0 0.603091414 0.603091414 0.670123419 0.670123419\r\nomitted mixture mass / zero-wait atom: 0.00019662705047555332 0.09999999999999998\r\noffered / invariant law: 8.0 [0.338753388, 0.27100271, 0.216802168, 0.173441734]\r\nequation residual / admitted rate / total seconds: 0.0 6.612466125 0.185245902\r\nempty-start one-second law: [0.340526528, 0.27147243, 0.215977814, 0.172023227]\r\nuniformization discrepancy / unrenormalized missing mass: 2.498001805406602e-16 1.598769398793537e-27\r\noffered / invariant law: 10.0 [0.25, 0.25, 0.25, 0.25]\r\nequation residual / admitted rate / total seconds: 0.0 7.5 0.2\r\nempty-start one-second law: [0.251219446, 0.25050511, 0.249494888, 0.248780555]\r\nuniformization discrepancy / unrenormalized missing mass: 2.220446049250313e-16 1.1355720482109153e-24\r\noffered / invariant law: 12.0 [0.186289121, 0.223546945, 0.268256334, 0.321907601]\r\nequation residual / admitted rate / total seconds: 0.0 8.137108793 0.212087912\r\nempty-start one-second law: [0.186976588, 0.223924497, 0.268016275, 0.32108264]\r\nuniformization discrepancy / unrenormalized missing mass: 4.996003610813204e-16 3.5770045574516642e-22\r\n'
          }
        </CodeBlock>

        <Prose>
          {
            'For offered rates 8, 10 and 12, the finite state law remains normalized. At equal rates all four entries are .25. For offered 12, the accepted rate is 8.137108793 jobs/s and the admitted mean total is .212087912 s. Each printed invariant row passes its own balance residual check and remains invariant under the matrix exponential. The empty-start row is a separate calculation; one small discrepancy from equilibrium at one time is not a mixing-time certificate.'
          }
        </Prose>

        <Prose>
          {
            'The explicit Erlang mixture has O(B²) work for budget B because each branch recomputes its stage sum. The small dense solve and matrix exponential scale cubically in K+1; uniformization also performs one dense matrix product per retained term. Here K is bounded by 20 and rates by 20/s. The imported helper accepts matrix order at most 32, nonnegative off-diagonals and zero row sums, finite t≥0, integer last term 0–10000 and νt≤100. Our one-second examples satisfy those declared limits. For a large queueing network, exploit its sparsity or use a specialized transient method instead of treating a dense demonstration as the computational model for every size.'
          }
        </Prose>

        <Prose>{'<a id="queueing-code-route"></a>'}</Prose>

        <H3>{'Replay the same jobs through an event simulator'}</H3>

        <Prose>
          {
            "The next example changes B and C's service demands from 1 and 2 seconds to 2 and 1 seconds. Arrival times stay [0,1,2,6]. Its residence total will consequently be 12, compared with the opening cohort's 11."
          }
        </Prose>

        <QueueingReadingFigure id="Q34" />

        <Prose>
          {
            'For one FCFS server, start=max(arrival,previous departure) and departure=start+service already solve a finite trace in O(N) time. The complete bridge exposes that recurrence, then sends the same jobs through a SimPy Resource with capacity 1. Input order resolves simultaneous arrivals; zero service is allowed. This finite comparison admits 0–32 jobs, nonnegative nondecreasing arrivals at most 1,000,000 s and services at most 10,000 s, all exact multiples of 1/8 s. It rejects off-grid values rather than rounding them. Internally both routes use integer ticks; every returned column is divided by eight and expressed in seconds. Empty input yields a (0,3) trace and zero occupancy for a positive window; its customer mean is undefined. A generator schedules arrivals, each job requests the resource, and the context manager releases it after service.'
          }
        </Prose>

        <Prose>
          {
            "The bridge's displayed run used Python 3.12.14, NumPy 2.3.5 and SimPy 4.1.2. Reuse the same Python environment and install these package versions before running it:"
          }
        </Prose>

        <CodeBlock language={'bash'}>
          {'python -m pip install numpy==2.3.5 simpy==4.1.2\npython fcfs-simpy-bridge.py'}
        </CodeBlock>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'fcfs-simpy-bridge.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/fcfs-simpy-bridge.py'}
          filename={'fcfs-simpy-bridge.py'}
          language="python"
          title={'fcfs-simpy-bridge.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'fcfs-simpy-bridge.py.stdout.txt'}
          title={'Output: fcfs-simpy-bridge.py'}
          downloadUrl={'/learn-code/queueing-theory/fcfs-simpy-bridge.py.stdout.txt'}
        >
          {
            'arrival/start/departure [[0.0, 0.0, 3.0], [1.0, 3.0, 5.0], [2.0, 5.0, 6.0], [6.0, 6.0, 7.0]]\r\nmean wait / sojourn / time-average N [1.25, 3.0, 1.714286]\r\narrival/start/departure [[0.0, 0.0, 0.0], [0.0, 0.0, 2.0], [0.0, 2.0, 2.0], [1.0, 2.0, 3.0], [4.0, 4.0, 4.0]]\r\nmean wait / sojourn / time-average N [0.6, 1.2, 1.5]\r\nhorizon 4 censored occupancy area 8.0\r\nfull cohort sojourn sum 12.0\r\n'
          }
        </CodeBlock>

        <Prose>
          {
            'Every start and departure must agree, not only the mean wait. For arrivals (0,1,2,6) and services (3,2,1,1), waits average 1.25 and sojourns average 3. Draining all four jobs through time 7 gives occupancy area 12. Cutting the observation at time 4 gives area 8; it cannot be compared with the full-cohort sojourn sum as if the windows matched.'
          }
        </Prose>

        <Prose>
          {
            'The exact tick bound is 8,000,000 arrival ticks plus at most 32×80,000 service ticks, so no departure exceeds 10,560,000 ticks. Division by eight is exact in binary floating point within this domain. This bound belongs to the finite demonstration; the stochastic service model does not require durations on a grid. The recurrence stores O(N) trace values here; it can stream summary totals with constant additional state. A general simulator manages pending events and resource queues, adding scheduler overhead in exchange for richer interactions. It is useful when interruptions, routing or multiple resources make a single-server recurrence insufficient. For a long single-worker experiment, the duration-based Lindley recursion in section 10 avoids maintaining a calendar of events. A drained finite trace is not evidence of stationarity or PASTA.'
          }
        </Prose>

        <section className="queue-practice" data-lesson-exercise="">
          <H3>{'Implementation practice: ties, idle time and a second worker'}</H3>
          <Prose>
            {
              "Run arrivals (0,0,0,1,4), services (0,2,0,1,0), then change SimPy's capacity to 2. Identify which comparison must change."
            }
          </Prose>
          <details>
            <summary>Solution and checks</summary>
            <Prose>
              {
                'At capacity 1 the starts are (0,0,2,2,4); the zero-duration third job still waits behind the busy server. Capacity 2 changes resource allocation, so the single-server recurrence is no longer its oracle. Implement an earliest-available-server schedule with the same FCFS tie convention before claiming parity. '
              }
              <a href={'https://simpy.readthedocs.io/en/latest/topical_guides/resources.html'}>
                {'SimPy resources'}
              </a>
              {
                ' describes requests, capacities and release. This comparison uses ordinary Resource; preemption would change the service model.'
              }
            </Prose>
          </details>
        </section>

        <H2>{'10. Measure, test and practise'}</H2>

        <Prose>
          {
            'Begin an operational study by defining the boundary, the workload classes and the observation interval. Record arrival, service start and departure timestamps for the same jobs, plus service demand or actual resource occupancy when parallel stages matter. Compare direct occupancy integration with residence accounting. Keep unfinished jobs and pre-window residents visible; filtering to quick completions biases service and response distributions. Censored durations need suitable survival methods or a completed-cohort design, not deletion without comment.'
          }
        </Prose>

        <Prose>
          {
            'Estimate rates over relevant time windows and inspect interarrival dependence, burst patterns and time-of-day changes. A count histogram resembling Poisson is not proof of independent increments. Separate service distributions by workload class and note whether service slows with concurrency. Then select the simplest model whose assumptions match the decision. Choose headroom from a latency/loss objective and workload uncertainty, rather than a universal utilization percentage. Test failures, scaling delays, retries and downstream bottlenecks; monitor queue age, queue length, utilization, service durations, admitted rate, rejection and latency percentiles together.'
          }
        </Prose>

        <Prose>
          {
            'We can assess one stochastic model by running its own declared random clocks. Each of eight streams below supplies a run mean; the displayed points are those eight results.'
          }
        </Prose>

        <QueueingReadingFigure id="Q35" />

        <Prose>
          {'The interval around their mean is '}
          <strong>{'±one estimated Monte Carlo standard error'}</strong>
          {
            ', computed from the across-stream sample standard deviation divided by √8. It is an uncertainty scale, not a guaranteed 95% interval. Within-run customer dependence is retained by forming one mean per stream. The theoretical .5-second line follows from λ=8, μ=10; transient and finite-sample errors remain possible.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'simulation.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/simulation.py'}
          filename={'simulation.py'}
          language="python"
          title={'simulation.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'simulation.py.stdout.txt'}
          title={'Output: simulation.py'}
          downloadUrl={'/learn-code/queueing-theory/simulation.py.stdout.txt'}
        >
          {
            'total-time means by independent run: [0.508615, 0.482854, 0.495349, 0.481578, 0.516882, 0.5184, 0.492325, 0.508635]\nmean across runs: 0.50058\nestimated Monte Carlo standard error: 0.005147\nstationary theoretical total mean: 0.5\ntheory minus finite estimate: -0.00058'
          }
        </CodeBlock>

        <Prose>
          {
            'Each seeded run starts empty, discards the first 5,000 arrivals, then records the complete durations of the next 50,000 arrivals. The final measured cohort is completed by the recursion rather than dropping unfinished jobs at an arbitrary time. Customers within a run remain correlated. Eight independent random streams give eight run means, whose sample standard deviation divided by √8 estimates Monte Carlo standard error. The estimate here is 0.50058 s versus theoretical 0.5 s, with estimated MC standard error 0.005147 s. Burn-in is a chosen diagnostic setting, not a proof that all transient bias is gone. Repeat with longer warm-up and different load before interpreting a discrepancy.'
          }
        </Prose>

        <Prose>
          {
            'Lindley’s recursion also helps numerical accuracy: it tracks the previous customer’s total duration, subtracts the new interarrival gap, and keeps any remaining wait. Adding this customer’s service gives their total duration. It avoids subtracting large calendar times, which can erase a short service duration after a very long idle period. An exact event identity, an idealized stochastic model and a finite stochastic experiment play different roles. A simulator that draws independent exponential jobs can validate that calculation and its implementation; it cannot establish that a production workload is exponential. Realistic trace replay or load tests need their own measured workload, temporal structure and system boundaries.'
          }
        </Prose>

        <H3>{'Inspect an observed duration distribution'}</H3>

        <Prose>
          {
            "An observed service-like quantity can teach variability before it justifies a queue model. The UCI Bank Marketing dataset includes a published 4,521-record subset with last-contact duration in seconds. Our two-column projection retains each published row's ID and duration. It contains no arrival, service-start or queue-departure timestamps. The record order is the published order, not an arrival sequence."
          }
        </Prose>

        <QueueingReadingFigure id="Q36" />

        <Prose>
          {
            'The first strip counts records in each of five duration ranges. The second counts their share of '
          }
          <strong>{'total observed duration'}</strong>
          {
            ', using the same ranges, colours and marker labels. The (0,60] second range contains 492 of 4,521 records, about 10.8825%, but only 1.4076% of the total duration. The (600,86400] range contains 422 records, about 9.3342%, but accounts for 31.7065% of total duration. The observed maximum is 3,025 seconds; 86,400 is the declared upper bin bound, not an observed duration.'
          }
        </Prose>

        <Prose>
          {
            'The longest ceil(4521/10)=453 records have 10.0199% of record count and 33.2364% of observed duration. Stable source-row IDs resolve equal-duration ties in a display of that selected group. These shares express the same length-bias mechanism as the two-size example, now computed from a real set of observed values.'
          }
        </Prose>

        <Prose>
          {
            'To calculate moments, use every original duration sᵢ, giving each record mass 1/n. The empirical mean is Σsᵢ/n and its second moment is Σsᵢ²/n. The bins summarize that distribution visually; their midpoints never replace the raw values in a moment or waiting calculation. Population variance is m₂−m₁², matching '
          }
          <code>{'numpy.var(ddof=0)'}</code>
          {
            '. The sample-variance denominator n−1 answers an estimation question and would change the exact empirical-law second moment if substituted here.'
          }
        </Prose>

        <QueueingReadingFigure id="Q37" />

        <Prose>
          {'We now declare a '}
          <strong>{'hypothetical'}</strong>
          {
            ' iid service law: pick one of these raw records uniformly and use its duration as a service demand. Separately choose an independent Poisson arrival rate λ=.5/m₁, so the model has load .5. The data provide the possible service durations; this chosen arrival clock is not estimated from those records. The resulting P–K wait is λm₂/[2(1−.5)]=m₂/(2m₁), approximately 259.860255 s. Its equality with the busy-conditional residual occurs because the chosen load is one half. It is not a measured waiting time in the banking dataset.'
          }
        </Prose>

        <Prose>
          {'Download '}
          <a href={'/learn-code/queueing-theory/bank-contact-durations.csv'}>
            {'bank-contact-durations.csv'}
          </a>
          {' and its '}
          <a href={'/learn-code/queueing-theory/bank-contact-durations-provenance.json'}>
            {'CC BY 4.0 provenance'}
          </a>
          {' beside '}
          <code>{'contact_duration_moments.py'}</code>
          {
            '. Reuse the NumPy installation above; this programme imports neither SciPy nor SimPy. Run '
          }
          <code>{'python contact_duration_moments.py bank-contact-durations.csv'}</code>
          {
            ' in that same Python environment. The CSV reader checks the two exact column names, consecutive published IDs and positive bounded integer seconds. Python integers and '
          }
          <code>{'Fraction'}</code>
          {
            ' compute exact moments first; NumPy then evaluates the same sums, squares, population variance and weighted ratio in floating point.'
          }
        </Prose>

        <Prose>
          {''}
          <strong>
            {'Save as '}
            <code>{'contact_duration_moments.py'}</code>
            {'.'}
          </strong>
          {''}
        </Prose>

        <RemoteCodeBlock
          source={'/learn-code/queueing-theory/contact_duration_moments.py'}
          filename={'contact_duration_moments.py'}
          language="python"
          title={'contact_duration_moments.py'}
        />

        <CodeBlock
          kind="output"
          language="output"
          filename={'contact_duration_moments.py.stdout.txt'}
          title={'Output: contact_duration_moments.py'}
          downloadUrl={'/learn-code/queueing-theory/contact_duration_moments.py.stdout.txt'}
        >
          {
            'records / duration range (seconds): 4521 4 3025\r\nexact mean / second / variance: 1193369/4521 620218345/4521 1379877567584/20439441\r\nNumPy mean / second / variance: 263.961292 137186.097102 67510.53356\r\nhypothetical busy inspection residual (seconds): 259.860255\r\nlongest selected count / count share / duration share: 453 0.100199 0.332364\r\nduration bins: lower-exclusive / upper-inclusive / count / count share / time share\r\n0 60 492 0.108825 0.014076\r\n60 120 887 0.196196 0.067697\r\n120 300 1879 0.415616 0.308015\r\n300 600 841 0.186021 0.293147\r\n600 86400 422 0.093342 0.317065\r\nhypothetical arrival rate (per second) / load / mean wait (seconds): 0.001894217 0.5 259.860255\r\n'
          }
        </CodeBlock>

        <Prose>
          {
            'The exact mean 1193369/4521 is about 263.961292 s; the second moment 620218345/4521 is about 137186.097102 s². The exact population variance becomes approximately 67510.533560 s². The library comparisons use the raw array and agree within their stated numerical allowances. '
          }
          <code>{'np.dot(array,array)/(2*array.sum())'}</code>
          {
            ' directly computes m₂/(2m₁), because the common n cancels. Parsing and moment computation are linear in the number of rows; selecting the longest tenth by sorting costs O(n log n). The five bins are fixed, so scanning the data once per bin remains O(n).'
          }
        </Prose>

        <Prose>
          {
            'To turn this into an operational queueing study, one would still need a defensible service definition, arrival observations, the scheduling and admission policy, and evidence about dependence and changing workload. Here the observed object is the duration distribution; the queue is an explicitly stated model built from it.'
          }
        </Prose>

        <section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">
          <H3>{'Practise on changed cases'}</H3>

          <Prose>
            {
              'Each prompt below can be attempted independently. The hints and explained solutions are available for checking the reasoning; they are not gates on the live investigations.'
            }
          </Prose>

          <section className="queue-practice">
            <H3>{'Trace an idle gap and simultaneous arrivals'}</H3>

            <Prose>
              {
                'An empty FCFS worker receives A at 0 s needing 2 s, B at 0 s needing 1 s, and C at 5 s needing 2 s. Ties keep listed order. Find starts, waits, departures and mean occupancy over [0,7].'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {'The worker can be idle between jobs; do not carry negative work through a gap.'}
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'Starts are 0, 2, 5; departures 2, 3, 7; waits 0, 2, 0. Total durations are 2, 3, 2, summing to 7 job-seconds. Thus mean occupancy is 1 job. Complete-cohort rate 3/7 times mean duration 7/3 gives 1. The idle interval is [3,5), not a negative wait for C.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'Repair a censored occupancy calculation'}</H3>

            <Prose>
              {
                'For the same changed trace, observe only through 2.5 s. Someone multiplies the sole completed job’s mean residence by the completed rate. Compute the correct average and the missing contribution.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {
                  'A contributes its full duration; B contributes only the time already spent inside.'
                }
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'A contributes 2 job-seconds and unfinished B contributes 2.5, giving area 4.5 and mean population 1.8. Completion-only rate 1/2.5 times mean 2 gives 0.8. The missing unfinished term is 2.5/2.5=1 job. C has not arrived and contributes zero.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'Keep milliseconds, capacity and percentiles distinct'}</H3>

            <Prose>
              {
                'Under stationary FCFS M/M/1, λ=90 requests/s and μ=100 requests/s. Find W, Wq, L and total p99. Propose a capacity intervention and a variability intervention, then name what must be measured before trusting them.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {'Mean service is 10 ms. The total quantile uses −log(1−p), not p times the mean.'}
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'ρ=0.9, W=0.1 s=100 ms, Wq=0.09 s=90 ms and L=9 jobs. Total p99=−log(0.01)/10≈0.460517 s. Increasing this worker’s speed to μ=120 predicts W=1/30 s≈33.33 ms under the same model; adding workers requires the parallel-capacity model instead. Removing rare expensive service paths can reduce E[S²], but should then be evaluated with the measured mean and variability under M/G/1 or another fitting model. Measure temporal arrivals, workload classes, service tails, contention, retries and actual percentiles. A changed scheduler also needs fairness and starvation checks.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'Find the atom before taking a logarithm'}</H3>

            <Prose>
              {
                'Let λ=2 and μ=5 jobs/s. What are the queue median, total median and probability that queue wait exceeds 1 second?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {
                  'First calculate the empty probability. Use strict survival for the last quantity.'
                }
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'ρ=0.4 and P(Tq=0)=0.6, so the queue median is 0. Total median is log(2)/3≈0.231049 s. Queue survival at 1 s is 0.4e⁻³≈0.019915. A logarithm formula blindly applied to the median would produce a negative value, revealing the missed zero atom.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'Inspect a changed equal-mean mixture'}</H3>

            <Prose>
              {
                'Half the jobs take 0.02 s and half take 0.18 s, with Poisson arrival rate 5 jobs/s. Find the long-job busy-time share, both residual means, mean queue wait and total time.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {
                  'E[S]=0.1; square the durations before averaging them. The busy fraction is not 1.'
                }
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'The long class occupies 0.5×0.18/0.1=90% of busy time. E[S²]=0.5×0.0004+0.5×0.0324=0.0164 s². Busy residual is 0.0164/0.2=0.082 s. Busy fraction ρ=0.5 gives time residual 0.041 s; Wq=0.041/(1−0.5)=0.082 s and W=0.182 s. Equal busy-conditional residual and wait here is a consequence of this particular load, not a general identity.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'Name the sampling and stability assumptions'}</H3>

            <Prose>
              {
                'A dispatcher sends a job only when it observes an idle worker. Another infinite-buffer FCFS queue has Poisson load 0.8 but a finite service mean and infinite second moment. Can the first use PASTA and can the second claim a finite mean wait?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {
                  'Separate arrival sampling from time sampling, and a proper stationary distribution from an integrable duration.'
                }
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'The idle-triggered dispatcher sees idle with probability 1 by design; its input is state-dependent and does not satisfy the independent Poisson condition used here. The second queue can have a proper stationary regime when ρ<1, but an infinite service second moment makes its FCFS mean wait infinite. Stability is not a guarantee that every moment exists. A finite average in a short simulation cannot resolve that infinite-tail question.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'Compare changed worker architectures'}</H3>

            <Prose>
              {
                'Poisson arrivals have rate 6 jobs/s. Compare two pooled exponential workers of rate 4 each, two separately queued workers with independent uniform routing, and one rate-8 worker. Find their total means.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {
                  'For the pool, a=1.5 and ρ=0.75. Normalize the prefix and tail before calculating the wait probability.'
                }
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'Z=1+1.5+1.5²/(2×0.25)=7, so C=4.5/7=9/14. Pooled Wq=C/(8−6)=9/28 and W=9/28+1/4=4/7≈0.571429 s. Split inputs are rate 3 each, giving W=1/(4−3)=1 s. The fast worker gives W=1/(8−6)=0.5 s. The last worker reduces per-job service time; pooling only reallocates parallel capacity. Different service/routing assumptions can change these comparisons.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'A short latency can conceal rejected work'}</H3>

            <Prose>
              {
                'An M/M/1/2 queue has offered λ=μ=4 jobs/s. Find rejection probability, admitted throughput, mean population and admitted-customer total time. What happens to queue wait at K=1?'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {
                  'At equal rates the finite stationary weights are equal. K includes the service slot.'
                }
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'For K=2, each state has probability 1/3. Rejection is 1/3, admitted throughput is 8/3 jobs/s and L=(0+1+2)/3=1. Hence W=3/8 s. At K=1, admitted jobs start immediately, so Wq=0; they still require mean service 1/4 s. Rejection rises to 1/2 at equal rates. Lower latency among admitted jobs does not establish higher completion success.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'Separate polling delay from congestion'}</H3>

            <Prose>
              {
                'In the optional repeated-vacation model, service is constant 0.05 s, λ=10 jobs/s, and each vacation is a constant 0.2 s. Find the mean queue wait and explain its low-arrival-rate limit.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {'Apply the formula only after checking the repeated, independent vacation rule.'}
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'ρ=0.5 and service second moment is 0.0025 s². Congestion contributes 10×0.0025/(2×0.5)=0.025 s; residual vacation contributes 0.2/2=0.1 s. Mean wait is 0.125 s. As positive λ tends to zero, congestion vanishes and wait tends to 0.1 s. A device that sleeps once and wakes according to a load-dependent policy need not follow this repeated-vacation model.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'Design an auditable measurement'}</H3>

            <Prose>
              {
                'A repair center reports 40 completed jobs/hour and a six-hour mean among jobs completed this afternoon. Can you conclude that its afternoon mean work-in-progress was 240? Design a better check.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {'The time window, customer cohort and included population must agree.'}
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'Not from those figures alone. Afternoon completions can include jobs that arrived earlier, while unfinished afternoon jobs are missing from the reported residence mean. Integrate actual work-in-progress over the afternoon and sum clipped residence intervals, including pre-window arrivals and unfinished jobs. Separately assess whether a long-run stationary regime and a matched mean support Little’s Law. Record workload classes and temporal variation, then compare staffing or service changes with realistic traces. Acceptable plans identify each boundary, retained/censored observations, units and uncertainty; a single numerical estimate cannot replace those choices.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'Solve and diagnose a finite generator'}</H3>

            <Prose>
              {
                'For an M/M/1/2 queue with offered λ=2 and service μ=3 jobs/s, construct the row generator, stationary law, admitted rate, L, admitted mean total and mean queue wait. A colleague instead supplies Qᵀ as the row generator. Explain the error before using a solver.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {
                  'At state 2 a new arrival is rejected; it does not move the state. The normalized birth–death weights are 1:(2/3):(2/3)².'
                }
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  "The generator is [[−2,2,0],[3,−5,2],[0,3,−3]]. Its row sums vanish, and off-diagonals are nonnegative. The weights total 19/9, giving π=(9,6,4)/19. The admitted rate is 2(1−4/19)=30/19 jobs/s. Mean count is (6+8)/19=14/19. Little's Law for admitted customers gives W=(14/19)/(30/19)=7/15 s. Subtracting the mean service 1/3 s gives Wq=2/15 s. Independently, completion rate 3(1−9/19)=30/19 matches admissions. Qᵀ has row sums (1,0,−1), so it violates the departure-row generator convention; transposing is appropriate inside the stationary column "
                }
                <strong>{'equation'}</strong>
                {", not when relabelling the Markov model. The finite tool programme's "}
                <code>{'finite_stationary(2,3,2)'}</code>
                {
                  ' implements exactly these equations, while the displayed derivation supplies an independent rational result.'
                }
              </Prose>
            </details>
          </section>

          <section className="queue-practice">
            <H3>{'Keep empirical moments distinct from sample estimators'}</H3>

            <Prose>
              {
                'Use the declared synthetic service durations [1,1,2,6] seconds as an empirical distribution with equal record weights, and choose a hypothetical independent Poisson rate λ=1/5 job/s. Find the first two moments, population variance, load and P–K mean queue wait. What share of customer count and busy time belongs to the 6-second record? Diagnose using sample variance to reconstruct the second moment.'
              }
            </Prose>
            <details>
              <summary>Hint</summary>
              <Prose>
                {
                  "Average the four squared durations before taking a variance. A record's busy-time weight is its duration divided by the sum of all four durations."
                }
              </Prose>
            </details>
            <details>
              <summary>Worked solution</summary>
              <Prose>
                {
                  'The mean is 10/4=5/2 s and the second moment is (1+1+4+36)/4=21/2 s². Population variance is 21/2−25/4=17/4 s². Load is (1/5)(5/2)=1/2, so Wq=(1/5)(21/2)/[2(1−1/2)]=21/10 s. The 6-second record has count share 1/4 and occupied-time share 6/10=3/5. Sample variance divides the squared deviations by three, giving 17/3; adding mean squared then gives 143/12 as an incorrect empirical second moment and 143/60 s as the resulting incorrect wait. These four synthetic values form a changed arithmetic example; they are not four additional observed UCI records.'
                }
              </Prose>
            </details>
          </section>

          <Prose>
            {''}
            <strong>{'Check your understanding:'}</strong>
            {
              ' You should be able to clip a residence interval to a stated observation window, distinguish time sampling from arrival sampling, explain the squared-duration residual, and choose the correct population and capacity model before calculating a wait. Use one changed practice case to check the units and assumptions as well as the answer.'
            }
          </Prose>

          <Prose>
            {''}
            <strong>{'What to learn next:'}</strong>
            {
              ' Dynamical Systems Theory & Chaos studies how state changes under repeated rules and continuous evolution. Our workload recursion already shows a state, incoming work, draining and a boundary at zero. The '
            }
            <a href={'/learn/topic/dynamical-systems-theory-chaos'}>{'next topic'}</a>
            {
              ' develops stability and trajectories in their own setting; stochastic queue congestion and deterministic chaos are different mechanisms. For queueing applications, networks, scheduling, heavy-traffic limits and state-dependent serving systems require their own models rather than extending one mean formula beyond its assumptions. '
            }
          </Prose>
        </section>

        <section
          className="lesson-ending lesson-ending--further-learning"
          data-lesson-ending="further-learning"
          data-lesson-resource-list=""
        >
          <H2>{'Read further'}</H2>

          <ul>
            <li>
              {"Karl Sigman's "}
              <a href={'https://www.columbia.edu/~ks20/stochastic-I/stochastic-I-LL.pdf'}>
                {"Little's Law note"}
              </a>
              {
                ' is a precise alternate route after section 2. Its pathwise counting and limiting assumptions explain why a matched population matters beyond a finite observation window.'
              }
            </li>
            <li>
              {"Gallager's "}
              <a
                href={
                  'https://ocw.mit.edu/courses/6-262-discrete-stochastic-processes-spring-2011/931ffa0940899c27f34b71ad64fd2bb0_MIT6_262S11_chap04.pdf'
                }
              >
                {'Discrete Stochastic Processes, chapter 4'}
              </a>
              {
                ', §4.4 and §§4.5.3–4.5.5, develops renewal reward, residual-life triangles and the M/G/1 argument. Read after sections 6–7 for a more mathematical treatment.'
              }
            </li>
            <li>
              {'The official '}
              <a
                href={
                  'https://ocw.mit.edu/courses/6-262-discrete-stochastic-processes-spring-2011/resources/lecture-13-little-m-g-1-ensemble-averages/'
                }
              >
                {'MIT Gallager lecture 13 entry'}
              </a>
              {' provides a spoken alternative on Little, M/G/1 and ensemble averages. Its '}
              <a
                href={
                  'https://ocw.mit.edu/courses/6-262-discrete-stochastic-processes-spring-2011/444d1c582426b279a044253f2d116d41_MIT6_262S11_lec13.pdf'
                }
              >
                {'associated slides'}
              </a>
              {' supply diagrams alongside the written derivations.'}
            </li>
            <li>
              {"Sigman's "}
              <a href={'https://www.columbia.edu/~ks20/stochastic-I/stochastic-I-RRT.pdf'}>
                {'Renewal Reward and the Inspection Paradox'}
              </a>
              {
                ', especially §§1.4–1.8, connects the class strips to continuous duration distributions and equilibrium residual life.'
              }
            </li>
            <li>
              {''}
              <a
                href={
                  'https://ocw.mit.edu/courses/6-263j-data-communication-networks-fall-2002/65d9ab519ec4851af812f4b89ffaeedc_Lectures8_9.pdf'
                }
              >
                {'MIT Modiano lectures 8–9'}
              </a>
              {
                ' offer a compact residual-work and repeated-vacation treatment. Their W denotes queue delay; this lesson calls it Wq.'
              }
            </li>
            <li>
              {"Zukerman's "}
              <a href={'https://www.ee.cityu.edu.hk/~zukerman/classnotes.pdf'}>
                {'Introduction to Queueing Theory and Stochastic Teletraffic Models'}
              </a>
              {
                ", chapters 3, 6 and 16, is a broader reference for the stochastic models and service-time effects. Whitt's "
              }
              <a href={'https://www.columbia.edu/~ww2040/6711F12/lect1101.pdf'}>{'M/G/1 note'}</a>
              {' adds the embedded-chain and transform viewpoint after the residual derivation.'}
            </li>
            <li>
              {"Little's "}
              <a
                href={
                  'https://fisherp.scripts.mit.edu/wordpress/wp-content/uploads/2015/11/ContentServer.pdf'
                }
              >
                {'1961 paper'}
              </a>
              {
                ", printed pages 383–387, is the original technical source for the long-run relationship. Wolff's "
              }
              <a href={'https://www.math.purdue.edu/~peterson/Teaching/532/PASTA.pdf'}>
                {'Poisson Arrivals See Time Averages'}
              </a>
              {' gives the precise nonanticipation framework behind section 3.'}
            </li>
            <li>
              {"Harchol-Balter's "}
              <a href={'https://www.cs.cmu.edu/~harchol/ISCA15show.pdf'}>
                {'Performance Modeling tutorial'}
              </a>
              {
                ', slides 22–28 and 54–64, offers alternative inspection and architecture explanations. The '
              }
              <a href={'https://www.cs.cmu.edu/~harchol/PerformanceModeling/book.html'}>
                {"book's author page"}
              </a>
              {' describes a longer systems and scheduling route.'}
            </li>
            <li>
              {'The official SimPy '}
              <a href={'https://simpy.readthedocs.io/en/stable/simpy_intro/shared_resources.html'}>
                {'shared-resource introduction'}
              </a>
              {', '}
              <a
                href={
                  'https://simpy.readthedocs.io/en/stable/topical_guides/time_and_scheduling.html'
                }
              >
                {'time and scheduling guide'}
              </a>
              {', and '}
              <a href={'https://simpy.readthedocs.io/en/stable/topical_guides/environments.html'}>
                {'environment guide'}
              </a>
              {
                " explain request ordering, release and the distinction between draining events and stopping at a numeric horizon. SciPy's "
              }
              <a
                href={'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.gamma.html'}
              >
                {'gamma reference'}
              </a>
              {' and '}
              <a
                href={
                  'https://docs.scipy.org/doc/scipy/reference/generated/scipy.linalg.solve.html'
                }
              >
                {'linear solve reference'}
              </a>
              {' document the ordinary computational routes used here.'}
            </li>
            <li>
              {''}
              <a href={'https://archive.ics.uci.edu/dataset/222/bank+marketing'}>
                {'UCI Bank Marketing'}
              </a>
              {
                ', DOI 10.24432/C5K306, is the source of the observed last-contact durations. The linked two-column CSV and its provenance retain the original published subset and CC BY 4.0 attribution. Use this source for what the records contain, not as evidence of unobserved arrival or waiting times.'
              }
            </li>
          </ul>

          <Prose>
            {'The P–K name records the historical work of Pollaczek and Khinchine. The '}
            <a href={'https://link.springer.com/article/10.1007/BF01194620'}>
              {'Pollaczek publisher record'}
            </a>
            {' and '}
            <a href={'https://www.mathnet.ru/eng/sm6834'}>{'Khinchine archival record'}</a>
            {
              ' provide bibliographic provenance; the accessible canonical notes above are the recommended derivation routes.'
            }
          </Prose>
        </section>
      </div>
    </QueueingAreaProvider>
  ),
};
