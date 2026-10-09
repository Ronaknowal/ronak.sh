import { useEffect, useMemo, useRef, useState } from 'react';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { ConvNeXtNormalizationDrawing, ConvNeXtResponseDrawing, ConvNeXtFusionDrawing, ConvNeXtNonlinearDrawing } from './ConvNeXtDrawings.jsx';
import { blockBudget, defaultFusion, foldBranches, maxDifference, normalizeLocations, reconstruct, responseNormalize } from '../../data/convnext-models.js';
import measurements from '../../data/convnext-measurements.json';
import './convnext.css';
import './convnext-flow.css';


export const convnextAsset = '/learn-assets/convnext-modern-cnn-designs/';
const integer = value => value.toLocaleString('en-US');

export function ConvNeXtProgram({ file, title }) {
  return <RemoteCodeBlock source={convnextAsset + file} language="python" filename={file} title={title}/>;
}

export function ConvNeXtGenealogy() {
  const stages = [
    ['Prior ResNet', 76.13, 'Historical recipe: cited baseline, not a new paired run.'],
    ['Enhanced recipe', 78.82, 'Training changes first; standard deviation 0.07.'],
    ['Stage ratio + patchify stem', 79.51, 'Stage ratio alone: 79.36 ± 0.07; patchify: ± 0.18.'],
    ['Depthwise replacement', 78.28, 'Spatial channel connectivity removed; ± 0.08.'],
    ['Widen channels', 80.50, 'Capacity and budget increase together; ± 0.02.'],
    ['Invert bottleneck', 80.64, 'Channel transformations expand, then project; ± 0.03.'],
    ['Move depthwise first', 79.92, 'Spatial filtering uses the narrower width; ± 0.08.'],
    ['Increase kernel to 7', 80.57, 'Size 5: 80.35 ± 0.08; size 7: ± 0.14.'],
  ];
  return <figure data-figure="convnext-measured-history"><NeuralTable caption="Published ImageNet top-1 accuracy; V1 Appendix C, Table 10" headers={['Intervention in sequence', 'Accuracy', 'Conditions']} rows={stages.map(([name, accuracy, note]) => [name, `${accuracy.toFixed(2)}%`, note])}/><p>Modernized values average three seeds. Side branches: size 9 gave 80.57 ± 0.06%, size 11 gave 80.47 ± 0.11%. Later changes reached 81.97 ± 0.06%; the final reported checkpoint was 82.1%. Each row depends on earlier changes.</p></figure>;
}

export function ConvNeXtNormalizationLab() {
  const [secondValue, setSecondValue] = useState(101);
  const locations = [[1, 3], [secondValue, 103]];
  const local = normalizeLocations(locations, 'channels');
  const whole = normalizeLocations(locations, 'whole');
  return <FlowLab id="convnext-normalization" label="Compare channel normalization groups on one image">
    <ConvNeXtNormalizationDrawing locations={locations} local={local} whole={whole}/>
    <NeuralTable caption="The values in each outlined group determine these statistics" headers={['Group', 'Mean', 'Population variance']} rows={[
      ...local.statistics.map((stat,index)=>[`Channel LayerNorm: location ${index}`,number(stat.mean),number(stat.variance)]),
      ['GroupNorm: both locations',number(whole.statistics[0].mean),number(whole.statistics[0].variance)],
    ]}/>
    <FlowControls><FlowSlider name="Location 1, channel A input" value={secondValue} onChange={setSecondValue} min={-20} max={120} step={.25}/></FlowControls>
    <FlowReadout>Location 0 remains [{local.output[0].map(value => number(value)).join(', ')}] under channel LayerNorm; its GroupNorm result is [{whole.output[0].map(value => number(value)).join(', ')}], because only the second route shares statistics across locations.</FlowReadout>
  </FlowLab>;
}

export function ConvNeXtHierarchy() {
  return <figure data-figure="convnext-hierarchy"><div className="cnx-data">224 × 224 RGB input → 4 × 4 stride-4 stem → 56 × 56 × 96</div><div className="cnx-hierarchy">{[56, 28, 14, 7].map((side, index) => <div key={side}><span>Stage {index + 1}</span><div className="cnx-stage-scale"><div className="cnx-stage-square" style={{ width: `${100 * side / 56}%` }}/></div><p className="cnx-computed">{side} × {side} locations; {96 * 2 ** index} channels<br/>{index === 2 ? 9 : 3} blocks, each preserving this shape</p>{index < 3 && <p className="cnx-arrow">↓ channel LayerNorm → 2 × 2 stride-2 convolution → next stage</p>}</div>)}</div><p>Squares share one spatial scale; channel width is written separately. Final stage → average locations → channel LayerNorm → class scores.</p></figure>;
}

export function ConvNeXtBudgetLab() {
  const [channels, setChannels] = useState(96), [kernel, setKernel] = useState(7), [side, setSide] = useState(14);
  const result = blockBudget(channels, 4, kernel, side, side, 1);
  return <FlowLab id="convnext-budget" label="Allocate ConvNeXt V1 parameters and convolution work">
    <NeuralTable caption="V1 block: fourfold expansion, biases included" headers={['Spatial filter', 'Channel norm', 'Expand', 'Project', 'LayerScale']} rows={[[result.depthwise, result.norm, result.expand, result.project, result.response].map(integer)]}/>
    <p>Calculated MAC shares: cyan spatial filtering {integer(result.spatialMacs)}; violet channel mixing {integer(result.channelMacs)}.</p>
    <div className="cnx-split" role="img" aria-label={`Spatial filtering ${number(100 * result.spatialMacs / result.macs, 2)}%; channel mixing ${number(100 * result.channelMacs / result.macs, 2)}%`}><span style={{ flex: result.spatialMacs }}/><span style={{ flex: result.channelMacs }}/></div>
    <FlowControls><FlowSlider name="Channel width C" value={channels} onChange={setChannels} min={4} max={256} step={4}/><FlowSlider name="Odd spatial kernel side" value={kernel} onChange={setKernel} min={3} max={11} step={2}/><FlowSlider name="Square feature-grid side" value={side} onChange={setSide} min={1} max={56} step={1}/></FlowControls>
    <FlowReadout>The block has <strong>{integer(result.parameters)}</strong> parameters and <strong>{integer(result.macs)}</strong> convolution/linear MACs per image; grid area changes work, while channel width and kernel size also change learned parameter count.</FlowReadout>
  </FlowLab>;
}

export function ConvNeXtResponseLab() {
  const [secondChannelValue, setSecondChannelValue] = useState(12), [firstScale, setFirstScale] = useState(.5);
  const maps = [[3, 4], [0, secondChannelValue]];
  const result = responseNormalize(maps, [firstScale, -.5], [0, 0]);
  return <FlowLab id="convnext-grn" label="One whole channel map changes another through a shared denominator">
    <ConvNeXtResponseDrawing maps={maps} result={result} scales={[firstScale,-.5]}/>
    <FlowControls><FlowSlider name="Channel B, second spatial value" value={secondChannelValue} onChange={setSecondChannelValue} min={0} max={24} step={.25}/><FlowSlider name="Channel A scale γA" value={firstScale} onChange={setFirstScale} min={-1} max={1} step={.05}/></FlowControls>
    <FlowReadout>A's first input stays 3, but its output becomes <strong>{number(result.output[0][0])}</strong> through 3 × (1 + γA × RA); at γA = 0 it stays 3 even when B changes the shared statistic.</FlowReadout>
  </FlowLab>;
}

function PixelMap({ label, values, mask, selected, onSelect }) {
  return <div><p>{label}</p><div className="cnx-pixel-grid">{values.flat().map((value, index) => {
    const row = Math.floor(index / 8), column = index % 8;
    const hidden = mask && !mask[Math.floor(row / 2)][Math.floor(column / 2)];
    const properties = { style: { '--intensity': Math.max(0, Math.min(1, value)) }, 'data-hidden': !!hidden };
    return onSelect ? <button type="button" key={index} {...properties} aria-label={`${label}: row ${row}, column ${column}, value ${number(value)}${hidden ? ', hidden target' : ', visible input'}`} aria-pressed={selected === index} onClick={() => onSelect(index)}>{hidden ? '×' : ''}</button> : <span key={index} {...properties} title={`Row ${row}, column ${column}: ${number(value)}`}>{hidden ? '×' : ''}</span>;
  })}</div><p className="flow-note">Black = 0, amber = 1; display clips colour only. × marks unavailable input; arithmetic retains unrounded values.</p></div>;
}

function useSavedModels() {
  const container = useRef(null);
  const [models, setModels] = useState(null), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let observer;
    const load = () => {
      observer?.disconnect();
      setFailed(false);
      fetch(convnextAsset + 'saved-models.json', { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error('Saved model request failed');
        return response.json();
      }).then(setModels).catch(error => { if (error.name !== 'AbortError') setFailed(true); });
    };
    if (attempt || typeof IntersectionObserver === 'undefined') load();
    else {
      observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) load(); }, { rootMargin: '800px' });
      if (container.current) observer.observe(container.current);
    }
    return () => { controller.abort(); observer?.disconnect(); };
  }, [attempt]);
  return { container, models, failed, retry: () => setAttempt(value => value + 1) };
}

function SavedModelView({ children }) {
  const { container, models, failed, retry } = useSavedModels();
  return <div ref={container}>{models ? children(models) : failed ? <><p role="alert">Saved weights could not load.</p><FlowControls><button type="button" onClick={retry}>Retry saved weights</button></FlowControls></> : <p role="status">Saved fixed weights load as this experiment approaches the viewport.</p>}</div>;
}

export function ConvNeXtReconstructionLab() {
  return <FlowLab id="convnext-mask" label="Edit a pixel with fixed seed 1 GRN weights"><SavedModelView>{models => <PixelIntervention models={models}/>}</SavedModelView></FlowLab>;
}

function PixelIntervention({ models }) {
  const model = models[1], example = model.examples[0];
  const [pixels, setPixels] = useState(example.input), [selectedPixel, setSelectedPixel] = useState(0);
  const baseline = useMemo(() => reconstruct(model.model_state, example.input, example.visible_patches), [model, example]);
  const result = useMemo(() => reconstruct(model.model_state, pixels, example.visible_patches), [model, pixels, example]);
  const row = Math.floor(selectedPixel / 8), column = selectedPixel % 8;
  const hidden = !example.visible_patches[Math.floor(row / 2)][Math.floor(column / 2)];
  return <><div className="flow-columns-2"><PixelMap label={`Editable target: source ${example.source_id}, actual digit ${example.actual}`} values={pixels} mask={example.visible_patches} selected={selectedPixel} onSelect={setSelectedPixel}/><PixelMap label="Visible-only encoder input" values={result.visibleInput} mask={example.visible_patches}/><PixelMap label="Computed reconstruction" values={result.output}/><PixelMap label="Computed hidden-pixel squared errors" values={result.errors}/></div><FlowControls><FlowSlider name={`Selected row ${row}, column ${column}: ${hidden ? 'hidden target' : 'visible input'}`} value={pixels[row][column]} onChange={value => setPixels(current => current.map((values, y) => values.map((entry, x) => y === row && x === column ? value : entry)))} min={0} max={1} step={.0625}/><button type="button" onClick={() => setPixels(example.input)}>Restore original image</button></FlowControls><FlowReadout>With fixed seed 1 GRN weights and mask, hidden-pixel MSE is <strong>{number(result.mse, 8)}</strong> (original {number(baseline.mse, 8)}); the largest output change is <strong>{number(maxDifference(result.output, baseline.output), 8)}</strong>. This selected {hidden ? 'hidden target enters scoring only' : 'visible value enters the encoder'}.</FlowReadout><NeuralTable caption="Computed reconstruction values; rows and columns match the image" headers={['Row', ...Array.from({ length: 8 }, (_, index) => `c${index}`)]} rows={result.output.map((values, index) => [index, ...values.map(value => number(value, 7))])}/><NeuralTable caption="Squared errors; visible pixels contribute zero to this loss" headers={['Row', ...Array.from({ length: 8 }, (_, index) => `c${index}`)]} rows={result.errors.map((values, index) => [index, ...values.map(value => number(value, 7))])}/></>;
}

export function ConvNeXtPatchLab() {
  return <FlowLab id="convnext-patch-visibility" label="Swap available patches while retaining six visible"><SavedModelView>{models => <PatchIntervention models={models}/>}</SavedModelView></FlowLab>;
}

function PatchIntervention({ models }) {
  const model = models[1], example = model.examples[0];
  const [mask, setMask] = useState(example.visible_patches), [selectedPatch, setSelectedPatch] = useState(null);
  const baseline = useMemo(() => reconstruct(model.model_state, example.input, example.visible_patches), [model, example]);
  const result = useMemo(() => reconstruct(model.model_state, example.input, mask), [model, example, mask]);
  const select = index => {
    if (selectedPatch === null || mask.flat()[selectedPatch] === mask.flat()[index]) { setSelectedPatch(selectedPatch === index ? null : index); return; }
    setMask(current => current.map((values, row) => values.map((entry, column) => row * 4 + column === index || row * 4 + column === selectedPatch ? 1 - entry : entry)));
    setSelectedPatch(null);
  };
  return <><div className="flow-columns-2"><PixelMap label="Fixed original image; × follows hidden patches" values={example.input} mask={mask}/><PixelMap label="Reconstruction from the current visible set" values={result.output}/></div><FlowControls><div role="group" aria-label="Choose two patches with opposite visibility"><p>Select one visible patch and one hidden patch to exchange them; V = visible, × = hidden.</p><div className="cnx-patches">{mask.flat().map((value, index) => <button type="button" key={index} data-visible={!!value} aria-pressed={selectedPatch === index} aria-label={`Patch row ${Math.floor(index / 4)}, column ${index % 4}: ${value ? 'visible' : 'hidden'}`} onClick={() => select(index)}>{value ? 'V' : '×'}</button>)}</div></div><button type="button" onClick={() => { setMask(example.visible_patches); setSelectedPatch(null); }}>Restore original visibility</button></FlowControls><FlowReadout>{selectedPatch === null ? 'Six patches are visible and ten are hidden.' : `Patch ${selectedPatch} is selected; choose one with the opposite visibility.`} Current MSE is <strong>{number(result.mse, 8)}</strong>; largest output change from the original mask is <strong>{number(maxDifference(result.output, baseline.output), 8)}</strong>. Image and model weights stay fixed.</FlowReadout></>;
}

export function ConvNeXtRecordedExperiment() {
  const [seed, setSeed] = useState(1);
  const runs = measurements.runs.filter(run => run.seed === seed);
  return <FlowLab id="convnext-recorded-experiment" label="Inspect recorded paired training seeds"><NeuralTable caption="Recorded learning trajectory; includes the untrained step 0" headers={['Update', 'GRN absent MSE', 'GRN present MSE']} rows={runs[0].trace.map((entry, index) => [entry.step, number(entry.development_masked_mse, 7), number(runs[1].trace[index].development_masked_mse, 7)])}/><div>{runs.map(run => {
    const mse = run.trace.at(-1).development_masked_mse;
    return <div key={String(run.global_response)}><p>Final GRN {run.global_response ? 'present' : 'absent'}: MSE {number(mse, 7)}</p><div className="cnx-bar" role="img" aria-label={`Final MSE ${mse}, focused scale 0.050 to 0.053`}><span style={{ width: `${100 * (mse - .05) / .003}%` }}/></div></div>;
  })}</div><p className="flow-note">Both final-MSE bars share a focused 0.050–0.053 scale; zero-length means 0.050, not zero error. The table retains the full training path.</p><NeuralTable caption="Separate downstream and feature diagnostics" headers={['Representation', 'Probe correct / 120', 'Mean cosine distance', 'Near-zero fraction']} rows={[['Raw pixels', measurements.raw_pixel_linear_probe.development_correct, '—', '—'], ...runs.map(run => [`GRN ${run.global_response ? 'present' : 'absent'}`, run.linear_probe.development_correct, number(run.development_feature_diagnostics.mean_nonself_cosine_distance, 7), number(run.development_feature_diagnostics.near_zero_channel_fraction)])]}/><FlowControls><FlowChoice label="Recorded paired seed" value={seed} onChange={setSeed} options={[1, 2, 3].map(value => [value, String(value)])}/></FlowControls><FlowReadout>Seed <strong>{seed}</strong> selects two recorded fits; it does not train a new model. The reconstruction criterion and the frozen-classifier count answer different questions.</FlowReadout></FlowLab>;
}

export function ConvNeXtFusionLab() {
  const [centreWeight, setCentreWeight] = useState(.4), [gamma, setGamma] = useState(3), [inputValue, setInputValue] = useState(13);
  const config = { ...defaultFusion, gamma, kernel: defaultFusion.kernel.map((entry, index) => index === 4 ? centreWeight : entry), image: defaultFusion.image.map((entry, index) => index === 12 ? inputValue : entry) };
  const result = foldBranches(config, false);
  return <FlowLab id="convnext-fusion" label="Fold fixed affine branches into one kernel"><ConvNeXtFusionDrawing config={config} result={result}/><FlowControls><FlowSlider name="Centre spatial weight" value={centreWeight} onChange={setCentreWeight} min={-3} max={3} step={.1}/><FlowSlider name="First BatchNorm scale γ" value={gamma} onChange={setGamma} min={-3} max={3} step={.1}/><FlowSlider name="Input centre value" value={inputValue} onChange={setInputValue} min={-20} max={30} step={.5}/></FlowControls><FlowReadout>Separate branches give centre <strong>{number(result.separate[12], 8)}</strong>; fused convolution gives <strong>{number(result.folded[12], 8)}</strong>; largest difference across all 25 outputs is <strong>{result.difference.toExponential(2)}</strong>.</FlowReadout><p>Same 5 × 5 input in every branch; first BatchNorm mean 1, variance 4, β = −0.2, ε = 10⁻⁵. All other branch parameters stay fixed. White centre outlines show where the 1 × 1 and identity impulses enter.</p></FlowLab>;
}

export function ConvNeXtNonlinearLab() {
  const [input, setInput] = useState(-2);
  return <FlowLab id="convnext-nonlinear-fusion" label="Test the boundary of linear branch folding"><ConvNeXtNonlinearDrawing input={input}/><FlowControls><FlowSlider name="Scalar input x" value={input} onChange={setInput} min={-3} max={3} step={.1}/></FlowControls><FlowReadout>The difference is <strong>{number(Math.abs(input))}</strong>; agreement at x = 0 does not make the two functions identical elsewhere.</FlowReadout></FlowLab>;
}
