import { useState } from 'react';
import { apply2, covarianceGeometry, eliminationPresets, eliminationTrace, qrGeometry, svdGeometry } from '../../data/matrix-decomposition-models.js';
import { DecompositionMatrix, DecompositionPlane, QrGeometryDrawing, SingularValueBars, SvdStagesDrawing, valueText, vectorText } from './MatrixDecompositionFigures.jsx';
import './matrix-decomposition-labs.css';
export { DecompositionMatrix, TriangularDependencyFigure } from './MatrixDecompositionFigures.jsx';

function Slider({ label, value, min, max, step, setValue, display = valueText(value) }) {
  return <label><span>{label}: <output>{display}</output></span><input type="range" aria-label={label} value={value} min={min} max={max} step={step} onChange={event => setValue(Number(event.target.value))} /></label>;
}

export function EliminationLab() {
  const [presetName, setPresetName] = useState('coupled');
  const [targetOffset, setTargetOffset] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const trace = eliminationTrace(presetName, targetOffset);
  const state = trace.steps[Math.min(stepIndex, trace.steps.length - 1)];
  const conclusion = trace.steps.at(-1);
  function reset() { setPresetName('coupled'); setTargetOffset(0); setStepIndex(0); }
  function changePreset(event) { setPresetName(event.target.value); setStepIndex(0); }
  return <section className="decomposition-lab" aria-label="Pivoted elimination investigation">
    <div className="decomposition-two"><DecompositionMatrix label="Original [A | b]" values={trace.matrix.map((row,i)=>[...row,trace.target[i]])} augmented /><DecompositionMatrix label={`Current equations · step${stepIndex+1}`} values={state.augmented} augmented /></div>
    <div className="decomposition-two"><DecompositionMatrix label="P: same row order for A and b" values={state.permutation} /><DecompositionMatrix label="L: stored multipliers" values={state.lower} /></div>
    <p className="decomposition-readout" aria-live="polite">{trace.solution ? `Original-system solution x=${vectorText(trace.solution)}; A x=${vectorText(apply2(trace.matrix,trace.solution))}.` : conclusion.message}</p>
    <p>{state.message}</p>
    <div className="decomposition-controls">
      <label>System<select aria-label="Elimination system" value={presetName} onChange={changePreset}>{Object.entries(eliminationPresets).map(([name,preset])=><option key={name} value={name}>{preset.title}</option>)}</select></label>
      <Slider label="Second target offset" value={targetOffset} min={-2} max={2} step={.25} setValue={value=>{setTargetOffset(value);setStepIndex(0);}} />
      <Slider label="Elimination operation" value={stepIndex} min={0} max={trace.steps.length-1} step={1} display={`${stepIndex+1} / ${trace.steps.length}`} setValue={setStepIndex} />
      <button onClick={()=>setStepIndex(i=>Math.max(0,i-1))} disabled={stepIndex===0}>Previous operation</button><button onClick={()=>setStepIndex(i=>Math.min(trace.steps.length-1,i+1))} disabled={stepIndex===trace.steps.length-1}>Next operation</button><button onClick={reset}>Reset elimination</button>
    </div>
    <p className="decomposition-note">The full solution/status is visible immediately; the operation control traces how it is obtained. A target change keeps the same coefficient matrix and pivots. After elimination the displayed left side is U, its target is y, and PA=LU. These bounded presets do not model roundoff.</p>
  </section>;
}

export function QrProjectionLab() {
  const [columnX,setColumnX]=useState(1), [columnY,setColumnY]=useState(0);
  const model=qrGeometry([columnX,columnY]);
  return <section className="decomposition-lab" aria-label="QR column projection investigation">
    <QrGeometryDrawing model={model} live />
    <div className="decomposition-two">{model.orthogonal ? <DecompositionMatrix label="Q: perpendicular unit columns" values={model.orthogonal} /> : <p className="decomposition-readout">Q's second unit column is undefined: a zero remainder supplies no new direction.</p>}<DecompositionMatrix label="R: coordinates of the original columns" values={model.triangular} /></div>
    <p className="decomposition-readout" aria-live="polite">q₁·a₂={valueText(model.overlap)}; {model.dependent ? 'dependent columns; full-rank triangular solve is unavailable.' : `q₂=${vectorText(model.secondUnit)}; q₁·q₂≈0.`}</p>
    <div className="decomposition-controls"><Slider label="Second column first coordinate" value={columnX} min={-2} max={2} step={.1} setValue={setColumnX} /><Slider label="Second column second coordinate" value={columnY} min={-2} max={2} step={.1} setValue={setColumnY} /><button onClick={()=>{setColumnX(1);setColumnY(0);}}>Reset columns</button></div>
    <p className="decomposition-note">The first column remains (1,1). Equal or zero second coordinates show dependence on fixed scales; values are rounded only for display. A remainder below 10⁻¹² is treated as zero in this bounded geometry.</p>
  </section>;
}

export function CovarianceFactorLab() {
  const [correlation,setCorrelation]=useState(.5);
  const model=covarianceGeometry(correlation);
  return <section className="decomposition-lab" aria-label="Covariance factor investigation">
    <DecompositionPlane range={3} label={`Unit circle and its exact image under L at correlation${correlation}; C has variances4,1 and covariance${2*correlation}.`} curves={[{points:model.circle,kind:'reference'},{points:model.transformed,kind:'comparison'}]} arrows={[{to:[2,correlation],label:'L₁',dx:12,dy:-14},{to:[0,model.lower[1][1]],label:'L₂',kind:'reference',dx:12,dy:16}]} />
    <div className="decomposition-two"><DecompositionMatrix values={model.lower} label="L: independent input contributions" /><DecompositionMatrix values={model.covariance} label="C=LLᵀ · variances4 and1" /></div>
    <p className="decomposition-readout" aria-live="polite">det(C)={valueText(model.determinant)}; {model.positiveDefinite ? 'positive definite: two independent contributions remain.' : 'one independent contribution vanishes; positive semidefinite boundary, outside ordinary Cholesky’s strict contract.'}</p>
    <p>Column L₁=(2,{valueText(correlation)}); column L₂=(0,{valueText(model.lower[1][1])}). x₁=2z₁; x₂=ρz₁+√(1−ρ²)z₂.</p>
    <div className="decomposition-controls"><Slider label="Covariance correlation" value={correlation} min={-1} max={1} step={.01} setValue={setCorrelation} /><button onClick={()=>setCorrelation(.5)}>Reset correlation</button></div>
    <p className="decomposition-note">Neutral circle: input geometry. Dashed cyan: exact linear image sampled at 65 angular positions. A zero second column is marked at the origin. These are not observed samples or density contours.</p>
  </section>;
}

export function SingularDirectionsLab() {
  const [inputAngle,setInputAngle]=useState(30), [outputAngle,setOutputAngle]=useState(-20), [vectorAngle,setVectorAngle]=useState(45);
  const model=svdGeometry({inputAngle,outputAngle,vectorAngle,smallerScale:1,retained:2});
  return <section className="decomposition-lab" aria-label="Singular directions investigation">
    <SvdStagesDrawing input={model.input} rotated={model.rotated} scaled={model.scaled} output={model.output} right={model.right} left={model.left} singular={model.singularValues} range={4} />
    <DecompositionMatrix label="Constructed A=UΣVᵀ" values={model.matrix} />
    <p className="decomposition-readout" aria-live="polite">Fixed stretches(3,1); x={vectorText(model.input)}; Ax={vectorText(model.output)}. Rotating either basis changes its coordinate role while retaining the singular values.</p>
    <div className="decomposition-controls"><Slider label="Input basis angle" value={inputAngle} min={-90} max={90} step={15} display={`${inputAngle}°`} setValue={setInputAngle} /><Slider label="Output basis angle" value={outputAngle} min={-90} max={90} step={10} display={`${outputAngle}°`} setValue={setOutputAngle} /><Slider label="Input vector angle" value={vectorAngle} min={0} max={360} step={15} display={`${vectorAngle}°`} setValue={setVectorAngle} /><button onClick={()=>{setInputAngle(30);setOutputAngle(-20);setVectorAngle(45);}}>Reset directions</button></div>
    <p className="decomposition-note">An analytic real 2×2 family with known factors. Comparable panels retain the same scale. The browser is applying supplied rotations/stretches; it does not run a general numerical SVD. General orthogonal factors may also reflect.</p>
  </section>;
}

export function SingularTruncationLab() {
  const [smallerScale,setSmallerScale]=useState(1), [retained,setRetained]=useState(1), [vectorAngle,setVectorAngle]=useState(45);
  const model=svdGeometry({inputAngle:0,outputAngle:0,smallerScale,retained,vectorAngle});
  const error=model.output.map((v,i)=>v-model.approximationOutput[i]);
  return <section className="decomposition-lab" aria-label="Singular truncation investigation">
    <div className="decomposition-two"><DecompositionPlane range={4} label={`Full output${vectorText(model.output)}, retained output${vectorText(model.approximationOutput)} and their error connector${vectorText(error)}.`} curves={[{points:model.transformed,kind:'reference'},{points:model.truncated,kind:'comparison'}]} arrows={[{to:model.output,label:'Ax',dy:-18},{to:model.approximationOutput,label:'Aₖx',kind:'comparison',dy:23}]} segments={[{from:model.approximationOutput,to:model.output}]} /><SingularValueBars singular={model.singularValues} retained={retained} /></div>
    <div className="decomposition-two"><DecompositionMatrix label="Full A · fixed identity bases" values={model.matrix} /><DecompositionMatrix label="Aₖ · retained directions" values={model.approximation} /></div>
    <p className="decomposition-readout" aria-live="polite">One-input error={valueText(Math.hypot(...error))}; maximum unit-input error={valueText(model.spectralError)}; Frobenius error={valueText(model.frobeniusError)}; original rank={model.rank}.</p>
    <p>x={vectorText(model.input)}; full output={vectorText(model.output)}; retained output={vectorText(model.approximationOutput)}; error={vectorText(error)}.</p>
    <div className="decomposition-controls"><Slider label="Smaller singular value" value={smallerScale} min={0} max={3} step={.25} setValue={setSmallerScale} /><label>Singular directions kept<select aria-label="Singular directions kept" value={retained} onChange={event=>setRetained(Number(event.target.value))}><option value="0">0: zero map</option><option value="1">1: largest direction</option><option value="2">2: both directions</option></select></label><Slider label="Truncation input angle" value={vectorAngle} min={0} max={360} step={15} display={`${vectorAngle}°`} setValue={setVectorAngle} /><button onClick={()=>{setSmallerScale(1);setRetained(1);setVectorAngle(45);}}>Reset truncation</button></div>
    <p className="decomposition-note">Solid bars are retained values; dashed bars are discarded. Both output images and the dotted error share one coordinate scale. Aligning x with a retained direction can make this input's error zero even when the maximum error remains positive.</p>
  </section>;
}
