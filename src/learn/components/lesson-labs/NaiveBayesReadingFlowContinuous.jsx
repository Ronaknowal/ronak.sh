import { MergeGeometry } from './NaiveBayesReadingFlowAnatomy.jsx';
import { gaussianObservationState, gaussianGeometryState, gaussianLogDensity, copiedAlarmState } from '../../data/naive-bayes-models.js';
import { classColors, sum, finite, vector, moments, mergeMoments } from '../../data/naive-bayes-reading-flow-models.js';
import observations from '../../data/naive-bayes-reading-flow-observations.js';
import { Figure, Svg, Text, Arrow, Mark, ClassLegend, Axis, Table, Result, Probability, Field, Choice, Controls, useDraft, num, f, pathFor } from './NaiveBayesReadingFlowElements.jsx';
export function Density() {
  const m = useDraft({
      x: '0',
      width: '.4'
    }, d => gaussianObservationState(num(d.x), num(d.width))),
    v = m.value;
  const x = t => 60 + (t + 6) * 50,
    y = t => 280 - t * 480;
  const curves = [1, 4].map(variance => Array.from({
    length: 241
  }, (_, j) => {
    const t = -6 + j * .05;
    return [t, Math.exp(gaussianLogDensity(t, 0, variance))];
  }));
  return <Figure title="Density height scores a point; probability is interval area" caption="Both readings use mV. The vertical unit is inverse mV. Widening the interval changes its mass, while point-density class probabilities stay fixed.">
    <Svg height={370} label="Two Gaussian density curves and shaded observed intervals">
      <Axis width={600} height={220} y={280} xmin={-6} xmax={6} ymin={0} ymax={.458333333333} xTicks={[-6, -3, 0, 3, 6]} yTicks={[0, .1, .2, .3, .4]} xlabel="reading (mV)" ylabel="density (1/mV)" />
      {curves.map((curve, c) => {
        const selected = curve.filter(([t]) => t >= v.reading - v.width / 2 && t <= v.reading + v.width / 2);
        const area = selected.length ? `M${x(selected[0][0])},280 ${pathFor(selected, x, y).replace(/^M/, 'L')} L${x(selected.at(-1)[0])},280Z` : '';
        return <g key={c}>
        <path d={area} fill={classColors[c]} opacity={.3} />
        <path d={pathFor(curve, x, y)} fill="none" stroke={classColors[c]} strokeWidth={2.5} />
      </g>;
      })}
      <line x1={x(v.reading)} y1={55} x2={x(v.reading)} y2={280} stroke="white" strokeDasharray="4 4" />
      <Text x={x(v.reading) + 8} y={53}>query</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Reading (mV)" value={m.draft.x} onChange={x => m.edit('x', x)} help="−5 to 5" />
      <Field label="Interval width (mV)" value={m.draft.width} onChange={x => m.edit('width', x)} help=".1–1" />
    </Controls>
    <Table caption="Point densities and interval masses" headers={['class', 'variance (mV²)', 'density at query', 'interval mass']} rows={[0, 1].map(c => [c, c ? 4 : 1, f(v.densities[c]), f(v.masses[c])])} />
    <Probability values={v.probabilities} />
  </Figure>;
}
export function Residuals() {
  const m = useDraft({
      x: '1, 2, 3'
    }, d => {
      const values = vector(d.x);
      return {
        values,
        ...moments(values)
      };
    }),
    v = m.value;
  const span = Math.max(1, ...v.values.map(x => Math.abs(x - v.mean))),
    scale = 190 / span;
  return <Figure title="Centre each reading, then add squared residuals" caption="Mean and variance are maximum-likelihood estimates: divide centred M2 by n, with ddof=0. Drawing distances use a declared common local scale.">
    <Svg width={760} height={140 + v.values.length * 45} label="Readings relative to mean, residual arrows and square areas">
      <Text x={350} y={26} anchor="middle">mean {f(v.mean)}</Text>
      <line x1={350} y1={40} x2={350} y2={70 + v.values.length * 45} stroke="white" />
      {v.values.map((reading, i) => {
        const residual = reading - v.mean;
        return <g key={i}>
        <Text x={20} y={73 + i * 45}>
          {f(reading)}
        </Text>
        <Arrow x1={350} y1={68 + i * 45} x2={350 + residual * scale} y2={68 + i * 45} />
        <circle cx={350 + residual * scale} cy={68 + i * 45} r={4} fill="#b79cff" />
        <rect x={570} y={50 + i * 45} width={Math.abs(residual) * 25 / span} height={Math.abs(residual) * 25 / span} fill="#b79cff" opacity={.6} />
        <Text x={610} y={73 + i * 45}>r²={f(residual ** 2)}</Text>
      </g>;
      })}
      <Text x={20} y={110 + v.values.length * 45}>Residual distance: {f(scale)} px/unit. Square side: {f(25 / span)} px/unit.</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Readings" value={m.draft.x} onChange={x => m.edit('x', x)} vector help="1–100 readings within ±1,000,000" />
    </Controls>
    <Result>
      <p>n={v.n}; mean={f(v.mean)}; M2={f(v.M2)}; M2/n={f(v.variance)}.</p>
    </Result>
  </Figure>;
}
export function Floor() {
  const m = useDraft({
      floor: '1e-9'
    }, d => finite(num(d.floor), 1e-12, 1e12, 'Variance floor')),
    v = m.value,
    sigma = Math.sqrt(v),
    position = 60 + (Math.log10(v) + 12) * 25;
  const curve = Array.from({
    length: 121
  }, (_, j) => {
    const z = -3 + j * .05;
    return [z, Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)];
  });
  return <Figure title="A constant class has zero raw spread" caption="Coincident raw readings have a singular point mass. The positive floor gives a Gaussian spread; this magnified curve uses z=(reading−2)/σ and σ×density so even a tiny spread can be inspected.">
    <Svg width={760} height={430} label="Raw coincident observations, magnified positive Gaussian spread and logarithmic variance ruler">
      <Text x={20} y={30}>readings 2, 2, 2 → mean 2; M2 = 0; raw density undefined</Text>
      <line x1={245} y1={60} x2={245} y2={225} stroke="white" strokeDasharray="5 4" />
      <path d={pathFor(curve, z => 50 + (z + 3) * 65, density => 225 - 330 * density)} fill="none" stroke="#b79cff" strokeWidth={3} />
      <line x1={50} y1={225} x2={440} y2={225} stroke="#aaa" />
      {[-3, 0, 3].map(z => <Text key={z} x={50 + (z + 3) * 65} y={253} anchor="middle">z={z}</Text>)}
      <Text x={50} y={283}>physical readings: {f(2 - 3 * sigma)} to {f(2 + 3 * sigma)} mV</Text>
      <Text x={475} y={105}>vertical: σ × density</Text>
      <Text x={475} y={145}>peak 1/√(2π) ≈ .39894</Text>
      <Text x={475} y={190}>σ = {f(sigma)} mV</Text>
      <line x1={60} y1={350} x2={660} y2={350} stroke="#aaa" />
      {[-12, -6, 0, 6, 12].map(t => <Text key={t} x={60 + (t + 12) * 25} y={380} anchor="middle">10^{t}</Text>)}
      <circle cx={position} cy={350} r={7} fill="#b79cff" stroke="white" />
      <Text x={60} y={421}>log₁₀ variance (mV²); raw zero is outside this scale</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Absolute variance floor (mV²)" value={m.draft.floor} onChange={x => m.edit('floor', x)} help="1e-12–1e12; stored separately from M2" />
    </Controls>
    <Result>
      <p>Derived variance = M2/n + floor = {f(v)}. Physical peak density = {f(1 / Math.sqrt(2 * Math.PI * v))} per mV. The raw M2 remains zero: changing the floor does not add observed variation.</p>
    </Result>
  </Figure>;
}
export function Covariance() {
  const m = useDraft({
      rho: '.6'
    }, d => finite(num(d.rho), -.8, .8, 'Correlation')),
    rho = m.value;
  const points = Array.from({
    length: 121
  }, (_, i) => {
    const t = i * 2 * Math.PI / 120;
    return [Math.cos(t) * Math.sqrt(1 + rho) / Math.sqrt(2) - Math.sin(t) * Math.sqrt(1 - rho) / Math.sqrt(2), Math.cos(t) * Math.sqrt(1 + rho) / Math.sqrt(2) + Math.sin(t) * Math.sqrt(1 - rho) / Math.sqrt(2)];
  });
  return <Figure title="Diagonal likelihoods cannot rotate with correlation" caption="Both axes have equal physical scale. The white circle uses diagonal I; violet uses the full covariance with the same marginal variances.">
    <Svg width={720} height={390} label="Full correlated ellipse versus diagonal circle">
      <Axis x={100} y={320} width={280} height={280} xmin={-2} xmax={2} ymin={-2} ymax={2} xTicks={[-2, -1, 0, 1, 2]} yTicks={[-2, -1, 0, 1, 2]} xlabel="feature 1" ylabel="feature 2" />
      <circle cx={240} cy={180} r={70} fill="none" stroke="white" strokeWidth={2} />
      <path d={pathFor(points, x => 240 + 70 * x, y => 180 - 70 * y)} fill="none" stroke="#b79cff" strokeWidth={3} />
      <Text x={430} y={90}>Σ = [1, ρ; ρ, 1]</Text>
      <Text x={430} y={145}>det Σ = {f(1 - rho * rho)}</Text>
      <Text x={430} y={200}>Q = (x₁² − 2ρx₁x₂ + x₂²)</Text>
      <Text x={430} y={230}>divided by (1−ρ²)</Text>
      <Text x={430} y={280}>At ρ=0, both contours agree.</Text>
    </Svg>
    <Controls model={m}>
      <Field label="Correlation rho" value={m.draft.rho} onChange={x => m.edit('rho', x)} help="−.8 to .8" />
    </Controls>
  </Figure>;
}
export function Boundary() {
  const m = useDraft({
      mode: 'unequal',
      x: '0',
      y: '0'
    }, d => gaussianGeometryState(d.mode, [num(d.x), num(d.y)])),
    v = m.value;
  const xy = x => 60 + (x + 8) * 28;
  return <Figure title="Spread terms and distance terms determine the boundary" caption="Cell-centre class regions sit behind the exact equal-score boundary. Both axes use the same distance scale.">
    <Svg width={760} height={500} label="Equal-axis Gaussian boundary and query"><Axis x={60} y={445} width={392} height={392} xmin={-8} xmax={6} ymin={-8} ymax={6} xTicks={[-8, -4, 0, 4, 6]} yTicks={[-8, -4, 0, 4, 6]} xlabel="x" ylabel="y" />{v.grid.map((p, i) => <rect key={i} x={xy(p.x) - 7} y={445 - (p.y + 8) * 28 - 7} width={14} height={14} fill={classColors[p.label]} opacity={.17} />)}{v.mode === 'equal' ? <line x1={xy(-6)} y1={445 - 14 * 28} x2={xy(6)} y2={445 - 2 * 28} stroke="white" strokeWidth={2} /> : <circle cx={xy(v.center[0])} cy={445 - (v.center[1] + 8) * 28} r={v.radius * 28} fill="none" stroke="white" strokeWidth={2} />} {v.means.map((mean, c) => <Mark key={c} x={xy(mean[0])} y={445 - (mean[1] + 8) * 28} c={c} size={8} />)}<path d={`M${xy(v.point[0]) - 7},${445 - (v.point[1] + 8) * 28}h14 M${xy(v.point[0])},${445 - (v.point[1] + 8) * 28 - 7}v14`} stroke="white" strokeWidth={3} /><Text x={480} y={100}>white: score equality</Text><Text x={480} y={145}>blue ● mean (−2,−2)</Text><Text x={480} y={190}>gold ▲ mean (2,2)</Text><Text x={480} y={245}>prior = ½ each</Text><Text x={480} y={300}>variances {v.variances.join(', ')}</Text></Svg>
    <Controls model={m}>
      <Choice label="Variance comparison" value={m.draft.mode} onChange={x => m.edit('mode', x)} options={[['equal', 'equal variances'], ['unequal', 'unequal variances']]} />
      <Field label="Probe x" value={m.draft.x} onChange={x => m.edit('x', x)} help="−8 to 6" />
      <Field label="Probe y" value={m.draft.y} onChange={x => m.edit('y', x)} help="−8 to 6" />
    </Controls>
    <Table caption="Query score operands" headers={['class', 'log prior', '−log variance', '−squared distance / (2v)', 'score']} rows={v.means.map((mean, c) => [c, f(Math.log(.5)), f(-Math.log(v.variances[c])), f(-sum(mean.map((x, j) => (v.point[j] - x) ** 2)) / (2 * v.variances[c])), f(v.scores[c])])} />
    <Probability values={v.probabilities} />
    <ClassLegend />
  </Figure>;
}
export function Copies() {
  const m = useDraft({
      copies: '3',
      sign: 'on',
      prior: '.2'
    }, d => copiedAlarmState(num(d.copies), d.sign === 'on', num(d.prior))),
    v = m.value;
  return <Figure title="Copied fields share one actual alarm" caption="The copied route multiplies one event repeatedly. The independent-child route would require genuinely separate observations.">
    <Svg height={380} label="One actual class-alarm-copy fan versus independent class children">
      <Text x={20} y={35}>actual class → one alarm → copied fields</Text>
      <ellipse cx={55} cy={115} rx={34} ry={24} fill="none" stroke="#aaa" />
      <Text x={55} y={121} anchor="middle">class</Text>
      <Arrow x1={90} y1={115} x2={135} y2={115} />
      <circle cx={170} cy={115} r={28} fill="none" stroke="#78d3ea" />
      <Text x={170} y={121} anchor="middle">alarm</Text>
      {Array.from({
        length: v.copies
      }, (_, i) => <g key={i}>
        <Arrow x1={200} y1={115} x2={290 + i * 90} y2={70} />
        <Text x={290 + i * 90} y={57} anchor="middle">copy {i + 1}</Text>
      </g>)}
      <Text x={20} y={190}>assumed class → distinct independent alarms</Text>
      <ellipse cx={120} cy={250} rx={36} ry={25} fill="none" stroke="#aaa" />
      <Text x={120} y={256} anchor="middle">class</Text>
      {Array.from({
        length: v.copies
      }, (_, i) => <g key={i}>
        <Arrow x1={155} y1={250} x2={290 + i * 90} y2={300} color="#78d3ea" />
        <circle cx={290 + i * 90} cy={327} r={24} fill="none" stroke="#78d3ea" />
        <Text x={290 + i * 90} y={333} anchor="middle">
          {i + 1}
        </Text>
      </g>)}
    </Svg>
    <Controls model={m}>
      <Field label="Number of copies" value={m.draft.copies} onChange={x => m.edit('copies', x)} help="integer 1–5" />
      <Choice label="Alarm value" value={m.draft.sign} onChange={x => m.edit('sign', x)} options={[['on', 'positive alarm'], ['off', 'negative alarm']]} />
      <Field label="Fault prior" value={m.draft.prior} onChange={x => m.edit('prior', x)} help=".05–.5" />
    </Controls>
    <p>Actual one-alarm posterior</p>
    <Probability values={v.truth.probabilities} />
    <p>Repeated-factor model posterior</p>
    <Probability values={v.naive.probabilities} />
    <Table caption="Actual population law, scored by the repeated-factor model" headers={['observation', 'class masses', 'actual P(fault)', 'reported', 'decision']} rows={v.rows.map(row => [row.positive ? 'on' : 'off', row.masses.map(x => f(x)).join(', '), f(row.actual), f(row.reported), row.prediction])} />
    <Result>
      <p>Actual-law accuracy {f(v.accuracy)}; Brier {f(v.brier)}. A strict tie chooses class 0.</p>
    </Result>
  </Figure>;
}
export function Xor() {
  return <Figure title="Equal one-feature marginals hide a parity rule" caption="00 and 11 have class 0; 01 and 10 have class 1. Each class makes either value of each feature equally frequent.">
    <Svg height={330} label="Four XOR corners with equal class conditional feature marginals">
      {[[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]].map(([a, b, c]) => <g key={`${a}${b}`}>
        <Mark x={100 + 180 * a} y={245 - 180 * b} c={c} size={12} />
        <Text x={100 + 180 * a} y={b ? 45 : 280} anchor="middle">{a}{b}; class {c}</Text>
      </g>)}
      <line x1={100} y1={245} x2={280} y2={65} stroke={classColors[0]} opacity={.4} />
      <line x1={100} y1={65} x2={280} y2={245} stroke={classColors[1]} opacity={.4} />
      <Text x={390} y={90}>P(X₁=1|c) = ½</Text>
      <Text x={390} y={140}>P(X₂=1|c) = ½</Text>
      <Text x={390} y={200}>naive posterior = ½ at all corners</Text>
      <Text x={390} y={255}>parity preserves the missing relation</Text>
    </Svg>
    <ClassLegend />
  </Figure>;
}
export function Merging() {
  const m = useDraft({ left: '1, 2', right: '3' }, draft => {
    const a = vector(draft.left, { empty: true });
    const b = vector(draft.right, { empty: true });
    if (a.length + b.length > 100) throw Error('Combined groups must contain at most 100 readings.');
    const left = moments(a);
    const right = moments(b);
    return { a, b, left, right, merged: mergeMoments(left, right) };
  });
  const v = m.value;
  return <Figure title="Merge centred state with its between-group correction" caption="Empty groups are identities. Raw M2 and mass merge first; a variance floor is derived separately.">
    <MergeGeometry value={v} />
    <Table caption="Every reading's centered square and recentering square" headers={['group / row', 'reading', 'x − group mean', 'centered square', 'group mean − merged mean', 'offset square']}
      rows={[['A', v.a, v.left], ['B', v.b, v.right]].flatMap(([name, readings, group]) => readings.map((reading, index) => {
        const centered = reading - group.mean;
        const offset = group.mean - v.merged.mean;
        return [name + index, f(reading), f(centered), f(centered * centered), f(offset), f(offset * offset)];
      }))} />
    <Controls model={m}>
      <Field label="Left group readings" value={m.draft.left} onChange={left => m.edit('left', left)} vector help="empty or finite readings within ±1,000,000" />
      <Field label="Right group readings" value={m.draft.right} onChange={right => m.edit('right', right)} vector help="combined ≤100 readings" />
    </Controls>
    <Table caption="Merge all raw sufficient statistics" headers={['group', 'n', 'mean', 'M2', 'M2/n']}
      rows={['left', 'right', 'merged'].map(name => {
        const group = v[name];
        return [name, group.n, f(group.mean), f(group.M2), f(group.variance)];
      })} />
    <Result><p>Saved library epsilon is batch {f(observations.nb_gaussian_online.library_epsilon_batch)}, versus chunk values [{observations.nb_gaussian_online.library_epsilon_chunks.map(value => f(value)).join(', ')}]. Those are retained observations, not new fits.</p></Result>
  </Figure>;
}
