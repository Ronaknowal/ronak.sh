import { useEffect, useMemo, useState } from 'react';
import useLessonViewport from './useLessonViewport.js';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as n } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { capsuleVotes, emVotes, capsuleIndex, norm, squash, routeCapsules, squashProbe, diagonalCapsuleEM, shiftCapsuleImage, loadCapsuleWeights, encodeCapsuleImage, decodeCapsules } from '../../data/capsule-models.js';
import evidence from '../../data/capsule-measurements.json';
import { CapsuleGroupDrawing, CapsuleContributionDrawing, CapsuleSquashDrawing, CapsuleRoutingDrawing, CapsuleMarginDrawing, CapsuleSensitivityDrawing, CapsuleFrameDrawing, CapsuleEMDrawing, CapsuleDecoderDrawing } from './CapsuleDrawings.jsx';
import './capsules.css';
import './capsule-flow.css';

const vector = values => `(${values.map(value => n(value, 5)).join(', ')})`;
const copy = value => structuredClone(value);
const difference = (left, right) => Math.max(...left.map((value, index) => Math.abs(value - right[index])));
function Select({ label, value, onChange, options }) {
  return <label className="capsule-flow-select"><span>{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}

export function CapsuleGrouping() {
  const [row, setRow] = useState(1), [column, setColumn] = useState(2), [type, setType] = useState(3);
  const mapping = Array.from({ length: 4 }, (_, coordinate) => capsuleIndex(row, column, type, coordinate));
  return <FlowLab id="capsule-grouping" label="Map channel coordinates to a capsule without changing their values">
    <CapsuleGroupDrawing row={row} column={column} type={type} />
    <FlowControls><FlowSlider name="Grid row" value={row} onChange={setRow} min={0} max={3} step={1} /><FlowSlider name="Grid column" value={column} onChange={setColumn} min={0} max={3} step={1} /><FlowSlider name="Capsule type" value={type} onChange={setType} min={0} max={3} step={1} /></FlowControls>
    <FlowReadout data-result="grouping">Channels {type * 4}–{type * 4 + 3} at ({row}, {column}) form child <strong>{mapping[0].child}</strong>; its four values are unchanged.</FlowReadout>
    <button type="button" onClick={() => { setRow(1); setColumn(2); setType(3); }}>Reset grouping</button>
    <NeuralTable caption="Index correspondence; no invented activation values" headers={['Source (channel,row,column)', 'Destination (child,coordinate)']} rows={mapping.map(item => [vector([item.channel, item.row, item.column]), vector([item.child, item.coordinate])])} />
  </FlowLab>;
}

export function CapsuleInitialSum() {
  const state = routeCapsules(capsuleVotes, 1)[0];
  return <div className="flow-columns-2">{[0, 1].map(parent => <CapsuleContributionDrawing key={parent} votes={capsuleVotes} state={state} parent={parent} />)}</div>;
}
export function CapsuleSquashLab() {
  const [x, setX] = useState(.3), [y, setY] = useState(.4);
  const values = [x, y], output = squash(values);
  return <FlowLab id="capsule-squash" label="Change vector coordinates and watch squash preserve direction and change length">
    <CapsuleSquashDrawing values={values} />
    <FlowControls><FlowSlider name="Input coordinate 1" value={x} onChange={setX} min={-4} max={4} step={.05} /><FlowSlider name="Input coordinate 2" value={y} onChange={setY} min={-4} max={4} step={.05} /></FlowControls>
    <FlowReadout data-result="squash">Input radius <strong>{n(norm(values))}</strong> becomes output length <strong>{n(norm(output))}</strong>; {norm(values) ? 'direction is unchanged.' : 'the zero vector has no direction.'}</FlowReadout>
    <button type="button" onClick={() => { setX(.3); setY(.4); }}>Reset vector</button>
  </FlowLab>;
}
export function CapsuleVoteLab() {
  const [x, setX] = useState(2), [y, setY] = useState(0), [step, setStep] = useState(1);
  const votes = copy(capsuleVotes);
  votes[1][0] = [x, y];
  const state = routeCapsules(votes, 8)[step - 1];
  return <FlowLab id="capsule-votes" label="Change child2's vote for A and inspect one actual routing step">
    <CapsuleRoutingDrawing state={state} />
    <div className="flow-columns-2">{[0, 1].map(parent => <CapsuleContributionDrawing key={parent} votes={votes} state={state} parent={parent} />)}</div>
    <FlowControls><FlowSlider name="Child 2 → A coordinate 1" value={x} onChange={setX} min={-3} max={3} step={.1} /><FlowSlider name="Child 2 → A coordinate 2" value={y} onChange={setY} min={-3} max={3} step={.1} /><FlowSlider name="Routing step" value={step} onChange={setStep} min={1} max={8} step={1} /></FlowControls>
    <FlowReadout data-result="routing">Step {step} gives A length <strong>{n(state.lengths[0])}</strong> and B length <strong>{n(state.lengths[1])}</strong>; every edit restarts the computation from zero logits.</FlowReadout>
    <NeuralTable caption="This step's inputs, shares, contributions and agreement" headers={['Child', 'Input logits A,B', 'Shares A,B', 'Contribution A', 'Contribution B', 'Dot agreements A,B']} rows={votes.map((row, child) => [child + 1, vector(state.logits[child]), vector(state.coupling[child]), ...row.map((vote, parent) => vector(vote.map(value => value * state.coupling[child][parent]))), vector(state.agreement[child])])} />
    <button type="button" onClick={() => { setX(2); setY(0); setStep(1); }}>Reset routing</button>
  </FlowLab>;
}
export function CapsuleMarginLab() {
  const [trueLength, setTrue] = useState(.7), [wrongLength, setWrong] = useState(.3);
  const loss = Math.max(0, .9 - trueLength) ** 2 + .5 * Math.max(0, wrongLength - .1) ** 2;
  return <FlowLab id="capsule-margin" label="Independent true-class and wrong-class margin penalties">
    <CapsuleMarginDrawing trueLength={trueLength} wrongLength={wrongLength} />
    <FlowControls><FlowSlider name="True-class length" value={trueLength} onChange={setTrue} min={0} max={1} step={.01} /><FlowSlider name="One wrong-class length" value={wrongLength} onChange={setWrong} min={0} max={1} step={.01} /></FlowControls>
    <FlowReadout data-result="margin">These two classes contribute <strong>{n(loss)}</strong> to the loss; the other wrong classes are held at or below 0.1.</FlowReadout>
    <button type="button" onClick={() => { setTrue(.7); setWrong(.3); }}>Reset lengths</button>
  </FlowLab>;
}

export function CapsuleEvidenceLab({ intervention = false }) {
  const [selected, setSelected] = useState('3-1'), [iterations, setIterations] = useState('2');
  const run = evidence.runs.find(item => `${item.seed}-${item.training_iterations}` === selected);
  if (intervention) {
    const measured = run.inference_iterations[iterations], baseline = run.inference_iterations[String(run.training_iterations)];
    const changed = measured.predictions.filter((value, index) => value !== baseline.predictions[index]).length;
    return <FlowLab id="capsule-inference-count" label="Change the recorded inference routing count while preserving model weights">
      <NeuralTable caption="Each row is one fixed fitted model; counts out of 120" headers={['Seed / trained steps', 'Infer1', 'Infer2', 'Infer3', 'Infer5']} rows={evidence.runs.map(item => [`${item.seed} / ${item.training_iterations}`, ...['1', '2', '3', '5'].map(key => item.inference_iterations[key].correct)])} />
      <FlowControls><Select label="Fixed trained model" value={selected} onChange={setSelected} options={evidence.runs.map(item => [`${item.seed}-${item.training_iterations}`, `Seed ${item.seed} · trained ${item.training_iterations}`])} /><Select label="Recorded inference steps" value={iterations} onChange={setIterations} options={['1', '2', '3', '5'].map(value => [value, value])} /></FlowControls>
      <FlowReadout data-result="evidence">Correct <strong>{measured.correct}/120</strong>; <strong>{changed}</strong> prediction identities differ from this model's training-time count, whose correct count is {baseline.correct}/120. No weights changed.</FlowReadout>
      <button type="button" onClick={() => { setSelected('3-1'); setIterations('2'); }}>Reset recorded comparison</button>
    </FlowLab>;
  }
  return <div className="capsule-flow-series">
    <div className="flow-columns-3">{[['correct', 'Correct /120', 120], ['margin_loss', 'Margin loss', .06], ['predicted_mask_mse', 'Predicted-mask MSE', .08]].map(([field, label, maximum]) => <figure key={field} className="capsule-flow-figure capsule-flow-evidence">
      <svg viewBox="0 0 320 315" role="img" aria-label={`${label}: actual three seed pairs, amber one-step, violet three-step`}>
        <text x="160" y="23" textAnchor="middle" fill="#ddd">{label}</text><path d="M55,48 V229 H296" fill="none" stroke="#929292" />
        {[0, maximum / 2, maximum].map(value => <text key={value} x="47" y={234 - value * 180 / maximum} textAnchor="end" fill="#ddd">{n(value, 2)}</text>)}
        {[1, 2, 3].map(seed => {
          const values = evidence.runs.filter(item => item.seed === seed).map(item => item.trajectory.at(-1).development[field]);
          const x = 95 + 80 * (seed - 1);
          return <g key={seed}><line x1={x - 9} y1={229 - values[0] * 180 / maximum} x2={x + 9} y2={229 - values[1] * 180 / maximum} stroke="#929292" /><circle cx={x - 9} cy={229 - values[0] * 180 / maximum} r="4" fill="#e2b55a" /><circle cx={x + 9} cy={229 - values[1] * 180 / maximum} r="4" fill="#b69ee8" /><text x={x} y="253" textAnchor="middle" fill="#ddd">seed {seed}</text></g>;
        })}
        {field === 'predicted_mask_mse' && <path d={`M55,${229 - evidence.meanImageMSE * 180 / maximum}H296`} stroke="#929292" strokeDasharray="4 4" />}
        <text x="160" y="282" textAnchor="middle" fill="#e2b55a">● trained 1 step</text><text x="160" y="310" textAnchor="middle" fill="#b69ee8">● trained 3 steps</text>
      </svg>
    </figure>)}</div>
    <p>The three panels keep full zero-based axes; exact differences are in the table. The dashed MSE line is the training-mean image, {n(evidence.meanImageMSE)}.</p>
    <NeuralTable caption="All six final measurements; every training count is 280/280" headers={['Seed / trained steps', 'Correct /120', 'Margin', 'Predicted-mask MSE', 'Label-conditioned MSE']} rows={evidence.runs.map(item => { const point = item.trajectory.at(-1).development; return [`${item.seed} / ${item.training_iterations}`, point.correct, n(point.margin_loss), n(point.predicted_mask_mse), n(point.label_conditioned_mse)]; })} />
  </div>;
}

let frozenModelPromise;
function requestFrozenModel() {
  if (!frozenModelPromise) frozenModelPromise = Promise.all([
    fetch('/learn-assets/capsule-networks/frozen-model.json').then(response => { if (!response.ok) throw new Error('Model metadata unavailable'); return response.json(); }),
    fetch('/learn-assets/capsule-networks/frozen-model.f32').then(response => { if (!response.ok) throw new Error('Model weights unavailable'); return response.arrayBuffer(); }),
  ]).then(([metadata, buffer]) => {
    if (!Array.isArray(metadata.examples) || metadata.examples.length !== 2 || metadata.examples.some(sample => sample.image.length !== 64 || sample.image.some(value => !Number.isFinite(value) || value < 0 || value > 1))) throw new Error('Invalid source image');
    return { metadata, state: loadCapsuleWeights(buffer, metadata) };
  }).catch(error => { frozenModelPromise = undefined; throw error; });
  return frozenModelPromise;
}
export function CapsuleFrozenInvestigation({ kind = 'pixels' }) {
  const [section, ready] = useLessonViewport(), [loaded, setLoaded] = useState(null), [error, setError] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!ready || loaded) return;
    let active = true;
    setError(false);
    requestFrozenModel().then(result => { if (active) setLoaded(result); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [ready, loaded, attempt]);
  return <section ref={section} aria-label={`Fixed capsule model: ${kind}`}>
    {ready && (loaded ? <FrozenCapsuleLab {...loaded} kind={kind} /> : error ? <p role="alert">The frozen model could not load. <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry frozen model</button></p> : <p role="status">Loading the fixed seed-1 model and two source images…</p>)}
  </section>;
}
function PixelImage({ values, label, selected, onSelect, differenceMap = false }) {
  return <figure><div className={`capsule-pixels${onSelect ? ' capsule-pixels-editable' : ''}`} role={onSelect ? 'group' : 'img'} aria-label={label}>{values.map((value, index) => {
    const intensity = Math.max(0, Math.min(1, Math.abs(value)));
    const style = { backgroundColor: differenceMap ? value >= 0 ? `rgb(${35 + 191 * intensity} ${35 + 146 * intensity} ${35 + 55 * intensity})` : `rgb(${35 + 70 * intensity} ${35 + 120 * intensity} ${35 + 200 * intensity})` : `rgb(${255 * value} ${255 * value} ${255 * value})` };
    return onSelect ? <button key={index} type="button" style={style} aria-label={`Pixel row ${Math.floor(index / 8)}, column ${index % 8}: ${n(value, 4)}`} aria-pressed={index === selected} onClick={() => onSelect(index)} /> : <span key={index} style={style} />;
  })}</div><figcaption>{label}</figcaption></figure>;
}
function FrozenCapsuleLab({ metadata, state, kind }) {
  const [specimen, setSpecimen] = useState('0'), [pixels, setPixels] = useState([...metadata.examples[0].image]), [cell, setCell] = useState(27), [dx, setDx] = useState(0), [dy, setDy] = useState(0), [coordinate, setCoordinate] = useState(0), [delta, setDelta] = useState(0);
  const sample = metadata.examples[Number(specimen)];
  const original = useMemo(() => encodeCapsuleImage(sample.image, state), [sample, state]);
  const image = useMemo(() => kind === 'shift' ? shiftCapsuleImage(sample.image, dy, dx) : kind === 'pixels' ? pixels : sample.image, [kind, sample, dy, dx, pixels]);
  const current = useMemo(() => encodeCapsuleImage(image, state), [image, state]);
  const selectSource = value => { setSpecimen(value); setPixels([...metadata.examples[Number(value)].image]); setCell(27); setDx(0); setDy(0); setCoordinate(0); setDelta(0); };
  const sourceControl = <Select label="Source image" value={specimen} onChange={selectSource} options={metadata.examples.map((example, index) => [String(index), `Source ${example.source_id} · digit ${example.label}`])} />;
  if (kind === 'latent') {
    const selected = original.predicted, maskedOut = (selected + 1) % 10;
    const editClass = label => original.capsules.map((row, classIndex) => row.map((value, index) => value + (classIndex === label && index === coordinate ? delta : 0)));
    const baseline = decodeCapsules(original.capsules, selected, state), edited = decodeCapsules(editClass(selected), selected, state), nullEdit = decodeCapsules(editClass(maskedOut), selected, state);
    return <FlowLab id="capsule-latent" label="Decoder-only selected versus masked-out coordinate edits">
      <CapsuleDecoderDrawing selected={selected} coordinate={coordinate} delta={delta} />
      <div className="flow-columns-3"><PixelImage values={baseline} label={`Mask class ${selected} · original`} /><PixelImage values={edited} label={`Edit class ${selected} · decoded`} /><PixelImage values={edited.map((value, index) => value - baseline[index])} label="Signed difference · fixed −1 to1" differenceMap /></div>
      <PixelImage values={nullEdit} label={`Same edit to class ${maskedOut} · masked out`} />
      <FlowControls>{sourceControl}<FlowSlider name="Edited coordinate" value={coordinate} onChange={setCoordinate} min={0} max={7} step={1} /><FlowSlider name="Coordinate change" value={delta} onChange={setDelta} min={-.2} max={.2} step={.01} /></FlowControls>
      <FlowReadout data-result="latent">Class {selected}'s edit changes pixels by at most <strong>{n(difference(edited, baseline), 8)}</strong>; class {maskedOut}'s same edit changes them by <strong>{n(difference(nullEdit, baseline), 8)}</strong>. The encoder's ten scores remain fixed.</FlowReadout>
      <p>Difference colours encode sign: amber positive, blue negative, charcoal zero; every image intensity uses 0–1. The original mask stays class {selected} for both comparisons.</p>
      <NeuralTable caption="Exact reconstruction changes; encoder outputs are unchanged" headers={['Pixel row,col', 'Base', 'Edited selected', 'Selected difference', 'Masked-out difference']} rows={baseline.map((value, index) => [`${Math.floor(index / 8)},${index % 8}`, n(value), n(edited[index]), n(edited[index] - value, 7), n(nullEdit[index] - value, 7)])} />
      <button type="button" onClick={() => selectSource('0')}>Reset decoder investigation</button>
    </FlowLab>;
  }
  return <FlowLab id={kind === 'shift' ? 'capsule-shift' : 'capsule-frozen'} label="Image intervention with fixed encoder and decoder weights">
    <div className="flow-columns-2"><PixelImage values={sample.image} label="Original input · intensities 0–1" /><PixelImage values={image} label={kind === 'shift' ? `Shifted input · column${dx}, row${dy}` : 'Editable input · select a pixel'} selected={cell} onSelect={kind === 'pixels' ? setCell : undefined} /></div>
    <div className="capsule-score-bars" aria-label="Class scores, zero-to-one axes; bar current and neutral tick original">{current.lengths.map((length, label) => <div key={label}><span>Class {label}</span><div><i style={{ width: `${100 * length}%` }} /><b style={{ left: `${100 * original.lengths[label]}%` }} /></div><span>{n(length, 5)}</span></div>)}</div>
    <PixelImage values={current.reconstruction} label={`Reconstruction · predicted mask${current.predicted}`} />
    <FlowControls>{sourceControl}{kind === 'shift' ? <><FlowSlider name="Horizontal shift" value={dx} onChange={setDx} min={-2} max={2} step={1} /><FlowSlider name="Vertical shift" value={dy} onChange={setDy} min={-2} max={2} step={1} /></> : <><FlowSlider name="Selected pixel index (row × 8 + column)" value={cell} onChange={setCell} min={0} max={63} step={1} /><FlowSlider name={`Pixel (${Math.floor(cell / 8)}, ${cell % 8}) intensity`} value={pixels[cell]} onChange={value => setPixels(previous => previous.map((old, index) => index === cell ? value : old))} min={0} max={1} step={.025} /></>}</FlowControls>
    <FlowReadout data-result={kind === 'shift' ? 'shift' : 'frozen'}>Original winner {original.predicted}; current winner <strong>{current.predicted}</strong>. Maximum score change <strong>{n(difference(original.lengths, current.lengths), 8)}</strong>; weights stay fixed.</FlowReadout>
    <p>Violet bars are current lengths; neutral ticks are original lengths. They are not sum-one probabilities. Source {sample.source_id}'s actual label {sample.label} is an annotation, never an encoder input. Exact score ties choose the lowest class index. Shifts zero-fill exposed pixels and crop the opposite edge.</p>
    <button type="button" onClick={() => selectSource('0')}>Reset image investigation</button>
  </FlowLab>;
}

export function CapsuleSensitivityLab() {
  const [radius, setRadius] = useState(.5), [delta, setDelta] = useState(.02);
  const values = [.6 * radius, .8 * radius], radial = squashProbe(values, delta, 'radial'), tangent = squashProbe(values, delta, 'tangent');
  return <FlowLab id="capsule-sensitivity" label="Equal radial and perpendicular perturbations with different output sensitivity">
    <CapsuleSensitivityDrawing radius={radius} delta={delta} />
    <FlowControls><FlowSlider name="Input radius" value={radius} onChange={setRadius} min={0} max={5} step={.1} /><FlowSlider name="Perturbation length" value={delta} onChange={setDelta} min={0} max={.05} step={.001} /></FlowControls>
    <FlowReadout data-result="sensitivity">Finite radial output change <strong>{n(radial.change, 8)}</strong>; perpendicular change <strong>{n(tangent.change, 8)}</strong>. Infinitesimal sensitivities are {n(radial.radial, 8)} and {n(radial.tangent, 8)}.{radius === 0 && ' At zero the arrow has no direction; the probes use the Cartesian x and y axes.'}</FlowReadout>
    <button type="button" onClick={() => { setRadius(.5); setDelta(.02); }}>Reset sensitivity</button>
  </FlowLab>;
}
export function CapsuleGeometryFigure() {
  const [angle, setAngle] = useState(90), [stretch, setStretch] = useState(2);
  return <FlowLab id="capsule-geometry" label="Compare a supplied frame identity with a learned-map counterexample">
    <div className="flow-columns-2"><CapsuleFrameDrawing angle={angle} stretch={stretch} /><CapsuleFrameDrawing angle={angle} stretch={stretch} physical={false} /></div>
    <FlowControls><FlowSlider name="Scene rotation (degrees)" value={angle} onChange={setAngle} min={-180} max={180} step={5} /><FlowSlider name="Vector-map horizontal scale" value={stretch} onChange={setStretch} min={.5} max={3} step={.1} /></FlowControls>
    <FlowReadout data-result="geometry">The supplied matrix-frame routes always coincide; the unequal-scale vector map coincides for all rotations only at scale 1. A single zero-angle match does not establish the identity.</FlowReadout>
    <button type="button" onClick={() => { setAngle(90); setStretch(2); }}>Reset transformations</button>
  </FlowLab>;
}
export function CapsuleEMLab({ allEvidence = false }) {
  const [activation, setActivation] = useState(.5), [x, setX] = useState(2), [step, setStep] = useState(1), [gain, setGain] = useState(1);
  const votes = copy(emVotes); votes[2][0][0] = x;
  const activations = allEvidence ? [1, 1, .5].map(value => value * gain) : [1, 1, activation];
  const state = diagonalCapsuleEM(votes, activations, 3)[step - 1];
  return <FlowLab id={allEvidence ? 'capsule-em-evidence' : 'capsule-em'} label="Diagonal EM effective evidence and identified means">
    <div className="flow-columns-2">{[0, 1].map(parent => <CapsuleEMDrawing key={parent} votes={votes} state={state} parent={parent} />)}</div>
    <FlowControls>{allEvidence ? <FlowSlider name="All child activation gain" value={gain} onChange={setGain} min={0} max={1} step={.05} /> : <><FlowSlider name="Child 3 activation" value={activation} onChange={setActivation} min={0} max={1} step={.05} /><FlowSlider name="Child 3 → A coordinate 1" value={x} onChange={setX} min={-1} max={4} step={.1} /><FlowSlider name="EM round" value={step} onChange={setStep} min={1} max={3} step={1} /></>}</FlowControls>
    <FlowReadout data-result={allEvidence ? 'em-evidence' : 'em'}>{state ? <>Round {step}: means <strong>{vector(state.means[0])}</strong> and <strong>{vector(state.means[1])}</strong>; mass {vector(state.mass)}, parent activations {vector(state.parentActivation)}.</> : 'No active evidence: parent means are not identified; a guarded zero is not a discovered object.'}</FlowReadout>
    <button type="button" onClick={() => { setActivation(.5); setX(2); setStep(1); setGain(1); }}>Reset EM evidence</button>
    {state && <NeuralTable caption="Multiply normalized responsibility by the unchanged child activation once" headers={['Child', 'Activation', 'Share in A,B', 'Effective mass A,B', 'Share out A,B']} rows={activations.map((value, child) => [child + 1, value, vector(state.responsibility[child]), vector(state.effective[child]), vector(state.next[child])])} />}
  </FlowLab>;
}
export function CapsuleTemperatureLab() {
  const [temperature, setTemperature] = useState(1), [step, setStep] = useState(3);
  const state = routeCapsules(capsuleVotes, step, temperature).at(-1);
  return <FlowLab id="capsule-temperature" label="Change parent-softmax temperature without scaling agreement updates">
    <CapsuleRoutingDrawing state={state} />
    <FlowControls><FlowSlider name="Positive temperature τ" value={temperature} onChange={setTemperature} min={.25} max={2} step={.05} /><FlowSlider name="Routing steps" value={step} onChange={setStep} min={1} max={8} step={1} /></FlowControls>
    <FlowReadout data-result="temperature">At τ = {n(temperature)} after {step} steps, A length is <strong>{n(state.lengths[0])}</strong> and B length <strong>{n(state.lengths[1])}</strong>; agreement updates are unchanged.</FlowReadout>
    <button type="button" onClick={() => { setTemperature(1); setStep(3); }}>Reset temperature</button>
  </FlowLab>;
}
