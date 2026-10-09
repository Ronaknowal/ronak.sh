import { CalibrationRolePorts } from './NaiveBayesReadingFlowAnatomy.jsx';
import { reliabilityState } from '../../data/naive-bayes-models.js';
import { gaussianLogDensity } from '../../data/naive-bayes-models.js';
import { finite, vector, expectedLoss, action, integrated, betaCdf, logGamma, mixed, sum, classColors } from '../../data/naive-bayes-reading-flow-models.js';
import { Figure, Svg, Text, Arrow, Mark, Axis, Table, Result, Probability, Field, Choice, Controls, useDraft, num, f, pathFor } from './NaiveBayesReadingFlowElements.jsx';
export function Reliability() {
  const m = useDraft({
      bins: '4',
      compression: 'false',
      selected: '0'
    }, d => {
      const result = reliabilityState(num(d.bins), d.compression === 'true');
      const selected = num(d.selected);
      if (!Number.isInteger(selected) || selected < 0 || selected > 5) throw Error('Use bin selector 0–5.');
      return {
        ...result,
        selected
      };
    }),
    v = m.value;
  return <Figure title="Case identities join bins before reliability points appear" caption="Every nonempty bin plots its mean prediction against its observed positive fraction. Empty bins have no point. Changing bins preserves individual predictions and proper losses.">
    <Svg width={760} height={440} label="Case to bin memberships and equal-axis reliability plot">
      <Axis x={65} y={365} width={300} height={300} xlabel="mean predicted p" ylabel="observed positive fraction" />
      <line x1={65} y1={365} x2={365} y2={65} stroke="#aaa" strokeDasharray="5 5" />
      {v.bins.filter(bin => bin.count > 0).map(bin => <g key={bin.index}>
        <circle cx={65 + 300 * bin.meanPrediction} cy={365 - 300 * bin.observedFraction} r={5 + bin.count} fill="#b79cff" stroke={bin.index === v.selected ? 'white' : '#b79cff'} strokeWidth={2} />
      </g>)}
      <Text x={410} y={50}>case → selected bin</Text>
      <Text x={410} y={385}>
        {v.bins[v.selected] ? `Selected bin ${v.selected}: n=${v.bins[v.selected].count}` : 'No current bin selected'}
      </Text>
      {v.cases.map((item, j) => <Text key={item.id} x={410 + j % 2 * 165} y={85 + Math.floor(j / 2) * 45} color={v.bins[v.selected]?.cases.some(c => c.id === item.id) ? '#fff' : '#999'}>#{item.id}: p {f(item.probability, 2)} / y {item.outcome}</Text>)}
    </Svg>
    <Controls model={m}>
      <Choice label="Number of bins" value={m.draft.bins} onChange={x => m.edit('bins', x)} options={[2, 3, 4, 5, 6].map(x => [x, String(x)])} />
      <Choice label="Prediction route" value={m.draft.compression} onChange={x => m.edit('compression', x)} options={[['false', 'raw predictions'], ['true', 'compressed: .15 + .7p']]} />
      <Choice label="Selected bin index" value={m.draft.selected} onChange={x => m.edit('selected', x)} options={[0, 1, 2, 3, 4, 5].map(x => [x, String(x)])} />
    </Controls>
    <Table caption="Every bin membership, including empty bins" headers={['bin interval', 'case IDs', 'mean p', 'fraction y=1', 'count']} rows={v.bins.map(bin => [`${f(bin.lower, 3)}–${f(bin.upper, 3)}${bin.index === v.binCount - 1 ? ' (closed at 1)' : ''}`, bin.cases.map(x => x.id).join(', ') || 'empty', f(bin.meanPrediction), f(bin.observedFraction), bin.count])} />
    <Result>
      <p>Brier {f(v.brier)}; log loss {f(v.logLoss)}. Selecting an index beyond the current bin count highlights no bin.</p>
    </Result>
  </Figure>;
}
export function ProperLoss({
  staticOnly = false
}) {
  const m = useDraft({
      p: '.6666666666666666',
      q: '.3'
    }, d => ({
      p: finite(num(d.p), 0, 1, 'Reported probability'),
      q: finite(num(d.q), 0, 1, 'True frequency'),
      ...expectedLoss(num(d.p), num(d.q))
    })),
    v = m.value;
  const curves = Array.from({
    length: 101
  }, (_, j) => [j / 100, expectedLoss(j / 100, v.q).brier]);
  return <Figure title={staticOnly ? 'One outcome produces a squared probability error' : 'Expected probability loss is minimized at the true frequency'} caption={staticOnly ? 'The square side is the prediction error; its area is the realized Brier loss.' : 'The Brier parabola includes irreducible q(1−q). Endpoint log losses use mathematical limits.'}>
    <Svg width={760} height={400} label={staticOnly ? 'Common-unit realized error squares' : 'Expected Brier curve and realized outcome squares'}>
      {staticOnly ? [0, 1].map(y => <g key={y}>
        <Text x={70 + y * 330} y={40}>outcome y={y}</Text>
        <rect x={70 + y * 330} y={65} width={240 * Math.abs(2 / 3 - y)} height={240 * Math.abs(2 / 3 - y)} fill={classColors[y]} opacity={.55} />
        <Text x={70 + y * 330} y={300}>side {y ? '1/3' : '2/3'}; area {y ? '1/9' : '4/9'}</Text>
      </g>) : <>
        <Axis x={60} y={310} width={310} height={250} xlabel="reported p" ylabel="expected Brier" />
        <path d={pathFor(curves, x => 60 + 310 * x, y => 310 - 250 * y)} fill="none" stroke="#b79cff" strokeWidth={3} />
        <circle cx={60 + 310 * v.p} cy={310 - 250 * v.brier} r={6} fill="none" stroke="white" strokeWidth={3} />
        <circle cx={60 + 310 * v.q} cy={310 - 250 * v.irreducible} r={5} fill="#e7c37d" />
        {[0, 1].map(y => <g key={y}>
          <Text x={430 + y * 140} y={75}>y={y}</Text>
          <rect x={430 + y * 140} y={95} width={120 * Math.abs(v.p - y)} height={120 * Math.abs(v.p - y)} fill={classColors[y]} opacity={.5} />
          <Text x={430 + y * 140} y={250}>area {f((v.p - y) ** 2)}</Text>
        </g>)}
      </>}
    </Svg>
    {!staticOnly && <Controls model={m}>
      <Field label="Reported p" value={m.draft.p} onChange={x => m.edit('p', x)} help="0–1" />
      <Field label="True positive frequency q" value={m.draft.q} onChange={x => m.edit('q', x)} help="0–1" />
    </Controls>}
    {!staticOnly && <Result>
      <p>Expected Brier {f(v.brier)} = excess {f(v.excess)} + irreducible {f(v.irreducible)}. Expected log loss {f(v.logLoss)}.</p>
      <p>White point uses reported p; gold minimum uses true q. Realized squares at right use the same side scale (120 pixels per probability unit).</p>
    </Result>}
  </Figure>;
}
export function CalibrationPorts() {
  return <Figure title="A calibrator learns from new predictions and their targets" caption="The retained seed2026 experiment uses separate 800 / 800 / 1,200 case roles. Its changed practice uses 400 calibration cases and remains a different measured task.">
    <CalibrationRolePorts />
    <Result><p>Saved sigmoid changes 63 decisions at .5, with Brier .147984→.131472. Its [.8,1] bin is empty, so the separately fixed .8 action rule flags no test cases.</p></Result>
  </Figure>;
}
export function Mapping() {
  const m = useDraft({
      score: 'probability',
      method: 'sigmoid'
    }, d => d),
    v = m.value;
  const lower = v.score === 'probability' ? 0 : -3,
    upper = v.score === 'probability' ? 1 : 3;
  const sigmoid = s => 1 / (1 + Math.exp(-(v.score === 'probability' ? 4 * (s - .5) : s)));
  const points = Array.from({
    length: 101
  }, (_, j) => {
    const s = lower + (upper - lower) * j / 100;
    return [s, v.method === 'sigmoid' ? sigmoid(s) : s < (lower + upper) / 2 ? .3 : .3];
  });
  return <Figure title="Name the supplied score before fitting a probability map" caption="These mapping shapes are illustrative, with fixed toy parameters. GaussianNB supplies probabilities; a model with decision_function can supply margins.">
    <Svg height={390} label="Score interface to mapped probability and adjacent-block pooling">
      <Axis x={60} y={310} width={390} height={250} xmin={lower} xmax={upper} xTicks={v.score === 'probability' ? [0, .25, .5, .75, 1] : [-3, -1.5, 0, 1.5, 3]} xlabel={v.score === 'probability' ? 'base probability score' : 'base decision margin'} ylabel="mapped probability" />
      <path d={pathFor(points, s => 60 + 390 * (s - lower) / (upper - lower), p => 310 - 250 * p)} fill="none" stroke="#b79cff" strokeWidth={3} />
      <Text x={485} y={65}>two equal-size blocks</Text>
      <rect x={485} y={100} width={100} height={90} fill="none" stroke="#78d3ea" />
      <rect x={585} y={100} width={100} height={90} fill="none" stroke="#78d3ea" />
      <Text x={535} y={140} anchor="middle">rate .4</Text>
      <Text x={635} y={140} anchor="middle">rate .2</Text>
      <Text x={485} y={226}>decreasing → pool both</Text>
      <rect x={485} y={250} width={200} height={40} fill="none" stroke="#78d3ea" />
      <Text x={585} y={276} anchor="middle">equal-size pooled rate .3</Text>
    </Svg>
    <Controls model={m}>
      <Choice label="Score interface" value={m.draft.score} onChange={x => m.edit('score', x)} options={[['probability', 'GaussianNB probability'], ['margin', 'SVM decision margin']]} />
      <Choice label="Mapping mechanism" value={m.draft.method} onChange={x => m.edit('method', x)} options={[['sigmoid', 'sigmoid shape'], ['isotonic', 'isotonic adjacent-pool shape']]} />
    </Controls>
    <Result>
      <p>{v.method === 'sigmoid' ? `Toy map: sigmoid(${v.score === 'probability' ? '4(s−.5)' : 's'}).` : 'Two equally sized adjacent groups become one constant .3 step.'} The real saved sigmoid's empty high bin is a separate measured observation.</p>
    </Result>
  </Figure>;
}
export function Costs() {
  const m = useDraft({
      p: '.75',
      fp: '4',
      fn: '1'
    }, d => action(num(d.p), num(d.fp), num(d.fn))),
    v = m.value,
    maximum = Math.max(v.fp, v.fn);
  return <Figure title="An action compares expected costs, not class marks" caption="Positive costs set the line heights and crossing. The equality policy chooses allow. A preferred positive class can still have an allow action.">
    <Svg height={400} label="Expected flag and allow cost lines with current probability and crossing">
      <Axis x={60} y={310} width={420} height={250} ymin={0} ymax={maximum} yTicks={[0, maximum / 4, maximum / 2, maximum * 3 / 4, maximum]} xlabel="spam probability p" ylabel="expected cost per case" />
      <line x1={60} y1={310 - 250 * v.fp / maximum} x2={480} y2={310} stroke="#b79cff" strokeWidth={3} />
      <line x1={60} y1={310} x2={480} y2={310 - 250 * v.fn / maximum} stroke="#78d3ea" strokeWidth={3} />
      <line x1={60 + 420 * v.p} y1={60} x2={60 + 420 * v.p} y2={310} stroke="white" strokeDasharray="5 4" />
      <circle cx={60 + 420 * v.threshold} cy={310 - 250 * v.fn * v.threshold / maximum} r={6} fill="white" />
      <Text x={510} y={90} color="#b79cff">flag: C_FP(1−p)</Text>
      <Text x={510} y={145} color="#78d3ea">allow: C_FN p</Text>
      <Text x={510} y={205}>crossing {f(v.threshold)}</Text>
      <Text x={510} y={260}>height range 0–{f(maximum)}</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Spam probability p" value={m.draft.p} onChange={x => m.edit('p', x)} help="0–1" />
      <Field label="False-positive cost" value={m.draft.fp} onChange={x => m.edit('fp', x)} help=".01–100" />
      <Field label="False-negative cost" value={m.draft.fn} onChange={x => m.edit('fn', x)} help=".01–100" />
    </Controls>
    <Result>
      <p>Flag cost {f(v.flag)}; allow cost {f(v.allow)}. Preferred class {v.preferred}; action {v.action}. Threshold {f(v.threshold)}.</p>
    </Result>
  </Figure>;
}
export function LinearOdds() {
  const m = useDraft({
      counts: '1, 1'
    }, d => {
      const counts = vector(d.counts, {
        minLength: 2,
        maxLength: 2,
        low: 0,
        high: 20,
        integer: true
      });
      return {
        counts,
        terms: [Math.log(2), counts[0] * Math.log(28 / 11), counts[1] * Math.log(7 / 22)]
      };
    }),
    v = m.value;
  const [free, meeting] = v.counts,
    odds = sum(v.terms);
  return <Figure title="The count-plane point and odds contributions use the same named inputs" caption="The fixed-table linear log odds do not specify whether fitting maximized joint likelihood, conditional likelihood or a margin objective.">
    <Svg height={430} label="Count plane exact linear zero odds boundary and signed contribution bars">
      <Axis x={60} y={330} width={300} height={300} xmin={0} xmax={20} ymin={0} ymax={20} xTicks={[0, 5, 10, 15, 20]} yTicks={[0, 5, 10, 15, 20]} xlabel="free count" ylabel="meeting count" />
      <path d={pathFor(Array.from({
        length: 101
      }, (_, i) => i * .2).map(x => [x, -(Math.log(2) + x * Math.log(28 / 11)) / Math.log(7 / 22)]).filter(([_, y]) => y <= 20), x => 60 + 15 * x, y => 330 - 15 * y)} stroke="white" strokeWidth={2} fill="none" />
      <circle cx={60 + 15 * free} cy={330 - 15 * meeting} r={7} fill="#b79cff" stroke="white" />
      {v.terms.map((term, j) => <g key={j}>
        <Text x={425} y={65 + j * 90}>{['prior', 'free', 'meeting'][j]} {f(term)}</Text>
        <rect x={Math.min(565, 565 + term * 5)} y={82 + j * 90} width={Math.abs(term * 5)} height={20} fill={['#ccc', '#b79cff', '#93b5f5'][j]} />
      </g>)}
      <line x1={565} y1={50} x2={565} y2={300} stroke="white" />
      <Text x={425} y={340}>bar scale: 5 px / log-odds unit</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Free and meeting counts" value={m.draft.counts} onChange={x => m.edit('counts', x)} vector help="two integers 0–20" />
    </Controls>
    <Result>
      <p>log 2 + {free} log(28/11) + {meeting} log(7/22) = {f(odds)}. Model spam probability {f(1 / (1 + Math.exp(-odds)))}.</p>
    </Result>
  </Figure>;
}
export function Integration() {
  const m = useDraft({
      shapes: '4, 1',
      counts: '2, 0'
    }, d => integrated(vector(d.shapes, {
      minLength: 2,
      maxLength: 20,
      low: 1e-8,
      high: 100
    }), vector(d.counts, {
      minLength: 2,
      maxLength: 20,
      low: 0,
      high: 100,
      integer: true
    }))),
    v = m.value;
  const slots = v.counts.flatMap((n, j) => Array(n).fill(j)),
    first = slots[0],
    second = slots[1],
    letter = j => j === 0 ? 'A' : j === 1 ? 'B' : String(j);
  let curve = [],
    peak = 1;
  if (v.shapes.length === 2) {
    const [a, b] = v.shapes;
    curve = Array.from({
      length: 199
    }, (_, j) => {
      const x = (j + 1) / 200;
      const log = (a - 1) * Math.log(x) + (b - 1) * Math.log1p(-x) - logGamma(a) - logGamma(b) + logGamma(a + b);
      return [x, Math.exp(log)];
    });
    peak = Math.max(...curve.map(p => p[1]));
  }
  return <Figure title="Both future positions share one uncertain composition" caption="At fixed θ, draws are conditionally independent. Integrating their complete event over the shared θ induces dependence. A higher-dimensional vector is never shown as a full one-dimensional density.">
    {v.shapes.length === 2 && <Svg width={1000} height={460} label="Beta density and explicit fixed-mean versus shared sequential predictive factors">
      <Axis x={110} y={300} width={330} height={230} ymin={0} ymax={peak} yTicks={[0, peak / 2, peak]} xlabel="θA; θB=1−θA" ylabel="density per θ unit" />
      <path d={pathFor(curve, x => 110 + 330 * x, y => 300 - 230 * y / peak)} stroke="#b79cff" fill="none" strokeWidth={3} />
      <line x1={110 + 330 * v.mean[0]} y1={78} x2={110 + 330 * v.mean[0]} y2={300} stroke="white" strokeDasharray="5 4" />
      <Text x={60} y={415}>interior samples .005–.995</Text>
      <Text x={60} y={445}>mean θA = {f(v.mean[0])}</Text>
      <ellipse cx={740} cy={55} rx={120} ry={28} fill="none" stroke="#aaa" />
      <Text x={740} y={61} anchor="middle">fixed mean composition</Text>
      {v.n === 0 ? <Text x={500} y={145}>empty future event: no draw; mass 1</Text> : <>
        {[first, second].map((j, i) => j !== undefined && <g key={i}>
          <Arrow x1={700 + i * 80} y1={85} x2={555 + i * 300} y2={124} />
          <Text x={515 + i * 300} y={155} color={j === 0 ? '#b79cff' : '#78d3ea'}>{letter(j)}: {f(v.mean[j])}</Text>
          <Text x={515 + i * 300} y={183}>a{letter(j)}/total</Text>
        </g>)}
      </>}
      <ellipse cx={740} cy={245} rx={120} ry={28} fill="none" stroke="#b79cff" />
      <Text x={740} y={251} anchor="middle">shared uncertain θ</Text>
      {v.n === 0 ? <Text x={500} y={335}>zero counts: unique event, coefficient 1</Text> : <>
        {[first, second].map((j, i) => j !== undefined && <g key={i}>
          <Arrow x1={700 + i * 80} y1={275} x2={555 + i * 300} y2={310} />
          <Text x={515 + i * 300} y={340} color={j === 0 ? '#b79cff' : '#78d3ea'}>{letter(j)}: {f(i ? (v.shapes[j] + (j === first ? 1 : 0)) / (v.total + 1) : v.shapes[j] / v.total)}</Text>
          <Text x={515 + i * 300} y={368}>
            {i ? `(${f(v.shapes[j])}+${j === first ? 1 : 0})/(${f(v.total)}+1)` : `${f(v.shapes[j])}/${f(v.total)}`}
          </Text>
        </g>)}
        {second !== undefined && <>
          <Arrow x1={560} y1={392} x2={850} y2={392} dashed />
          <Text x={705} y={432} anchor="middle">first draw updates the next predictive factor</Text>
        </>}
      </>}
    </Svg>}
    <Controls model={m}>
      <Field label="Posterior shape vector" value={m.draft.shapes} onChange={x => m.edit('shapes', x)} vector help="2–20 entries, 1e-8–100" />
      <Field label="Matching future counts" value={m.draft.counts} onChange={x => m.edit('counts', x)} vector help="integer entries 0–100" />
    </Controls>
    {v.shapes.length === 2 && <p>{v.shapes[0] < 1 ? 'Left endpoint density is +∞. ' : ''}{v.shapes[1] < 1 ? 'Right endpoint density is +∞. ' : ''}The plotted peak is the maximum of the labelled interior samples; the interval masses include the endpoints.</p>}
    <Table caption="Complete shapes and mean composition" headers={['identity', 'shape', 'mean', 'future count']} rows={v.shapes.map((a, j) => [<span style={{
      color: j === 0 ? '#b79cff' : j === 1 ? '#78d3ea' : undefined
    }}>
        {j === 0 ? 'A' : j === 1 ? 'B' : `piece ${j}`}
      </span>, f(a), f(v.mean[j]), v.counts[j]])} />
    {v.shapes.length === 2 && <Table caption="Probability intervals under the shared Beta composition" headers={['interval', 'mass']} rows={[0, .25, .5, .75].map(left => [`${left}–${left + .25}`, f(betaCdf(left + .25, ...v.shapes) - betaCdf(left, ...v.shapes))])} />}
    {v.n === 2 && v.shapes.length === 2 && <Table caption="Ordered events merge into one count event" headers={['order', 'plug-in ordered mass', 'integrated ordered mass']} rows={v.counts[0] === 1 ? [['AB', f(v.plugin / 2), f(v.integrated / 2)], ['BA', f(v.plugin / 2), f(v.integrated / 2)]] : [[v.counts[0] === 2 ? 'AA' : 'BB', f(v.plugin), f(v.integrated)]]} />}
    <Result>
      <p>The drawing traces the first two slots of a representative ordering; full counts and multiplicity determine the event. For default AA, fixed factors 4/5 × 4/5 give 16/25; shared sequential factors 4/5 × 5/6 give 2/3.</p>
      <p>Complete Dirichlet count law: N!/∏xⱼ! × Γ(total)/Γ(total+N) × ∏Γ(aⱼ+xⱼ)/Γ(aⱼ).</p>
      <p>Count multiplicity has finite log {f(v.logCoefficient)}. {Number.isFinite(Math.exp(v.logCoefficient)) ? `Its value is ${f(Math.exp(v.logCoefficient))}.` : 'The coefficient is finite; exponentiation exceeds the browser floating-point range.'} Plug-in log mass {f(v.pluginLog)}, mass {f(v.plugin)}; integrated log mass {f(v.integratedLog)}, mass {f(v.integrated)}.</p>
      <p>Zero future length gives mass one. Above two categories, the complete vector and count law replace the one-dimensional Beta drawing.</p>
    </Result>
  </Figure>;
}
export function Mixed() {
  const m = useDraft({
      record: '0, 1, .5',
      mask: '1, 1, 1'
    }, d => {
      const record = vector(d.record, {
          minLength: 3,
          maxLength: 3,
          low: -5,
          high: 5
        }),
        mask = vector(d.mask, {
          minLength: 3,
          maxLength: 3,
          low: 0,
          high: 1,
          integer: true
        }).map(Boolean);
      return {
        record,
        ...mixed(...record, mask)
      };
    }),
    v = m.value,
    colors = ['#b79cff', '#78d3ea', '#f49c91'];
  return <Figure title="Three measurement families feed one class prior" caption="Status, alarm and mV reading retain their identities when a measurement is missing. Follow each parameter lookup or density to its prior-free class log likelihood.">
    <Svg width={1080} height={680} label="Categorical cells, binary on-off branches and Gaussian density curves feed one prior and class sums">
      <Text x={20} y={30} color={colors[0]}>status {v.record[0]}: category lookup</Text>
      {[0, 1].map(c => <g key={c}>
        <Text x={20} y={90 + c * 42} color={classColors[c]}>class {c}</Text>
        {[0, 1].map(k => <g key={k}>
          <rect x={150 + k * 100} y={68 + c * 42} width={85} height={32} fill="none" stroke={v.mask[0] && v.record[0] === k ? 'white' : colors[0]} strokeDasharray={v.mask[0] ? undefined : '5 4'} />
          <Text x={192 + k * 100} y={90 + c * 42} anchor="middle">
            {f(k === c ? 2 / 3 : 1 / 3)}
          </Text>
        </g>)}
      </g>)}
      <Text x={192} y={58} anchor="middle">status 0</Text>
      <Text x={292} y={58} anchor="middle">status 1</Text>
      <Text x={20} y={235} color={colors[1]}>alarm {v.record[1]}: measured on / off</Text>
      {[0, 1].map(c => <g key={c}>
        <Mark x={105} y={300 + c * 80} c={c} />
        <Text x={20} y={305 + c * 80} color={classColors[c]}>class {c}</Text>
        {[0, 1].map(b => <g key={b}>
          <Arrow x1={118} y1={300 + c * 80} x2={215} y2={279 + c * 80 + b * 42} color={colors[1]} dashed={!v.mask[1] || v.record[1] !== b} />
          <Text x={230} y={284 + c * 80 + b * 42} color={v.mask[1] && v.record[1] === b ? 'white' : colors[1]}>{b ? 'on' : 'off'}: {f(b === 1 ? c ? 1 / 3 : 2 / 3 : c ? 2 / 3 : 1 / 3)}</Text>
        </g>)}
      </g>)}
      <Text x={20} y={455} color={colors[2]}>reading {v.record[2]} mV: point density</Text>
      <Text x={70} y={485}>density 1/mV; variance 1.25 + 1e−9</Text>
      {[0, 1].map(c => <path key={c} d={pathFor(Array.from({
        length: 201
      }, (_, j) => {
        const x = -5 + j * .05;
        return [x, Math.exp(gaussianLogDensity(x, c ? 1.5 : .5, 1.25 + 1e-9))];
      }), x => 70 + (x + 5) * 35, p => 620 - 260 * p)} fill="none" stroke={classColors[c]} strokeWidth={2.5} strokeDasharray={v.mask[2] ? undefined : '5 4'} />)}
      <line x1={70} y1={620} x2={420} y2={620} stroke="#aaa" />
      {[-5, 0, 5].map(x => <Text key={x} x={70 + (x + 5) * 35} y={650} anchor="middle">{x} mV</Text>)}
      {v.mask[2] && <line x1={70 + (v.record[2] + 5) * 35} y1={515} x2={70 + (v.record[2] + 5) * 35} y2={620} stroke="white" strokeDasharray="4 4" />}
      {['status', 'alarm', 'reading'].map((name, j) => <g key={name}>
        {[0, 1].map(c => <Text key={c} x={475} y={90 + j * 200 + c * 42} color={classColors[c]}>class {c}: {v.mask[j] ? `log L = ${f(v.terms[c][j])}` : 'missing → log factor 0'}</Text>)}
        <Arrow x1={748} y1={106 + j * 200} x2={825} y2={330} color={colors[j]} dashed={!v.mask[j]} />
      </g>)}
      <Text x={825} y={42} color="#e7c37d">one log(.5) per class</Text>
      <Arrow x1={930} y1={58} x2={930} y2={292} color="#e7c37d" />
      <ellipse cx={930} cy={330} rx={95} ry={32} fill="none" stroke="#aaa" />
      <Text x={930} y={336} anchor="middle">class additions</Text>
      {v.values.map((score, c) => <Text key={c} x={825} y={395 + c * 42} color={classColors[c]}>score {c}: {f(score)}</Text>)}
      <Arrow x1={930} y1={452} x2={930} y2={503} />
      <Text x={930} y={535} anchor="middle">normalize once</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Status, alarm, reading (mV)" value={m.draft.record} onChange={x => m.edit('record', x)} vector help="status/alarm 0 or 1; reading −5 to 5" />
      <Field label="Measured mask, same family order" value={m.draft.mask} onChange={x => m.edit('mask', x)} vector help="1 measured; 0 missing" />
    </Controls>
    <p>Eight-row fit: means .5 / 1.5 mV; raw variance 1.25 mV²; absolute floor 1e−9. Dashed missing branches retain their family; they contribute log factor zero under the declared ignorable measurement process.</p>
    <Table caption="Class-aligned prior-free logs and selected sum" headers={['class', 'status log', 'alarm log', 'reading log', '+ one log prior = score']} rows={v.terms.map((row, c) => [c, ...row.map((x, j) => v.mask[j] ? f(x) : 'omitted → 0'), f(v.values[c])])} />
    <Probability values={v.probabilities} />
  </Figure>;
}
