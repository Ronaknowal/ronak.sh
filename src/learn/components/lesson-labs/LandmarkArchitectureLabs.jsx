// Landmark Architectures labs and small figures, in the reading flow (LessonFlow.jsx):
// each lab states its question in the lesson sentence before it, shows a useful result
// at once, keeps only the controls that question needs directly under the visual, and
// reports the result as a live sentence. Value grids follow the module rule: positive
// cells amber, negative cells blue (and dashed), every cell labelled with its number.
import useLessonViewport from './useLessonViewport.js';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { useEffect, useState } from 'react';
import { NeuralTable, formatNeural as number } from './NeuralLessonElements.jsx';
import { architectureKinds, headBudget, signedScoreMap } from '../../data/landmark-architecture-models.js';
import measured from '../../data/landmark-architecture-measurements.json';
import { FlowChoice, FlowControls, FlowLab, FlowReadout, FlowSlider, flowNumber } from './LessonFlow.jsx';
import './landmark-architectures.css';

export const landmarkAsset = '/learn-assets/landmark-architectures-lenet-alexnet-vgg-resnet-efficientnet/';
const integer = value => Math.round(value).toLocaleString('en-US');
const kinds = Object.fromEntries(architectureKinds);
const signed = (value, digits = 5) => flowNumber(value, digits);

function TileMap({ values, title }) {
  return <div className="landmark-map"><p className="landmark-map-title">{title}</p><div className="landmark-grid" role="img" aria-label={`${title}: ${values.map(v => signed(v)).join(', ')}`}>{values.map((value, i) => <span key={i} data-positive={value > 0} data-negative={value < 0}>{signed(value)}</span>)}</div></div>;
}

export function LandmarkProgram({ file = 'architecture-experiments.py', title = 'Read the complete small architecture experiment' }) {
  return <>
    <RemoteCodeBlock source={landmarkAsset + file} language="python" filename={file} title={(title)} />
    <p className="landmark-download"><a href={landmarkAsset + file} download={file}>Download {file}</a></p>
  </>;
}

function WindowFigure({ length, kernel, stride, unit }) {
  const cell = 280 / length, position = i => 30 + i * cell;
  return <svg className="landmark-chart" viewBox="0 0 340 125" role="img" aria-label={`Two adjacent windows on the ${unit} grid: indices 0 to ${kernel - 1}, then ${stride} to ${stride + kernel - 1}.`}>
    {Array.from({ length }, (_, i) => <rect key={i} x={position(i)} y="70" width={cell} height="18" fill="none" stroke="#505050" />)}
    <text x={position(0)} y="14" className="landmark-chart-label">first window: {kernel} cells</text>
    <line x1={position(0)} x2={position(kernel)} y1="24" y2="24" stroke="#bdbdbd" strokeWidth="5" />
    <text x={position(stride)} y="45" className="landmark-chart-label">next window starts {stride} later</text>
    <line x1={position(stride)} x2={position(stride + kernel)} y1="55" y2="55" stroke="#8a8a8a" strokeWidth="5" strokeDasharray="6 4" />
    {[0, stride, stride + kernel - 1].map((value, i) => <text key={i} x={position(value) + cell / 2} y="108" textAnchor="middle">{value}</text>)}
  </svg>;
}

// AlexNet's first layer and pool on their own grids (one axis drawn).
export function LandmarkStrideFigure() {
  return <figure className="landmark-figure" data-figure="landmark-stride" aria-label="AlexNet's first convolution windows on the image grid, then the pool windows on the convolution grid">
    <p className="landmark-map-title">Image grid: kernel 11, stride 4 (227 positions → 55)</p>
    <WindowFigure length={16} kernel={11} stride={4} unit="image-pixel index" />
    <p className="landmark-map-title">Convolution grid: pool 3, stride 2 (55 positions → 27)</p>
    <WindowFigure length={7} kernel={3} stride={2} unit="convolution-position index" />
    <figcaption>Each row is a one-dimensional slice of a square window; only the start of each grid is drawn. The top row counts image pixels, the bottom row counts convolution outputs.</figcaption>
  </figure>;
}

// Two stacked 3 × 3 convolutions reach a 5 × 5 input region. Select an intermediate position
// to see which 3 × 3 input patch feeds it.
export function LandmarkCompositionFigure() {
  const [intermediate, setIntermediate] = useState(4);
  const row = Math.floor(intermediate / 3), column = intermediate % 3;
  return <figure className="landmark-figure" data-figure="landmark-composition" aria-label="Two stacked 3 × 3 convolutions reach a 5 × 5 input region">
    <div className="landmark-composition">
      <div><p className="landmark-map-title">Input: 5 × 5 region</p><div className="landmark-small-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }} role="img" aria-label={`Intermediate row ${row + 1}, column ${column + 1} reads input rows ${row + 1} to ${row + 3}, columns ${column + 1} to ${column + 3}`}>{Array.from({ length: 25 }, (_, i) => <span key={i} data-active={i % 5 >= column && i % 5 <= column + 2 && Math.floor(i / 5) >= row && Math.floor(i / 5) <= row + 2} />)}</div></div>
      <span className="landmark-composition-arrow" aria-hidden="true">→ 3 × 3 conv + ReLU →</span>
      <div><p className="landmark-map-title">Intermediate 3 × 3 (select one)</p><div className="landmark-small-grid landmark-intermediate" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>{Array.from({ length: 9 }, (_, i) => <button key={i} aria-label={`Intermediate row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}`} aria-pressed={intermediate === i} onClick={() => setIntermediate(i)}>{i + 1}</button>)}</div></div>
      <span className="landmark-composition-arrow" aria-hidden="true">→ 3 × 3 conv →</span>
      <div><p className="landmark-map-title">One output</p><div className="landmark-small-grid landmark-output" role="img" aria-label="One output value"><span data-active="true" /></div></div>
    </div>
    <FlowReadout>Intermediate position <strong>{intermediate + 1}</strong> reads input rows {row + 1}–{row + 3} and columns {column + 1}–{column + 3} (outlined). The single output reads all nine intermediate values, so together they cover all 25 input cells.</FlowReadout>
  </figure>;
}

export function LandmarkBranchFigure() {
  return <figure className="landmark-figure" data-figure="landmark-merges" aria-label="Adding versus concatenating the same two vectors">
    <div className="landmark-merge-compare flow-columns-2">
      <div><p className="landmark-map-title">⊕ add aligned slots (ResNet)</p><p className="landmark-merge-math">[1, 2] + [3, −1] = [4, 1]</p><p>Corresponding entries combine; the width stays two.</p></div>
      <div><p className="landmark-map-title">‖ append distinct slots (Inception)</p><p className="landmark-merge-math">concat([1, 2], [3, −1]) = [1, 2, 3, −1]</p><p>Both inputs keep their own entries; the width becomes four.</p></div>
    </div>
  </figure>;
}

// Where did VGG's parameters go? Fixed 512 channels, 4,096 hidden width and 1,000 classes;
// the learner changes the head operation and the final grid side.
export function LandmarkHeadLab() {
  const [mode, setMode] = useState('flat'), [side, setSide] = useState(7);
  const fixed = { channels: 512, dense: 4096, classes: 1000 };
  const current = headBudget({ ...fixed, height: side, width: side, mode });
  const baseline = headBudget({ ...fixed, height: 7, width: 7, mode: 'dense' });
  const maximum = Math.max(current.parameters, current.gapParameters, baseline.parameters);
  const bars = [['VGG-16’s original head (7 × 7, two dense layers)', baseline.parameters], ['Selected head', current.parameters], ['Global average + linear', current.gapParameters]];
  return <FlowLab id="landmark-head" label="Where did the classifier’s parameters go?">
    <div className="landmark-bars">{bars.map(([label, value]) => <div key={label} className="landmark-bar-row"><span>{label}</span><div className="landmark-bar"><span style={{ width: `${100 * value / maximum}%` }} /></div><strong>{integer(value)}</strong></div>)}</div>
    <FlowControls>
      <FlowChoice label="Head" value={mode} onChange={setMode} options={[['flat', 'One flattened linear layer'], ['dense', 'Two dense layers + classifier']]} />
      <FlowSlider name="Final grid side (H = W)" value={side} onChange={setSide} min={1} max={14} step={1} format={value => `${value} × ${value}`} />
    </FlowControls>
    <FlowReadout>The selected head reads <strong>{integer(512 * side * side)}</strong> numbers and has <strong>{integer(current.parameters)}</strong> parameters{current.pieces.length > 1 ? ` (${current.pieces.map(integer).join(' + ')})` : ''}. The global-average head reads 512 numbers, whatever the grid size, and has {integer(current.gapParameters)}. Bars share one zero and one maximum; counts include biases.</FlowReadout>
  </FlowLab>;
}

function LearningPlot({ rows, field }) {
  const maximum = field === 'correct' ? 120 : Math.max(...rows.flatMap(row => row.trace.map(point => point.development.cross_entropy))) * 1.05;
  const x = value => 50 + value / 400 * 240, y = value => 210 - value / maximum * 180;
  const colours = ['#ececec', '#c7a5ee'];
  return <svg className="landmark-chart" viewBox="0 0 360 255" role="img" aria-label={`Recorded development ${field === 'correct' ? 'correct counts out of 120' : 'cross-entropy'} at updates 0 to 400 for ${kinds[rows[0].kind]} and ${kinds[rows[1].kind]}. Exact values in the table below.`}>
    <line x1="50" x2="290" y1="210" y2="210" stroke="#505050" /><line x1="50" x2="50" y1="30" y2="210" stroke="#505050" />
    {[0, maximum / 2, maximum].map(value => <text key={value} x="43" y={y(value) + 4} textAnchor="end">{number(value, 2)}</text>)}
    {[0, 200, 400].map(value => <text key={value} x={x(value)} y="230" textAnchor="middle">{value}</text>)}
    <text x="170" y="248" textAnchor="middle">full-batch update</text>
    {rows.map((row, i) => { const last = row.trace.at(-1); return <g key={row.kind}>
      <polyline points={row.trace.map(point => `${x(point.step)},${y(point.development[field])}`).join(' ')} fill="none" stroke={colours[i]} strokeWidth="2" strokeDasharray={i ? '5 4' : undefined} />
      {row.trace.map(point => <circle key={point.step} cx={x(point.step)} cy={y(point.development[field])} r="3" fill={colours[i]} />)}
      <text x={x(last.step) + 6} y={y(last.development[field]) + (i ? 12 : -4)} fill={colours[i]} className="landmark-chart-series">{kinds[row.kind]}</text>
    </g>; })}
  </svg>;
}

// Recorded training curves: plain against one other body, for one seed and one metric.
export function LandmarkComparisonLab() {
  const [seed, setSeed] = useState(1), [comparison, setComparison] = useState('residual'), [field, setField] = useState('correct');
  const rows = measured.fits.filter(row => row.seed === seed);
  const pair = [rows.find(row => row.kind === 'plain'), rows.find(row => row.kind === comparison)];
  return <FlowLab id="landmark-comparison" label="Recorded development curves for plain against another body">
    <LearningPlot rows={pair} field={field} />
    <FlowControls>
      <FlowChoice label="Seed" value={seed} onChange={setSeed} options={[[1, '1'], [2, '2'], [3, '3']]} />
      <FlowChoice label="Plain against" value={comparison} onChange={setComparison} options={architectureKinds.filter(([key]) => key !== 'plain')} />
      <FlowChoice label="Measure" value={field} onChange={setField} options={[['correct', 'Correct of 120'], ['cross_entropy', 'Cross-entropy']]} />
    </FlowControls>
    <FlowReadout>Seed {seed} after 400 updates: plain <strong>{pair[0].trace.at(-1).development.correct}/120</strong> (cross-entropy {number(pair[0].trace.at(-1).development.cross_entropy, 4)}), {kinds[comparison].toLowerCase()} <strong>{pair[1].trace.at(-1).development.correct}/120</strong> ({number(pair[1].trace.at(-1).development.cross_entropy, 4)}). Markers are recorded checkpoints; lines only connect them.</FlowReadout>
    <NeuralTable caption="The same recorded checkpoints, training and development" headers={['Body', 'Update', 'Training correct/280', 'Training CE', 'Development correct/120', 'Development CE']} rows={pair.flatMap(row => row.trace.map(point => [kinds[row.kind], point.step, point.train.correct, number(point.train.cross_entropy, 6), point.development.correct, number(point.development.cross_entropy, 6)]))} />
  </FlowLab>;
}

// Two routes to one class score: average each feature map then weight, or weight then
// average the class map. Change one feature cell and the class weight of channel B.
const scoreMaps = [[1, 2, 0, 3], [0, 1, 2, 1]];
export function LandmarkScoreLab() {
  const [cell, setCell] = useState(2), [weightB, setWeightB] = useState(-1);
  const maps = [scoreMaps[0], scoreMaps[1].map((value, i) => i === 2 ? cell : value)];
  const weights = [2, weightB], bias = .5;
  const result = signedScoreMap(maps, weights, bias);
  return <FlowLab id="landmark-score" label="A class score from feature maps, by two routes">
    <div className="landmark-score-flow">
      <div className="flow-columns-2"><TileMap values={maps[0]} title="Feature A (class weight 2)" /><TileMap values={maps[1]} title={`Feature B (class weight ${signed(weightB, 2)})`} /></div>
      <p className="landmark-score-arrow" aria-hidden="true">↓ multiply each map by its class weight</p>
      <div className="flow-columns-2"><TileMap values={result.contributions[0]} title="2 × feature A" /><TileMap values={result.contributions[1]} title={`${signed(weightB, 2)} × feature B`} /></div>
      <p className="landmark-score-arrow" aria-hidden="true">↓ add the two maps cell by cell</p>
      <TileMap values={result.totalMap} title="Class activation map" />
    </div>
    <FlowControls>
      <FlowSlider name="Feature B, bottom-left cell" value={cell} onChange={setCell} min={0} max={8} step={1} format={value => String(value)} />
      <FlowSlider name="Class weight for B" value={weightB} onChange={setWeightB} min={-3} max={3} step={.5} format={value => signed(value, 2)} />
    </FlowControls>
    <FlowReadout>Average then weight: [{result.means.map(v => signed(v, 4)).join(', ')}] · [2, {signed(weightB, 2)}] + 0.5 = <strong>{signed(result.viaFeatures, 4)}</strong>. Weight then average: mean of the class map + 0.5 = <strong>{signed(result.viaMap, 4)}</strong>. The two routes always agree.</FlowReadout>
  </FlowLab>;
}

// Saved seed-1 features and head of the parallel model, loaded only near the viewport.
export function LandmarkRecordedMaps() {
  const [teachingSection, ready] = useLessonViewport(), [data, setData] = useState(null), [error, setError] = useState(false), [attempt, setAttempt] = useState(0), [specimen, setSpecimen] = useState(1);
  useEffect(() => {
    if (!ready || data) return;
    const controller = new AbortController(); setError(false);
    fetch(landmarkAsset + 'recorded-feature-maps.json', { signal: controller.signal }).then(response => { if (!response.ok) throw new Error('Record request failed'); return response.json(); }).then(setData).catch(reason => { if (reason.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, [ready, data, attempt]);
  const fit = data?.find(row => row.kind === 'parallel'), sample = fit?.observations[specimen];
  let chosen = 0, other = 0;
  if (sample) {
    const order = sample.logits.map((logit, i) => [logit, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
    chosen = order[0];
    other = sample.actual !== chosen ? sample.actual : order[1];
  }
  const mapFor = classId => signedScoreMap(sample.feature_maps.map(map => map.flat()), fit.head_weight[classId], fit.head_bias[classId]);
  return <section className="flow-lab landmark-recorded" ref={teachingSection} aria-label="Saved trained feature maps and class maps, including a mistake">
    {ready && !data && (error ? <p role="alert">Saved maps could not load. <button onClick={() => setAttempt(value => value + 1)}>Retry saved maps</button></p> : <p role="status">Loading only the saved feature and head observations…</p>)}
    {sample && <>
      <div className="landmark-recorded-row">
        <div className="landmark-map"><p className="landmark-map-title">Source {sample.source_id}: actual {sample.actual}</p><div className="landmark-pixels" role="img" aria-label={`Source ${sample.source_id}, digit ${sample.actual}, saved 8 × 8 intensities`}>{sample.input.flat().map((value, i) => <span key={i} style={{ background: `rgb(${255 * value} ${255 * value} ${255 * value})` }} />)}</div></div>
        <TileMap values={mapFor(chosen).totalMap} title={`Class ${chosen} map (chosen)`} />
        <TileMap values={mapFor(other).totalMap} title={`Class ${other} map (${other === sample.actual ? 'actual' : 'runner-up'})`} />
      </div>
      <FlowControls><FlowChoice label="Saved specimen" value={specimen} onChange={setSpecimen} options={[[0, 'Correct: source 251'], [1, 'Mistake: source 379']]} /></FlowControls>
      <FlowReadout>The parallel model chooses <strong>{chosen}</strong>. Both maps come from the same 16 saved feature maps with different head weights. Class {chosen}: mean map + bias = {signed(mapFor(chosen).viaMap, 6)}, recorded logit {signed(sample.logits[chosen], 6)}, probability {signed(sample.probabilities[chosen], 4)}. Class {other}: {signed(mapFor(other).viaMap, 6)} against {signed(sample.logits[other], 6)}, probability {signed(sample.probabilities[other], 4)}. Probabilities come from softmax across all ten logits, not from the map cells.</FlowReadout>
      <NeuralTable caption="All ten recorded logits for this saved image" headers={['Class', 'Logit', 'Probability']} rows={sample.logits.map((logit, i) => [`${i}${i === sample.actual ? ' · actual' : ''}${i === chosen ? ' · chosen' : ''}`, signed(logit, 6), signed(sample.probabilities[i], 6)])} />
    </>}
  </section>;
}
