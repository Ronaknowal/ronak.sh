import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowReadout } from './LessonFlow.jsx';

import { Bars, PixelImage, Values, f, vec } from './HopfieldPrimitives.jsx';
import { digitRead, prepareDigitBank, digitMse, occludeDigit } from '../../data/hopfield-memory-models.js';
const base = '/learn-code/modern-hopfield-networks/';
function useNear() {
  const ref = useRef(null),
    [near, setNear] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (!globalThis.IntersectionObserver) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        setNear(true);
        observer.disconnect();
      }
    }, {
      rootMargin: '350px'
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, near];
}
function useAsset(name, enabled, retry) {
  const [state, setState] = useState({});
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState({
      name
    });
    fetch(base + name, {
      signal: controller.signal
    }).then(r => {
      if (!r.ok) throw Error('asset');
      return r.json();
    }).then(data => setState({
      name,
      data
    })).catch(e => {
      if (e.name !== 'AbortError') setState({
        name,
        error: true
      });
    });
    return () => controller.abort();
  }, [name, enabled, retry]);
  return state.name === name ? state : {};
}
export function DigitReadView({
  bank,
  model,
  raw,
  original,
  label = 'Current cue',
  showWeights = true,
  children
}) {
  const prepared = useMemo(() => prepareDigitBank(bank, model), [bank, model]),
    r = useMemo(() => digitRead(raw, bank, model, prepared), [raw, bank, model, prepared]),
    clean = original.pixels.map(x => x / 16),
    cue = raw.map(x => x / 16),
    sum = r.top.reduce((s, x) => s + x.weight, 0);
  return <><div className="hm-images"><PixelImage title="Original reference" pixels={original.pixels} raw caption={`source row ${original.sourceId}, label ${original.label}`} /><PixelImage title={label} pixels={raw} raw caption={`input MSE ${f(digitMse(cue, clean), 8)}`} /><PixelImage title="Weighted pixel read" pixels={r.readPixels} caption={`read MSE ${f(digitMse(r.readPixels, clean), 8)}`} />{r.top.map(({
        index,
        weight
      }) => <PixelImage key={index} title={`Memory row ${bank.memory[index].sourceId}`} pixels={bank.memory[index].pixels} raw caption={`label ${bank.memory[index].label}; weight ${f(weight, 8)}`} />)}</div>{children}<p className="hm-result" aria-live="polite">{label}: {r.winners.length === 10 ? 'All ten classes tie at 0.1. No unique predicted class.' : r.winners.length === 1 ? `Predicted class ${r.winners[0]}; class ${original.label} mass ${f(r.classes[original.label], 8)}.` : `Tied classes ${r.winners.join(', ')}.`} Original source row {original.sourceId}, label {original.label}, is used only as an evaluation reference.</p><p>The three displayed memories carry {f(sum, 8)} of the total weight. All 200 memories contribute to both outputs. Pixel MSE uses normalized intensities (0…1) relative to this original image; after arbitrary edits it remains a comparison, not a new ground-truth annotation.</p><Bars title={`${label}: ten computed class masses`} labels={r.classes.map((_, i) => `class ${i}`)} values={r.classes} fixedMaximum={1} /><Values caption="Normalized query and all 64 retrieved pixels" rows={[["Unit query", vec(r.query)], ["Retrieved pixels", vec(r.readPixels)]]} />{showWeights && <><NeuralTable caption="Current full memory read; original label is absent from the read function" headers={['Memory index', 'Source row', 'Class', 'Dot score', 'Weight']} rows={bank.memory.map((row, i) => [i, row.sourceId, row.label, f(r.scores[i], 8), f(r.weights[i], 10)])} /></>}</>;
}
export function DigitMemoryLab() {
  const [ref, near] = useNear(),
    [modelId, setModelId] = useState('seed17'),
    [retry, setRetry] = useState(0),
    [rowIndex, setRowIndex] = useState(31),
    [raw, setRaw] = useState(null),
    [selected, setSelected] = useState(28),
    [pinned, setPinned] = useState(null),
    [fixedBeta, setFixedBeta] = useState(64),
    bankState = useAsset('digit-bank.json', near, retry),
    modelState = useAsset('model-' + modelId + '.json', near, retry),
    bank = bankState.data,
    model = useMemo(() => modelState.data ? {
      ...modelState.data,
      beta: modelId === 'fixed' ? fixedBeta : modelState.data.beta
    } : null, [modelState.data, modelId, fixedBeta]);
  const original = bank?.validation[rowIndex],
    pixels = raw || original?.pixels,
    changePixel = (i, n) => setRaw(pixels.map((v, j) => i === j ? n : v)),
    reset = () => {
      setModelId('seed17');
      setRowIndex(31);
      setRaw(null);
      setSelected(28);
      setPinned(null);
      setFixedBeta(64);
    };
  const keyboard = (event, i) => {
    const delta = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -8,
      ArrowDown: 8
    }[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      const next = Math.max(0, Math.min(63, i + delta));
      setSelected(next);
      event.currentTarget.parentElement.querySelector(`[data-pixel="${next}"]`)?.focus();
    }
  };
  return <div ref={ref}><FlowLab id="hopfield-digits" label="Edit actual handwriting and inspect every association">
 <p>The initial live cue is validation source 3748, the same image shown at the start of this section. Select a cell in the actual grid, then change its count below. Arrow keys move the selected cell; white outline marks selection; amber outline marks keyboard focus, and brightness shows count divided by 16.</p>
 {!near&&<p>Real images and the selected model load as this investigation approaches the screen.</p>}
 {near&&(bankState.error||modelState.error)?<div role="alert"><p>The memory data could not load. Your pixels, selected cell, original reference and saved comparison are retained.</p><FlowControls><button onClick={()=>setRetry(n=>n+1)}>Retry memory data</button></FlowControls></div>:near&&(!bank||!model)?<p role="status">Loading the selected frozen model; current edits are retained.</p>:null}
 {bank&&pixels&&<><div className="hm-pixels" role="group" aria-label="Editable 8 by 8 handwriting pixels">{pixels.map((v,i)=><button type="button" key={i} data-pixel={i} tabIndex={i===selected?0:-1} aria-pressed={i===selected} aria-label={`Row ${Math.floor(i/8)+1}, column ${i%8+1}, intensity ${v}`} onClick={()=>setSelected(i)} onKeyDown={event=>keyboard(event,i)} style={{background:`rgb(${v/16*255},${v/16*255},${v/16*255})`,color:v>=8?'black':'white'}}>{v}</button>)}</div>
 <FlowControls><FlowSlider name={`Pixel row ${Math.floor(selected/8)+1}, column ${selected%8+1}`} value={pixels[selected]} min={0} max={16} step={1} onChange={n=>changePixel(selected,n)}/></FlowControls>
 <FlowReadout>Selected cell {selected+1} has intensity {pixels[selected]}; changing it updates the current query and both returned outputs immediately.</FlowReadout>
 <p>Restore the original image, remove the two central columns, or remove all strokes. These change the input only; they do not fit a model.</p>
 <PixelImage title="Current editable cue" pixels={pixels} raw caption={`reference source ${original.sourceId}`}/>
 <FlowControls><button onClick={()=>setRaw([...original.pixels])}>Restore original cue</button><button onClick={()=>setRaw(occludeDigit(original.pixels))}>Zero original columns 4 and 5</button><button onClick={()=>setRaw(Array(64).fill(0))}>Blank cue null</button></FlowControls>
 </>}
 {bank&&model&&pixels&&<><p>What changes if you use a different frozen geometry? The current query is compared with the same 200 memory images. A model switch preserves your edited pixels and original evaluation reference; changing the validation row explicitly starts a new cue.</p>
 <DigitReadView bank={bank} model={model} raw={pixels} original={original} showWeights={false}>
 <FlowControls><label className="hm-model-select">Frozen association geometry<select value={modelId} onChange={event=>setModelId(event.target.value)}><option value="seed17">Learned seed 17 · epoch 100 · β=16</option><option value="seed41">Learned seed 41 · epoch 25 · β=16</option><option value="fixed">Fixed pixel cosine geometry</option></select></label><FlowSlider name="Validation index (0…299)" value={rowIndex} min={0} max={299} step={1} onChange={n=>{setRowIndex(n);setRaw(null);setSelected(28);}}/></FlowControls>
 </DigitReadView>
 {modelId==='fixed'&&<FixedTemperatureView bank={bank} model={model} raw={pixels} beta={fixedBeta} onChange={setFixedBeta}/>}
 <DigitWeights bank={bank} model={model} raw={pixels}/>
 <p>Save the current input, reference and exact model for a comparison. The saved result stays visible while you edit the current one.</p>
 <PixelImage title="Input to retain" pixels={pixels} raw/>
 <FlowControls><button onClick={()=>setPinned({raw:[...pixels],original:structuredClone(original),model:structuredClone(model)})}>Pin current input and model</button><button onClick={reset}>Reset digit investigation</button></FlowControls>
 </>}
 {bank&&pinned&&<><p>Saved comparison: {pinned.model.id}, β={pinned.model.beta}, original source {pinned.original.sourceId}. This complete input and model remain fixed.</p><DigitReadView bank={bank} model={pinned.model} raw={pinned.raw} original={pinned.original} label="Pinned cue" showWeights={false}/></>}
 <p><a href={base+'data-provenance.md'}>Dataset attribution and split provenance</a>. Only the 500 memory and validation images needed here are loaded; fitting happens in the complete Python program, never in the browser.</p>
 </FlowLab></div>;
}
function DigitWeights({bank,model,raw}) {
 const prepared=useMemo(()=>prepareDigitBank(bank,model),[bank,model]),r=useMemo(()=>digitRead(raw,bank,model,prepared),[raw,bank,model,prepared]);
 return <NeuralTable caption="All 200 memory contributions; original query label is absent from retrieval" headers={['Memory index','Source row','Class','Dot score','Weight']} rows={bank.memory.map((row,i)=>[i,row.sourceId,row.label,f(r.scores[i],8),f(r.weights[i],10)])}/>;
}
function FixedTemperatureView({bank,model,raw,beta,onChange}) {
 const prepared=useMemo(()=>prepareDigitBank(bank,model),[bank,model]),r=useMemo(()=>digitRead(raw,bank,model,prepared),[raw,bank,model,prepared]);
 return <><p>For the fixed pixel geometry only, change the inverse temperature while keeping all dot scores unchanged. Clean validation selected β=64; the live control is an investigation, not a newly selected experiment.</p><Bars title="Current fixed-geometry class masses" labels={r.classes.map((_,i)=>`class ${i}`)} values={r.classes} fixedMaximum={1}/><FlowControls><FlowSlider name="Fixed-geometry β (validation selected 64)" value={beta} min={.1} max={256} step={.1} onChange={onChange}/></FlowControls><FlowReadout>At β={f(beta)}, the returned class masses are {vec(r.classes)}.</FlowReadout></>;
}
export function DigitStoriesFigure() {
  const [ref, near] = useNear(),
    [retry, setRetry] = useState(0),
    bankState = useAsset('digit-bank.json', near, retry),
    modelState = useAsset('model-seed17.json', near, retry),
    bank = bankState.data,
    model = modelState.data;
  return <div ref={ref}>{bank && model ? [2946, 3052].map(id => {
      const original = bank.validation.find(row => row.sourceId === id);
      return <div key={id}><p>Actual validation source {id}: first clean, then the same image with central columns zeroed.</p><DigitReadView bank={bank} model={model} raw={original.pixels} original={original} label="Clean cue" showWeights={false} /><DigitReadView bank={bank} model={model} raw={occludeDigit(original.pixels)} original={original} label="Occluded cue" showWeights={false} /></div>;
    }) : bankState.error || modelState.error ? <><p>The measured image stories could not load.</p><FlowControls><button onClick={() => setRetry(x => x + 1)}>Retry image stories</button></FlowControls></> : <p>{near ? 'Loading the actual images and selected seed 17 projection…' : 'The actual image stories load as they approach the screen.'}</p>}</div>;
}
export function HopfieldProgram({
  filename
}) {
  return <>
    <RemoteCodeBlock source={base + filename} language="python" filename={filename} title={"Read the complete explained program: " + (filename)} />
    <p><a href={base + filename} download>Download {filename}</a>. Save required source data beside the program as described above.</p>
  </>;
}
