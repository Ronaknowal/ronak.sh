import { useEffect, useMemo, useState } from 'react';
import useLessonViewport from './useLessonViewport.js';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber as f } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { FlowArrow, ValueStrip, ReceptiveJumpFigure } from './DepthwiseFlowFigures.jsx';
import { channelFixture, channelForward, channelGradient, rankProbe, initialSignal, sampleStencil, samplingSupport, finiteTaps, parallelContext, savedDigitLogits, reconstructedKernel } from '../../data/depthwise-convolution-models.js';

export const depthwiseAsset = '/learn-code/depthwise-separable-dilated-convolutions/';
const vector = values => `[${values.map(value => f(value, 4)).join(', ')}]`;
const sg = value => (value < 0 ? `(${f(value)})` : f(value));
const replace = (values, index, value) => values.map((previous, position) => position === index ? value : previous);

export function DepthwiseChannelLab() {
  const [firstB, setFirstB] = useState(2);
  const [mixingB, setMixingB] = useState(-1);
  const inputs = [channelFixture.inputs[0], [firstB, 0, 1]];
  const mixing = [2, mixingB];
  const result = channelForward(inputs, channelFixture.filters, mixing);
  return <FlowLab id="depthwise-channels" label="Depthwise lanes followed by pointwise mixing">
    <div className="flow-columns-2">{['A', 'B'].map((name, channel) => <div key={name}>
      <p className="dw-input">Input channel {name}: white outlines mark position 0's patch</p>
      <ValueStrip values={inputs[channel]} selected={[0, 1]} indices />
      <FlowArrow>read only this channel</FlowArrow>
      <div className="dw-operation">Multiply each patch by <span className="dw-parameter">D_{name} = {vector(channelFixture.filters[channel])}</span>, then sum</div>
      <p className="dw-computed">Filtered {name}: {vector(result.filtered[channel])}</p>
      <p>{f(inputs[channel][0])} × {sg(channelFixture.filters[channel][0])} + {f(inputs[channel][1])} × {sg(channelFixture.filters[channel][1])} = {f(result.filtered[channel][0])}</p>
      <FlowArrow>pointwise weight P_{name} = {f(mixing[channel])}</FlowArrow>
      <p className="dw-computed">Position 0 contribution: {f(result.contributions[channel][0])}</p>
    </div>)}</div>
    <div className="dw-operation">Add contributions at the same position</div>
    <p className="dw-computed">One output channel, positions 0 and 1: {vector(result.output)}</p>
    <FlowControls><FlowSlider name="First value of channel B" value={firstB} onChange={setFirstB} min={-4} max={8} />
      <FlowSlider name="Pointwise weight for B" value={mixingB} onChange={setMixingB} min={-3} max={3} /></FlowControls>
    <FlowReadout>Position 0 is <strong>{f(result.output[0])}</strong>, from {f(result.contributions[0][0])} + {f(result.contributions[1][0])}; position 1 is {f(result.output[1])}. B's first value is outside position 1's patch.</FlowReadout>
  </FlowLab>;
}

export function DepthwiseGradientLab() {
  const [target, setTarget] = useState(1);
  const [rate, setRate] = useState(.01);
  const result = channelGradient(channelFixture.inputs, channelFixture.filters, channelFixture.mixing, target, rate);
  return <FlowLab id="depthwise-gradient" label="One simultaneous gradient update">
    <div className="flow-columns-2"><div><p className="dw-parameter">Pointwise weights [2, −1]</p>
      <p className="dw-gradient">Derivative {vector(result.mixingGradient)}</p>
      <p className="dw-parameter">After step: {vector(result.nextMixing)}</p></div>
      <div>{result.filterGradient.map((values, index) => <div key={index}><p className="dw-parameter">Spatial filter {index ? 'B' : 'A'}</p>
        <p className="dw-gradient">Derivative {vector(values)}</p><p className="dw-parameter">After step: {vector(result.nextFilters[index])}</p></div>)}</div></div>
    <FlowControls><FlowSlider name="Desired output (target)" value={target} onChange={setTarget} min={-3} max={3} />
      <FlowSlider name="Simultaneous step size" value={rate} onChange={setRate} min={0} max={.1} step={.001} /></FlowControls>
    <FlowReadout>Output −3 becomes <strong>{f(result.after)}</strong>; half squared loss {f(result.loss)} becomes <strong>{f(result.nextLoss)}</strong>. {rate === 0 ? 'A zero step changes no weights.' : result.nextLoss > result.loss ? 'The step overshoots: reduce its size.' : 'All new weights use derivatives from the same starting state.'}</FlowReadout>
  </FlowLab>;
}

export function DepthwiseRankLab() {
  const [secondTap, setSecondTap] = useState(0);
  const [secondRoute, setSecondRoute] = useState(0);
  const result = rankProbe([[1, secondTap], [0, 1]], [[1, 0], [0, secondRoute]]);
  return <FlowLab id="depthwise-rank" label="Independent spatial patterns and rank">
    <div className="flow-columns-2"><div><p className="dw-parameter">First pattern D₁ = [1, {f(secondTap)}]</p><p className="dw-parameter">Second pattern D₂ = [0, 1]</p></div>
      <div><p className="dw-parameter">Output 1 mixing = [1, 0]</p><p className="dw-parameter">Output 2 mixing = [0, {f(secondRoute)}]</p></div></div>
    <FlowArrow>each output's effective filter is a sum of shared patterns</FlowArrow>
    <p className="dw-parameter">Effective kernel: [[1, {f(secondTap)}], [0, {f(secondRoute)}]]</p>
    <div className="flow-columns-2">{result.probes.map((probe, index) => <div key={index}>
      <p className="dw-input">Independent probe {index + 1}: {vector(probe)}</p>
      <div className="dw-operation">Apply effective kernel</div><p className="dw-computed">Output {vector(result.outputs[index])}</p>
      <p>Required unchanged patch: {vector(probe)}</p>
    </div>)}</div>
    <FlowControls><FlowSlider name="First pattern's second tap" value={secondTap} onChange={setSecondTap} min={-2} max={2} />
      <FlowSlider name="Second pattern's output weight" value={secondRoute} onChange={setSecondRoute} min={-2} max={2} /></FlowControls>
    <FlowReadout>The current kernel has rank <strong>{secondRoute === 0 ? 1 : 2}</strong>, with maximum probe error <strong>{f(result.error)}</strong>. Two filters are always allocated (multiplier 2); a zero second-route weight reduces the current rank, but does not reclaim that allocation.</FlowReadout>
  </FlowLab>;
}

export function DepthwiseStencilLab() {
  const [dilation, setDilation] = useState(2);
  const [center, setCenter] = useState(4);
  const [sixthValue, setSixthValue] = useState(7);
  const signal = replace(initialSignal, 6, sixthValue);
  const result = sampleStencil(signal, center, dilation);
  return <FlowLab id="depthwise-stencil" label="Dilated filter addresses and contributions">
    <ValueStrip values={signal.map(value => f(value))} selected={result.terms.map(term => term.index)} indices />
    <FlowArrow>three taps read center − dilation, center, center + dilation</FlowArrow>
    <div className="flow-columns-3">{result.terms.map((term, index) => <div key={index}>
      <p>{term.padded ? 'Zero padding' : 'Input'} at index {term.index}</p><div className="dw-operation">{f(term.value)} × <span className="dw-parameter">weight 1</span></div>
      <p className="dw-computed">Contribution {f(term.product)}</p>
    </div>)}</div>
    <FlowControls><FlowSlider name="Dilation (tap spacing)" value={dilation} onChange={setDilation} min={1} max={8} step={1} />
      <FlowSlider name="Output center index" value={center} onChange={setCenter} min={0} max={8} step={1} />
      <FlowSlider name="Signal value at index 6" value={sixthValue} onChange={setSixthValue} min={-5} max={20} /></FlowControls>
    <FlowReadout>Indices {result.terms.map(term => term.index).join(', ')} give sum <strong>{f(result.sum)}</strong>; three learned taps span <strong>{2 * dilation + 1}</strong> positions. {result.terms.some(term => term.index === 6) ? 'Index 6 is read, so its edit changes this sum.' : 'Index 6 is not read, so its edit leaves this sum unchanged.'}</FlowReadout>
  </FlowLab>;
}

export function DepthwiseCoverageLab() {
  const [rates, setRates] = useState([1, 2, 4]);
  const result = samplingSupport(rates);
  return <FlowLab id="depthwise-coverage" label="Serial dilation reachability">
    {result.layers.map((sites, index) => <div key={index}><p>{index === 0 ? 'Start at output offset 0' : `After adding layer ${index}'s offsets −${rates[index - 1]}, 0, ${rates[index - 1]}`}</p>
      <div className="dw-offsets">{sites.map(site => <span className="dw-reachable" key={site}>{site}</span>)}</div></div>)}
    <p>Violet underlines mark reached offsets; crossed numbers below are holes inside the bound.</p>
    <div className="dw-offsets">{result.holes.map(hole => <span className="dw-hole" key={hole}>{hole}</span>)}</div>
    <FlowControls>{rates.map((rate, index) => <FlowSlider key={index} name={`Layer ${index + 1} dilation`} value={rate} onChange={value => setRates(previous => replace(previous, index, value))} min={1} max={9} step={1} />)}</FlowControls>
    <FlowReadout>The bound has width <strong>{result.width}</strong>, but only <strong>{result.sites.length}</strong> 1D sites are reachable: {result.holes.length ? `${result.holes.length} holes remain` : 'no holes remain'}. Full 3×3 stencils in 2D reach {result.sites.length ** 2} of {result.width ** 2} bounding sites.</FlowReadout>
  </FlowLab>;
}

export function DepthwiseBoundaryLab() {
  const [dilation, setDilation] = useState(2);
  const [row, setRow] = useState(4);
  const [column, setColumn] = useState(4);
  const taps = finiteTaps(row, column, dilation);
  return <FlowLab id="depthwise-boundary" label="Finite map and zero-padding taps">
    <p>8×8 input map; white outlines = read data sites, filled cell = selected output center.</p>
    <div className="dw-lattice">{Array.from({ length: 64 }, (_, index) => {
      const r = Math.floor(index / 8), c = index % 8;
      return <span key={index} className={`${taps.some(([tr, tc]) => tr === r && tc === c) ? 'dw-read' : ''} ${row === r && column === c ? 'dw-center' : ''}`} aria-label={`Row ${r}, column ${c}`}>{r},{c}</span>;
    })}</div>
    <FlowControls><FlowSlider name="Finite-map dilation" value={dilation} onChange={setDilation} min={1} max={8} step={1} />
      <FlowSlider name="Output row" value={row} onChange={setRow} min={0} max={7} step={1} />
      <FlowSlider name="Output column" value={column} onChange={setColumn} min={0} max={7} step={1} /></FlowControls>
    <FlowReadout>At ({row}, {column}), <strong>{taps.length}</strong> of nine taps read data; <strong>{9 - taps.length}</strong> multiply zero padding. Dilation 8 leaves only the center at every position.</FlowReadout>
  </FlowLab>;
}

export function DepthwiseContextLab() {
  const [farValue, setFarValue] = useState(9);
  const [farWeight, setFarWeight] = useState(.3);
  const signal = replace(initialSignal, 8, farValue);
  const mixing = [0, .1, .2, farWeight, 1];
  const result = parallelContext(signal, mixing);
  const names = ['Center only', 'Dilation 1', 'Dilation 2', 'Dilation 4', 'Whole-strip mean'];
  return <FlowLab id="depthwise-context" label="Same-input parallel context and projection">
    <ValueStrip values={signal.map(value => f(value))} indices />
    <FlowArrow>the same strip feeds all five routes, at center 4</FlowArrow>
    <div className="dw-context-routes">{names.map((name, index) => <div key={name}>
      <div className="dw-operation">{name}<br />{index === 0 ? 'read 4' : index === 4 ? 'read all 9 sites' : `read ${sampleStencil(signal, 4, [1, 2, 4][index - 1]).terms.map(term => term.index).join(', ')}`}</div>
      <p className="dw-computed">Branch value {f(result.branches[index])}</p><p className="dw-parameter">Projection weight {f(mixing[index])}</p>
      <p className="dw-computed">Contribution {f(result.contributions[index])}</p>
    </div>)}</div>
    <FlowArrow>concatenate branch values, then multiply and add</FlowArrow>
    <FlowControls><FlowSlider name="Far signal value at index 8" value={farValue} onChange={setFarValue} min={-5} max={20} />
      <FlowSlider name="Dilation-4 projection weight" value={farWeight} onChange={setFarWeight} min={-2} max={2} step={.1} /></FlowControls>
    <FlowReadout>Projection gives <strong>{f(result.output)}</strong> from {vector(result.branches)}. Index 8 changes only the dilation-4 and mean routes; its total influence is {f(farWeight + 1 / 9)} per unit change.</FlowReadout>
  </FlowLab>;
}

export function DepthwiseSupportingFigure({ kind }) {
  if (kind === 'field') return <ReceptiveJumpFigure />;
  return <figure data-figure="separable-weight-budget">
    <p className="dw-parameter">Dense: 73,728 learned weights</p><div className="dw-budget"><span style={{ width: '100%' }} /></div>
    <p className="dw-parameter">Separable: 576 spatial + 8,192 pointwise = 8,768 learned weights</p>
    <div className="dw-budget"><span style={{ width: `${576 / 73728 * 100}%` }} /><span className="dw-mixing" style={{ width: `${8192 / 73728 * 100}%` }} /></div>
    <p>Both bars start at zero and use the same scale. Amber fill marks spatial weights; amber outline marks pointwise weights.</p>
  </figure>;
}

export function DepthwiseProgram({ file, title }) {
  return <RemoteCodeBlock source={depthwiseAsset + file} language="python" filename={file} title={title} />;
}

function useDigitResource(enabled) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch(depthwiseAsset + 'digit-inference.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Saved weights could not be loaded.'); return response.json(); })
      .then(data => { if (!controller.signal.aborted) setState({ data, error: null }); })
      .catch(error => { if (!controller.signal.aborted) setState({ data: null, error: error.message }); });
    return () => controller.abort();
  }, [enabled, attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}

const multiplierOptions = [1, 2, 4, 9].map(value => [value, String(value)]);

function DigitExperiment({ run }) {
  const example = run.examples.find(item => item.source_id === 299) || run.examples[0];
  const [multiplier, setMultiplier] = useState(1);
  const [pixel, setPixel] = useState(0);
  const [image, setImage] = useState(example.input);
  const dense = useMemo(() => savedDigitLogits(run, image), [run, image]);
  const compressed = useMemo(() => savedDigitLogits(run, image, multiplier), [run, image, multiplier]);
  const largest = Math.max(...dense.map(Math.abs), ...compressed.map(Math.abs), 1);
  const argmax = values => values.indexOf(Math.max(...values));
  const row = Math.floor(pixel / 8), column = pixel % 8;
  return <FlowLab id="depthwise-digits" label="Live fixed-weight digit compression comparison">
    <div className="flow-columns-2"><div><p className="dw-input">Source {example.source_id}, original digit {example.actual}; select a pixel (white outline)</p>
      <div className="dw-digit-grid">{image.flatMap((values, r) => values.map((value, c) => <button key={`${r}-${c}`} type="button"
        style={{ backgroundColor: `rgb(${value * 255}, ${value * 255}, ${value * 255})` }}
        aria-pressed={pixel === r * 8 + c} aria-label={`Pixel ${r}, ${c}; intensity ${f(value)}`} onClick={() => setPixel(r * 8 + c)} />))}</div>
      <p>Black = 0, white = 1; edited images need not retain the original digit label.</p></div>
      <div><p>Signed logits: grey bar = dense model, violet bar = compressed; each row is one class. Zero is the center, shared scale ±{f(largest, 2)}.</p>
        {dense.map((value, index) => <div className="dw-score-row" key={index}><span>{index}</span><div className="dw-score-track">{[value, compressed[index]].map((score, kind) =>
          <span key={kind} className={kind ? 'dw-score-compressed' : 'dw-score-dense'} style={{ left: `${50 + Math.min(0, score) / largest * 50}%`, width: `${Math.abs(score) / largest * 50}%` }} />)}</div></div>)}</div></div>
    <FlowControls><FlowChoice label="Retained patterns per input (m)" options={multiplierOptions} value={multiplier} onChange={setMultiplier} />
      <FlowSlider name={`Pixel (${row}, ${column}) intensity`} value={image[row][column]} min={0} max={1} step={.0625}
        onChange={value => setImage(previous => previous.map((values, r) => r === row ? replace(values, column, value) : values))} /></FlowControls>
    <FlowReadout>Fixed seed-1, dilation-1 weights give dense class <strong>{argmax(dense)}</strong> and compressed class <strong>{argmax(compressed)}</strong>; original-label logits are {f(dense[example.actual])} and {f(compressed[example.actual])}. Changes run inference only.</FlowReadout>
    <NeuralTable caption="Current image: exact class scores" headers={['Class', 'Dense', 'Compressed', 'Difference']} rows={dense.map((value, index) => [index, f(value, 4), f(compressed[index], 4), f(compressed[index] - value, 4)])} />
  </FlowLab>;
}

function KernelExperiment({ run }) {
  const [input, setInput] = useState(0);
  const [output, setOutput] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const original = run.dense_state['spatial.weight'][output][input];
  const reconstructed = reconstructedKernel(run, multiplier, input, output);
  const grids = [original, reconstructed, original.map((values, r) => values.map((value, c) => reconstructed[r][c] - value))];
  return <FlowLab id="depthwise-kernel" label="Independent fixed-model spatial kernel inspection">
    <div className="flow-columns-3">{grids.map((grid, index) => <div key={index}><p>{['Original kernel', 'Reconstructed P·D', 'Reconstruction − original'][index]}</p>
      <div className="dw-weight-grid">{grid.flat().map((value, cell) => <span key={cell} className={Math.abs(value) < .00005 ? 'dw-zero' : value < 0 ? 'dw-negative' : ''}>{f(value, 4)}</span>)}</div></div>)}</div>
    <p>Amber positive, blue negative, neutral values rounding to zero; each cell shows a learned weight, not an activation.</p>
    <FlowControls><FlowSlider name="Kernel input channel" value={input} onChange={setInput} min={0} max={7} step={1} />
      <FlowSlider name="Kernel output channel" value={output} onChange={setOutput} min={0} max={11} step={1} />
      <FlowChoice label="Retained patterns here (m)" options={multiplierOptions} value={multiplier} onChange={setMultiplier} /></FlowControls>
    <FlowReadout>Kernel {input} → {output} has maximum entry error <strong>{f(Math.max(...grids[2].flat().map(Math.abs)))}</strong>. This is the same seed-1, dilation-1 model, with independent controls: this m does not change the digit comparison above.</FlowReadout>
  </FlowLab>;
}

export function DepthwiseDigitLab({ kind = 'digit' }) {
  const [anchor, ready] = useLessonViewport();
  const resource = useDigitResource(ready);
  const run = resource.data?.runs.find(item => item.dilation === 1);
  return <div ref={anchor}>{resource.error ? <p role="alert">{resource.error} <button className="dw-retry" type="button" onClick={resource.retry}>Retry saved weights</button></p>
    : run ? kind === 'kernel' ? <KernelExperiment run={run} /> : <DigitExperiment run={run} />
      : <p role="status">Saved weights load as this investigation approaches the screen…</p>}</div>;
}
