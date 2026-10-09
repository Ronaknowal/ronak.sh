import { ClassRoutes, DataRolePorts } from './NaiveBayesReadingFlowAnatomy.jsx';
import { useState } from 'react';
import { tokenEvidenceState, presenceEvidenceState, normalizeNaiveBayesScores } from '../../data/naive-bayes-models.js';
import { words, wordColors, classColors, classCounts, sum, vector, alphaValue, countLaw, simplex, simplexContours, categorical } from '../../data/naive-bayes-reading-flow-models.js';
import { Figure, Svg, Text, Arrow, Mark, ClassLegend, Table, Result, Probability, Field, Choice, Controls, useDraft, num, f } from './NaiveBayesReadingFlowElements.jsx';
export function Representation() {
  return <Figure title="Token positions become indexed measurements" caption="The two free positions share one column. Position, count and presence answer different questions.">
    <Svg height={300} label="Three tokens mapping to five count and presence columns">
      {['free', 'free', 'money'].map((w, i) => <g key={i}>
        <Text x={100 + i * 160} y={32} anchor="middle">position {i + 1}</Text>
        <rect x={50 + i * 160} y={48} width={100} height={42} fill="none" stroke={wordColors[words.indexOf(w)]} />
        <Text x={100 + i * 160} y={75} anchor="middle" color={wordColors[words.indexOf(w)]}>
          {w}
        </Text>
        <Arrow x1={100 + i * 160} y1={94} x2={150 + words.indexOf(w) * 110} y2={147} color={wordColors[words.indexOf(w)]} />
      </g>)}
      {words.map((w, j) => <g key={w}>
        <Text x={150 + j * 110} y={175} anchor="middle" color={wordColors[j]}>
          {w}
        </Text>
        <Text x={150 + j * 110} y={213} anchor="middle">
          {[2, 1, 0, 0, 0][j]}
        </Text>
        <Text x={150 + j * 110} y={254} anchor="middle">
          {[1, 1, 0, 0, 0][j]}
        </Text>
      </g>)}
      <Text x={16} y={213}>count</Text>
      <Text x={16} y={254}>presence</Text>
    </Svg>
  </Figure>;
}
export function TwoRoutes() {
  return <Figure title="A separating score or a class generation model" caption="A straight boundary does not identify the training objective. The plane is illustrative; the supplied toy table is built from counts in section 3.">
    <ClassRoutes />
    <ClassLegend />
  </Figure>;
}
export function DataRoles() {
  return <Figure title="Only labelled training rows teach this table" caption="Small representative records are symbolic. Validation and test inspect the frozen workflow; a query arrives with an empty annotation slot.">
    <DataRolePorts />
  </Figure>;
}
export function ConditionalGraph() {
  return <Figure title="The class is shared; features are independent given that class" caption="Edges specify probability factorization, not a claim that the class causes a word.">
    <Svg height={320} label="Class parent and three presence observations">
      {[0, 1].map(c => <g key={c}>
        <ellipse cx={190 + c * 375} cy={55} rx={78} ry={28} fill="none" stroke={classColors[c]} />
        <Text x={190 + c * 375} y={61} anchor="middle" color={classColors[c]}>class {c}</Text>
        {['free = 1', 'money = 0', 'win = 1'].map((w, j) => <g key={w}>
          <Arrow x1={190 + c * 375} y1={85} x2={80 + j * 110 + c * 375} y2={142} />
          <circle cx={80 + j * 110 + c * 375} cy={170} r={38} fill="none" stroke={wordColors[j]} />
          <Text x={80 + j * 110 + c * 375} y={176} anchor="middle" color={wordColors[j]}>
            {w}
          </Text>
        </g>)}
        <Text x={190 + c * 375} y={242} anchor="middle">
          {c === 0 ? '.2 × .8 × .2 = .032' : '.8 × .2 × .8 = .128'}
        </Text>
        <Text x={190 + c * 375} y={280} anchor="middle">equal prior × likelihood</Text>
      </g>)}
    </Svg>
    <Probability values={[.2, .8]} />
  </Figure>;
}
export function PoolingAreas() {
  return <Figure title="Independent inside each class; dependent after pooling" caption="Each square is one conditional probability unit. Both classes have equal pooling weight.">
    <Svg width={780} height={370} label="Equal-unit conditional intersection areas compared with pooled marginal multiplication">
      {[.2, .8].map((p, c) => <g key={c}>
        <Text x={20 + c * 240} y={25} color={classColors[c]}>class {c}: P(A)=P(B)={p}</Text>
        <rect x={20 + c * 240} y={55} width={180} height={180} fill="none" stroke="#aaa" />
        <rect x={20 + c * 240} y={55} width={180 * p} height={180} fill={classColors[c]} opacity={.18} />
        <rect x={20 + c * 240} y={55} width={180} height={180 * p} fill={classColors[c]} opacity={.18} />
        <rect x={20 + c * 240} y={55} width={180 * p} height={180 * p} fill={classColors[c]} opacity={.7} />
        <Text x={20 + c * 240} y={267}>intersection area {f(p * p, 2)}</Text>
      </g>)}
      <Text x={510} y={75}>pooled intersection</Text>
      <rect x={510} y={95} width={180} height={180 * .34} fill="#c4c4ca" />
      <rect x={510} y={95} width={180} height={180} fill="none" stroke="#aaa" />
      <Text x={510} y={299}>½(.04 + .64) = .34</Text>
      <Text x={20} y={338}>P(A)P(B) = .5 × .5 = .25 ≠ .34; common square area = 1</Text>
    </Svg>
  </Figure>;
}
export function BayesAreas() {
  const priors = [1 / 3, 2 / 3],
    likelihood = [1 / 7, 4 / 11],
    weights = [1 / 21, 8 / 33],
    total = sum(weights);
  return <Figure title="Keep joint mass before dividing by its shared total" caption="Each prior strip uses a common unit width; evidence retains only a fraction of that strip.">
    <Svg height={300} label="Prior times conditional likelihood joint mass and normalized posterior">
      {priors.map((p, c) => <g key={c}>
        <Text x={20} y={45 + c * 85} color={classColors[c]}>class {c}</Text>
        <rect x={100} y={23 + c * 85} width={p * 420} height={28} fill={classColors[c]} opacity={.25} />
        <rect x={100} y={23 + c * 85} width={weights[c] * 420} height={28} fill={classColors[c]} />
        <Text x={430} y={43 + c * 85}>{f(p)} × {f(likelihood[c])} = {f(weights[c])}</Text>
      </g>)}
      <Text x={100} y={208}>shared evidence mass = {f(total)}</Text>
      <rect x={100} y={229} width={420 * weights[0] / total} height={27} fill={classColors[0]} />
      <rect x={100 + 420 * weights[0] / total} y={229} width={420 * weights[1] / total} height={27} fill={classColors[1]} />
      <Text x={100} y={288}>posterior width: 11/67 and 56/67; sum 1</Text>
    </Svg>
    <Probability values={weights.map(x => x / total)} />
  </Figure>;
}
export function Normalization() {
  const m = useDraft({
    s: '-1001, -1000'
  }, d => {
    const input = vector(d.s, {
      minLength: 1,
      maxLength: 20,
      low: -Number.MAX_VALUE,
      high: Number.MAX_VALUE,
      infinity: true
    });
    return {
      input,
      ...normalizeNaiveBayesScores(input)
    };
  });
  const v = m.value,
    maximum = Math.max(...v.input),
    shifted = v.input.map(x => x - maximum);
  return <Figure title="Shift before exponentiating" caption="Subtract the same finite maximum from every score. All −∞ is a supported undefined posterior, not a uniform answer.">
    <Svg width={880} height={100 + v.input.length * 45} label="Each score shifts, exponentiates, sums and divides">
      <Text x={80} y={28}>score</Text>
      <Text x={260} y={28}>subtract maximum</Text>
      <Text x={480} y={28}>exp(shift)</Text>
      <Text x={680} y={28}>divide by sum</Text>
      {v.input.map((s, c) => <g key={c}>
        <Text x={20} y={70 + c * 45}>c{c}</Text>
        <Text x={80} y={70 + c * 45}>
          {f(s)}
        </Text>
        <Arrow x1={205} y1={65 + c * 45} x2={245} y2={65 + c * 45} />
        <Text x={260} y={70 + c * 45}>
          {maximum === -Infinity ? 'undefined' : f(shifted[c])}
        </Text>
        <Arrow x1={410} y1={65 + c * 45} x2={465} y2={65 + c * 45} />
        <Text x={480} y={70 + c * 45}>
          {maximum === -Infinity ? 'undefined' : f(Math.exp(shifted[c]))}
        </Text>
        <Arrow x1={610} y1={65 + c * 45} x2={665} y2={65 + c * 45} />
        <Text x={680} y={70 + c * 45}>
          {v.probabilities ? f(v.probabilities[c]) : 'undefined'}
        </Text>
      </g>)}
    </Svg>
    <Controls model={m}>
      <Field label="Class score vector" value={m.draft.s} onChange={x => m.edit('s', x)} vector help="1–20 finite scores or -inf" />
    </Controls>
    <Result>
      <p>Maximum {f(maximum)}; shifted exponential sum {maximum === -Infinity ? 'undefined' : f(sum(shifted.map(Math.exp)))}. Log normalizer {f(v.logNormalizer)}.</p>
    </Result>
  </Figure>;
}
export function OddsBars({
  staticOnly = false
}) {
  const m = useDraft({
    text: 'free meeting',
    alpha: '1',
    prior: String(2 / 3)
  }, d => tokenEvidenceState(d.text, num(d.alpha), num(d.prior)));
  const [step, setStep] = useState(null),
    v = m.value;
  const count = step === null ? v.frames.length - 1 : Math.min(step, v.frames.length - 1),
    frame = v.frames[count];
  const contributions = staticOnly ? [{
    word: 'prior',
    value: Math.log(2)
  }, {
    word: 'free',
    value: Math.log(28 / 11)
  }, {
    word: 'meeting',
    value: Math.log(7 / 22)
  }] : [{
    word: 'prior',
    value: Math.log(v.spamPrior / (1 - v.spamPrior))
  }, ...v.knownTokens.slice(0, count).map(word => ({
    word,
    value: Math.log(v.parameters.probabilities[1][words.indexOf(word)] / v.parameters.probabilities[0][words.indexOf(word)])
  }))];
  const finiteBars = contributions.filter(x => Number.isFinite(x.value)),
    scale = 140 / Math.max(1, ...finiteBars.map(x => Math.abs(x.value)));
  return <Figure title={staticOnly ? 'Three contributions make one log-odds comparison' : 'Trace a message through named word evidence'} caption="Word hue identifies the factor. Bar direction and signed length carry evidence, with one common numerical scale.">
    <Svg width={760} height={90 + contributions.length * 46} label="Signed log odds contributions">
      <line x1={350} y1={35} x2={350} y2={65 + contributions.length * 46} stroke="white" />
      <Text x={350} y={23} anchor="middle">zero</Text>
      {contributions.map((item, j) => <g key={j}>
        <Text x={20} y={62 + j * 46} color={wordColors[words.indexOf(item.word)] || '#ddd'}>
          {item.word}
        </Text>
        {Number.isFinite(item.value) ? <rect x={Math.min(350, 350 + scale * item.value)} y={44 + j * 46} width={Math.abs(scale * item.value)} height={24} fill={wordColors[words.indexOf(item.word)] || '#aaa'} /> : <Text x={370} y={62 + j * 46}>infinite factor</Text>}
        <Text x={540} y={62 + j * 46}>
          {f(item.value)}
        </Text>
      </g>)}
      <Text x={20} y={79 + contributions.length * 46}>one unit = {f(scale, 2)} drawing pixels; positive supports spam</Text>
    </Svg>
    {!staticOnly && <Controls model={{
      ...m,
      reset: () => {
        m.reset();
        setStep(null);
      }
    }}>
      <Field label="Incoming message" value={m.draft.text} onChange={x => {
        m.edit('text', x);
        setStep(null);
      }} help="≤300 characters and 30 tokens; punctuation ignored" />
      <Field label="Alpha" value={m.draft.alpha} onChange={x => m.edit('alpha', x)} help="0 or 1e-8–10" />
      <Field label="Spam prior" value={m.draft.prior} onChange={x => m.edit('prior', x)} help=".01–.99" />
    </Controls>}
    {staticOnly && <Result>
      <p>Sum log odds {f(Math.log(2) + Math.log(28 / 11) + Math.log(7 / 22))}; posterior spam {f(v.final.probabilities[1])}.</p>
    </Result>}
    {!staticOnly && <>
      <div className="nb-step">
        <button type="button" disabled={count === 0} onClick={() => setStep(count - 1)}>Step back</button>
        <span>Known-token prefix {count}/{v.knownTokens.length}</span>
        <button type="button" disabled={count === v.frames.length - 1} onClick={() => setStep(count + 1)}>Step forward</button>
      </div>
      <Result>
        <p>Current text: {v.tokens.join(' ') || '(empty)'}. Out-of-vocabulary tokens: {v.unknownTokens.join(', ') || 'none'}.</p>
        <p>Class scores at this prefix: {frame.scores.map(x => f(x)).join(', ')}. Log odds: {f(frame.logOdds)}.</p>
      </Result>
      <Probability values={frame.probabilities} />
      <Table caption="Current class table in fixed word order" headers={['class', ...words]} rows={v.parameters.probabilities.map((row, c) => [c, ...row.map(x => f(x))])} />
    </>}
  </Figure>;
}
export function ZeroSupport() {
  return <Figure title="A known impossible event differs from an unknown word" caption="Zero smoothing leaves free meeting unsupported by both classes. An OOV token has no fitted column.">
    <Svg height={220} label="Known zero likelihood and OOV prior routes">
      <Text x={20} y={35}>known: free meeting</Text>
      <Text x={20} y={75}>class 0: 0 × 1/2 = 0</Text>
      <Text x={20} y={115}>class 1: 1/2 × 0 = 0</Text>
      <Arrow x1={250} y1={90} x2={325} y2={90} />
      <Text x={345} y={95}>0 / (0 + 0): undefined</Text>
      <Text x={20} y={170}>unknown: turquoise</Text>
      <Arrow x1={230} y1={165} x2={325} y2={165} />
      <Text x={345} y={170}>no column → unchanged prior</Text>
    </Svg>
  </Figure>;
}
export function TokenPools() {
  const docs = [[2, 1, 0, 0, 0], [1, 1, 1, 0, 0], [0, 0, 0, 1, 1]];
  return <Figure title="Documents estimate priors; token pools estimate compositions" caption="One ham document has two tokens. Two spam documents have six tokens. These denominators have different units.">
    <Svg height={360} label="Three document rows connected to class raw token accumulators">
      {docs.map((row, i) => <g key={i}>
        <Mark x={25} y={45 + i * 65} c={i === 2 ? 0 : 1} />
        <Text x={45} y={50 + i * 65}>row {i + 1}</Text>
        {row.map((x, j) => <Text key={j} x={170 + j * 93} y={50 + i * 65} color={wordColors[j]}>{words[j]}: {x}</Text>)}
        <Arrow x1={650} y1={45 + i * 65} x2={600} y2={i === 2 ? 255 : 300} color={classColors[i === 2 ? 0 : 1]} />
      </g>)}
      {classCounts.map((row, c) => <g key={c}>
        <Text x={20} y={265 + c * 45} color={classColors[c]}>class {c}: {c ? 2 : 1} documents</Text>
        <rect x={235} y={242 + c * 45} width={380} height={34} fill="none" stroke={classColors[c]} />
        <Text x={250} y={265 + c * 45}>{row.join(', ')} → {sum(row)} tokens</Text>
      </g>)}
    </Svg>
  </Figure>;
}
export function CountEvent() {
  const m = useDraft({
      x: '1, 1'
    }, d => countLaw(vector(d.x, {
      minLength: 2,
      maxLength: 5,
      low: 0,
      high: 10,
      integer: true
    }))),
    v = m.value;
  return <Figure title="Many orders can describe one count event" caption="For two words, θ=(.8,.2). Changing vocabulary size declares a new uniform table, rather than silently padding this table.">
    <Svg height={360} label="Ordered draw positions merge into a count event">
      <Text x={20} y={35}>θ = [{v.theta.map(x => f(x)).join(', ')}]; N={v.n}; counts [{v.counts.join(', ')}]</Text>
      {v.counts.length === 2 && v.counts[0] === 1 && v.counts[1] === 1 ? <>
        {['AB', 'BA'].map((order, j) => <g key={order}>
          {[...order].map((letter, i) => <g key={i}>
            <rect x={35 + i * 75} y={75 + j * 95} width={54} height={40} fill="none" stroke={letter === 'A' ? '#b79cff' : '#78d3ea'} />
            <Text x={62 + i * 75} y={101 + j * 95} anchor="middle" color={letter === 'A' ? '#b79cff' : '#78d3ea'}>
              {letter}
            </Text>
          </g>)}
          <Text x={210} y={101 + j * 95}>ordered mass 4/25</Text>
          <Arrow x1={390} y1={95 + j * 95} x2={465} y2={140} />
        </g>)}
        <Text x={490} y={145}>one count event [1,1]</Text>
        <Text x={490} y={180}>mass 8/25 = .32</Text>
      </> : <>
        <Text x={20} y={105}>one order: ∏ θⱼˣʲ = {f(v.ordered)}</Text>
        <Arrow x1={365} y1={100} x2={425} y2={100} />
        <Text x={440} y={105}>{v.coefficient} equivalent orders</Text>
        <Text x={20} y={190}>counts [{v.counts.join(', ')}]</Text>
        <Arrow x1={365} y1={185} x2={425} y2={185} />
        <Text x={440} y={190}>count mass {f(v.mass)}</Text>
      </>}
      <Text x={20} y={310}>N! / ∏ xⱼ! = {v.coefficient}; each order shares the same product likelihood</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Count vector" value={m.draft.x} onChange={x => m.edit('x', x)} vector help="2–5 dimensions; integer total ≤10" />
    </Controls>
    <Result>
      <p>N! / ∏ xⱼ! = {v.coefficient}. If N=0, the unique empty order has mass one.</p>
    </Result>
  </Figure>;
}
export function Smoothing() {
  const m = useDraft({
      alpha: '1'
    }, d => alphaValue(num(d.alpha))),
    a = m.value;
  const maximum = 3 + a,
    scale = 180 / Math.max(1, maximum);
  return <Figure title="Separate observed token mass from pseudo-count mass" caption="Alpha joins each vocabulary column once. Both classes use the same bar scale before row normalization.">
    <Svg height={360} label="Observed counts plus alpha segments in each word column">
      {classCounts.map((row, c) => <g key={c}>
        <Text x={20} y={30 + c * 170} color={classColors[c]}>class {c}; total {sum(row)} + 5×{f(a)} = {f(sum(row) + 5 * a)}</Text>
        {row.map((x, j) => <g key={j}>
          <rect x={130 + j * 110} y={140 + c * 170 - x * scale / 2} width={42} height={x * scale / 2} fill={wordColors[j]} />
          <rect x={130 + j * 110} y={140 + c * 170 - (x + a) * scale / 2} width={42} height={a * scale / 2} fill="none" stroke={wordColors[j]} strokeDasharray="4 3" />
          <Text x={150 + j * 110} y={162 + c * 170} anchor="middle" color={wordColors[j]}>
            {words[j]}
          </Text>
          <Text x={180 + j * 110} y={105 + c * 170}>{x}+{f(a, 3)}</Text>
        </g>)}
      </g>)}
    </Svg>
    <Controls model={m}>
      <Field label="Alpha per column" value={m.draft.alpha} onChange={x => m.edit('alpha', x)} help="0 or 1e-8–10" />
    </Controls>
    <Table caption="Divide each complete row by its own token + pseudo total" headers={['class', ...words]} rows={classCounts.map((row, c) => [c, ...row.map(x => f((x + a) / (sum(row) + 5 * a)))])} />
    <p>Solid = observed count; dashed = pseudo-count. One count uses {f(scale / 2, 2)} pixels in both rows.</p>
  </Figure>;
}
const simplexSegments = simplexContours();
export function Simplex() {
  const m = useDraft({
      a: '.5',
      b: '.25'
    }, d => simplex(num(d.a), num(d.b))),
    v = m.value;
  const xy = t => [80 + 440 * (t[1] + .5 * t[2]), 405 - 381 * t[2]];
  const point = xy(v.theta);
  const cells = [];
  for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24 - i; j++) {
    const t = [i / 24, j / 24, 1 - (i + j) / 24];
    const ll = t.some(x => x === 0) ? -Infinity : 2 * Math.log(t[0]) + Math.log(t[1]) + Math.log(t[2]);
    cells.push({
      t,
      ll
    });
  }
  return <Figure title="A likelihood lives on a constrained composition triangle" caption="Coordinates sum to one. Darker neutral dots represent lower likelihood on the labelled common scale; coloured vertices identify words.">
    <Svg width={720} height={480} label="Equilateral probability simplex with calculated likelihood field">
      {cells.map(({
        t,
        ll
      }, i) => {
        const [x, y] = xy(t);
        return <circle key={i} cx={x} cy={y} r={4} fill={`rgb(${Math.round(45 + 150 * Math.max(0, 1 + (Number.isFinite(ll) ? ll : -20) / 12))},${Math.round(45 + 150 * Math.max(0, 1 + (Number.isFinite(ll) ? ll : -20) / 12))},${Math.round(45 + 150 * Math.max(0, 1 + (Number.isFinite(ll) ? ll : -20) / 12))})`} />;
      })}
      {simplexSegments.map((segment, i) => {
        const a = xy(segment.points[0]),
          b = xy(segment.points[1]);
        return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#e0e0e0" opacity={.7} />;
      })}
      <path d="M80 405L520 405L300 24Z" fill="none" stroke="#999" />
      {[[[1, 0, 0], 'A'], [[0, 1, 0], 'B'], [[0, 0, 1], 'C']].map(([t, name], j) => {
        const [x, y] = xy(t);
        return <Text key={name} x={x} y={y + (j === 2 ? -2 : 28)} color={wordColors[j]} anchor="middle">{name}: 1</Text>;
      })}
      <circle cx={point[0]} cy={point[1]} r={8} fill="none" stroke="white" strokeWidth={3} />
      <circle cx={xy([.5, .25, .25])[0]} cy={xy([.5, .25, .25])[1]} r={4} fill="#e7c37d" />
      <Text x={555} y={80}>counts 2,1,1</Text>
      <Text x={555} y={120}>white: query</Text>
      <Text x={555} y={160}>gold: optimum</Text>
      <Text x={555} y={200}>LL scale</Text>
      <Text x={555} y={230}>−12 to 0</Text>
      <Text x={555} y={280}>isolines −8, −6,</Text>
      <Text x={555} y={308}>−5, −4.3</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Probability A" value={m.draft.a} onChange={x => m.edit('a', x)} help="0–1" />
      <Field label="Probability B" value={m.draft.b} onChange={x => m.edit('b', x)} help="0–1; A+B≤1" />
    </Controls>
    <Result>
      <p>θ = [{v.theta.map(x => f(x)).join(', ')}]. Log likelihood = {f(v.logLikelihood)}. Count/θ gradient = [{v.gradient.map(x => f(x)).join(', ')}].</p>
      <p>The constrained optimum is (.5,.25,.25); a positive-count zero coordinate gives −∞. The saved BFGS route reached (.5000000004,.2499999999,.2499999997) but returned success=False, status 2 (precision loss); its small gradient is not a success flag.</p>
    </Result>
  </Figure>;
}
export function Presence() {
  const m = useDraft({
      x: '1, 0, 0, 0, 0'
    }, d => presenceEvidenceState(vector(d.x, {
      minLength: 5,
      maxLength: 5,
      low: 0,
      high: 20,
      integer: true
    }))),
    v = m.value;
  return <Figure title="Presence keeps an absent factor for every fitted word" caption="Repeat a positive count: its binary event remains one. Empty text still observes every absence.">
    <Svg height={270} label="Count to presence conversion and present or absent word branches">
      {words.map((w, j) => <g key={w}>
        <Text x={100 + j * 130} y={30} color={wordColors[j]} anchor="middle">
          {w}
        </Text>
        <Text x={100 + j * 130} y={75} anchor="middle">count {v.counts[j]}</Text>
        <Arrow x1={100 + j * 130} y1={90} x2={100 + j * 130} y2={130} />
        <Text x={100 + j * 130} y={155} anchor="middle">z = {Number(v.counts[j] > 0)}</Text>
        <Text x={100 + j * 130} y={203} anchor="middle">
          {v.counts[j] > 0 ? 'φ' : '1 − φ'}
        </Text>
        <Text x={100 + j * 130} y={245} anchor="middle">observed factor</Text>
      </g>)}
    </Svg>
    <Controls model={m}>
      <Field label="Five word counts" value={m.draft.x} onChange={x => m.edit('x', x)} vector help="free,money,win,meeting,agenda; integers 0–20" />
    </Controls>
    <Table caption="Smoothed presence rates" headers={['class', ...words]} rows={v.parameters.map((row, c) => [c, ...row.map(x => f(x))])} />
    <Table caption="Actual selected log factors, including every observed absence" headers={['class', ...words, '+ log prior = score']} rows={v.terms.map((row, c) => [c, ...row.map(x => f(x)), f(v.bernoulli.scores[c])])} />
    <p>Bernoulli posterior</p>
    <Probability values={v.bernoulli.probabilities} />
    <p>Multinomial posterior for these same counts</p>
    <Probability values={v.multinomial.probabilities} />
  </Figure>;
}
export function Missing() {
  const m = useDraft({
      state: 'off'
    }, d => {
      const likelihood = d.state === 'missing' ? [1, 1] : d.state === 'on' ? [.4, .8] : [.6, .2];
      const weights = likelihood.map((x, c) => x * [.8, .2][c]);
      return {
        state: d.state,
        likelihood,
        weights,
        probabilities: weights.map(x => x / sum(weights))
      };
    }),
    v = m.value;
  return <Figure title="Observed off and unobserved are different branches" caption="Missing is marginalized to factor one only under the stated ignorable observation assumption.">
    <Svg width={820} height={370} label="Two class roots branch into on and off events; missing sums both">
      {[0, 1].map(c => <g key={c}>
        <Mark x={45} y={85 + c * 145} c={c} />
        <Text x={65} y={90 + c * 145}>prior {c ? .2 : .8}</Text>
        {[['on', c ? .8 : .4], ['off', c ? .2 : .6]].map(([state, p], j) => <g key={state}>
          <Arrow x1={175} y1={85 + c * 145} x2={290} y2={50 + j * 75 + c * 145} color={v.state === state ? 'white' : classColors[c]} dashed={v.state === 'missing'} />
          <Text x={310} y={55 + j * 75 + c * 145}>{state}: {p}</Text>
          {(v.state === state || v.state === 'missing') && <Arrow x1={385} y1={50 + j * 75 + c * 145} x2={535} y2={85 + c * 145} dashed={v.state === 'missing'} />}
        </g>)}
        <Text x={555} y={82 + c * 145}>selected factor {f(v.likelihood[c])}</Text>
        <Text x={555} y={110 + c * 145}>joint weight {f(v.weights[c])}</Text>
      </g>)}
      <Text x={45} y={340}>missing: P(on|c)+P(off|c)=1; observed off selects only its own branch</Text>
    </Svg>
    <Controls model={m}>
      <Choice label="Alarm measurement" value={m.draft.state} onChange={x => m.edit('state', x)} options={['on', 'off', 'missing'].map(x => [x, x])} />
    </Controls>
    <Probability values={v.probabilities} />
  </Figure>;
}
export function Categories() {
  const m = useDraft({
      status: '0',
      link: '1'
    }, d => categorical(num(d.status), num(d.link))),
    v = m.value;
  return <Figure title="Category lookup uses names and column support" caption="Reserved other has code 3. Code 4 lies outside this fitted schema. Two features have separate category denominators.">
    <Table caption="Status: observed count + 1, denominator 4+4" headers={['class', 'idle', 'busy', 'offline', 'other']} rows={v.tables.map((cls, c) => [c, ...cls[0].map((x, j) => <span key={j} style={{
      outline: j === v.status ? '1px solid white' : undefined
    }}>
        {f(x)}
      </span>)])} />
    <Table caption="Link: observed count + 1, denominator 4+2" headers={['class', 'wired', 'radio']} rows={v.tables.map((cls, c) => [c, ...cls[1].map((x, j) => <span key={j} style={{
      outline: j === v.link ? '1px solid white' : undefined
    }}>
        {f(x)}
      </span>)])} />
    <Svg height={180} label="Two class-aligned selected categorical factors combine with one prior">
      {v.selected.map((row, c) => <g key={c}>
        <Mark x={25} y={50 + c * 75} c={c} />
        <Text x={50} y={55 + c * 75}>.5 × {f(row[0])} × {f(row[1])}</Text>
        <Arrow x1={330} y1={50 + c * 75} x2={400} y2={50 + c * 75} />
        <Text x={420} y={55 + c * 75}>log score {f(v.scores[c])}</Text>
      </g>)}
    </Svg>
    <Controls model={m}>
      <Choice label="Status" value={m.draft.status} onChange={x => m.edit('status', x)} options={[[0, 'idle (0)'], [1, 'busy (1)'], [2, 'offline (2)'], [3, 'other (3)'], [4, 'outside support (4)']]} />
      <Choice label="Link" value={m.draft.link} onChange={x => m.edit('link', x)} options={[[0, 'wired (0)'], [1, 'radio (1)']]} />
    </Controls>
    <Probability values={v.probabilities} />
  </Figure>;
}
