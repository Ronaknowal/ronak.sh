import React, { useState } from 'react';
import { saved, comparison } from './saved-data.js';
import { Figure, Panels, Matrix, Bars, Plot, Point, Controls, Range, Select, Result, Table, colors } from './Drawing.jsx';
import { fmt } from './nmf-model.js';
export function savedRow(source) {
  const i = saved.test.findIndex(r => r.sourceRow === Number(source));
  if (i < 0) throw Error('Unknown saved source ID');
  const row = saved.test[i],
    w = saved.activations[i],
    parts = saved.dictionary.map((h, c) => h.map(v => v * w[c])),
    prediction = Array.from({
      length: 64
    }, (_, j) => parts.reduce((s, p) => s + p[j], 0));
  return {
    row,
    w,
    parts,
    prediction,
    observed: row.pixels.map(v => v / 16)
  };
}
const mse = (a, b) => a.reduce((s, v, j) => s + (v - b[j]) ** 2, 0) / a.length;
export function Pixels({
  values,
  label,
  min = 0,
  max = 4,
  signed = false,
  selected,
  component
}) {
  if (values.some(v => !Number.isFinite(v) || v < min - 1e-10 || v > max + 1e-10)) throw Error(`Image outside declared ruler: ${label}`);
  return <figure className="nmf-image"><p className="nmf-object-label" style={component !== undefined ? {
      color: colors[component]
    } : undefined}>{label}</p><div className="nmf-pixels" role="group" aria-label={`${label}; eight rows, eight columns; feature index8r+c`} tabIndex={0}>{values.map((v, j) => {
        const fraction = (v - min) / (max - min),
          grey = Math.round(12 + 230 * fraction),
          background = signed ? v < 0 ? `color-mix(in srgb, #ee8faf ${100 * Math.abs(v) / Math.abs(min)}%, #101923)` : `color-mix(in srgb, #7bb7ff ${100 * v / max}%, #101923)` : `rgb(${grey},${grey},${grey})`;
        return <span key={j} role="img" aria-label={`row${Math.floor(j / 8)}, column${j % 8}, F${j}: ${v}`} title={`r${Math.floor(j / 8)} c${j % 8} F${j}: ${v}`} style={{
          background,
          outline: selected === j ? '2px solid white' : undefined,
          outlineOffset: '-2px'
        }} />;
      })}</div><div className="nmf-pixel-ruler" role="img" aria-label={`Shared intensity ruler ${min} to ${max}; zero at ${100 * (0 - min) / (max - min)} percent`} style={{
      background: signed ? 'linear-gradient(to right,#ee8faf,#101923 50%,#7bb7ff)' : 'linear-gradient(to right,rgb(12,12,12),rgb(242,242,242))'
    }}><span className="nmf-ruler-min">{min}</span>{min < 0 && <span className="nmf-ruler-zero" style={{
        left: `${100 * (0 - min) / (max - min)}%`
      }}>0</span>}<span className="nmf-ruler-max">{max}</span></div><figcaption>Intensity ruler {min} → {max}{min < 0 ? ' · zero separates negative and positive values' : ''}. {signed ? 'Rose negative; blue positive.' : 'Dark low, light high.'}</figcaption></figure>;
}
export function Dictionary() {
  return <Figure id="D42" caption="The original saved k8/seed19 dictionary contains eight complete64-bin patterns, trained on180 rows. Each panel has the same0–4 per-unit pattern ruler. C1–C8 are display IDs for these eight stored rows, with no semantic source label."><div className="nmf-image-grid">{saved.dictionary.map((h, c) => <Pixels key={c} label={`C${c + 1} · original saved pattern`} values={h} component={c} />)}</div></Figure>;
}
export function SavedContribution() {
  const [source, setSource] = useState('242'),
    [component, setComponent] = useState('0'),
    [gain, setGain] = useState(1),
    s = savedRow(source),
    c = Number(component),
    part = s.parts[c].map(v => v * gain),
    other = s.prediction.map((v, j) => v - s.parts[c][j]),
    prediction = other.map((v, j) => v + part[j]),
    residual = s.observed.map((v, j) => v - prediction[j]);
  return <Figure id="D43" caption="The complete contribution is amount × all64 pattern bins. Gain changes only this saved amount; all other addends stay fixed. This is an intervention in a recorded decomposition, without refitting."><div className="nmf-image-grid"><Pixels label={`Source${source} · observed digit${s.row.digit}`} values={s.observed} /><Pixels label={`C${c + 1} · per-unit pattern`} values={saved.dictionary[c]} component={c} /><Pixels label={`C${c + 1} · weighted addend`} values={part} component={c} /><Pixels label="Current complete reconstruction" values={prediction} /><Pixels label="Observed minus reconstruction" values={residual} min={-4} max={4} signed /></div><Bars label="Original saved amounts · stable component IDs" values={s.w} ids={s.w.map((_, i) => `C${i + 1}`)} component max={1} /><Controls onReset={() => {
      setSource('242');
      setComponent('0');
      setGain(1);
    }}><Select label="Saved source ID" value={source} onChange={setSource} options={['242', '256']} /><Select label="Component" value={component} onChange={setComponent} options={s.w.map((_, i) => ({
        value: String(i),
        label: `C${i + 1}`
      }))} /><Range label="Selected amount gain" value={gain} onChange={setGain} max={2} step={.1} /></Controls><Result>Source{source}, C{c + 1}: original amount {fmt(s.w[c])}, edited amount {fmt(gain * s.w[c])}, contribution sum {fmt(part.reduce((a, b) => a + b, 0))}, MSE {fmt(mse(s.observed, prediction))}. {s.w[c] === 0 ? 'This saved amount is zero; its intervention remains a genuine zero-change case.' : gain === 0 ? 'Only the selected complete addend is removed.' : 'No fit or other amount changes.'}</Result></Figure>;
}
export function SavedRanking() {
  const s = savedRow(256),
    totals = s.parts.map(p => p.reduce((a, b) => a + b, 0)),
    maxTotal = Math.max(...totals);
  return <Figure id="D44" caption="Source256 has largest raw coefficient C7 but largest total contributed intensity C8. Per-bin addends, rather than coefficients alone, determine the image. Sixteen of the60 reserved rows have different rankings."><Panels><Bars label="Saved amounts · factor units" values={s.w} ids={s.w.map((_, i) => `C${i + 1}`)} component max={1} /><Bars label="Total addend intensity · summed64 bins" values={totals} ids={s.w.map((_, i) => `C${i + 1}`)} component max={8} /><Pixels label="C7 weighted pattern" values={s.parts[6]} component={6} /><Pixels label="C8 weighted pattern" values={s.parts[7]} component={7} /></Panels><Table caption="Exact saved ranking values" headers={['Component', 'Amount', 'Total intensity']} rows={s.w.map((v, i) => [`C${i + 1}`, v, totals[i]])} /></Figure>;
}
export function Removal() {
  const [gain, setGain] = useState(1),
    s = savedRow(256),
    part = s.parts[7],
    current = s.prediction.map((v, j) => v + (gain - 1) * part[j]);
  return <Figure id="D45" caption="Remove or restore the complete C8 addend from source256 with all other amounts fixed. This is the displayed decomposition's counterfactual, not retraining. Source242's saved C8 amount is zero, so its analogous removal changes nothing."><div className="nmf-image-grid"><Pixels label="Source256 observed" values={s.observed} /><Pixels label="Original saved reconstruction" values={s.prediction} /><Pixels label="C8 complete addend" values={part} component={7} /><Pixels label="Current reconstruction" values={current} /><Pixels label="Current signed residual" values={s.observed.map((v, j) => v - current[j])} min={-4} max={4} signed /></div><Controls onReset={() => setGain(1)}><Range label="Retained fraction of C8 amount" value={gain} onChange={setGain} max={1} step={.1} /></Controls><Result>Gain {fmt(gain)}; MSE {mse(s.observed, current)}. Original {mse(s.observed, s.prediction)}; removed {mse(s.observed, s.prediction.map((v, j) => v - part[j]))}. Removed total intensity {fmt((1 - gain) * part.reduce((a, b) => a + b, 0))}.</Result></Figure>;
}
export function Partitions() {
  return <Figure id="D46" caption="Source IDs and digit labels are metadata, separate from64 fitting columns. The known/16 measurement ruler is fixed. Only training rows fit dictionaries; validation compares candidates and reserved rows use frozen transforms. No writer IDs are supplied."><Panels><Matrix label="Reserved metadata · never fitting features" values={[[242, 8], [256, 0]]} columns={['Source ID', 'Digit label']} /><Matrix label="Reserved fitting features · all64 pixel columns" values={saved.test.slice(0, 2).map(r => r.pixels.map(v => v / 16))} rows={['Source242', 'Source256']} /><div><p>180 training rows → dictionary fit</p><p>60 validation rows → frozen dictionary transform → candidate comparison</p><p>60 reserved rows → frozen dictionary transform → final descriptive evaluation</p><p>Original inspection k8/seed19; minimum recorded validation k16/seed7.</p></div></Panels>{Object.entries(comparison.sourceIDs).map(([role, ids]) => <div key={role}><p className="nmf-object-label">Complete {role} source IDs · {ids.length} rows</p><p>{ids.join(', ')}</p></div>)}</Figure>;
}
export function Candidates() {
  return <Figure id="D47" caption="Every recorded training/validation pair is shown without interpolated fits or error bars. Seed7 uses circles, seed19 diamonds; blue training and rose validation share a zero-origin0–.08 MSE ruler. Validation minimum16/7 and inspectable8/19 are different roles."><Plot label="All eight recorded candidates" xmax={16} xticks={[1, 4, 8, 16]} ymax={.08} xlabel="component count k" ylabel="MSE">{map => <>{saved.runs.flatMap(r => [['trainMse', colors[0]], ['validationMse', colors[1]]].map(([key, color]) => {
          const p = map([r.k, r[key]]);
          return r.seed === 7 ? <circle key={r.k + key + r.seed} cx={p[0]} cy={p[1]} r="4" fill={color}><title>{`k${r.k} seed${r.seed} ${key} ${r[key]}`}</title></circle> : <path key={r.k + key + r.seed} d={`M${p[0]} ${p[1] - 5}l5 5l-5 5l-5-5Z`} fill="none" stroke={color}><title>{`k${r.k} seed${r.seed} ${key} ${r[key]}`}</title></path>;
        }))}</>}</Plot><p>Direct mark identities: {saved.runs.map(r => `${r.seed === 7 ? '○' : '◇'} k${r.k}/seed${r.seed}`).join('; ')}. Validation minimum is ○ k16/seed7; fixed inspection is ◇ k8/seed19. Near-identical runs overlap at their actual coordinates.</p><Table caption="All recorded candidate values and iteration counts" headers={['k', 'Seed', 'Training MSE', 'Validation MSE', 'Iterations']} rows={saved.runs.map(r => [r.k, r.seed, r.trainMse, r.validationMse, r.iterations])} /></Figure>;
}
export function MatchedComparison() {
  return <Figure id="D48" caption="Original eight-component aggregate errors stay separate from this new predeclared rank6/seed23 comparison. New images are literal recorded predictions for source242/256, with the same signed−.25…1.25 ruler and no clipping. No historical PCA8 factors are fabricated."><Bars label="Original reserved means · k8 comparison · MSE0–.08" values={[saved.baselines.meanTestMse, saved.baselines.pcaTestMse, saved.baselines.nmfTestMse]} ids={['Mean', 'PCA8', 'NMF8']} max={.08} /><Table caption="Original aggregate MSE" headers={['Representation', 'MSE']} rows={Object.entries(saved.baselines)} /><p className="nmf-object-label">New predeclared six-coordinate study · rank6, seed23</p>{comparison.selected.map(row => <div key={row.source_row}><p>Reserved source{row.source_row}, digit{row.label} · fixed64-bin/16 units</p><div className="nmf-image-grid">{['observed', 'mean', 'PCA6', 'NMF6'].map(key => <Pixels key={key} label={key} values={row[key]} min={-.25} max={1.25} />)}</div><Table caption={`New source${row.source_row} row MSE`} headers={['Representation', 'MSE']} rows={['mean', 'PCA6', 'NMF6'].map(key => [key, mse(row.observed, row[key])])} /></div>)}<Table caption="New rank6/seed23 all60 reserved MSE" headers={['Representation', 'MSE']} rows={Object.entries(comparison.testMSE)} /><p>Training180 / validation60 / reserved60. NMF nndsvda, CD/Frobenius, zero alphas, tolerance1e−6, cap3000; recorded229 iterations, no warnings, cap not reached. Selection on reserved rows: no. New PCA range [{comparison.predictionRanges.PCA6.join(', ')}]. Negative values retain their signed position on the shared ruler.</p></Figure>;
}
export function PixelAddress() {
  const s = savedRow(242);
  return <Figure id="D49" caption="The original k8 inspection keeps the measurement address and units explicit. Row4/column3 maps to F35 by8r+c; raw16 becomes1 under the known/16 ruler, while the prediction can exceed1."><Panels><Pixels label="Source242 · raw measurement /16" values={s.observed} selected={35} /><Pixels label="Original NMF8 reconstruction" values={s.prediction} selected={35} /><Matrix label="Literal address trace" values={[[4, 3, 35, 16, 1, s.prediction[35]]]} rows={['Source242']} columns={['Row', 'Column', 'F', 'Raw', 'Raw/16', 'NMF8 prediction']} /></Panels><p>Source242/F35 prediction {s.prediction[35]}. Separately source256's original NMF8 maximum is F26={savedRow(256).prediction[26]}. These are not the new six-coordinate study.</p></Figure>;
}
