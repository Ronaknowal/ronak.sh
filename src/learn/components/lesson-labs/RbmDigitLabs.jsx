import useLessonViewport from './useLessonViewport.js';
import { useMemo, useState } from 'react';
import { NeuralSelect, NeuralTable, formatNeural as f } from './NeuralLessonElements.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowReadout } from './LessonFlow.jsx';
import { completion, hiddenEnumeration, rbmMetrics, exactSample } from '../../data/rbm-models.js';
import summary from '../../data/rbm-study-summary.js';
import { PixelTile, ProbabilityBars, RbmResource, useRbmAsset } from './RbmElements.jsx';
export function RbmStudyInputFigure() {
  const resource = useRbmAsset('assessment-images.json');
  return <RbmResource resource={resource}>{sources => <figure className="rbm-study-input">
    <PixelTile title={'One retained binary image: source ' + sources[0].id} values={sources[0].pixels} />
    <svg viewBox="0 0 280 230" role="img" aria-label="Eight hidden random variables interact with the64visible pixels; selected pixel18wires shown">
      {Array.from({length:8},(_,i)=><g key={i}><circle cx={20+i*34} cy="30" r="12" fill="#bd9ee522" stroke="#bd9ee5" /><text x={20+i*34} y="35" textAnchor="middle">{i+1}</text><line x1={20+i*34} y1="42" x2="111" y2="111" stroke="#e6b854" opacity=".5" /></g>)}
      {sources[0].pixels.map((value,i)=><rect key={i} x={62+(i%8)*20} y={62+Math.floor(i/8)*20} width="18" height="18" fill={value?'#eee':'#222'} stroke={i===18?'#e6b854':'#777'} strokeWidth={i===18?2:1} />)}
      <text x="140" y="228" textAnchor="middle">64 visible binary variables</text>
    </svg><figcaption>White cells are on; charcoal cells are off. The eight violet circles are hidden random variables. Amber wires show pixel18’s eight interactions; every other visible pixel also has eight learned interactions, omitted to keep the drawing readable. This is a probability graph, not a deterministic forward neural network.</figcaption>
  </figure>}</RbmResource>;
}
const choices = summary.fits.map(fit => [fit.method + '-' + fit.seed, fit.method.toUpperCase() + ', seed ' + fit.seed]);
const half = () => Array.from({
  length: 64
}, (_, i) => i % 8 < 4);
function ModelChoice({
  value,
  onChange,
  label = 'Retained fitted model'
}) {
  return <NeuralSelect label={label} value={value} onChange={onChange} options={choices} />;
}
export function RbmStudyFigure() {
  const [selected, setSelected] = useState('exact-11');
  const run = summary.fits.find(row => row.method + '-' + row.seed === selected);
  return <FlowLab id="rbm-study" label="Inspect the measured fit and development likelihood histories">
    <figure className="rbm-measured-chart"><svg viewBox="0 0 280 232" role="img" aria-label="Recorded exact NLL at five measured epochs; horizontal completed epoch, vertical nats per binary image">
      <path d="M40 22 V185 H262" fill="none" stroke="#aaa" />
      {[18,23,28].map(value => <text key={value} x="34" y={185-(value-18)*16+5} textAnchor="end">{value}</text>)}
      {[1,150,300].map(value => <text key={value} x={40+(value-1)*220/299} y="207" textAnchor={value===1?'start':value===300?'end':'middle'}>{value}</text>)}
      {['fit','development'].map((role,i)=><g key={role}><polyline fill="none" stroke={i?'#bd9ee5':'#e6b854'} strokeWidth="2" points={run.history.map(row=>(40+(row.epoch-1)*220/299)+','+(185-(row[role]-18)*16)).join(' ')} />{run.history.map(row=><circle key={row.epoch} cx={40+(row.epoch-1)*220/299} cy={185-(row[role]-18)*16} r="3" fill={i?'#bd9ee5':'#e6b854'} />)}</g>)}
      <text x="150" y="229" textAnchor="middle">completed epoch</text>
    </svg><figcaption>Vertical scale: exact NLL, nats per binary image, 18–28. Amber: fit. Violet: development. Points are measured; connecting lines do not imply additional observations.</figcaption></figure>
    <FlowControls><ModelChoice value={selected} onChange={setSelected} /></FlowControls>
    <FlowReadout>Selected {run.method.toUpperCase()}, seed {run.seed}: final assessment NLL is <strong>{f(run.nll,6)}</strong> nats per image. Selection reads a saved run and performs no training.</FlowReadout>
    <p>Only epochs 1, 10, 50, 100 and 300 were measured here. Lines join those observations; they are not unrecorded intermediate measurements. The assessment split was scored at the final model.</p>
    <NeuralTable caption="All final assessment NLL outcomes; no selected winner" headers={['Method / seed', 'NLL nats/image']} rows={summary.fits.map(row => [row.method + ' / ' + row.seed, f(row.nll, 6)]).concat([['Independent pixels', f(summary.baseline.nll_nats_per_image.assessment, 6)]])} />
  </FlowLab>;
}
export function RbmStudyDiagnostics() {
  return <NeuralTable caption="All final assessment diagnostics, under the fixed half-image mask" headers={['Method / seed', 'NLL nats/image', 'Reconstruction MSE', 'Completion MSE', 'Correct missing pixels /2560']} rows={summary.fits.map(row => [row.method + ' / ' + row.seed, f(row.nll, 6), f(row.reconstruction, 6), f(row.completionMse, 6), row.completionCorrect]).concat([['Independent pixels', f(summary.baseline.nll_nats_per_image.assessment, 6), 'not an RBM reconstruction', f(summary.baseline.completion_mse, 6), summary.baseline.completion_correct]])} />;
}
export function RbmSampleGallery() {
  const [selected, setSelected] = useState('exact-11'),
    resource = useRbmAsset('model-' + selected + '.json');
  return <FlowLab id="rbm-samples" label="Independent generation from the exact hidden marginal"><RbmResource resource={resource}>{data => <><div className="rbm-sample-grid">{data.samples.map((pixels, i) => <div key={i}><PixelTile title={'Saved draw ' + (i + 1)} values={pixels} /><small>h={data.hiddenSamples[i].join('')}</small></div>)}</div><p>All sixteen original saved samples, in original order. Each draws one of the 256 hidden configurations from its exact marginal, then binary visible pixels conditional on that hidden state. None receives a digit input; these are neither reconstructions nor a sixteen-step Gibbs chain.</p></>}</RbmResource><FlowControls><ModelChoice value={selected} onChange={setSelected} /></FlowControls><FlowReadout>Model {selected}: sixteen saved whole-image draws, in their original order.</FlowReadout></FlowLab>;
}
export function RbmDigitLab() {
  const [selected, setSelected] = useState('exact-11'),
    images = useRbmAsset('assessment-images.json');
  return <section id="rbm-digits" aria-label="Condition on real digit evidence"><RbmResource resource={images}>{sources => <DigitExperiment modelName={selected} sources={sources} modelChoice={<ModelChoice value={selected} onChange={setSelected} />} />}</RbmResource></section>;
}
// Learner inputs live above the asynchronous model boundary. A saved-model
// selection/retry changes the probability model without discarding the case.
function DigitExperiment({ modelName, sources, modelChoice }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [pixels, setPixels] = useState(sources[0].pixels), [mask, setMask] = useState(half);
  const [selected, setSelected] = useState(18), [seed, setSeed] = useState(71);
  const experiment = { sourceIndex, setSourceIndex, pixels, setPixels, mask, setMask, selected, setSelected, seed, setSeed };
  return <LoadedDigitModel selected={modelName} sources={sources} modelChoice={modelChoice} experiment={experiment} />;
}
function LoadedDigitModel({
  selected,
  sources,
  modelChoice,
  experiment
}) {
  const model = useRbmAsset('model-' + selected + '.json');
  return <RbmResource resource={model}>{data => <DigitWorkspace data={data} sources={sources} name={selected} modelChoice={modelChoice} experiment={experiment} />}</RbmResource>;
}
function DigitWorkspace({
  data,
  sources,
  name,
  modelChoice,
  experiment
}) {
  const { sourceIndex, setSourceIndex, pixels, setPixels, mask, setMask, selected, setSelected, seed, setSeed } = experiment;
  const source = sources[sourceIndex];
  const [teachingSection, ready] = useLessonViewport();
  const prepared = useMemo(() => hiddenEnumeration(data.model), [data]);
  const result = useMemo(() => completion(pixels, mask, data.model, prepared), [pixels, mask, data, prepared]);
  const baseline = useMemo(() => completion(source.pixels, half(), data.model, prepared), [source, data, prepared]);
  const fullSource = useMemo(() => rbmMetrics(source.pixels, data.model, prepared), [source, data, prepared]);
  const missing = mask.flatMap((observed, i) => observed ? [] : [i]);
  const mse = missing.length ? missing.reduce((sum, i) => sum + (result.probabilities[i] - source.pixels[i]) ** 2, 0) / missing.length : null;
  const correct = missing.filter(i => Number(result.probabilities[i] >= .5) === source.pixels[i]).length;
  const belief = data.model.b.map((_, i) => prepared.states.reduce((sum, h, j) => sum + h[i] * result.posterior[j], 0));
  const samples = useMemo(() => ready ? exactSample(data.model, seed, 8, pixels, mask) : [], [ready, data, seed, pixels, mask]);
  const reset = () => {
    setPixels(source.pixels);
    setMask(half());
    setSelected(18);
    setSeed(71);
  };
  const switchSource = index => {
    setSourceIndex(index);
    setPixels(sources[index].pixels);
    setMask(half());
    setSelected(18);
    setSeed(71);
  };
  const selectToggle = () => setPixels(old => old.map((value, i) => i === selected ? 1 - value : value));
  return <><p>Real assessment source {source.id}, original digit label {source.digit}; labels are not RBM inputs. Model {name}. White cells are binary 1; charcoal cells are binary 0. Select a cell to inspect its row, column and current value.</p>
    <FlowLab id="rbm-digit-source" label="Compare the source evidence with its conditional completion">
      <div className="rbm-pixel-roles"><PixelTile title="Current evidence; hatched pixels are missing" values={pixels} mask={mask} selected={selected} onSelect={setSelected} /><PixelTile title="Conditional means; observed values remain fixed" values={result.probabilities} /><PixelTile title="Original withheld truth, used only for scoring" values={source.pixels} /><PixelTile title="Original source with fixed half-mask: comparison" values={baseline.probabilities} /></div>
      <FlowControls>{modelChoice}<NeuralSelect label="Assessment source image" value={sourceIndex} onChange={value => switchSource(Number(value))} options={sources.map((row, i) => [i, 'Source ' + row.id + ', original digit ' + row.digit])} /></FlowControls>
      <FlowReadout>Model {name}, source {source.id}. Select a cell in the evidence grid to inspect it: pixel {selected}, row {Math.floor(selected / 8)}, column {selected % 8}, is {mask[selected] ? 'observed evidence' : 'missing, with a display placeholder'}. Its current conditional on-probability is <strong>{f(result.probabilities[selected],8)}</strong>.</FlowReadout>
    </FlowLab>
    <p>Keep that source and model fixed. What does changing one binary value do? The miniature pair below repeats the current evidence and conditional mean so the change is visible directly above the button. A missing placeholder must have no effect on the posterior.</p>
    <FlowLab id="rbm-digit-value" label="Change one selected observed value or missing placeholder">
      <div className="rbm-pixel-roles"><PixelTile title="Edited evidence and current mask" values={pixels} mask={mask} selected={selected} onSelect={setSelected} /><PixelTile title="Recomputed conditional probabilities" values={result.probabilities} /></div>
      <FlowControls><button type="button" onClick={selectToggle}>Toggle pixel {selected}: {pixels[selected]} → {1-pixels[selected]}</button><button type="button" onClick={reset}>Reset source values and half mask</button></FlowControls>
      <FlowReadout>Pixel {selected} is {mask[selected] ? 'observed: its binary value is evidence' : 'missing: its binary value is ignored'}. Its conditional probability is <strong>{f(result.probabilities[selected],8)}</strong>; the largest missing-pixel change from the original half-mask result is <strong>{missing.length ? f(Math.max(...missing.map(i => Math.abs(result.probabilities[i]-baseline.probabilities[i]))),8) : 'not defined because no pixels are missing'}</strong>.</FlowReadout>
    </FlowLab>
    <p>Which values are known? The next investigation changes only the observation mask. Observing a pixel supplies its current binary value; hiding it removes that evidence and sums over both possible values.</p>
    <FlowLab id="rbm-digit-mask" label="Change which values count as observed evidence">
      <div className="rbm-pixel-roles"><PixelTile title="Observed versus missing evidence" values={pixels} mask={mask} selected={selected} onSelect={setSelected} /><PixelTile title="Posterior mean under this mask" values={result.probabilities} /></div>
      <FlowControls><button type="button" aria-pressed={mask[selected]} onClick={() => setMask(old => old.map((value,i) => i === selected ? !value : value))}>Pixel {selected}: {mask[selected] ? 'observed → missing' : 'missing → observed'}</button><NeuralSelect label="Whole-image observation mask" value={mask.every(Boolean) ? 'all' : mask.every(value => !value) ? 'none' : mask.every((value,i) => value === (i%8<4)) ? 'half' : 'custom'} options={[['custom','Current per-pixel mask'],['half','Observe the left half'],['none','Hide every pixel'],['all','Observe every pixel']]} onChange={value => { if(value !== 'custom') setMask(value === 'half' ? half() : Array(64).fill(value === 'all')); }} /></FlowControls>
      <FlowReadout>There are <strong>{missing.length}</strong> missing pixels. All missing gives unconditional model marginals; all observed copies the input exactly. Original truth is never supplied to the posterior where the mask says missing.</FlowReadout>
    </FlowLab>
    <NeuralTable caption="Current conditional calculation; the original half-mask baseline is pinned" headers={['Quantity', 'Value']} rows={[['Current conditional probability at pixel ' + selected, f(result.probabilities[selected], 8)], ['Pinned baseline at selected pixel', f(baseline.probabilities[selected], 8)], ['Selected probability difference', f(result.probabilities[selected] - baseline.probabilities[selected], 8)], ['Largest change among current missing pixels', missing.length ? f(Math.max(...missing.map(i => Math.abs(result.probabilities[i] - baseline.probabilities[i]))), 8) : 'No missing pixels'], ['Current missing pixel count', missing.length], ['Current-case probability MSE against original withheld truth', mse === null ? 'No hidden pixels to score' : f(mse, 8)], ['Current-case thresholded matches', missing.length ? correct + ' / ' + missing.length : 'No hidden pixels to score'], ['Exact full original-image NLL (immutable source)', f(fullSource.nll, 8) + ' nats']]} />
    <p>Changing an observed bit changes evidence. Changing only a hatched placeholder contributes nothing to the hidden posterior. Hiding all pixels recovers unconditional model marginals; observing all pixels copies the input exactly. The local score uses original withheld pixels as reference and is not the 80-image assessment result after any edit.</p>
    <ProbabilityBars title="Hidden on-probabilities given the current observed evidence" rows={belief.map((current, i) => ({
      label: 'h' + (i + 1),
      current
    }))} />
    <section data-lesson-teaching="" aria-label="Learned interaction maps and current pixel probabilities"><p>All eight filters and all nine models use the same signed scale ±{f(summary.sharedWeightExtent, 4)}. Amber is positive; blue is negative. A pattern is a learned interaction map, not an assigned digit name.</p><div className="rbm-filter-grid">{data.model.b.map((_, j) => <PixelTile key={j} title={'Hidden ' + (j + 1) + ' weights'} values={data.model.w.map(row => row[j])} signed extent={summary.sharedWeightExtent} />)}</div><NeuralTable caption="Current mask, source and conditional probabilities" headers={['Index / row / column', 'Observed?', 'Current binary value', 'Original truth', 'Conditional probability', 'Half-mask baseline']} rows={pixels.map((v, i) => [i + ' / ' + Math.floor(i / 8) + ' / ' + i % 8, mask[i] ? 'yes' : 'no', v, source.pixels[i], f(result.probabilities[i], 8), f(baseline.probabilities[i], 8)])} /></section>
    <FlowLab id="rbm-conditional-samples" label="Draw whole conditional alternatives"><div ref={teachingSection}><p>The probability image is an average. What do whole binary completions look like? Draw a hidden state from the observed-data posterior, then missing pixels conditional on it, keeping all observed values fixed.</p><div className="rbm-sample-grid">{samples.map((sample, i) => <div key={i}><PixelTile title={'Conditional sample ' + (i + 1)} values={sample.pixels} /><small>h={sample.hidden.join('')}</small></div>)}</div></div><FlowControls><FlowSlider name="Conditional sample stream seed" value={seed} min={0} max={100} step={1} onChange={setSeed} /></FlowControls><FlowReadout>Mulberry32 seed {seed}: eight categorical hidden-posterior draws, then Bernoulli missing-pixel draws. Observed values are restored exactly. Samples are joint alternatives; the gray probability image is the exact conditional expectation, not necessarily the empirical average of these eight draws.</FlowReadout></FlowLab>
  </>;
}
