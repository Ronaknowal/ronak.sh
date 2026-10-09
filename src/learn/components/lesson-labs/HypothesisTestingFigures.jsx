import { PAIRED_OLD, PAIRED_NEW, PAIRED_DIFFERENCES, sampleSummary, t4Density, t4Quantile, t4Survival, normalDensity, plannedPowerState, predictionWidths, proportionIntervals, proportionCoverageState, optionalLooksState, binomialMasses, inferenceNumber as num } from '../../data/hypothesis-testing-models.js';
import data from '../../data/hypothesis-testing-reading-flow-data.json';
import { INK, SELECT, COMPARE, MUTED, scale, curve, area, Drawing, Block, Table, Axis, Arrow, Interval, Density, Mass } from './HypothesisTestingDrawings.jsx';
export function IntervalPlot({
  rows,
  domain = [-2, 6],
  ticks = [-2, 0, 2, 4, 6],
  references = [0],
  label = 'Mean saving (ms)'
}) {
  const x = scale(...domain),
    height = rows.length * 70 + 105;
  return <Drawing title={label + '; labelled interval constructions'} height={height}>{references.map(v => <path key={v} d={rows.map((_, i) => `M${x(v)},${52 + i * 70}V${i === rows.length - 1 ? height - 65 : 85 + i * 70}`).join(' ')} stroke={COMPARE} strokeDasharray="5 4" />)}{rows.map((r, i) => <g key={r.label}><text x="50" y={42 + i * 70}>{r.label}</text><Interval x={x} low={r.low} high={r.high} mean={r.mean} y={65 + i * 70} domain={domain} color={r.color ?? INK} dashed={r.dashed} /></g>)}<Axis x={x} ticks={ticks} y={height - 65} label={label} /></Drawing>;
}
export function DatasetPlot({
  values = PAIRED_DIFFERENCES,
  label = 'Saving (ms)',
  domain = [-8, 10]
}) {
  const x = scale(...domain);
  return <Drawing title={'Five labelled ' + label + ' measurements'} height={250}><path d={`M${x(0)},25V185`} stroke={COMPARE} strokeDasharray="4 4" />{values.map((v, i) => <g key={i}><text x="25" y={45 + i * 30}>{'ABCDE'[i]}</text><path d={`M${x(0)},${40 + i * 30}H${x(v)}`} stroke={INK} /><circle cx={x(v)} cy={40 + i * 30} r="4.5" fill={INK} /><text x={x(v) + (v < 0 ? -8 : 8)} y={44 + i * 30} textAnchor={v < 0 ? 'end' : 'start'}>{num(v, 2)}</text></g>)}<Axis x={x} ticks={[-8, -4, 0, 4, 8]} y={185} label={label} /></Drawing>;
}
export function PairedDifferenceFigure() {
  const x = scale(98, 110),
    c = scale(-2, 5);
  return <Block id="paired-difference" title="Each workload keeps its two measurements" caption="Filled point: old version. Open point: new version. The lower contrast view uses a separate saving scale; each A–E identity stays matched."><Drawing title="Actual old and new timings on one millisecond axis" height={260}>{PAIRED_OLD.map((v, i) => <g key={i}><text x="25" y={45 + i * 29}>{'ABCDE'[i]}</text><Arrow x1={x(v)} y1={40 + i * 29} x2={x(PAIRED_NEW[i])} y2={40 + i * 29} color={i === 2 ? COMPARE : INK} /><circle cx={x(v)} cy={40 + i * 29} r="5" fill={INK} /><circle cx={x(PAIRED_NEW[i])} cy={40 + i * 29} r="5" fill="#171716" stroke={INK} /></g>)}<Axis x={x} ticks={[98, 100, 104, 108, 110]} y={190} label="Measured latency (ms)" /></Drawing><Drawing title="Same five IDs on their old-minus-new contrast scale" height={200}>{PAIRED_DIFFERENCES.map((v, i) => <g key={i}><path d={`M${c(0)},${30 + i * 23}H${c(v)}`} stroke={INK} /><circle cx={c(v)} cy={30 + i * 23} r="4" fill={i === 2 ? COMPARE : INK} /><text x="25" y={34 + i * 23}>{'ABCDE'[i]}</text><text x={c(v) + (v < 0 ? -8 : 8)} y={34 + i * 23} textAnchor={v < 0 ? 'end' : 'start'}>{v}</text></g>)}<Axis x={c} ticks={[-2, 0, 2, 4]} y={140} label="Saving = old − new (ms)" /></Drawing><Table title="Exact matched records" headers={['Workload', 'Old (ms)', 'New (ms)', 'Saving (ms)']} rows={PAIRED_OLD.map((v, i) => ['ABCDE'[i], v, PAIRED_NEW[i], PAIRED_DIFFERENCES[i]])} /></Block>;
}
export function EstimandSamplingFigure() {
  const hypotheticalOld = [106, 109, 103, 103, 110],
    hypotheticalNew = [105, 106, 104, 103, 108];
  const samples = [{
    ids: 'ABCDE',
    old: PAIRED_OLD,
    next: PAIRED_NEW,
    label: 'The original five matched workloads'
  }, {
    ids: 'FGHIJ',
    old: hypotheticalOld,
    next: hypotheticalNew,
    label: 'A second hypothetical sample; illustrative synthetic measurements'
  }];
  const x = scale(98, 112, 65, 270);
  return <Block id="estimand-sampling" title="A fixed population target can yield different sample estimates" caption="Each row is a complete paired unit: filled old timing, open new timing, attached ID and old-minus-new contrast. The first sample retains the original measurements; F–J are explicitly hypothetical synthetic measurements. The population target μ stays fixed when the selected sample changes. Sampling units and assigning version order are separate operations.">
 <Drawing title="Illustrative population units and the sampling boundary" height={150}>
 <ellipse cx="122" cy="66" rx="87" ry="51" fill="none" stroke={MUTED} />
 {Array.from({
        length: 15
      }, (_, i) => <circle key={i} cx={66 + i % 5 * 27} cy={38 + Math.floor(i / 5) * 28} r="5" fill={INK} />)}
 <Arrow x1={218} y1={66} x2={290} y2={66} /><path d="M301,25V112" stroke={COMPARE} strokeDasharray="4 4" />
 <text x="122" y="139" textAnchor="middle">Population / target μ</text><text x="305" y="139">Sample boundary</text>
 </Drawing>
 {samples.map(sample => {
      const differences = sample.old.map((v, i) => v - sample.next[i]),
        sum = differences.reduce((a, b) => a + b, 0);
      return <Drawing key={sample.ids} title={sample.label} height={320}>
 {differences.map((d, i) => <g key={sample.ids[i]}><text x="28" y={35 + i * 30}>{sample.ids[i]}</text><Arrow x1={x(sample.old[i])} y1={30 + i * 30} x2={x(sample.next[i])} y2={30 + i * 30} /><circle cx={x(sample.old[i])} cy={30 + i * 30} r="4" fill={INK} /><circle cx={x(sample.next[i])} cy={30 + i * 30} r="4" fill="#171716" stroke={INK} /><text x="300" y={35 + i * 30}>{d} ms contrast</text></g>)}
 <Axis x={x} ticks={[98, 102, 106, 110]} y={180} low={65} high={270} label="Old/new latency (ms)" />
 <Arrow x1={355} y1={164} x2={355} y2={240} color={COMPARE} />
 <text x="220" y="282" textAnchor="middle">Σd = {sum} ms; d̄ = {sum}/5 = {sum / 5} ms</text>
 </Drawing>;
    })}
 </Block>;
}
export function MeanVarianceFigure() {
  const x = scale(75, 125),
    y = v => 180 - v / .44 * 130;
  return <Block id="mean-variance" title="Independent contributions shrink when averaged" caption="Top: three illustrative independent centered contributions each receive weight 1/3. Bottom: exact Normal sampling densities share the same mean axis and the same density scale per millisecond."><Drawing title="Three equal contribution weights and their variance sum" height={185}>{[-1, 0, 1].map((v, i) => <g key={i}><circle cx={85 + i * 130} cy="48" r="17" fill="none" stroke={INK} /><text x={85 + i * 130} y="53" textAnchor="middle">X{i + 1}</text><Arrow x1={85 + i * 130} y1={66} x2={220} y2={110} /><text x={65 + i * 130} y="98">1/3</text></g>)}<circle cx="220" cy="129" r="18" fill="none" stroke={SELECT} /><text x="220" y="134" textAnchor="middle">X̄</text><text x="220" y="176" textAnchor="middle">σ²/9 + σ²/9 + σ²/9 = σ²/3</text></Drawing><Drawing title="Normal sampling densities for n=5,25,100; density per millisecond" height={260}>{[5, 25, 100].map((n, i) => {
        const s = 10 / Math.sqrt(n);
        return <path key={n} d={curve(v => normalDensity((v - 100) / s) / s, 75, 125, x, y)} fill="none" stroke={[INK, COMPARE, SELECT][i]} strokeWidth="2" strokeDasharray={i === 1 ? '5 4' : undefined} />;
      })}<path d="M50,180V48" stroke={MUTED} /><text x="50" y="27">Density / ms</text><text x="46" y="55" textAnchor="end">.44</text><Axis x={x} ticks={[75, 85, 100, 115, 125]} y={185} label="Sample mean (ms); μ = 100" /></Drawing><Table title="The plotted sampling distributions, σ = 10 ms" headers={['n / line', 'Variance of mean (ms²)', 'SE (ms)']} rows={[['5 / neutral', 20, num(10 / Math.sqrt(5))], ['25 / dashed cyan', 4, 2], ['100 / amber', 1, 1]]} /></Block>;
}
export function PredictionVarianceFigure() {
  const s = predictionWidths(100);
  return <Block id="prediction-variance" title="Future noise and estimation noise both survive" caption="The two independent noises enter the difference Ynew−X̄ with opposite signs but their variances add. The observed-centered interval rules below have distinct targets; they are not posterior densities for μ."><Drawing title="Independent future and sample mean errors combine" height={210}><circle cx="95" cy="65" r="25" fill="none" stroke={INK} /><text x="95" y="70" textAnchor="middle">εnew</text><text x="95" y="113" textAnchor="middle">σ² = 100</text><circle cx="335" cy="65" r="25" fill="none" stroke={COMPARE} /><text x="335" y="70" textAnchor="middle">X̄−μ</text><text x="335" y="113" textAnchor="middle">σ²/n = 1</text><Arrow x1={120} y1={75} x2={204} y2={150} /><Arrow x1={310} y1={75} x2={226} y2={150} color={COMPARE} /><text x="215" y="175" textAnchor="middle">Var(Ynew−X̄) = 101 ms²</text></Drawing><IntervalPlot rows={[{
      label: '95% confidence / mean',
      mean: 100,
      low: 100 - s.meanHalfWidth,
      high: 100 + s.meanHalfWidth
    }, {
      label: '95% prediction / next reading',
      mean: 100,
      low: 100 - s.predictionHalfWidth,
      high: 100 + s.predictionHalfWidth,
      color: COMPARE,
      dashed: true
    }]} domain={[75, 125]} ticks={[75, 85, 100, 115, 125]} references={[100]} label="Rule centered on observed mean 100 ms" /></Block>;
}
export function ResidualDegreesFigure() {
  const x = scale(-4, 5),
    r = [0, 2, -3, 1, 0];
  return <Block id="residual-degrees" title="Center each saving, then square its distance" caption="Each residual has millisecond units. In the second drawing, one side unit is 25 pixels; square area is therefore 625 pixels² per ms². Zero residuals have zero area, shown as crosses rather than positive squares."><Drawing title="Five observed savings and residual distances from mean 2" height={255}><path d={`M${x(2)},20V180`} stroke={COMPARE} strokeDasharray="5 4" />{PAIRED_DIFFERENCES.map((d, i) => <g key={i}><text x="25" y={44 + i * 30}>{'ABCDE'[i]}</text><path d={`M${x(2)},${40 + i * 30}H${x(d)}`} stroke={INK} /><circle cx={x(d)} cy={40 + i * 30} r="4" fill={INK} /><text x={x(d) + (r[i] < 0 ? -8 : 8)} y={44 + i * 30} textAnchor={r[i] < 0 ? 'end' : 'start'}>{r[i] >= 0 ? '+' : ''}{r[i]}</text></g>)}<Axis x={x} ticks={[-4, -2, 0, 2, 4]} y={185} label="Saving (ms); dashed mean = 2" /></Drawing><Drawing title="Individual residual square areas 0,4,9,1,0 ms squared" width={520} height={180}>{r.map((v, i) => {
        const a = 25 * Math.abs(v),
          cx = 52 + i * 100;
        return <g key={i}>{a > 0 ? <rect x={cx - a / 2} y={115 - a} width={a} height={a} fill={INK} opacity=".3" stroke={INK} /> : <path d={`M${cx - 4},111l8,8m-8,0l8,-8`} stroke={INK} />}<text x={cx} y="144" textAnchor="middle">{'ABCDE'[i]}: {v * v} ms²</text></g>;
      })}<text x="260" y="24" textAnchor="middle">Squares sum to 14 ms²</text></Drawing></Block>;
}
const roots = [Math.sqrt(5), Math.sqrt(2), Math.sqrt(6), Math.sqrt(12), Math.sqrt(20)];
const basis = [[1, 1, 1, 1, 1], [1, -1, 0, 0, 0], [1, 1, -2, 0, 0], [1, 1, 1, -3, 0], [1, 1, 1, 1, -4]].map((row, i) => row.map(v => v / roots[i]));
export function NormalProjectionFigure() {
  return <Block id="normal-projection" title="Five coordinates split into one mean and four residual directions" caption="The complete grid contains actual five-dimensional coefficient vectors. Each small horizontal coefficient axis spans −1 to +1; marked coefficients and arithmetic—not the inset—describe the five observations. The final inset illustrates perpendicular directions in two dimensions only."><Drawing title="Actual complete 5 by 5 orthonormal coefficient grid" width={610} height={340}>{basis.map((row, i) => <g key={i}><text x="14" y={57 + i * 54}>{i === 0 ? 'e₀' : 'e' + i}</text>{row.map((v, j) => {
          const center = 94 + j * 110,
            yy = 45 + i * 54;
          return <g key={j}><path d={`M${center - 43},${yy}h86`} stroke={MUTED} /><path d={`M${center},${yy - 5}v10`} stroke={MUTED} /><circle cx={center + v * 43} cy={yy} r="4" fill={i === 2 ? SELECT : INK} /><text x={center} y={yy + 24} textAnchor="middle">{num(v, 3)}</text></g>;
        })}</g>)}{'ABCDE'.split('').map((id, j) => <text key={id} x={94 + j * 110} y="321" textAnchor="middle">{id}</text>)}</Drawing><Table title="Projecting d=(2,4,−1,3,2) ms onto that basis" headers={['Direction', 'Coefficient numerator', 'Projection (ms)', 'Square (ms²)']} rows={[['Mean e₀', '(1,1,1,1,1) / √5', '10/√5', '20'], ['Residual e₁', '(1,−1,0,0,0) / √2', '−2/√2', '2'], ['Residual e₂', '(1,1,−2,0,0) / √6', '8/√6', '64/6'], ['Residual e₃', '(1,1,1,−3,0) / √12', '−4/√12', '16/12'], ['Residual e₄', '(1,1,1,1,−4) / √20', '0', '0']]} /><Drawing title="Separate 2D orthogonality illustration, not a five-dimensional projection" height={215}><path d="M90,125H345M180,185V28" stroke={MUTED} /><Arrow x1={180} y1={125} x2={250} y2={55} color={INK} /><Arrow x1={180} y1={125} x2={250} y2={195} color={COMPARE} /><path d="M191,114l11,11l-11,11" stroke={SELECT} fill="none" /><text x="265" y="53">(1,1)/√2</text><text x="264" y="194">(1,−1)/√2</text><text x="55" y="26">2D illustration</text></Drawing></Block>;
}
export function StudentPivotFigure() {
  return <Block id="student-pivot" title="An independent random denominator changes the reference tails" caption="Each ξ is an independent standard Normal residual coordinate under the Gaussian model. Squaring and summing gives U with four degrees of freedom. The density comparison shares a dimensionless coordinate and density scale; dashed cyan is standard Normal."><Drawing title="Independent Normal factors combine into the Student ratio" height={245}><circle cx="85" cy="55" r="22" fill="none" stroke={INK} /><text x="85" y="60" textAnchor="middle">Z</text>{[0, 1, 2, 3].map(i => <g key={i}><circle cx={195 + i * 55} cy="55" r="20" fill="none" stroke={INK} /><text x={195 + i * 55} y="60" textAnchor="middle">ξ{i + 1}²</text><Arrow x1={195 + i * 55} y1={76} x2={270} y2={121} /></g>)}<text x="270" y="149" textAnchor="middle">U = ξ₁²+ξ₂²+ξ₃²+ξ₄²</text><Arrow x1={85} y1={78} x2={155} y2={182} /><Arrow x1={270} y1={156} x2={222} y2={182} /><text x="200" y="215" textAnchor="middle">T = Z / √(U/4)</text></Drawing><Density fn={t4Density} comparison={normalDensity} domain={[-6, 6]} ticks={[-6, -3, 0, 3, 6]} label="Dimensionless t; solid Student t₄" /></Block>;
}
export function PairedIntervalFigure() {
  const s = sampleSummary(PAIRED_DIFFERENCES);
  return <Block id="paired-interval" title="The same mean supports two different interval conventions" caption="Both constructions use the observed mean 2 and SE √.7. Neutral has two finite 95% endpoints. Dashed cyan is the 95% lower confidence set; its right arrow continues to +∞, beyond the drawn axis."><IntervalPlot rows={[{
      label: 'Two-sided 95%',
      mean: 2,
      low: 2 - t4Quantile(.975) * s.se,
      high: 2 + t4Quantile(.975) * s.se
    }, {
      label: 'One-sided lower 95%',
      mean: 2,
      low: 2 - t4Quantile(.95) * s.se,
      high: Infinity,
      dashed: true,
      color: COMPARE
    }]} /><Table title="Actual endpoints (ms); null reference 0" headers={['Construction', 'Lower', 'Upper']} rows={[['Two-sided 95%', num(2 - t4Quantile(.975) * s.se, 6), num(2 + t4Quantile(.975) * s.se, 6)], ['One-sided lower 95%', num(2 - t4Quantile(.95) * s.se, 6), '+∞']]} /></Block>;
}
export function IntervalInversionFigure() {
  const s = sampleSummary(PAIRED_DIFFERENCES),
    c = t4Quantile(.975),
    lo = 2 - c * s.se,
    hi = 2 + c * s.se,
    x = scale(-2, 6),
    candidates = [-1, lo, 0, 2, hi, 5];
  return <Block id="interval-inversion" title="Move the null claim while keeping the observations fixed" caption="Amber filled candidates belong to the closed non-rejection interval. Open crossed candidates reject. Endpoint equality is the mathematical p=.05 boundary; six-decimal endpoint labels are rounded, not a new exact input."><Drawing title="Candidate null means inside and outside the compatible interval" height={210}><path d={`M${x(lo)},110H${x(hi)}`} stroke={SELECT} strokeWidth="7" opacity=".5" />{candidates.map((v, i) => {
        const inSet = v >= lo && v <= hi;
        return <g key={i}><circle cx={x(v)} cy="110" r="5" fill={inSet ? SELECT : '#171716'} stroke={inSet ? SELECT : INK} />{!inSet && <path d={`M${x(v) - 4},106l8,8m-8,0l8,-8`} stroke={INK} />}<text x={x(v)} y={i % 2 ? 76 : 49} textAnchor="middle">{num(v, 3)}</text></g>;
      })}<Axis x={x} ticks={[-2, 0, 2, 4, 6]} y={145} label="Candidate null μ₀ (ms)" /></Drawing><Table title="Compatible tail test at fixed observed d" headers={['Candidate μ₀ (ms)', 't=(2−μ₀)/SE', 'Two-sided p', 'Decision']} rows={candidates.map(v => [num(v, 6), num((2 - v) / s.se, 6), num(2 * t4Survival(Math.abs((2 - v) / s.se)), 6), v >= lo && v <= hi ? 'Non-rejection (closed)' : 'Reject'])} /></Block>;
}
export function SuperiorityCriterionFigure() {
  const s = sampleSummary(PAIRED_DIFFERENCES);
  return <Block id="superiority-criterion" title="Zero difference and a useful saving are distinct references" caption="Dashed reference lines are 0 and the predeclared 1 ms criterion. The  +1 ms counterfactual moves the mean without changing spread. The two-sided interval and one-sided lower set answer different tail questions."><IntervalPlot references={[0, 1]} rows={[{
      label: 'Original: two-sided 95%',
      mean: 2,
      low: 2 - t4Quantile(.975) * s.se,
      high: 2 + t4Quantile(.975) * s.se
    }, {
      label: 'Saving +1: two-sided 95%',
      mean: 3,
      low: 3 - t4Quantile(.975) * s.se,
      high: 3 + t4Quantile(.975) * s.se
    }, {
      label: 'Saving +1: lower 95%',
      mean: 3,
      low: 3 - t4Quantile(.95) * s.se,
      high: Infinity,
      color: COMPARE,
      dashed: true
    }]} /></Block>;
}
export function TostIntersectionFigure() {
  const se = Math.sqrt(.7),
    c = t4Quantile(.95),
    t = .5 / (se / 4);
  return <Block id="tost-intersection" title="Equivalence needs both directed rejections" caption="The precise centered sample has lower-null upper tail and upper-null lower tail, each .037565. Both must reject. On the effect axis, the open tolerance band (−.5,.5) contains the precise 90% interval but not the original-spread interval."><div className="hf-pair"><Density fn={t4Density} domain={[-6, 6]} ticks={[-6, -3, 0, 3, 6]} regions={[[t, Infinity, SELECT]]} reference={t} label="Lower null −.5: upper t tail" /><Density fn={t4Density} domain={[-6, 6]} ticks={[-6, -3, 0, 3, 6]} regions={[[-Infinity, -t, SELECT]]} reference={-t} label="Upper null +.5: lower t tail" /></div><IntervalPlot domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]} references={[-.5, .5]} rows={[{
      label: 'Centered / original spread 90%',
      mean: 0,
      low: -c * se,
      high: c * se
    }, {
      label: 'Centered / quarter spread 90%',
      mean: 0,
      low: -c * se / 4,
      high: c * se / 4,
      color: SELECT
    }]} /><Table title="Both TOST tail conditions at α=.05" headers={['Dataset', 'Lower-bound test p', 'Upper-bound test p', 'Both reject?']} rows={[['Centered', num(t4Survival(.5 / se), 6), num(t4Survival(.5 / se), 6), 'No'], ['Precise centered', num(t4Survival(t), 6), num(t4Survival(t), 6), 'Yes']]} /></Block>;
}
export function PowerPlot({
  state
}) {
  const {
      se,
      effect,
      boundary,
      alternative
    } = state,
    domain = [-4 * se, effect + 4 * se],
    x = scale(...domain),
    max = normalDensity(0) / se * 1.15,
    y = v => 190 - v / max * 140;
  const regions = alternative === 'greater' ? [[boundary, domain[1]]] : [[domain[0], -boundary], [boundary, domain[1]]];
  const panels = [{
    mean: 0,
    title: 'Null sampling density / α',
    color: COMPARE
  }, {
    mean: effect,
    title: 'Alternative sampling density / power',
    color: SELECT
  }];
  return <div className="hf-pair">{panels.map(p => {
      const fn = v => normalDensity((v - p.mean) / se) / se;
      return <Drawing key={p.mean + '-' + p.title} title={p.title + ' per millisecond'} height={280}>{regions.map(([a, b], i) => <path key={i} d={area(fn, Math.max(a, domain[0]), Math.min(b, domain[1]), x, y, 190)} fill={p.color} opacity=".35" />)}<path d={curve(fn, ...domain, x, y)} stroke={INK} fill="none" strokeWidth="2" />{[boundary, ...(alternative === 'two-sided' ? [-boundary] : [])].map(v => <path key={v} d={`M${x(v)},45V190`} stroke={p.color} strokeDasharray="4 4" />)}<path d="M50,190V45" stroke={MUTED} /><text x="54" y="27">Density / ms</text><text x="44" y="55" textAnchor="end">{num(max, 2)}</text><Axis x={x} ticks={[domain[0], 0, effect, domain[1]].filter((v, i, a) => a.indexOf(v) === i)} y={190} label="Sample mean saving (ms)" /><text x="220" y="272" textAnchor="middle">{p.title}</text></Drawing>;
    })}</div>;
}
export function PowerRegionsFigure() {
  const s = plannedPowerState();
  return <Block id="power-regions" title="One rejection rule under two generating means" caption="Both panels share exact x/y scales and density per millisecond. The same right-side rule has null area α=.05 and alternative power .803765; β is the alternative area to the left. The finite picture omits tiny tails outside its axis; readouts use full Normal tails."><PowerPlot state={s} /><Table title="Prospective known-Normal plan" headers={['n', 'σ (ms)', 'Hypothetical δ (ms)', 'Cutoff (ms)', 'Power', 'β']} rows={[[s.n, s.sigma, s.effect, num(s.boundary, 6), num(s.power, 6), num(s.beta, 6)]]} /></Block>;
}
export function SampleSizeBoundaryFigure() {
  const rows = data.planningBoundary;
  return <Block id="sample-size-boundary" title="The target is crossed between two adjacent integer plans" caption="The hypothetical effect is .5 ms with known σ = 4, upper-tail α = .05 and target power .8. All 31 points are actual SciPy planning values. The separately labelled zoom changes both axes to make the adjacent integer boundary visible. The static range extends beyond the live n≤200 control.">{[[380, 410, .78, .82], [394, 397, .798, .802]].map(([a, b, c, d], i) => {
      const x = scale(a, b, 65, 390),
        y = v => 190 - (v - c) / (d - c) * 140,
        selected = rows.filter(r => r.n >= a && r.n <= b);
      return <Drawing key={i} title={`${i ? 'Zoom: ' : ''}power against n, y domain ${c} to ${d}`} height={270}><path d="M65,190V50" stroke={MUTED} />{[c, .8, d].map(v => <text key={v} x="59" y={y(v) + 5} textAnchor="end">{v}</text>)}<path d={`M65,${y(.8)}H390`} stroke={COMPARE} strokeDasharray="4 4" /><path d={selected.map((r, j) => `${j ? 'L' : 'M'}${x(r.n)},${y(r.power)}`).join(' ')} stroke={INK} fill="none" />{selected.map(r => <circle key={r.n} cx={x(r.n)} cy={y(r.power)} r={r.n === 395 || r.n === 396 ? 4 : 2} fill={r.n === 395 ? '#171716' : r.n === 396 ? SELECT : INK} stroke={INK} />)}<text x="55" y="25">{i ? 'Zoom / power' : 'Power'}</text><Axis x={x} ticks={i ? [394, 395, 396, 397] : [380, 390, 400, 410]} y={200} low={65} label="Planned independent n" /></Drawing>;
    })}<Table title="Check the integer and its predecessor" headers={['n', 'Power', 'At least .8?']} rows={rows.filter(r => r.n === 395 || r.n === 396).map(r => [r.n, num(r.power, 9), r.power >= .8 ? 'Yes' : 'No'])} /></Block>;
}
export function WilsonAcceptanceFigure() {
  const upper = proportionIntervals(0, 10).wilson[1],
    x = scale(0, 1),
    score = p => 10 * p * p - 1.959963984540054 ** 2 * p * (1 - p),
    y = v => 180 - 12 * v;
  return <Block id="wilson-acceptance" title="Invert a score inequality instead of a zero estimated spread" caption="This curve is the score polynomial, not a density. Candidate probabilities between its two roots have nonpositive score. For 0/10 the Wald interval is only {0}; score inversion accepts the whole segment up to .277533."><Drawing title="Score polynomial at observed 0 successes in 10 trials" height={265}><path d={area(score, 0, upper, x, y, 180)} fill={SELECT} opacity=".3" /><path d={curve(score, 0, 1, x, y)} stroke={INK} fill="none" strokeWidth="2" /><path d="M50,180H390M50,200V35" stroke={MUTED} />{[0, 5, 10].map(v => <text key={v} x="44" y={y(v) + 5} textAnchor="end">{v}</text>)}<circle cx={x(0)} cy="180" r="5" fill={SELECT} /><circle cx={x(upper)} cy="180" r="5" fill={SELECT} /><text x="60" y="25">Score polynomial</text><Axis x={x} ticks={[0, .2, .4, .6, .8, 1]} y={200} label="Candidate p₀" /></Drawing><Table title="Roots and their interval rules, 95%" headers={['Rule', 'Lower', 'Upper']} rows={[['Wald', 0, 0], ['Wilson score', 0, num(upper, 6)]]} /></Block>;
}
export function ExactBinomialTailsFigure() {
  const s = proportionIntervals(0, 10),
    p = s.exact[1],
    q = 1 - p;
  return <Block id="exact-binomial-tails" title="Solve endpoints using complete discrete tail events" caption="At the upper endpoint for 0/10, the selected K=0 bar has probability .025. At the lower endpoint for 10/10, the selected K=10 bar has probability .025. Inclusive discrete events and structural endpoints 0/1 are different parts of the rule."><div className="hf-pair"><Mass title="K under candidate upper p₀=.308497" rows={binomialMasses(10, p).map((mass, k) => ({
        value: k,
        mass,
        extreme: k === 0
      }))} ticks={[0, 2, 4, 6, 8, 10]} /><Mass title="K under candidate lower p₀=.691503" rows={binomialMasses(10, q).map((mass, k) => ({
        value: k,
        mass,
        extreme: k === 10
      }))} ticks={[0, 2, 4, 6, 8, 10]} /></div><Table title="Exact equal-tail 95% endpoint conditions" headers={['Observed count', 'Structural endpoint', 'Solved endpoint', 'Inclusive event mass']} rows={[[0, 'Lower = 0', `Upper = ${num(p, 6)}`, num((1 - p) ** 10, 6)], [10, 'Upper = 1', `Lower = ${num(q, 6)}`, num(q ** 10, 6)]]} /></Block>;
}
export function BinomialIntervalsPlot({
  n = 10,
  k = 0,
  level = 95
}) {
  const intervals = proportionIntervals(k, n, level);
  return <><Drawing title={`Actual ${k} successes and ${n - k} failures`} height={120} width={Math.max(440, n * 22 + 60)}>{Array.from({
        length: n
      }, (_, i) => <g key={i}><circle cx={30 + i * 22} cy="40" r="6" fill={i < k ? SELECT : 'none'} stroke={INK} /><text x={30 + i * 22} y="75" textAnchor="middle">{i < k ? 'S' : 'F'}</text></g>)}</Drawing><IntervalPlot rows={Object.entries(intervals).map(([name, [low, high]]) => ({
      label: name === 'exact' ? 'Clopper–Pearson' : name,
      low,
      high,
      mean: k / n,
      color: name === 'wilson' ? COMPARE : INK,
      dashed: name === 'wilson'
    }))} domain={[-.35, 1.35]} ticks={[0, .5, 1]} references={[0, 1]} label="Probability endpoints; Wald can leave [0,1]" /><Table title={`${level}% intervals for observed ${k}/${n}`} headers={['Method', 'Lower', 'Upper']} rows={Object.entries(intervals).map(([name, [low, high]]) => [name, num(low, 6), num(high, 6)])} /></>;
}
export function CountCoveragePlot({
  state
}) {
  const height = state.rows.length * 28 + 110,
    methods = ['wald', 'wilson', 'exact'];
  return <><Drawing title="Every possible count's interval and its probability weight" width={830} height={height}>{methods.map((method, j) => {
        const x = scale(-.35, 1.35, 45 + j * 205, 230 + j * 205);
        return <g key={method}><text x={135 + j * 205} y="24" textAnchor="middle">{method}</text><path d={`M${x(state.truth)},34V${height - 65}`} stroke={COMPARE} strokeDasharray="4 4" />{state.rows.map((row, i) => <g key={row.k}>{j === 0 && <text x="16" y={56 + i * 28} fill={row.k === state.observed ? SELECT : INK}>{row.k === state.observed ? '›' : ''}{row.k}</text>}<Interval x={x} low={row.intervals[method][0]} high={row.intervals[method][1]} mean={row.k / state.n} y={50 + i * 28} domain={[-.35, 1.35]} color={row.covers[method] ? SELECT : INK} dashed={!row.covers[method]} />{!row.covers[method] && <path d={`M${x(row.k / state.n) - 3},${47 + i * 28}l6,6m-6,0l6,-6`} stroke={INK} />}</g>)}<Axis x={x} ticks={[0, .5, 1]} y={height - 65} low={45 + j * 205} high={230 + j * 205} label="p endpoints" /></g>;
      })}<text x="745" y="24" textAnchor="middle">Count mass</text>{state.rows.map((row, i) => <rect key={row.k} x="680" y={42 + i * 28} width={row.mass * 125} height="15" fill={INK} />)}<path d={`M680,${height - 65}h125`} stroke={MUTED} />{[0, .5, 1].map(p => <text key={p} x={680 + 125 * p} y={height - 40} textAnchor="middle">{p}</text>)}</Drawing><Table title="Complete weighted membership; amber intervals contain the fixed truth" headers={['Count k', 'Mass P(K=k)', 'Wald covers?', 'Wilson covers?', 'Exact covers?']} maxHeight="24rem" rows={state.rows.map(row => [`${row.k}${row.k === state.observed ? ' (selected)' : ''}`, num(row.mass, 7), ...methods.map(m => row.covers[m] ? 'Yes' : 'No')])} /></>;
}
export function CountWeightedCoverageFigure() {
  const s = proportionCoverageState();
  return <Block id="count-weighted-coverage" title="Coverage adds event weights, rather than interval counts" caption="The fixed truth is p=.2, not the observed fraction 0/10. Each possible count has its own interval and binomial mass. Adding only masses whose intervals contain .2 gives Wald .886256, Wilson .967207 and exact .993631."><CountCoveragePlot state={s} /><Table title="Actual coverage under the declared hypothetical truth" headers={['Method', 'Probability of coverage']} rows={Object.entries(s.coverage).map(([m, p]) => [m, num(p, 6)])} /></Block>;
}
export function IndependentUnitsFigure() {
  return <Block id="independent-units" title="Repeated requests share the user's common fluctuation" caption="Five independent user effects each branch into 2000 requests; three request marks per user illustrate that repeated structure. Each user mean then receives weight 1/5. The marks are model entities, not recorded measurements. Repeats reduce the independent noise term while the common-effect variance floor survives.">
 <Drawing title="User effects enter repeated requests, then five user means enter the estimate" width={570} height={315}>
 {Array.from({
        length: 5
      }, (_, i) => {
        const x = 65 + i * 110;
        return <g key={i}><circle cx={x} cy="40" r="20" fill="none" stroke={INK} /><text x={x} y="45" textAnchor="middle">U{i + 1}</text>
 {[-1, 0, 1].map(j => <g key={j}><Arrow x1={x} y1={60} x2={x + j * 28} y2={95} /><circle cx={x + j * 28} cy="104" r="5" fill={INK} /><Arrow x1={x + j * 28} y1={111} x2={x} y2={157} /></g>)}
 <text x={x} y="15" textAnchor="middle">r=2000</text><circle cx={x} cy="177" r="19" fill="none" stroke={COMPARE} /><text x={x} y="183" textAnchor="middle">X̄{i + 1}</text>
 <Arrow x1={x} y1={201} x2={285} y2={268} /><text x={x} y="235" textAnchor="middle">1/5</text></g>;
      })}
 <circle cx="285" cy="289" r="17" fill="none" stroke={SELECT} /><text x="285" y="294" textAnchor="middle">X̄</text></Drawing>
 <Drawing title="Mean variance components: common floor 4 and independent .008 ms squared" height={215}><text x="50" y="27">Variance components (ms²)</text><rect x="50" y="53" width={320} height="24" fill={INK} opacity=".45" /><rect x="370" y="53" width={.008 / 4 * 320} height="24" fill={SELECT} /><path d="M50,86H390" stroke={MUTED} /><text x="50" y="108">0</text><text x="370" y="108" textAnchor="middle">4</text><text x="50" y="142">Shared: 20/5 = 4</text><text x="50" y="171">Within: 80/(5×2000) = .008</text><text x="50" y="203">Thin amber part: separate 500× zoom below</text></Drawing>
 <Drawing title="Separate 500 times horizontal zoom of the .008 within-user variance part" height={90}><rect x="50" y="18" width={.008 / 4 * 320 * 500} height="23" fill={SELECT} /><text x="50" y="73">500× zoom; unchanged .008 ms²</text></Drawing>
 <Table title="Actual information comparison; not a t degrees-of-freedom rule" headers={['Quantity', 'Value']} rows={[['Real mean variance (ms²)', 4.008], ['Real SE (ms)', num(Math.sqrt(4.008), 6)], ['Naive independent SE (ms)', .1], ['Variance-equivalent n', num(100 / 4.008, 4)]]} /></Block>;
}
export function FamilyUnionPlot({
  count = 20
}) {
  const chance = -Math.expm1(count * Math.log1p(-.05));
  return <><Drawing title={`Independent rejection-event accumulation across ${count} tests`} height={235}>{Array.from({
        length: Math.min(count, 8)
      }, (_, i) => <g key={i}><circle cx={50 + i * 47} cy="50" r="14" fill="none" stroke={INK} /><text x={50 + i * 47} y="55" textAnchor="middle">{i + 1}</text><Arrow x1={50 + i * 47} y1={66} x2={220} y2={114} /></g>)}<text x="220" y="143" textAnchor="middle">Any false rejection / union</text><path d="M50,178H390" stroke={MUTED} /><rect x="50" y="163" width={340 * chance} height="30" fill={SELECT} opacity=".55" /><text x="50" y="218">0</text><text x="390" y="218" textAnchor="end">1</text></Drawing><Table title={`All-null independent family with ${count} tests`} headers={['Single false-rejection probability', 'None reject', 'At least one rejects']} rows={[[.05, num((1 - .05) ** count, 6), num(chance, 6)]]} /></>;
}
export function FamilyUnionFigure() {
  return <Block id="family-union" title="The selected event is at least one false alarm" caption="The first eight event nodes illustrate the 20-test family; all 20 enter the product. Under independence the no-alarm probability is .95²⁰; its complement is.641514. The probability strip uses a literal 0–1 scale."><FamilyUnionPlot /></Block>;
}
const holm = [{
  id: 2,
  p: .001
}, {
  id: 4,
  p: .01
}, {
  id: 1,
  p: .04
}, {
  id: 5,
  p: .2
}, {
  id: 3,
  p: .8
}];
export function HolmStoppingFigure() {
  const x = scale(0, .85, 115, 390);
  return <Block id="holm-stopping" title="The ordered procedure stops at its first failed comparison" caption="Solid point: each actual sorted p-value. Open diamond: itsα/(remaining tests) threshold. The first two rows reject; row 3 stops. The later candidates do not restart the path, even if another threshold comparison might pass in some dataset."><Drawing title="Five p-values, their sorted metric IDs and exact Holm thresholds" height={295}>{holm.map((r, i) => {
        const y = 48 + i * 40,
          c = .05 / (5 - i);
        return <g key={r.id}><text x="15" y={y + 5}>ID {r.id}</text><path d={`M115,${y}H390`} stroke={MUTED} opacity=".5" /><circle cx={x(r.p)} cy={y} r="4.5" fill={i < 2 ? SELECT : INK} /><path d={`M${x(c)},${y - 6}l6,6l-6,6l-6,-6Z`} fill="none" stroke={COMPARE} /><text x="65" y={y + 5}>{i < 2 ? '✓' : i === 2 ? 'STOP' : '—'}</text>{i < 2 && <Arrow x1={86} y1={y + 9} x2={86} y2={y + 31} color={SELECT} />}</g>;
      })}<Axis x={x} ticks={[0, .2, .4, .6, .8]} y={235} low={115} high={390} label="p-value / threshold" /></Drawing><Table title="Original IDs retained after ordering" headers={['Rank', 'Metric ID', 'p', 'Threshold', 'Sequential outcome']} rows={holm.map((r, i) => [i + 1, r.id, r.p, num(.05 / (5 - i), 6), i < 2 ? 'Reject' : i === 2 ? 'Stop / non-rejection' : 'Not rejected after stop'])} /></Block>;
}
export function OptionalPlot({
  state
}) {
  const levels = Math.min(6, state.maximum),
    px = n => 48 + n * 55,
    py = (n, k) => 125 + (k - n / 2) * 29;
  return <><Drawing title={`Actual fair-coin prefix states through look ${levels}`} height={315}>{Array.from({
        length: levels
      }, (_, n) => Array.from({
        length: n + 1
      }, (_, k) => <g key={n + '-' + k}><path d={`M${px(n)},${py(n, k)}L${px(n + 1)},${py(n + 1, k)}M${px(n)},${py(n, k)}L${px(n + 1)},${py(n + 1, k + 1)}`} stroke={MUTED} /></g>))}{Array.from({
        length: levels + 1
      }, (_, n) => Array.from({
        length: n + 1
      }, (_, k) => {
        const extreme = n === 6 && (k === 0 || k === 6);
        return <g key={n + '-' + k}><circle cx={px(n)} cy={py(n, k)} r="4" fill={extreme ? SELECT : INK} />{n === levels && <text x={px(n) + 10} y={py(n, k) + 5}>{k}</text>}</g>;
      }))}<Axis x={px} ticks={Array.from({
        length: levels + 1
      }, (_, i) => i)} y={235} low={px(0)} high={px(levels)} label="Look n; right labels = heads" /></Drawing><Table title={`Complete weighted prefix states through look ${levels}`} headers={['Look n', 'Head count k', 'Prefix multiplicity C(n,k)', 'Prefix event mass']} maxHeight="24rem" rows={Array.from({
      length: levels + 1
    }, (_, n) => Array.from({
      length: n + 1
    }, (_, k) => {
      let count = 1;
      for (let j = 1; j <= k; j++) count = count * (n - j + 1) / j;
      return [n, k, Math.round(count), num(count / 2 ** n, 6)];
    })).flat()} /><Table title={`All first-hit prefix weights through maximum ${state.maximum}`} headers={['Look', 'First rejecting prefixes', 'Continuation count per prefix', 'First-hit paths at final horizon', 'Fixed-at-this-look final-population paths']} rows={state.rows.map(r => [r.n, r.firstRejectCount, 2 ** (state.maximum - r.n), r.firstRejectCount * 2 ** (state.maximum - r.n), r.fixedRejectCount * 2 ** (state.maximum - r.n)])} /><Drawing title="Same full final-path population, grouped by rejection membership" height={155}>{[['Stop by horizon', state.cumulativeError], ['Reject at final look', state.fixedError]].map(([label, p], i) => <g key={label}><text x="50" y={23 + i * 65}>{label}</text><rect x="50" y={33 + i * 65} width="340" height="17" fill="none" stroke={MUTED} /><rect x="50" y={33 + i * 65} width={340 * p} height="17" fill={i ? COMPARE : SELECT} /><text x="50" y={72 + i * 65}>0</text><text x="220" y={72 + i * 65} textAnchor="middle">{num(p, 6)}</text><text x="390" y={72 + i * 65} textAnchor="end">1</text></g>)}</Drawing></>;
}
export function OptionalLookPathsFigure() {
  return <Block id="optional-look-paths" title="Early hits count all of their complete-path continuations" caption="Every fork has probability 1/2; the diagram merges prefixes with the same head count. The selected first rejection appears at look 6. The table retains all later first-hit weights:128+96+66=290 of 4096 paths stop by 12; only 158 reject at the fixed final look. Both strips use the same 0–1 probability scale. The prefix table preserves the exact number of ordered histories at each merged node; the first-hit table separately counts only histories with no earlier rejection."><OptionalPlot state={optionalLooksState()} /></Block>;
}
export function WelchVarianceFigure() {
  const a = [10, 12, 9, 11, 14],
    b = [8, 13, 7, 10, 9, 15, 6],
    sa = sampleSummary(a),
    sb = sampleSummary(b),
    x = scale(5, 16);
  return <Block id="welch-variance" title="Two independent groups supply two separate mean variances" caption="There are five A observations and seven B observations, with no pair connectors. Each group keeps its own spread. The reference uses the approximate Satterthwaite degrees of freedom 9.793479; this does not manufacture matched units."><Drawing title="Separate independent measurements on one common value axis" height={245}>{[a, b].map((row, j) => <g key={j}><text x="24" y={59 + j * 75}>{j ? 'B' : 'A'}</text>{row.map((v, i) => <g key={i}><circle cx={x(v)} cy={55 + j * 75} r="4" fill={j ? COMPARE : INK} /><text x={x(v)} y={82 + j * 75} textAnchor="middle">{i + 1}</text></g>)}</g>)}<Axis x={x} ticks={[6, 8, 10, 12, 14, 16]} y={180} label="Measured response (same units)" /></Drawing><Drawing title="Group mean variance components add without a covariance subtraction" height={205}><rect x="50" y="30" width={sa.variance / a.length * 120} height="25" fill={INK} /><rect x={50 + sa.variance / a.length * 120} y="30" width={sb.variance / b.length * 120} height="25" fill={COMPARE} /><text x="50" y="84">A: s²/n = {num(sa.variance / a.length, 6)}</text><text x="50" y="117">B: s²/n = {num(sb.variance / b.length, 6)}</text><Axis x={v => 50 + v * 120} ticks={[0, 1, 2, 3]} y={140} low={50} high={410} label="Mean-variance contribution (response²)" /></Drawing><IntervalPlot rows={[{
      label: 'Approximate Welch 95%',
      mean: 1.4857142857142858,
      low: -1.866224,
      high: 4.837653
    }]} domain={[-3, 6]} ticks={[-3, 0, 3, 6]} label="Group-mean difference A−B" /></Block>;
}
export function BootstrapResamplingFigure() {
  const boot = data.bootstrap,
    ids = boot.selectedIndices;
  return <Block id="bootstrap-resampling" title="Source IDs can repeat while another source ID is omitted" caption="Five destination slots choose from the five empirical source records with replacement. The shown sample A,A,B,D,E gives mean 2.6 ms and omits C. Every one of 3125 ordered choices has weight 1/3125; the distribution aggregates choices with equal means."><Drawing title="Exact repeated and omitted source-index operations in one resample" width={490} height={205}>{'ABCDE'.split('').map((id, i) => <g key={id}><circle cx={65 + i * 87} cy="45" r="16" fill="none" stroke={i === 2 ? MUTED : INK} /><text x={65 + i * 87} y="50" textAnchor="middle">{id}</text></g>)}{ids.map((s, i) => <g key={i}><Arrow x1={65 + s * 87} y1={62} x2={65 + i * 87} y2={132} color={s === 0 ? SELECT : INK} /><circle cx={65 + i * 87} cy="148" r="16" fill="none" stroke={s === 0 ? SELECT : INK} /><text x={65 + i * 87} y="153" textAnchor="middle">{'ABCDE'[s]}</text><text x={65 + i * 87} y="190" textAnchor="middle">{PAIRED_DIFFERENCES[s]} ms</text></g>)}</Drawing><Mass rows={boot.histogram} keyName="mean" title="Empirical bootstrap mean (ms)" domain={[-1.2, 4.2]} ticks={[-1, 0, 1, 2, 3, 4]} highlight={r => r.mean >= boot.low && r.mean <= boot.high} /><Table title="Default linear percentile endpoints and distribution spread" headers={['Quantity', 'Value']} rows={[['Total ordered resamples', 3125], ['.025 index / interpolation', 78.1], ['.975 index / interpolation', 3045.9], ['95% percentile interval (ms)', '[.4,3.2]'], ['Bootstrap SD (ms)', num(boot.sd, 6)], ['Sample-mean SE (ms)', num(Math.sqrt(.7), 6)]]} /></Block>;
}
export function ObservedPairsPlot({
  person = 1,
  units = 'hours'
}) {
  const factor = units === 'minutes' ? 60 : 1,
    x = scale(-2 * factor, 6 * factor),
    d = scale(-.5 * factor, 5 * factor);
  return <><Drawing title={`All 10 actual matched sleep records in ${units}`} height={430}>{data.rows.map((r, i) => {
        const color = r.id === person ? SELECT : INK,
          y = 38 + i * 32;
        return <g key={r.id}><text x="22" y={y + 5}>{r.id}</text><path d={`M${x(r.drug1 * factor)},${y}H${x(r.drug2 * factor)}`} stroke={color} /><circle cx={x(r.drug1 * factor)} cy={y} r="4.5" fill={color} /><circle cx={x(r.drug2 * factor)} cy={y} r="4.5" fill="#171716" stroke={color} /></g>;
      })}<Axis x={x} ticks={[-2, 0, 2, 4, 6].map(v => v * factor)} y={360} label={`Extra sleep (${units}) / filled drug1`} /></Drawing><Drawing title={`Same 10 paired contrasts including ID 5's literal zero,${units}`} height={430}>{data.rows.map((r, i) => {
        const color = r.id === person ? SELECT : INK,
          y = 38 + i * 32;
        return <g key={r.id}><text x="22" y={y + 5}>{r.id}</text><path d={`M${d(0)},${y}H${d(r.difference * factor)}`} stroke={color} /><circle cx={d(r.difference * factor)} cy={y} r="4.5" fill={color} /></g>;
      })}<path d={`M${d(0)},20V348`} stroke={COMPARE} strokeDasharray="4 4" /><Axis x={d} ticks={[0, 1, 2, 3, 4, 5].map(v => v * factor)} y={360} label={`Drug2−drug1 (${units})`} /></Drawing></>;
}
export function ObservedPairCovarianceFigure() {
  const c = data.covariance,
    x = scale(-2, 6);
  // Only annotation positions move. Measured point coordinates remain exact.
  const labelledRows = drug => {
    const rows = [...data.rows].sort((a, b) => a['drug' + drug] - b['drug' + drug] || a.id - b.id);
    let previous = 26;
    return rows.map(row => {
      const labelX = Math.max(x(row['drug' + drug]), previous + 24);
      previous = labelX;
      return { row, labelX };
    });
  };
  return <Block id="observed-pair-covariance" title="The matched records retain a covariance the unpaired call discards" caption="The first view preserves person IDs and matching. The second retains the same 20 measured points, but deliberately removes the pair relationships. It is an assumption counterexample, not a valid second protocol. Separated ID labels and their leader lines do not move the measured points."><ObservedPairsPlot /><Drawing title="Same 20 source measurements in two separate groups, without pair connectors" height={315}>{[1, 2].map((drug, j) => <g key={drug}><text x="50" y={25 + j * 115}>Drug {drug} / separate group</text>{labelledRows(drug).map(({ row, labelX }) => <g key={row.id}><path d={`M${x(row['drug' + drug])},${69 + j * 115}L${labelX},${94 + j * 115}`} stroke={MUTED} fill="none" /><circle cx={x(row['drug' + drug])} cy={64 + j * 115} r="4" fill={INK} /><text x={labelX} y={110 + j * 115} textAnchor="middle">{row.id}</text></g>)}</g>)}<Axis x={x} ticks={[-2, 0, 2, 4, 6]} y={250} label="Original extra-hours measurement" /></Drawing><Table title="Actual matched covariance and the deliberate assumption change" headers={['Quantity', 'Value']} rows={[['Var(drug1)', num(c.firstVariance, 6)], ['Var(drug2)', num(c.secondVariance, 6)], ['Cov(drug1,drug2)', num(c.covariance, 6)], ['Var(drug2−drug1)', num(c.differenceVariance, 6)], ['Paired SE (hours)', num(data.paired.se, 6)], ['Wrong independent SE', num(c.unpairedSE, 6)], ['Paired two-sided p', num(data.paired.p, 6)], ['Deliberately unpaired Welch p', num(c.unpairedWelchP, 6)]]} /></Block>;
}
export function ObservedQuestionsFigure() {
  return <Block id="observed-questions" title="The same ten pairs can answer separately declared questions" caption="The95% interval compares0 and the illustrative1 hour criterion on one effect axis. The conditional sign distribution has 1024 labels, including both labels for the zero record; four are at least as extreme in absolute sum. That transformation null is stronger than a weak mean-zero claim."><IntervalPlot rows={[{
      label: 'Paired parameter 95% interval',
      mean: data.paired.mean,
      low: data.paired.low,
      high: data.paired.high
    }]} domain={[-.5, 3]} ticks={[0, 1, 2, 3]} references={[0, 1]} label="Mean drug2−drug1 (hours)" /><Mass rows={data.signs.histogram} keyName="mean" title="Conditional sign-assignment mean (hours)" domain={[-1.75, 1.75]} ticks={[-1.5, -1, 0, 1, 1.5]} /><Table title="Different null/alternative conditions, all 10 original IDs retained" headers={['Question / reference', 'Statistic', 'p / conditional mass']} rows={[['Parametric mean 0 / two-sided', num(data.paired.t, 6), num(data.paired.p, 6)], ['Sign-symmetric zero / |sum| tail', '4 of 1024', 4 / 1024], ['Illustrative mean ≤ 1 / greater', num(data.criterion1h.t, 6), num(data.criterion1h.p, 6)]]} /></Block>;
}
export function InferenceReportFigure() {
  return <Block id="inference-report" title="A reported interval traces back to its contrast and unit" caption="The estimate and interval belong to the five independent paired workload contrasts, under the stated model. The separate0 ms statistical and 1 ms practical references do not replace one another. Reporting retains the protocol and its limits, not just a p threshold."><Drawing title="Actual paired records connect to their estimate and uncertainty interval" height={245}>{PAIRED_DIFFERENCES.map((v, i) => <g key={i}><circle cx={55 + i * 80} cy="46" r="14" fill="none" stroke={INK} /><text x={55 + i * 80} y="51" textAnchor="middle">{'ABCDE'[i]}</text><text x={55 + i * 80} y="84" textAnchor="middle">{v} ms</text><Arrow x1={55 + i * 80} y1={92} x2={215} y2={137} /></g>)}<text x="215" y="167" textAnchor="middle">Five pairs → mean 2 / SE √.7</text><Arrow x1={215} y1={179} x2={215} y2={205} /></Drawing><IntervalPlot references={[0, 1]} rows={[{
      label: 'Two-sided 95% / mean saving',
      mean: 2,
      low: 2 - t4Quantile(.975) * Math.sqrt(.7),
      high: 2 + t4Quantile(.975) * Math.sqrt(.7)
    }]} /></Block>;
}
