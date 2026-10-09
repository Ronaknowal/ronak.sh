import {
  createContext, useContext, useEffect, useId, useMemo, useState,
} from 'react';
import {
  FlowControls, FlowLab, FlowReadout, FlowSlider, flowNumber,
} from './LessonFlow.jsx';
import useLessonViewport from './useLessonViewport.js';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import {
  composeInfluence, dinoDirection, featureCosines, gramGeometry, patchProjection, visionMACs, windowRead,
} from '../../data/vision-transformer-models.js';
import { balancedPrototypeTrace, inspectVisionHead, traceVisionEncoder } from '../../data/vision-transformer-flow-models.js';
import examples from '../../data/vision-transformer-examples.json';
import { VisionPatchCoordinateDrawing, VisionPatchProjectionDrawing } from './VisionTransformerFlowFigures.jsx';
import { VisionRelativeBiasDrawing, VisionTwoHopPathsDrawing, VisionWindowInfluenceDrawing } from './VisionTransformerSpatialFigures.jsx';
import { VisionBalancedPrototypeDrawing, VisionDinoStudentDrawing, VisionDinoTargetDrawing, VisionGramDirectionsDrawing, VisionGramMatrixDrawing } from './VisionTransformerLearningFigures.jsx';
import { VisionActivationDrawing, VisionAffineCutawayDrawing, VisionClassProbabilityDrawing, VisionDigitDrawing, VisionHeadContributionDrawing, VisionHeadReadDrawing, VisionNativeAssemblyDrawing, VisionNormalizationDrawing, VisionResidualDrawing, VisionSlotIdentityDrawing } from './VisionTransformerEncoderFigures.jsx';
import { VisionCosineRetrievalDrawing, VisionFeatureAtlasDrawing } from './VisionTransformerFeatureFigures.jsx';
import { VisionOperationCountDrawing, visionOperationCounts } from './VisionTransformerSystemFigures.jsx';
import './vision-transformer-flow.css';

const VisionCases = createContext(null);
const cloneRows = rows => rows.map(row => [...row]);
const identityOrder = () => Array.from({ length: 16 }, (_, index) => index);
const replaceAt = (values, index, value) => values.map((old, position) => position === index ? value : old);
const replaceCell = (rows, row, column, value) => replaceAt(rows, row, replaceAt(rows[row], column, value));
const freshPatch = () => ({
  pixels: [2,1,4,0], weights: [[1,0,0,1],[0,1,-1,0]], biases: [.5,1],
  pixel: 2, feature: 1, pinned: [2.5,-2],
});
const workedDino = () => ({
  teacher: [.4,.1,-.2], center: [.1,0,-.1], student: [.1,.2,-.1],
  prototype: 2, role: 'teacher', teacherTemperature: .2, studentTemperature: .5,
  offset: 0, rate: .05,
});
const directionDino = () => ({
  teacher: [.2,-.1,.4], center: [.1,.1,0], student: [0,.2,-.2],
  prototype: 2, role: 'teacher', teacherTemperature: .25, studentTemperature: .5,
  offset: 0, rate: .05,
});
const freshWindows = () => ({
  values: Array.from({ length: 36 }, (_, index) => index === 0 ? 16 : 0),
  source: 0, destination: 14, window: 2, shift: 1, layers: 2, wrap: false,
});
const freshBias = () => ({
  values: Array.from({ length: 36 }, (_, index) => index === 7 ? 10 : 0),
  source: 7, destination: 14, offset: 8,
  bias: [[0,0,0],[0,0,0],[0,0,0]], wrap: false,
});
const freshImage = () => ({
  source: 2, image: cloneRows(examples.examples[2].image), pixel: 19,
  order: identityOrder(), movePositions: false, patchA: 5, patchB: 6,
  block: 1, head: 0, receiver: 0, donor: 0, featurePatch: 5, featureAxis: 0,
});

function useVisionCase() {
  const value = useContext(VisionCases);
  if (!value) throw new Error('A vision investigation must be inside VisionLessonProvider.');
  return value;
}

// One case per operator, shared by its small consecutive questions. Input state
// lives above lazy asset loading so a retry cannot discard the learner's edits.
export function VisionLessonProvider({ children }) {
  const [patch, setPatch] = useState(freshPatch);
  const [dino, setDino] = useState(workedDino);
  const [direction, setDirection] = useState(directionDino);
  const [windows, setWindows] = useState(freshWindows);
  const [bias, setBias] = useState(freshBias);
  const [angles, setAngles] = useState([0,90,180,270]);
  const [selectedFeature, setSelectedFeature] = useState(3);
  const [image, setImage] = useState(freshImage);
  const [targetSource,setTargetSource]=useState(1);
  const [resetToken, setResetToken] = useState(0);
  const [requested, setRequested] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!requested) return undefined;
    const controller = new AbortController();
    setError(false);
    fetch('/learn-assets/vision-transformers-vit-deit-swin-dinov2/plain-vit.json', { signal: controller.signal })
      .then(response => {
        if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || '')) {
          throw new Error('The saved vision model is unavailable.');
        }
        return response.json();
      })
      .then(value => {
        if (!value.state || value.state['head.weight']?.length !== 10 || value.state['patch.weight']?.length !== 32 || !value.pca) {
          throw new Error('The saved model has an incompatible feature layout.');
        }
        if (!controller.signal.aborted) setAsset(value);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [requested, attempt]);

  const projectedPatch = useMemo(() => patchProjection(patch.pixels, patch.weights, patch.biases), [patch]);
  const dinoRead = useMemo(() => dinoDirection(dino.teacher, dino.center, dino.student,
    dino.teacherTemperature, dino.studentTemperature, dino.offset), [dino]);
  const directionRead = useMemo(() => dinoDirection(direction.teacher, direction.center, direction.student,
    direction.teacherTemperature, direction.studentTemperature, direction.offset), [direction]);
  const gram = useMemo(() => gramGeometry(angles), [angles]);
  const windowReadout = useMemo(() => {
    const first = windowRead(windows.values, 6, 6, windows.window, 0);
    const second = windowRead(first.output, 6, 6, windows.window, windows.shift, { wrap: windows.wrap });
    const influence = windows.layers === 2 ? composeInfluence(second.weights, first.weights)
      : windows.layers === 1 ? first.weights
        : windows.values.map((_, row) => windows.values.map((__, column) => Number(row === column)));
    const output = windows.layers === 2 ? second.output : windows.layers === 1 ? first.output : windows.values;
    const shifted = windowRead(windows.values, 6, 6, windows.window, windows.shift, { wrap: windows.wrap });
    return { first, second, influence, output, shifted };
  }, [windows]);
  const biasReadout = useMemo(() => windowRead(bias.values, 6, 6, 2, 1, { bias: bias.bias, wrap: bias.wrap }), [bias]);
  const trace = useMemo(() => asset ? traceVisionEncoder(asset.state, image.image, {
    order: image.order, movePositions: image.movePositions, pca: asset.pca,
  }) : null, [asset, image.image, image.order, image.movePositions]);
  const originalTrace = useMemo(() => asset ? traceVisionEncoder(asset.state, examples.examples[image.source].image, {
    pca: asset.pca,
  }) : null, [asset, image.source]);
  const targetTrace=useMemo(()=>asset?traceVisionEncoder(asset.state,examples.examples[targetSource].image):null,[asset,targetSource]);

  const reset = operator => {
    if (operator === 'patch') setPatch(freshPatch());
    if (operator === 'dino') setDino(workedDino());
    if (operator === 'direction') setDirection(directionDino());
    if (operator === 'windows') setWindows(freshWindows());
    if (operator === 'bias') setBias(freshBias());
    if (operator === 'image') { setImage(freshImage());setTargetSource(1); }
    if (operator === 'gram') { setAngles([0,90,180,270]); setSelectedFeature(3); }
    setResetToken(value => value + 1);
  };
  return <VisionCases.Provider value={{
    patch, setPatch, projectedPatch, dino, setDino, dinoRead,
    direction, setDirection, directionRead, windows, setWindows, windowReadout,
    bias, setBias, biasReadout, angles, setAngles, selectedFeature, setSelectedFeature, gram,
    image, setImage, trace, originalTrace, targetSource, setTargetSource, targetTrace, asset, error, requested, setRequested,
    retry: () => setAttempt(value => value + 1), reset, resetToken,
  }}>{children}</VisionCases.Provider>;
}

export function VisionNumber({ name, value, onChange, min, max, integer = false }) {
  const identifier = useId();
  const { resetToken } = useVisionCase();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value, resetToken]);
  const parsed = Number(draft);
  const valid = draft.trim() !== '' && Number.isFinite(parsed)
    && parsed >= min && parsed <= max && (!integer || Number.isInteger(parsed));
  return <label className="vision-flow-field" htmlFor={identifier}>
    <span>{name}</span>
    <input id={identifier} aria-label={name} type="text" inputMode={integer ? 'numeric' : 'decimal'}
      value={draft} aria-invalid={!valid} aria-describedby={!valid ? `${identifier}-error` : undefined}
      onChange={event => {
        const next = event.target.value;
        setDraft(next);
        const number = Number(next);
        if (next.trim() && Number.isFinite(number) && number >= min && number <= max && (!integer || Number.isInteger(number))) {
          onChange(number);
        }
      }} />
    {!valid && <span id={`${identifier}-error`} role="status">Use {integer ? 'an integer' : 'a number'} from {min} to {max}.</span>}
  </label>;
}

export function VisionSelection({ name, value, onChange, options }) {
  const identifier = useId();
  return <label className="vision-flow-field" htmlFor={identifier}><span>{name}</span>
    <select id={identifier} aria-label={name} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, label]) => <option key={String(key)} value={key}>{label}</option>)}
    </select>
  </label>;
}

export function VisionModelBoundary({ children }) {
  const { asset, error, requested, setRequested, retry } = useVisionCase();
  const [container, nearby] = useLessonViewport();
  useEffect(() => { if (nearby) setRequested(true); }, [nearby, setRequested]);
  return <div ref={container}>
    {asset ? children : error ? <>
      <p role="alert">The saved model could not load. Your image edits remain available.</p>
      <FlowControls><button type="button" onClick={retry}>Retry saved model</button></FlowControls>
    </> : <p role="status">{requested ? 'Loading the fixed model…' : 'The fixed model loads as you reach this investigation.'}</p>}
  </div>;
}

export function VisionFlowProgram({ file, title }) {
  const source = `/learn-code/vision-transformers-vit-deit-swin-dinov2/${file}`;
  return <RemoteCodeBlock source={source} filename={file} language="python" title={title} />;
}

export function VisionPatchInvestigation({ question = 'pixels' }) {
  const { patch, setPatch, projectedPatch, reset } = useVisionCase();
  const update = changes => setPatch(old => ({ ...old, ...changes }));
  const pixelChoices = [0,1,2,3].map(index => [index, `Pixel ${index}`]);
  const featureChoices = [[0,'Feature 0'],[1,'Feature 1']];
  const output = projectedPatch.output;
  return <FlowLab id={question === 'pixels' ? 'vision-patch' : `vision-patch-${question}`} label={`Current patch: ${question}`}>
    {question==='compare' ? null : question === 'pixels'
      ? <VisionPatchProjectionDrawing pixels={patch.pixels} weights={patch.weights} biases={patch.biases} selectedPixel={patch.pixel} />
      : <VisionPatchCoordinateDrawing pixels={patch.pixels} weights={patch.weights} biases={patch.biases}
        selectedPixel={patch.pixel} selectedFeature={patch.feature} />}
    <FlowControls>
      {question === 'pixels' && <>
        <VisionSelection name="Pixel to change" value={patch.pixel} options={pixelChoices} onChange={value => update({ pixel: Number(value) })} />
        <VisionNumber name={`Pixel ${patch.pixel} value`} value={patch.pixels[patch.pixel]} min={0} max={16}
          onChange={value => update({ pixels: replaceAt(patch.pixels, patch.pixel, value) })} />
      </>}
      {question === 'coefficients' && <>
        <VisionSelection name="Output feature" value={patch.feature} options={featureChoices} onChange={value => update({ feature: Number(value) })} />
        <VisionSelection name="Pixel coordinate" value={patch.pixel} options={pixelChoices} onChange={value => update({ pixel: Number(value) })} />
        <VisionNumber name="Selected learned coefficient" value={patch.weights[patch.feature][patch.pixel]} min={-4} max={4}
          onChange={value => update({ weights: replaceCell(patch.weights, patch.feature, patch.pixel, value) })} />
      </>}
      {question === 'bias' && <>
        <VisionSelection name="Output feature" value={patch.feature} options={featureChoices} onChange={value => update({ feature: Number(value) })} />
        <VisionNumber name="Selected bias" value={patch.biases[patch.feature]} min={-8} max={8}
          onChange={value => update({ biases: replaceAt(patch.biases, patch.feature, value) })} />
      </>}
      {question === 'compare' && <>
        <button type="button" onClick={() => update({ pinned: [...output] })}>Keep these outputs for comparison</button>
        <button type="button" onClick={() => reset('patch')}>Restore the original patch and map</button>
      </>}
    </FlowControls>
    <FlowReadout>Current features are <strong>{visionVector(output)}</strong>; the change from the kept
      outputs {visionVector(patch.pinned)} is {visionVector(output.map((value, feature) => value - patch.pinned[feature]))}.
      Every question above uses this same edited patch and map.</FlowReadout>
  </FlowLab>;
}

const gridChoices = side => Array.from({length:side*side},(_,index)=>[index,`(${Math.floor(index/side)}, ${index%side})`]);
const prototypeChoices = [0,1,2].map(index=>[index,`Prototype ${index}`]);

export function VisionWindowInvestigation({ question = 'geometry' }) {
  const { windows, setWindows, windowReadout, reset } = useVisionCase();
  const update = changes=>setWindows(old=>({...old,...changes}));
  const selected = question==='wrap' ? windowReadout.shifted : windowReadout;
  const influence = question==='wrap' ? selected.weights : selected.influence;
  return <FlowLab id={`vision-window-${question}`} label={`Same uniform spatial case: ${question}`}>
    {question==='restore' ? null : question==='path' ? <VisionTwoHopPathsDrawing first={windowReadout.first.weights} second={windowReadout.second.weights}
      source={windows.source} destination={windows.destination} /> : <VisionWindowInfluenceDrawing values={windows.values} influence={influence} destination={windows.destination}
      source={windows.source} output={selected.output} window={windows.window} shift={windows.shift}
      layers={question==='wrap' ? 1 : windows.layers} wrap={windows.wrap} />}
    <FlowControls>
      {question==='geometry' && <>
        <VisionSelection name="Window side" value={windows.window} options={[[2,'2 × 2'],[3,'3 × 3']]}
          onChange={value=>update({window:Number(value),shift:Math.min(windows.shift,Number(value)-1)})} />
        <VisionNumber name="Shift in rows and columns" integer value={windows.shift} min={0} max={windows.window-1}
          onChange={value=>update({shift:value})} />
      </>}
      {question==='source' && <>
        <VisionSelection name="Original source cell" value={windows.source} options={gridChoices(6)} onChange={value=>update({source:Number(value)})} />
        <VisionNumber name="Selected source value" value={windows.values[windows.source]} min={-16} max={16}
          onChange={value=>update({values:replaceAt(windows.values,windows.source,value)})} />
      </>}
      {question==='receiver' && <>
        <VisionSelection name="Receiver cell" value={windows.destination} options={gridChoices(6)} onChange={value=>update({destination:Number(value)})} />
        <VisionSelection name="Completed uniform reads" value={windows.layers} options={[[0,'0: input only'],[1,'1: regular rooms'],[2,'2: regular then shifted']]}
          onChange={value=>update({layers:Number(value)})} />
      </>}
      {question==='wrap' && <VisionSelection name="Cyclic edge policy" value={String(windows.wrap)}
        options={[['false','Exclude wrapped edge records'],['true','Allow wrap: diagnostic only']]}
        onChange={value=>update({wrap:value==='true'})} />}
      {question==='path' && <>
        <VisionSelection name="Original source cell" value={windows.source} options={gridChoices(6)} onChange={value=>update({source:Number(value)})} />
        <VisionSelection name="Receiver cell" value={windows.destination} options={gridChoices(6)} onChange={value=>update({destination:Number(value)})} />
      </>}
      {question==='restore' && <button type="button" onClick={()=>reset('windows')}>Restore the spatial case</button>}
    </FlowControls>
    <FlowReadout>Receiver ({Math.floor(windows.destination/6)}, {windows.destination%6}) returns {flowNumber(question==='path' ? windowReadout.second.output[windows.destination] : selected.output[windows.destination],4)};
      original source ({Math.floor(windows.source/6)}, {windows.source%6}) has coefficient {flowNumber(question==='path' ? composeInfluence(windowReadout.second.weights,windowReadout.first.weights)[windows.destination][windows.source] : influence[windows.destination][windows.source],6)}.
      {question==='path' && ' This question inspects exactly two reads of the current rooms, regardless of the earlier completed-read selector.'}
      {question==='wrap' ? ' This is one direct shifted read of the same current source values.' : question==='path' ? ' This investigation composes the first window read with the shifted second read.' : ' The coefficients compose exactly the number of reads selected here.'}</FlowReadout>
  </FlowLab>;
}

export function VisionBiasInvestigation({ question = 'offset' }) {
  const { bias, setBias, biasReadout, reset }=useVisionCase();
  const update=changes=>setBias(old=>({...old,...changes}));
  const row=Math.floor(bias.offset/3),column=bias.offset%3;
  return <FlowLab id={`vision-bias-${question}`} label={`Same relative-bias case: ${question}`}>
    {question!=='restore' && <VisionRelativeBiasDrawing bias={bias.bias} destination={bias.destination} values={bias.values}
      weights={biasReadout.weights} output={biasReadout.output} source={bias.source} wrap={bias.wrap} />}
    <FlowControls>
      {question==='offset' && <>
        <VisionSelection name="Relative offset (query minus key)" value={bias.offset}
          options={Array.from({length:9},(_,index)=>[index,`(${Math.floor(index/3)-1}, ${index%3-1})`])}
          onChange={value=>update({offset:Number(value)})} />
        <VisionNumber name="Selected learned bias" value={bias.bias[row][column]} min={-8} max={8}
          onChange={value=>update({bias:replaceCell(bias.bias,row,column,value)})} />
      </>}
      {question==='value' && <>
        <VisionSelection name="Original source cell" value={bias.source} options={gridChoices(6)} onChange={value=>update({source:Number(value)})} />
        <VisionNumber name="Selected source value" value={bias.values[bias.source]} min={-16} max={16}
          onChange={value=>update({values:replaceAt(bias.values,bias.source,value)})} />
      </>}
      {question==='receiver' && <>
        <VisionSelection name="Receiver cell" value={bias.destination} options={gridChoices(6)} onChange={value=>update({destination:Number(value)})} />
        <VisionSelection name="Cyclic edge policy" value={String(bias.wrap)} options={[['false','Exclude wrap'],['true','Allow wrap: diagnostic']]}
          onChange={value=>update({wrap:value==='true'})} />
      </>}
      {question==='restore' && <button type="button" onClick={()=>reset('bias')}>Restore values and relative biases</button>}
    </FlowControls>
    <FlowReadout>The current source weight is {flowNumber(biasReadout.weights[bias.destination][bias.source],6)};
      the receiver returns {flowNumber(biasReadout.output[bias.destination],4)}.
      {biasReadout.allowed[bias.destination][bias.source] ? ' This source is legal; its relative bias can change its share.' : ' This source is forbidden; changing a bias cannot admit it.'}</FlowReadout>
  </FlowLab>;
}

export function VisionDinoInvestigation({ question = 'logit', direction = false }) {
  const cases=useVisionCase();
  const state=direction ? cases.direction : cases.dino;
  const read=direction ? cases.directionRead : cases.dinoRead;
  const set=direction ? cases.setDirection : cases.setDino;
  const update=changes=>set(old=>({...old,...changes}));
  const targetRole=state.role==='center' ? 'center' : 'teacher';
  const targetOnly=question==='logit' && !direction;
  const nextStudent=state.student.map((value,index)=>value-state.rate*read.gradient[index]);
  const stepIsValid=nextStudent.every(value=>Number.isFinite(value) && value>=-4 && value<=4);
  return <FlowLab id={direction ? 'vision-dino-direction' : `vision-dino-${question}`}
    label={direction ? 'Separate fresh teacher-direction example' : `Same worked prototype case: ${question}`}>
    {question==='restore' ? null : question==='temperature' ? <div className="vision-flow-parallel">
      <VisionDinoTargetDrawing teacher={state.teacher} center={state.center} temperature={state.teacherTemperature} read={read} offset={state.offset} />
      <VisionDinoStudentDrawing student={state.student} temperature={state.studentTemperature} read={read} />
    </div> : question==='student' || question==='update'
      ? <VisionDinoStudentDrawing student={state.student} temperature={state.studentTemperature} read={read} />
      : <VisionDinoTargetDrawing teacher={state.teacher} center={state.center} temperature={state.teacherTemperature} read={read} offset={state.offset} />}
    <FlowControls>
      {question==='logit' && !direction && <>
        <VisionSelection name="Vector to edit" value={targetRole} options={[['teacher','Teacher logits'],['center','Running center']]}
          onChange={value=>update({role:value})} />
        <VisionSelection name="Prototype coordinate" value={state.prototype} options={prototypeChoices} onChange={value=>update({prototype:Number(value)})} />
        <VisionNumber name="Selected logit or center" value={state[targetRole][state.prototype]} min={-4} max={4}
          onChange={value=>update({[targetRole]:replaceAt(state[targetRole],state.prototype,value)})} />
      </>}
      {question==='student' && <>
        <VisionSelection name="Student prototype coordinate" value={state.prototype} options={prototypeChoices}
          onChange={value=>update({prototype:Number(value)})} />
        <VisionNumber name="Selected student logit" value={state.student[state.prototype]} min={-4} max={4}
          onChange={value=>update({student:replaceAt(state.student,state.prototype,value)})} />
      </>}
      {direction && <FlowSlider name="Teacher prototype 2 logit" value={state.teacher[2]} min={-.5} max={.75} step={.01}
        format={value=>flowNumber(value,2)} onChange={value=>update({teacher:replaceAt(state.teacher,2,value)})} />}
      {question==='temperature' && <>
        <FlowSlider name="Teacher temperature" value={state.teacherTemperature} min={.05} max={2} step={.01}
          format={value=>flowNumber(value,2)} onChange={value=>update({teacherTemperature:value})} />
        <FlowSlider name="Student temperature" value={state.studentTemperature} min={.05} max={2} step={.01}
          format={value=>flowNumber(value,2)} onChange={value=>update({studentTemperature:value})} />
      </>}
      {question==='offset' && <FlowSlider name="Same offset to every teacher logit" value={state.offset} min={-4} max={4} step={.1}
        format={value=>flowNumber(value,1)} onChange={value=>update({offset:value})} />}
      {question==='update' && <>
        <VisionNumber name="One logit-step rate" value={state.rate} min={0} max={.1} onChange={value=>update({rate:value})} />
        <button type="button" disabled={!stepIsValid} onClick={()=>update({student:nextStudent})}>Take one student-logit step</button>
      </>}
      {question==='restore' && <button type="button" onClick={()=>cases.reset(direction?'direction':'dino')}>Restore this prototype example</button>}
    </FlowControls>
    {targetOnly ? <FlowReadout>The current teacher target is {visionVector(read.target)}.
      Teacher logits, center and temperature determine these normalized prototype shares; the other questions retain this same edited case.</FlowReadout>
      : <FlowReadout>Target {visionVector(read.target)}; student {visionVector(read.probability)}; cross-entropy {flowNumber(read.loss,7)}.
        Student-logit credit is {visionVector(read.gradient)}. {direction ? 'This fresh case is separate from the worked example above; student logits remain fixed while the teacher control moves.' : 'All worked-example questions retain the same logits, center and temperatures.'}</FlowReadout>}
    {question==='update' && !stepIsValid && <p role="status">This step would leave the editable logit range −4 to 4. Reduce the rate; the current logits remain unchanged.</p>}
  </FlowLab>;
}

export function VisionPrototypeBalancingInvestigation() {
  const trace=useMemo(()=>balancedPrototypeTrace([[1,2,3],[3,1,1]],3),[]);
  const [step,setStep]=useState(0);
  return <FlowLab id="vision-prototype-balancing" label="Observe the two alternating balancing constraints">
    <VisionBalancedPrototypeDrawing trace={trace} step={step} />
    <FlowControls><FlowSlider name="Completed balancing pass" value={step} min={0} max={trace.steps.length-1} step={1}
      format={value=>trace.steps[value].stage} onChange={setStep} /></FlowControls>
    <FlowReadout>{trace.steps[step].stage}: prototype masses {visionVector(trace.steps[step].prototypeMass,6)};
      sample masses {visionVector(trace.steps[step].sampleMass,6)}. A pass makes its own constraint exact while generally disturbing the other.</FlowReadout>
  </FlowLab>;
}

export function VisionGramInvestigation({ question='angle' }) {
  const {angles,setAngles,selectedFeature,setSelectedFeature,gram,reset}=useVisionCase();
  return <FlowLab id={`vision-gram-${question}`} label={`Same unit-feature geometry: ${question}`}>
    {question!=='restore' && <VisionGramDirectionsDrawing vectors={gram.vectors} selected={selectedFeature} />}
    <FlowControls>
      {question==='angle' && <>
        <VisionSelection name="Patch feature to turn" value={selectedFeature} options={angles.map((_,index)=>[index,`Feature ${index}`])}
          onChange={value=>setSelectedFeature(Number(value))} />
        <FlowSlider name="Selected feature angle" value={angles[selectedFeature]} min={-360} max={360} step={1}
          format={value=>`${value}°`} onChange={value=>setAngles(old=>replaceAt(old,selectedFeature,value))} />
      </>}
      {question==='rotation' && <button type="button" onClick={()=>setAngles(old=>old.map(value=>((value+90+360)%720)-360))}>Rotate every current feature by 90°</button>}
      {question==='restore' && <button type="button" onClick={()=>reset('gram')}>Restore the four feature directions</button>}
    </FlowControls>
    <FlowReadout>Sum of all 16 squared Gram discrepancies is {flowNumber(gram.loss,6)};
      the averaged loss is {flowNumber(gram.loss/16,6)}. A common rotation keeps every current pairwise dot product, including after a previous individual edit.</FlowReadout>
  </FlowLab>;
}

export function VisionCurrentGramMatrix() {
  const {gram}=useVisionCase();
  return <VisionGramMatrixDrawing gram={gram} />;
}

export function VisionImageInvestigation({ question='source', resourceOwner=false }) {
  const {image,setImage,trace,originalTrace,asset,reset}=useVisionCase();
  const paired=useMemo(()=>{
    if (!asset || !['permutation','position'].includes(question)) return null;
    const order=[...image.order];
    if (question==='permutation') [order[image.patchA],order[image.patchB]]=[order[image.patchB],order[image.patchA]];
    return traceVisionEncoder(asset.state,image.image,{order,
      movePositions:question==='position'?!image.movePositions:image.movePositions});
  },[asset,question,image.image,image.order,image.patchA,image.patchB,image.movePositions]);
  const update=changes=>setImage(old=>({...old,...changes}));
  const swap=()=>{
    const order=[...image.order];
    [order[image.patchA],order[image.patchB]]=[order[image.patchB],order[image.patchA]];
    update({order});
  };
  const originalLabel=examples.examples[image.source].label;
  const output=<>{trace && <VisionClassProbabilityDrawing trace={trace} />}
    <FlowReadout>{trace ? <>Current class {trace.predicted}; recorded label {originalLabel} has probability {flowNumber(trace.probabilities[originalLabel],7)}.
      Maximum logit difference from the unedited source and original listing is {flowNumber(Math.max(...trace.logits.map((value,index)=>Math.abs(value-originalTrace.logits[index]))),6)}.
      This includes all current pixel and patch-position edits.
      {paired && <> Holding the current pixels and other settings fixed, {question==='permutation'?'one swap of these selected slots':'changing only position ownership'}
        {' '}changes logits by at most {flowNumber(Math.max(...trace.logits.map((value,index)=>Math.abs(value-paired.logits[index]))),6)}.
        This paired comparison is separate from the original-source difference.</>}</> : 'The current image is retained while the fixed model loads.'}</FlowReadout></>;
  return <FlowLab id={`vision-image-${question}`} label={`Same fitted image case: ${question}`}>
    {question==='restore' ? null : (question==='permutation'||question==='position') && trace ? <VisionSlotIdentityDrawing trace={trace}/> : <VisionDigitDrawing image={image.image} pixel={image.pixel} patch={image.order[image.patchA]} />}
    <FlowControls>
      {question==='source' && <VisionSelection name="Original digit image" value={image.source}
        options={examples.examples.map((example,index)=>[index,`Image ${index+1}; label ${example.label}`])}
        onChange={value=>{const source=Number(value);update({source,image:cloneRows(examples.examples[source].image),order:identityOrder()});}} />}
      {question==='pixel' && <>
        <VisionSelection name="Original pixel coordinate" value={image.pixel} options={gridChoices(8)} onChange={value=>update({pixel:Number(value)})} />
        <VisionNumber name="Pixel count out of 16" value={image.image[Math.floor(image.pixel/8)][image.pixel%8]*16} min={0} max={16} integer
          onChange={value=>update({image:replaceCell(image.image,Math.floor(image.pixel/8),image.pixel%8,value/16)})} />
      </>}
      {question==='permutation' && <>
        <VisionSelection name="First patch slot" value={image.patchA} options={gridChoices(4)} onChange={value=>update({patchA:Number(value)})} />
        <VisionSelection name="Second patch slot" value={image.patchB} options={gridChoices(4)} onChange={value=>update({patchB:Number(value)})} />
        <button type="button" onClick={swap}>Swap those two current content rows</button>
      </>}
      {question==='position' && <VisionSelection name="Position ownership during listing changes" value={String(image.movePositions)}
        options={[['false','Positions belong to their slots'],['true','Positions travel with original content']]}
        onChange={value=>update({movePositions:value==='true'})} />}
      {question==='restore' && <button type="button" onClick={()=>reset('image')}>Restore the original fitted case</button>}
    </FlowControls>
    {resourceOwner ? <VisionModelBoundary>{output}</VisionModelBoundary> : output}
  </FlowLab>;
}

export function VisionResolutionInvestigation() {
  const [side,setSide]=useState(224);
  const read=visionOperationCounts(side);
  return <FlowLab id="vision-resolution-work" label="Change image side while holding patch 16, width 768 and twelve blocks fixed">
    <VisionOperationCountDrawing side={side}/>
    <FlowControls><VisionSelection name="Square input side in pixels" value={side}
      options={[224,384,512,1024].map(value=>[value,String(value)])} onChange={value=>setSide(Number(value))}/></FlowControls>
    <FlowReadout>{side}×{side} produces {read.patches} patch rows plus CLS.
      Pair products consume {flowNumber(100*read.pair/(read.qkvOutput+read.pair+read.ffn),2)}% of one block's dense matmul MACs;
      the whole model counts {flowNumber(read.total/1e9,2)} billion MACs. These are arithmetic counts, not measured wall-clock time.</FlowReadout>
  </FlowLab>;
}

export function VisionHeadInvestigation({ question='receiver' }) {
  const {image,setImage,trace}=useVisionCase();
  const update=changes=>setImage(old=>({...old,...changes}));
  if (!trace) return <p>The actual head becomes available after the saved model loads above; current image edits are retained.</p>;
  const read=inspectVisionHead(trace,image.block,image.head,image.receiver);
  return <FlowLab id={`vision-head-${question}`} label="Inspect the actual selected head of the same current image">
    {question==='receiver' ? <VisionHeadReadDrawing read={read} /> : <VisionHeadContributionDrawing read={read} source={image.donor} />}
    <FlowControls>
      {question==='receiver' && <>
        <VisionSelection name="Encoder block" value={image.block} options={[[0,'Block 0'],[1,'Block 1']]} onChange={value=>update({block:Number(value)})} />
        <VisionSelection name="Attention head" value={image.head} options={[0,1,2,3].map(index=>[index,`Head ${index}`])} onChange={value=>update({head:Number(value)})} />
        <VisionSelection name="Receiver sequence row" value={image.receiver} options={Array.from({length:17},(_,index)=>[index,index ? `Slot ${index}; original patch ${image.order[index-1]}` : 'Row 0: CLS'])}
          onChange={value=>update({receiver:Number(value)})} />
      </>}
      {question==='contribution' && <VisionSelection name="Source sequence row" value={image.donor}
        options={Array.from({length:17},(_,index)=>[index,index ? `Slot ${index}; original patch ${image.order[index-1]}` : 'Row 0: CLS'])}
        onChange={value=>update({donor:Number(value)})} />}
    </FlowControls>
    <FlowReadout>Block {image.block}, head {image.head}, receiver {image.receiver} reads all 17 rows.
      Source {image.donor} has weight {flowNumber(read.shares[image.donor],6)}; complete mixed output is {visionVector(read.output,5)}.
      These weights describe this computation; they are not an isolated causal explanation of the class decision.</FlowReadout>
  </FlowLab>;
}

export function VisionCurrentModelDrawing({ stage='stem' }) {
  const {image,trace,asset}=useVisionCase();
  if (!trace) return <p>The current fitted arrays become available after the saved model loads above.</p>;
  const block=trace.blocks[image.block],row=image.receiver;
  const common={visible:3};
  const originalPatch=trace.order[image.patchA];
  if (stage==='assembly') return <VisionNativeAssemblyDrawing trace={trace} state={asset.state} slot={image.patchA} />;
  if (stage==='stem') return <VisionAffineCutawayDrawing {...common} input={trace.raw[originalPatch]}
    weights={trace.patchWeights} biases={trace.patchBiases} output={trace.projected[originalPatch]}
    name="Patch projection" inputLabel={`Original patch ${originalPatch}`} inputRole="input" />;
  if (stage==='norm1') return <VisionNormalizationDrawing trace={block.firstNorm} row={row} />;
  if (stage==='query' || stage==='key' || stage==='value') {
    const offset={query:0,key:32,value:64}[stage]+image.head*8;
    return <VisionAffineCutawayDrawing {...common} input={block.firstNorm.output[row]}
      weights={block.qkvWeights.slice(offset,offset+8)} biases={block.qkvBiases.slice(offset,offset+8)}
      output={block.projectedQkv[row].slice(offset,offset+8)} name={`Head ${image.head} ${stage}`}
      inputLabel={`Normalized receiver ${row}`} />;
  }
  if (stage==='output') return <VisionAffineCutawayDrawing {...common} input={block.concatenated[row]}
    weights={block.outputWeights} biases={block.outputBiases} output={block.attentionWrite[row]}
    name="Attention output" inputLabel="Four heads concatenated" />;
  if (stage==='attention-residual') return <VisionResidualDrawing input={block.input[row]}
    update={block.attentionWrite[row]} output={block.residual[row]} label="Attention residual addition" />;
  if (stage==='norm2') return <VisionNormalizationDrawing trace={block.secondNorm} row={row} />;
  if (stage==='up') return <VisionAffineCutawayDrawing {...common} input={block.secondNorm.output[row]}
    weights={block.upWeights} biases={block.upBiases} output={block.hiddenPre[row]}
    name="FFN up map" inputLabel="Second normalized row" />;
  if (stage==='gelu') return <VisionActivationDrawing before={block.hiddenPre[row]} after={block.hidden[row]} />;
  if (stage==='down') return <VisionAffineCutawayDrawing {...common} input={block.hidden[row]}
    weights={block.downWeights} biases={block.downBiases} output={block.feedForwardWrite[row]}
    name="FFN down map" inputLabel="GELU hidden row" />;
  if (stage==='ffn-residual') return <VisionResidualDrawing input={block.residual[row]}
    update={block.feedForwardWrite[row]} output={block.output[row]} label="Feed-forward residual addition" />;
  if (stage==='final-norm') return <VisionNormalizationDrawing trace={trace.finalNorm} row={0} title="Final CLS normalization" />;
  if (stage==='class-head') return <VisionAffineCutawayDrawing {...common} input={trace.features[0]}
    weights={trace.headWeights} biases={trace.headBiases} output={trace.logits}
    name="Class head" inputLabel="Final normalized CLS row" />;
  throw new Error(`Unknown vision-model drawing stage: ${stage}`);
}

export function VisionFullAssemblyTable() {
  const {image,trace}=useVisionCase();
  if (!trace) return null;
  return <NeuralTable caption="Complete current assembled rows; 32 coordinates each" headers={['Sequence row','Original content / position','Assembled coordinates']}
    rows={trace.assembly.map((row,index)=>[index,index?`Patch ${image.order[index-1]} / position ${trace.positionIndices[index-1]}`:'Learned CLS / CLS position',visionVector(row,5)])}/>;
}

export function VisionFullHeadTable() {
  const {image,trace}=useVisionCase();
  if (!trace) return null;
  const read=inspectVisionHead(trace,image.block,image.head,image.receiver);
  return <NeuralTable caption="Complete current head: every source and all eight coordinates"
    headers={['Source row / original identity','Key K','Value V','Q×K coordinate products','Scaled score','Read weight','a×V contribution']}
    rows={read.keys.map((key,index)=>[
      index ? `${index} / patch ${image.order[index-1]}` : '0 / CLS',
      visionVector(key,5),visionVector(read.values[index],5),visionVector(read.products[index],5),
      flowNumber(read.scores[index],6),flowNumber(read.shares[index],6),visionVector(read.contributions[index],5),
    ])} />;
}

export function VisionFeatureInvestigation({question='patch'}) {
  const {image,setImage,trace,asset,targetTrace,targetSource,setTargetSource}=useVisionCase();
  if (!trace || !asset || !targetTrace) return <p>These features become available after the same saved model loads above.</p>;
  const update=changes=>setImage(old=>({...old,...changes}));
  const slot=image.order.indexOf(image.featurePatch);
  const query=trace.features[slot+1];
  const candidates=targetTrace.features.slice(1);
  const similarities=featureCosines(query,candidates);
  const top=similarities.map((score,index)=>({score,index})).filter(row=>row.score!==null)
    .sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3).map(row=>row.index);
  const targets=examples.examples.map((item,index)=>[index,`Original image ${index+1}; digit ${item.label}`]);
  return <FlowLab id={`vision-feature-${question}`} label="Inspect features of the same current edited image">
    {question==='patch' ? <VisionFeatureAtlasDrawing trace={trace} mean={asset.pca.training_mean} basis={asset.pca.basis}
      ranges={asset.pca} selected={image.featurePatch} axis={image.featureAxis} /> : top.length ? <VisionCosineRetrievalDrawing query={query} candidates={candidates}
      similarities={similarities} top={top} queryID={image.featurePatch} targetLabel={`original image ${targetSource+1}`} />
        : <p>The query or all candidates have zero feature length; no cosine direction is defined.</p>}
    <FlowControls>
      <VisionSelection name="Original query patch coordinate" value={image.featurePatch} options={gridChoices(4)} onChange={value=>update({featurePatch:Number(value)})} />
      {question==='patch' ? <VisionSelection name="PCA coordinate to read" value={image.featureAxis} options={[[0,'PC1 → red'],[1,'PC2 → green'],[2,'PC3 → blue']]}
        onChange={value=>update({featureAxis:Number(value)})} /> : <VisionSelection name="Fixed original candidate image" value={targetSource} options={targets} onChange={value=>setTargetSource(Number(value))} />}
    </FlowControls>
    <FlowReadout>Original query patch {image.featurePatch} currently occupies sequence row {slot+1}.
      {question==='patch' ? <> Its PC{image.featureAxis+1} coordinate is {flowNumber(trace.patchPCA[slot][image.featureAxis],6)}; the mean, basis and color ranges stay fixed from training.</>
        : <> Its largest defined cosine is {top.length?flowNumber(similarities[top[0]],6):'undefined'} at original candidate patch {top.length?top[0]:'none'}.
          This ranks similarity; it does not establish a correct correspondence.</>}</FlowReadout>
    {question==='matching' && <NeuralTable caption="Every candidate in the fixed original target image" headers={['Original patch','Cosine to current query']}
      rows={similarities.map((value,index)=>[index,value===null?'undefined: zero length':flowNumber(value,6)])} />}
  </FlowLab>;
}

export const visionVector = (row, digits = 4) => `[${row.map(value => flowNumber(value, digits)).join(', ')}]`;
export { useVisionCase, replaceAt, replaceCell };
