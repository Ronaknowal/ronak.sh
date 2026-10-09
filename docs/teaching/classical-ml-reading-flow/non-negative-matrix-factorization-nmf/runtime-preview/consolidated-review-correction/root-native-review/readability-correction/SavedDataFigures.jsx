import React, { useId, useRef, useState } from 'react';
import { saved, comparison } from '../../saved-data.js';
import { Figure, Panels, Matrix, Bars, Plot, Point, Controls, Range, Select, Result, Table, colors } from '../../Drawing.jsx';
import { fmt } from '../../nmf-model.js';
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
  const [address, setAddress] = useState(selected ?? 0);
  const group = useRef(null), readout = useId(), instructions = useId();
  function inspectKey(event) {
    const rowStart = 8 * Math.floor(address / 8);
    const targets = {ArrowLeft: Math.max(rowStart, address - 1), ArrowRight: Math.min(rowStart + 7, address + 1),
      ArrowUp: address < 8 ? address : address - 8, ArrowDown: address >= 56 ? address : address + 8,
      Home: event.ctrlKey ? 0 : rowStart, End: event.ctrlKey ? 63 : rowStart + 7};
    if (Object.hasOwn(targets, event.key)) { event.preventDefault(); setAddress(targets[event.key]); }
  }
  const ticks = Array.from({length: 5}, (_, i) => min + i * (max - min) / 4);
  if (min < 0 && max > 0 && !ticks.includes(0)) ticks.push(0);
  ticks.sort((a,b)=>a-b);
  return <figure className="nmf-image"><p className="nmf-object-label" style={component !== undefined ? {
      color: colors[component]
    } : undefined}>{label}</p><div className="nmf-image-addresses"><div className="nmf-column-addresses" aria-hidden="true">{Array.from({length:8}, (_, c) => <span key={c}>{c}</span>)}</div><div className="nmf-row-addresses" aria-hidden="true">{Array.from({length:8}, (_, r) => <span key={r}>{r}</span>)}</div><div className="nmf-pixels" ref={group} role="group" aria-label={`${label}; eight rows, eight columns; feature index8r+c`} aria-describedby={`${instructions} ${readout}`} tabIndex={0} onKeyDown={inspectKey} onClick={event => {
      const pixel = event.target.closest('[data-pixel-index]');
      if (pixel) { setAddress(Number(pixel.dataset.pixelIndex)); group.current.focus({preventScroll:true}); }
    }}>{values.map((v, j) => {
        const fraction = (v - min) / (max - min),
          grey = Math.round(12 + 230 * fraction),
          background = signed ? v < 0 ? `color-mix(in srgb, #ee8faf ${100 * Math.abs(v) / Math.abs(min)}%, #101923)` : `color-mix(in srgb, #7bb7ff ${100 * v / max}%, #101923)` : `rgb(${grey},${grey},${grey})`;
        return <span key={j} data-pixel-index={j} data-addressed={address === j ? '' : undefined} role="img" aria-label={`row${Math.floor(j / 8)}, column${j % 8}, F${j}: ${v}`} title={`r${Math.floor(j / 8)} c${j % 8} F${j}: ${v}`} style={{
          background,
        }} />;
      })}</div></div><p className="nmf-pixel-readout" id={readout} aria-live="polite" aria-atomic="true">Row {Math.floor(address/8)}, column {address%8} → F{address}: <output>{values[address]}</output></p><p className="nmf-ruler" id={instructions}>Tap a cell, or focus the image and use arrow keys. Amber outline marks the inspected cell.</p><div className="nmf-pixel-ruler" role="img" aria-label={`Shared intensity ruler ${min} to ${max}`} style={{
      background: signed ? 'linear-gradient(to right,#ee8faf,#101923 50%,#7bb7ff)' : 'linear-gradient(to right,rgb(12,12,12),rgb(242,242,242))'
    }}>{ticks.map(tick => <span key={tick} className={`nmf-ruler-tick${tick === min ? ' nmf-ruler-tick--0' : tick === max ? ' nmf-ruler-tick--4' : ''}`} style={{left:`${100*(tick-min)/(max-min)}%`}}>{fmt(tick)}</span>)}</div><figcaption>Intensity ruler {min} → {max}{min < 0 ? ' · zero lies at its labelled numeric position' : ''}. {signed ? 'Rose negative; blue positive.' : 'Dark low, light high.'}</figcaption></figure>;
}
export function Dictionary() {
  return <Figure id="D42" caption="The original saved k8/seed19 dictionary contains eight complete64-bin patterns, trained on180 rows. Each panel has the same0–4 per-unit pattern ruler. C1–C8 are display IDs for these eight stored rows, with no semantic source label."><div className="nmf-image-grid">{saved.dictionary.map((h, c) => <Pixels key={c} label={`C${c + 1} · original saved pattern`} values={h} component={c} selected={c === 0 ? 35 : undefined} />)}</div><Matrix label="Magnified C1 address neighbourhood · row4/column3 is F35=8×4+3" values={[[saved.dictionary[0][27],saved.dictionary[0][28]],[saved.dictionary[0][35],saved.dictionary[0][36]]]} rows={['r3','r4']} columns={['c3','c4']} selected={[1,0]} color={colors[0]} /></Figure>;
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
  const [removedFraction, setRemovedFraction] = useState(0),
    s = savedRow(256),
    part = s.parts[7],
    removed = part.map(v => removedFraction * v),
    current = s.prediction.map((v, j) => v - removed[j]);
  return <Figure id="D45" caption="Remove or restore the complete C8 addend from source256 with all other amounts fixed. This is the displayed decomposition's counterfactual, not retraining. Source242's saved C8 amount is zero, so its analogous removal changes nothing."><div className="nmf-image-grid"><Pixels label="Source256 observed" values={s.observed} /><Pixels label="Original saved reconstruction" values={s.prediction} /><Pixels label="C8 addend actually removed · r × complete addend" values={removed} component={7} /><Pixels label="Current reconstruction" values={current} /><Pixels label="Current signed residual" values={s.observed.map((v, j) => v - current[j])} min={-4} max={4} signed /></div><Controls onReset={() => setRemovedFraction(0)}><Range label="Fraction of C8 amount removed r" value={removedFraction} onChange={setRemovedFraction} max={1} step={.1} /></Controls><Result>Removal fraction r={fmt(removedFraction)}; MSE {mse(s.observed, current)}. Original {mse(s.observed, s.prediction)}; fully removed {mse(s.observed, s.prediction.map((v, j) => v - part[j]))}. Removed total intensity {fmt(removed.reduce((a, b) => a + b, 0))}.</Result></Figure>;
}
export function Partitions() {
  const arrow = useId().replaceAll(':', '');
  const roles = [
    {key:'train', label:'Training', color:colors[0]},
    {key:'validation', label:'Validation', color:colors[3]},
    {key:'test', label:'Reserved', color:'#e7b54a'},
  ];
  return <Figure id="D46" caption="Source IDs and digit labels are metadata, separate from64 fitting columns. The known/16 measurement ruler is fixed. Only training rows fit dictionaries; validation compares candidates and reserved rows use frozen transforms. No writer IDs are supplied.">
    <div className="nmf-split-masks" role="group" aria-label="The three recorded disjoint source-row masks">
      {roles.map(role => <div key={role.key}>
        <p className="nmf-object-label" style={{color:role.color}}>{role.label} · {comparison.sourceIDs[role.key].length} source rows</p>
        <div className="nmf-source-mask" aria-label={`${role.label}; one tick per actual source row`}>
          {comparison.sourceIDs[role.key].map(id => <span key={id} style={{backgroundColor:role.color}} title={`Source${id}`} />)}
        </div>
      </div>)}
    </div>
    <div className="nmf-dependency-scroll" tabIndex={0} role="region" aria-label="Training fits H once; validation and reserved routes reuse that exact H; scroll horizontally if needed">
      <svg className="nmf-partition-dependencies" viewBox="0 0 760 300" role="img" aria-label="Training X with180 rows fits W and H. The one stored H feeds both validation and reserved transforms. Neither held set points back into fit.">
        <defs><marker id={arrow} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="currentColor" /></marker></defs>
        <g fill="none" stroke="currentColor" strokeWidth="1.8" markerEnd={`url(#${arrow})`}>
          <path d="M125 45H235" /><path d="M320 45H405" />
          <path d="M460 65V120H350V126" /><path d="M460 65V205H350V216" />
          <path d="M125 155H310" /><path d="M125 245H310" />
          <path d="M390 155H550" /><path d="M390 245H550" />
        </g>
        <g fill="currentColor" fontSize="13">
          <text x="8" y="30" fill={colors[0]}>X training:180 ×64</text><text x="8" y="50">fixed pixel /16 units</text>
          <text x="245" y="36">fit once</text><text x="245" y="58">W training + H</text>
          <text x="415" y="30">one stored H:8 ×64</text><text x="415" y="52">k8 / seed19 inspection</text>
          <text x="330" y="111">reuse this H; no refit</text>
          <text x="8" y="139" fill={colors[3]}>X validation:60 ×64</text><text x="8" y="160">fixed pixel /16 units</text>
          <text x="320" y="145">transform</text><text x="320" y="170">H fixed; solve W</text>
          <text x="560" y="145">W validation:60 ×8</text><text x="560" y="168">compare candidates</text>
          <text x="8" y="229" fill="#e7b54a">X reserved:60 ×64</text><text x="8" y="250">fixed pixel /16 units</text>
          <text x="320" y="235">transform</text><text x="320" y="260">H fixed; solve W</text>
          <text x="560" y="235">W reserved:60 ×8</text><text x="560" y="258">final descriptive error</text>
          <text x="8" y="290">Arrows carry arrays or fitted state. Only the training route enters fit.</text>
        </g>
      </svg>
    </div>
    <Matrix label="The actual stored inspection H · all eight patterns and64 bins · reused by both held routes" values={saved.dictionary} rows={saved.dictionary.map((_,i)=>`C${i+1}`)} componentRows />
    <Panels><Matrix label="Reserved metadata · never fitting features" values={[[242, 8], [256, 0]]} columns={['Source ID', 'Digit label']} /><Matrix label="Reserved fitting features · all64 pixel columns · first two of60 rows" values={saved.test.slice(0, 2).map(r => r.pixels.map(v => v / 16))} rows={['Source242', 'Source256']} /><Matrix label="Actual saved transform amounts · first two of60 reserved rows · no browser refit" values={saved.activations.slice(0,2)} rows={['Source242','Source256']} columns={saved.dictionary.map((_,i)=>`C${i+1}`)} componentColumns max={1} /></Panels>
    <p>The dependency drawing shows the original k8/seed19 inspection. Candidate comparison repeats the same train-only boundary for each candidate; the minimum recorded validation error belongs to k16/seed7. The complete H above is recorded data, not a new fit. The validation outputs are a shape-labelled route; their row values are not supplied here.</p>
    {Object.entries(comparison.sourceIDs).map(([role, ids]) => <div key={role}><p className="nmf-object-label">Complete {role} source IDs · {ids.length} rows</p><p>{ids.join(', ')}</p></div>)}
  </Figure>;
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
