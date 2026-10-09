import { useState } from 'react';
import { intervalCoverageState, predictionWidths, pairedTailState, practicalEffectState, plannedPowerState, proportionIntervals, proportionCoverageState, optionalLooksState, signFlipState, t4Density, inferenceNumber as num } from '../../data/hypothesis-testing-models.js';
import data from '../../data/hypothesis-testing-reading-flow-data.json';
import { INK, SELECT, COMPARE, MUTED, scale, Drawing, Block, Table, Axis, Arrow, Interval, Density, Mass } from './HypothesisTestingDrawings.jsx';
import { IntervalPlot, DatasetPlot, PowerPlot, BinomialIntervalsPlot, CountCoveragePlot, FamilyUnionPlot, OptionalPlot, ObservedPairsPlot } from './HypothesisTestingFigures.jsx';
function Range({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = ''
}) {
  return <label>{label}: <strong>{num(value, 3)}{unit}</strong><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} /></label>;
}
function Choice({
  label,
  value,
  onChange,
  options
}) {
  return <label>{label}<select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>{options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></label>;
}
function Readout({
  rows
}) {
  return <dl className="hf-readout" aria-live="polite">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
const levels = [[90, '90%'], [95, '95%'], [99, '99%']];
function CoveragePlot({
  state
}) {
  const x = scale(60, 140);
  return <><Drawing title={`All 40 ${state.varianceMode} variance confidence intervals against fixed truth 100 ms`} height={615}><path d={`M${x(100)},25V543`} stroke={COMPARE} strokeDasharray="5 4" />{state.intervals.map((r, i) => {
        const y = 35 + i * 13;
        return <g key={r.index}>{i % 5 === 0 && <text x="16" y={y + 5}>{r.index}</text>}<Interval x={x} low={r.low} high={r.high} mean={r.mean} y={y} domain={[60, 140]} color={r.covers ? SELECT : INK} dashed={!r.covers} />{!r.covers && <path d={`M${x(r.mean) - 3},${y - 3}l6,6m-6,0l6,-6`} stroke={INK} />}</g>;
      })}<Axis x={x} ticks={[60, 80, 100, 120, 140]} y={550} label="Interval endpoints (ms) / fixed truth 100" /></Drawing><Table title={`All 40 actual model-factorization intervals; batch ${state.batch}`} headers={['Experiment', 'Mean (ms)', 'SD used (ms)', 'SE (ms)', 'Lower', 'Upper', 'Contains 100?']} maxHeight="24rem" rows={state.intervals.map(r => [r.index, num(r.mean, 4), num(r.sd, 4), num(r.se, 4), num(r.low, 4), num(r.high, 4), r.covers ? 'Yes' : 'No'])} /></>;
}
function CoverageLab({
  estimated = false
}) {
  const [n, setN] = useState(25),
    [level, setLevel] = useState(95),
    [batch, setBatch] = useState(0),
    [mode, setMode] = useState(estimated ? 'estimated' : 'known');
  const s = intervalCoverageState(n, level, batch, mode),
    reset = () => {
      setN(25);
      setLevel(95);
      setBatch(0);
      setMode(estimated ? 'estimated' : 'known');
    };
  return <Block lab id={estimated ? 'estimated-coverage' : 'confidence-coverage'} title={estimated ? 'Compare estimated and known denominators on the same mean stream' : 'Forty experiments vary while the generating mean stays fixed'} caption={estimated ? 'Estimated widths use an independent χ² variance stream; choosing known σ preserves the means but changes the interval rule. These are exact Normal-model factorization draws, not 40 saved raw datasets.' : 'Here σ=10 ms is known and μ=100 ms is the fixed generating mean. Solid amber intervals contain that truth; crossed dashed intervals miss. The seeded finite fraction need not equal the procedure target.'}><CoveragePlot state={s} /><div className="hf-controls"><Range label={estimated ? 'Estimated coverage sample size' : 'Coverage sample size'} value={n} onChange={setN} min={5} max={100} step={5} /><Choice label={estimated ? 'Estimated coverage confidence' : 'Coverage confidence'} value={level} onChange={v => setLevel(Number(v))} options={levels} />{estimated && <Choice label="Coverage variance rule" value={mode} onChange={setMode} options={[['estimated', 'Estimated SD / t interval'], ['known', 'Known σ / z interval']]} />}<button type="button" onClick={() => setBatch(b => Math.min(1000000, b + 1))} disabled={batch === 1000000}>New batch</button><button type="button" onClick={reset}>Reset {estimated ? 'estimated coverage' : 'coverage'}</button></div><Readout rows={[['This finite batch', `${s.covered}/40 contain 100 (${(s.covered * 2.5).toFixed(1)}%)`], ['Procedure target', `${level}% under the stated model`], ['Critical multiplier', `${num(s.critical, 6)}${mode === 'estimated' ? `; df=${n - 1}` : ''}`], ['Generating mean / known SD', '100 ms / 10 ms']]} /></Block>;
}
export function ConfidenceCoverageLab() {
  return <CoverageLab />;
}
export function EstimatedCoverageLab() {
  return <CoverageLab estimated />;
}
export function MeanPredictionLab() {
  const [n, setN] = useState(25),
    [level, setLevel] = useState(95),
    s = predictionWidths(n, level);
  return <Block lab id="mean-prediction" title="More observations narrow the mean rule, while future noise remains" caption="Both interval constructions stay centered on the illustrative observed mean 100 ms, with known population SD 10 ms. They share one fixed scale; the future interval includes fresh observation noise. An arrow marks an endpoint beyond the plotted75–125 ms domain."><IntervalPlot rows={[{
      label: `${level}% confidence / mean`,
      mean: 100,
      low: 100 - s.meanHalfWidth,
      high: 100 + s.meanHalfWidth
    }, {
      label: `${level}% prediction / next reading`,
      mean: 100,
      low: 100 - s.predictionHalfWidth,
      high: 100 + s.predictionHalfWidth,
      color: COMPARE,
      dashed: true
    }]} domain={[75, 125]} ticks={[75, 85, 100, 115, 125]} references={[100]} label="Interval-rule endpoints (ms)" /><div className="hf-controls"><Range label="Prediction sample size" value={n} onChange={setN} min={5} max={100} /><Choice label="Prediction confidence" value={level} onChange={v => setLevel(Number(v))} options={levels} /><button type="button" onClick={() => {
        setN(25);
        setLevel(95);
      }}>Reset prediction</button></div><Readout rows={[['Mean half-width (ms)', num(s.meanHalfWidth, 6)], ['Next-reading half-width (ms)', num(s.predictionHalfWidth, 6)], ['Mean variance (ms²)', num(100 / n, 6)], ['Future-reading variance (ms²)', num(100 + 100 / n, 6)]]} /></Block>;
}
export function NullTailLab() {
  const [alternative, setAlternative] = useState('two-sided'),
    [reference, setReference] = useState(0),
    [shift, setShift] = useState(0),
    [spread, setSpread] = useState(1),
    [confidence, setConfidence] = useState(95);
  const s = pairedTailState({
      alternative,
      reference,
      shift,
      spread,
      alpha: (100 - confidence) / 100
    }),
    threshold = Math.abs(s.t);
  const regions = alternative === 'two-sided' ? [[-Infinity, -threshold, SELECT], [threshold, Infinity, SELECT]] : alternative === 'greater' ? [[s.t, Infinity, SELECT]] : [[-Infinity, s.t, SELECT]];
  const reset = () => {
    setAlternative('two-sided');
    setReference(0);
    setShift(0);
    setSpread(1);
    setConfidence(95);
  };
  return <Block lab id="null-tail" title="Move a declared null reference and inspect its tail event" caption="The density is Student t₄, the area is probability and the coordinate is dimensionless. The five data contrasts are shown separately in milliseconds. A boundary arrow means the observed statistic is outside −8–8; its exact readout includes the full tail beyond the picture."><DatasetPlot values={s.values} /><Density fn={t4Density} domain={[-8, 8]} ticks={[-8, -4, 0, 4, 8]} regions={regions} reference={s.t} label="Standardized t / Student t₄" /><IntervalPlot rows={[{
      label: `Matching ${confidence}% ${alternative} set`,
      mean: s.mean,
      low: s.low,
      high: s.high
    }]} domain={[-8, 10]} ticks={[-8, -4, 0, 4, 8]} references={[reference]} /><div className="hf-controls"><Choice label="Test alternative" value={alternative} onChange={setAlternative} options={[['two-sided', 'Two-sided / μ≠μ₀'], ['greater', 'Upper tail / μ>μ₀'], ['less', 'Lower tail / μ<μ₀']]} /><Range label="Null reference" value={reference} onChange={setReference} min={-1} max={2} step={.25} unit=" ms" /><button type="button" onClick={reset}>Reset null tail</button></div><fieldset className="hf-advanced"><legend>Already defined data transformations and matched confidence</legend><div className="hf-controls"><Range label="Mean shift" value={shift} onChange={setShift} min={-2} max={3} step={.25} unit=" ms" /><Range label="Spread multiplier" value={spread} onChange={setSpread} min={.25} max={2} step={.25} /><Choice label="Matched confidence" value={confidence} onChange={v => setConfidence(Number(v))} options={levels} /></div></fieldset><Readout rows={[['Mean / SE (ms)', `${num(s.mean, 6)} / ${num(s.se, 6)}`], ['Observed t / df', `${num(s.t, 6)} / 4`], ['Selected tail probability p', num(s.p, 9)], ['Declared α', s.alpha], ['Matching interval (ms)', `[${num(s.low, 6)}, ${num(s.high, 6)}]`], ['Strict decision p<α', s.reject ? 'Reject this null' : 'Do not reject this null']]} /></Block>;
}
export function PracticalEffectLab() {
  const [preset, setPreset] = useState('original'),
    [tolerance, setTolerance] = useState(.5),
    s = practicalEffectState(preset, tolerance);
  return <Block lab id="practical-effect" title="The effect's location and spread meet two separate tolerance bounds" caption="Dashed references mark −Δ,0,+Δ. The90% interval corresponds to two one-sided α=.05 tests; its endpoints must lie strictly inside the tolerance band. The95% interval answers the separate two-sided zero question."><DatasetPlot values={s.values} /><IntervalPlot rows={[{
      label: '90% / equivalence geometry',
      mean: s.mean,
      low: s.low90,
      high: s.high90,
      color: SELECT
    }, {
      label: '95% / two-sided zero question',
      mean: s.mean,
      low: s.low95,
      high: s.high95,
      dashed: true,
      color: COMPARE
    }]} domain={[-5, 7]} ticks={[-4, -2, 0, 2, 4, 6]} references={[-tolerance, 0, tolerance]} /><div className="hf-controls"><Choice label="Effect dataset" value={preset} onChange={setPreset} options={[['original', 'Original contrasts'], ['shifted', 'Every saving  +1 ms'], ['centered', 'Mean zero / original spread'], ['precise', 'Mean zero / quarter spread']]} /><Range label="Equivalence tolerance Δ" value={tolerance} onChange={setTolerance} min={.25} max={2} step={.25} unit=" ms" /><button type="button" onClick={() => {
        setPreset('original');
        setTolerance(.5);
      }}>Reset practical effect</button></div><Readout rows={[['Lower-bound test p', num(s.lowerP, 6)], ['Upper-bound test p', num(s.upperP, 6)], ['Equivalence p / max of both', num(s.equivalenceP, 6)], ['Both strict tests reject?', s.equivalent ? 'Yes / model supports equivalence' : 'No / equivalence not established'], ['Two-sided zero-effect p', num(s.pZero, 6)], ['Greater-than1 ms p', num(s.pUseful, 6)]]} /></Block>;
}
export function PlannedPowerLab() {
  const [n, setN] = useState(25),
    [sigma, setSigma] = useState(4),
    [effect, setEffect] = useState(2),
    [alpha, setAlpha] = useState(.05),
    [alternative, setAlternative] = useState('greater'),
    s = plannedPowerState(n, sigma, effect, alpha, alternative);
  const reset = () => {
    setN(25);
    setSigma(4);
    setEffect(2);
    setAlpha(.05);
    setAlternative('greater');
  };
  return <Block lab id="planned-power" title="Plan using an effect before observing a study" caption="The null and hypothetical alternative panels share exact axes and density units per millisecond. Right and left power are both retained for a two-sided rule. Changing the plan changes a prospective sampling model; it does not estimate an observed effect's post-hoc power."><PowerPlot state={s} /><div className="hf-controls"><Range label="Planned independent n" value={n} onChange={setN} min={5} max={200} /><button type="button" onClick={reset}>Reset power plan</button></div><fieldset className="hf-advanced"><legend>Known noise, hypothetical effect and predeclared rejection rule</legend><div className="hf-controls"><Range label="Known population SD" value={sigma} onChange={setSigma} min={2} max={10} step={.5} unit=" ms" /><Range label="Hypothetical effect" value={effect} onChange={setEffect} min={0} max={4} step={.25} unit=" ms" /><Choice label="Planning significance α" value={alpha} onChange={v => setAlpha(Number(v))} options={[[.01, '.01'], [.05, '.05'], [.1, '.10']]} /><Choice label="Planning alternative" value={alternative} onChange={setAlternative} options={[['greater', 'Upper tail'], ['two-sided', 'Two-sided / both tails']]} /></div></fieldset><Readout rows={[['Mean SE (ms)', num(s.se, 6)], ['Right cutoff (ms)', num(s.boundary, 6)], ['Right-tail power', num(s.rightPower, 9)], ['Left-tail power', num(s.leftPower, 9)], ['Total power', num(s.power, 9)], ['β / failure to reject', num(s.beta, 9)]]} /></Block>;
}
export function ProportionIntervalLab() {
  const [n, setN] = useState(10),
    [k, setK] = useState(0),
    [level, setLevel] = useState(95),
    s = proportionIntervals(k, n, level);
  return <Block lab id="proportion-interval" title="The observed count determines each interval rule" caption="Filled S marks are observed successes; open F marks are failures. All methods use the same count and confidence level. Wald endpoints outside [0,1] remain visible as outputs of that rule, rather than being silently converted into valid probability bounds."><BinomialIntervalsPlot n={n} k={k} level={level} /><div className="hf-controls"><Range label="Observed binomial successes" value={k} onChange={setK} min={0} max={n} /><Range label="Binomial sample size" value={n} onChange={v => {
        setN(v);
        setK(a => Math.min(a, v));
      }} min={5} max={20} /><Choice label="Binomial confidence" value={level} onChange={v => setLevel(Number(v))} options={levels} /><button type="button" onClick={() => {
        setN(10);
        setK(0);
        setLevel(95);
      }}>Reset binomial interval</button></div><Readout rows={[['Observed fraction', `${k}/${n} = ${num(k / n, 6)}`], ['Wilson width', num(s.wilson[1] - s.wilson[0], 6)], ['Exact width', num(s.exact[1] - s.exact[0], 6)]]} /></Block>;
}
export function ProportionCoverageLab() {
  const [n, setN] = useState(10),
    [truth, setTruth] = useState(.2),
    [observed, setObserved] = useState(0),
    s = proportionCoverageState(n, observed, truth);
  return <Block lab id="proportion-coverage" title="Hypothetical truth determines repeated-experiment coverage" caption="The dashed truth line is separate from the realized selected count. A › marker and the selected-row label identify that count without changing which intervals contain the truth. Every possible count retains its mass and interval-membership condition. Nominal confidence stays 95%; coverage adds probability weights, not the number of containing intervals."><CountCoveragePlot state={s} /><div className="hf-controls"><Range label="Coverage binomial n" value={n} onChange={v => {
        setN(v);
        setObserved(k => Math.min(k, v));
      }} min={5} max={20} /><Range label="Hypothetical success truth" value={truth} onChange={setTruth} min={0} max={1} step={.01} /><button type="button" onClick={() => {
        setN(10);
        setTruth(.2);
        setObserved(0);
      }}>Reset binomial coverage</button></div><fieldset className="hf-advanced"><legend>Compare the already defined realized count separately</legend><div className="hf-controls"><Range label="Selected realized count" value={observed} onChange={setObserved} min={0} max={n} /></div></fieldset><Readout rows={[['Wald coverage', num(s.coverage.wald, 9)], ['Wilson coverage', num(s.coverage.wilson, 9)], ['Clopper–Pearson coverage', num(s.coverage.exact, 9)], ['Selected realized count', `${observed}/${n}; it does not set the hypothetical truth`], ['Its Wilson interval', `[${num(s.current.intervals.wilson[0], 6)}, ${num(s.current.intervals.wilson[1], 6)}]`], ['Its exact interval', `[${num(s.current.intervals.exact[0], 6)}, ${num(s.current.intervals.exact[1], 6)}]`]]} /></Block>;
}
export function MultipleChancesLab() {
  const [count, setCount] = useState(20),
    risk = -Math.expm1(count * Math.log1p(-.05));
  return <Block lab id="multiple-chances" title="One fixed look at an independent all-null family" caption={`The first ${Math.min(count, 8)} nodes illustrate the family; all ${count} tests enter the product. This laboratory changes simultaneous multiplicity, not repeated looks. The single-test α stays .05.`}><FamilyUnionPlot count={count} /><div className="hf-controls"><Range label="Simultaneous independent tests" value={count} onChange={setCount} min={1} max={100} /><button type="button" onClick={() => setCount(20)}>Reset family</button></div><Readout rows={[['At least one false alarm', num(risk, 9)], ['Bonferroni per-test level', num(.05 / count, 9)], ['Union-bound family guarantee with valid p-values', 'At most .05; no independence required for that bound']]} /></Block>;
}
export function OptionalLookLab() {
  const [maximum, setMaximum] = useState(12),
    s = optionalLooksState(maximum);
  return <Block lab id="optional-looks" title="A stopping rule changes the event counted" caption={`Each full length ${maximum} fair-coin path has probability 1/${2 ** maximum}. The prefix picture goes through the earlier of look 6 and the current horizon; the table carries every first-hit prefix and all of its final-horizon continuations. Strict p<.05 is fixed.`}><OptionalPlot state={s} /><div className="hf-controls"><Range label="Maximum fair-coin looks" value={maximum} onChange={setMaximum} min={1} max={12} /><button type="button" onClick={() => setMaximum(12)}>Reset repeated looks</button></div><Readout rows={[['Full equal-weight paths', 2 ** maximum], ['Stop-by-horizon rejected paths', Math.round(s.cumulativeError * 2 ** maximum)], ['Fixed-final rejected paths', Math.round(s.fixedError * 2 ** maximum)], ['Stop-by-horizon probability', num(s.cumulativeError, 9)], ['Fixed-final probability', num(s.fixedError, 9)]]} /></Block>;
}
export function SignFlipLab() {
  const [preset, setPreset] = useState('original'),
    [mask, setMask] = useState(0),
    s = signFlipState(preset, mask),
    x = scale(-4, 4);
  return <Block lab id="sign-flip" title="Select one transformation without moving the observed reference" caption="The assignment applies a ± multiplier to each original contrast. All 32 labels remain in the conditional reference, even when zero creates duplicate values. Amber histogram masses satisfy the inclusive absolute-sum event. A justified symmetry/randomization null is required."><Drawing title="Five selected transformed contrasts and their source IDs" height={250}>{s.current.transformed.map((v, i) => <g key={i}><text x="24" y={43 + i * 29}>{'ABCDE'[i]}</text><path d={`M${x(0)},${39 + i * 29}H${x(v)}`} stroke={INK} /><circle cx={x(v)} cy={39 + i * 29} r="4" fill={SELECT} /><text x={x(v) + 8} y={31 + i * 29}>{num(v)}</text></g>)}<Axis x={x} ticks={[-4, -2, 0, 2, 4]} y={185} label="Selected null contrasts (ms)" /></Drawing><Mass rows={s.histogram.map(r => ({
      ...r,
      mass: r.count / 32
    }))} keyName="mean" title="All 32 conditional assignment means (ms)" domain={[-2.5, 2.5]} ticks={[-2, -1, 0, 1, 2]} /><div className="hf-controls"><Range label="Selected sign assignment" value={mask} onChange={setMask} min={0} max={31} /><Choice label="Sign dataset" value={preset} onChange={setPreset} options={[['original', 'Original contrasts'], ['allPositive', 'Five positive ones'], ['centered', 'Exact centered contrasts / two zeros']]} /><button type="button" onClick={() => {
        setPreset('original');
        setMask(0);
      }}>Reset signs</button></div><Readout rows={[['Selected null sum / mean', `${num(s.current.sum)} / ${num(s.current.mean)}`], ['Fixed observed sum / mean', `${num(s.observedSum)} / ${num(s.observedMean)}`], ['Inclusive extreme labels', `${s.extremeCount}/32`], ['Exact conditional p', s.p]]} /><Table title="All 32 labelled assignments; repeats retain multiplicity" headers={['Mask', 'Multipliers A–E', 'Transformed A–E', 'Sum', 'Tail membership']} maxHeight="24rem" rows={s.assignments.map(r => [r.mask, r.signs.join(', '), r.transformed.join(', '), r.sum, r.extreme ? 'At least as extreme' : 'Not in tail'])} /></Block>;
}
export function ObservedSleepPairsLab() {
  const [person, setPerson] = useState(1),
    [units, setUnits] = useState('hours'),
    factor = units === 'minutes' ? 60 : 1,
    s = data.paired,
    r = data.rows[person - 1];
  return <Block lab id="observed-sleep-pairs" title="Highlight one source ID while retaining all ten matched records" caption="Filled points are drug1; open points are drug2. Amber highlights the selected source identity, not a selected fitting subset. Switching units multiplies measurements, mean, SE and endpoints by 60 while leaving t and p unchanged. Source documentation does not establish random order or representative sampling."><ObservedPairsPlot person={person} units={units} /><div className="hf-controls"><Range label="Highlighted sleep person" value={person} onChange={setPerson} min={1} max={10} /><Choice label="Sleep measurement units" value={units} onChange={setUnits} options={[['hours', 'Hours'], ['minutes', 'Minutes']]} /><button type="button" onClick={() => {
        setPerson(1);
        setUnits('hours');
      }}>Reset observed pairs</button></div><Readout rows={[['All records in analysis', '10 matched people / df 9'], ['Selected source contrast', `${num(r.drug2 * factor)} − ${num(r.drug1 * factor)} = ${num(r.difference * factor)} ${units}`], ['Mean / SE', `${num(s.mean * factor, 6)} / ${num(s.se * factor, 6)} ${units}`], ['Paired 95% interval', `[${num(s.low * factor, 6)}, ${num(s.high * factor, 6)}] ${units}`], ['Unchanged t', num(s.t, 6)], ['Unchanged two-sided p', num(s.p, 9)]]} /><Table title={`All exact paired source records, ${units}`} headers={['R source ID', 'Drug1', 'Drug2', 'Drug2−drug1']} maxHeight="24rem" rows={data.rows.map(row => [`${row.id}${row.id === person ? ' (highlighted)' : ''}`, num(row.drug1 * factor, 6), num(row.drug2 * factor, 6), num(row.difference * factor, 6)])} /></Block>;
}
