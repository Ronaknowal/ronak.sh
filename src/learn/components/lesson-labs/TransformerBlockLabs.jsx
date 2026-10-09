import { useEffect, useMemo, useRef, useState } from 'react';
import { NeuralTable, NeuralPlot as BasePlot } from './NeuralLessonElements.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber as f } from './LessonFlow.jsx';
import { BlockArray, BlockFeatureRow, BlockWorkspaceDrawing, BlockCommunicationDrawing, BlockStackDrawing, BlockPlacementDrawing, BlockNormalizerDrawing, BlockAxisDrawing, BlockFeedforwardDrawing, BlockGateDrawing, BlockMovementArchitectureDrawing, BlockProbeDrawing, BlockGradientDirectionsDrawing, BlockDerivativeRoutesDrawing, BlockVarianceDrawing, BlockTaskDrawing, BlockCopyDrawing, BlockVariantsDrawing, BlockParameterDrawing, BlockMemoryDrawing, BlockSystemsDrawing, blockVector as vector } from './TransformerBlockFlowFigures.jsx';
import { gatedFeedforwardTrace, blockCosts, blockDefault, feedforwardTrace, movementBlockForward, movementBlockForwardWithMasks, normalizationProbe, traceBlock } from '../../data/transformer-block-models.js';
import { layerNorm, mean, maxDifference } from '../../data/sequence-tensor-operations.js';
import './transformer-block-labs.css';

export { BlockWorkspaceDrawing, BlockCommunicationDrawing, BlockStackDrawing, BlockAxisDrawing, BlockMovementArchitectureDrawing, BlockGradientDirectionsDrawing, BlockDerivativeRoutesDrawing, BlockVarianceDrawing, BlockCopyDrawing, BlockParameterDrawing, BlockMemoryDrawing };
export const BlockCommunicationFigure = BlockCommunicationDrawing;
export const BlockTaskFigure = BlockTaskDrawing;
export const BlockVariantsFigure = BlockVariantsDrawing;
export const BlockSystemsFigure = BlockSystemsDrawing;
const base = '/learn-code/transformer-block-architecture/';
const colors = ['#be9cf5', '#e4b752', '#77cddb'];
function Plot(props) { return <div className="block-plot-scroll" role="region" aria-label={props.title} tabIndex={0}><div className="block-plot-size"><BasePlot {...props} /></div></div>; }
function useAsset(file) {
  const [resource, setResource] = useState({ data: null, error: null });
  const [attempt, setAttempt] = useState(0), [visible, setVisible] = useState(false);
  const container = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: '240px' });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return undefined;
    const controller = new AbortController();
    setResource({ data: null, error: null });
    fetch(base + file, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('The saved experiment could not be loaded.');
      return response.json();
    }).then(data => { if (!controller.signal.aborted) setResource({ data, error: null }); }).catch(error => { if (!controller.signal.aborted) setResource({ data: null, error: error.message }); });
    return () => controller.abort();
  }, [file, attempt, visible]);
  return { ...resource, container, retry: () => setAttempt(value => value + 1) };
}
function ResourceState({ resource, children }) {
  if (resource.error) return <div role="alert"><p>{resource.error}</p><FlowControls><button type="button" onClick={resource.retry}>Retry experiment</button></FlowControls></div>;
  if (!resource.data) return <p role="status">Loading the measured experiment when it reaches this part of the page…</p>;
  return children(resource.data);
}
function PairTrace({ settings, position = 0 }) {
  return <div className="block-flow-pair">{[true, false].map(pre => {
    const trace = traceBlock({ ...settings, pre });
    const selected = Object.fromEntries(Object.entries(trace).map(([key, values]) => [key, values[position]]));
    return <BlockPlacementDrawing key={String(pre)} pre={pre} trace={selected} input={settings.inputs[position]} branch={settings.branch} />;
  })}</div>;
}
export function BlockWiringFigure() {
  const [branch, setBranch] = useState(1);
  const settings = { ...blockDefault(), branch };
  const pre = traceBlock({ ...settings, pre: true }), post = traceBlock({ ...settings, pre: false });
  return <FlowLab id="block-wiring" label="Compare bypass and normalization placement">
    <PairTrace settings={settings} />
    <FlowControls><FlowSlider name="Both learned update multipliers λ" value={branch} min={0} max={1} step={.05} onChange={setBranch} /></FlowControls>
    <FlowReadout data-result="wiring">With λ={f(branch)}, pre-norm returns {vector(pre.output[0])}; post-norm returns {vector(post.output[0])}. The saved X and Z bypasses are never multiplied by λ.</FlowReadout>
  </FlowLab>;
}
export function BlockNormalizationLab() {
  const [first, setFirst] = useState(1), [offset, setOffset] = useState(0), [scale, setScale] = useState(1);
  const input = [first, 2, 5, 8], changed = input.map(x => scale * x + offset), epsilon = 1e-5;
  const rms = row => row.map(x => x / Math.sqrt(mean(row.map(v => v * v)) + epsilon));
  return <FlowLab id="block-normalization" label="Compare reference frames after a common shift and scale">
    <BlockArray label="Before the common transformation" values={input} role="input" />
    <BlockNormalizerDrawing input={changed} epsilon={epsilon} />
    <FlowControls><FlowSlider name="Original first feature" value={first} min={-4} max={8} step={.25} onChange={setFirst} /><FlowSlider name="Common offset added after scaling" value={offset} min={-10} max={10} step={.25} onChange={setOffset} /><FlowSlider name="Common multiplier" value={scale} min={-2} max={4} step={.1} onChange={setScale} /></FlowControls>
    <FlowReadout data-result="normalization">The transformed input is {vector(changed)}. Maximum change from original LN: {f(maxDifference(layerNorm(input, [], [], epsilon), layerNorm(changed, [], [], epsilon)))}; from original RMSNorm: {f(maxDifference(rms(input), rms(changed)))}. Centering removes a common offset; rescaling alone does not.</FlowReadout>
  </FlowLab>;
}
export function BlockNormalizationCases() {
  return <div>{[[[-1, -1, 1, 1], 'Zero-mean input: identical denominators and outputs'], [[2, 2, 2, 2], 'Constant nonzero input: centered distances vanish'], [[0, 0, 0, 0], 'Zero input: epsilon keeps both denominators positive']].map(([input, label]) => <div key={label}><p>{label}; gains one, offsets zero, ε=10⁻⁵.</p><BlockNormalizerDrawing input={input} /></div>)}</div>;
}
export function BlockEpsilonLab() {
  const [spread, setSpread] = useState(.01), [exponent, setExponent] = useState(-5);
  const epsilon = 10 ** exponent, input = [-3, -1, 1, 3].map(x => 2 + spread * x);
  const normalized = layerNorm(input, [], [], epsilon);
  return <FlowLab id="block-epsilon" label="What epsilon does near a constant row"><BlockNormalizerDrawing input={input} epsilon={epsilon} />
    <FlowControls><FlowSlider name="Spread around the constant 2" value={spread} min={0} max={.1} step={.001} onChange={setSpread} /><FlowSlider name="Epsilon exponent: ε = 10 to this power" value={exponent} min={-8} max={-1} step={1} onChange={setExponent} /></FlowControls>
    <FlowReadout data-result="epsilon">At spread {f(spread)} and ε={epsilon.toExponential(0)}, the centered output has L2 length {f(Math.hypot(...normalized))}. At zero spread it is zero; a positive spread is divided by √(5 × spread² + ε).</FlowReadout>
  </FlowLab>;
}
export function BlockFeedforwardLab() {
  const [first, setFirst] = useState(1), [detector, setDetector] = useState(1), [write, setWrite] = useState(.5);
  const fixture = blockDefault(), input = [first, 2, -1, -2];
  const up = fixture.up.map((row, i) => row.map((value, j) => i === 0 && j === 0 ? detector : value));
  const down = fixture.down.map((row, i) => row.map((value, j) => i === 2 && j === 2 ? write : value));
  const result = feedforwardTrace(input, up, down);
  return <FlowLab id="block-feature-write" label="Read a detector and follow its weighted write"><BlockFeedforwardDrawing input={input} up={up} down={down} />
    <FlowControls><FlowSlider name="Input feature 1" value={first} min={-3} max={3} step={.25} onChange={setFirst} /><FlowSlider name="Detector 1's coefficient on input 1" value={detector} min={-2} max={2} step={.25} onChange={setDetector} /><FlowSlider name="Write 3's coefficient on output 3" value={write} min={-2} max={2} step={.25} onChange={setWrite} /></FlowControls>
    <FlowReadout data-result="ffn">Responses {vector(result.responses)} become {vector(result.hidden)} under ReLU; the three weighted writes sum to {vector(result.output)}.</FlowReadout>
  </FlowLab>;
}
export function BlockLocalityLab() {
  const [first, setFirst] = useState(-1), fixture = blockDefault();
  const fixed = feedforwardTrace([1, 2, -1, -2], fixture.up, fixture.down), changed = feedforwardTrace([first, 0, 1, 0], fixture.up, fixture.down);
  return <FlowLab id="block-locality" label="Shared parameters do not mix direct input rows">
    <BlockArray label="Two direct FFN input rows" values={[[1, 2, -1, -2], [first, 0, 1, 0]]} role="input" /><BlockArray label="Shared FFN's two written updates" values={[fixed.output, changed.output]} />
    <FlowControls><FlowSlider name="Second row's first feature" value={first} min={-3} max={3} step={.25} onChange={setFirst} /></FlowControls>
    <FlowReadout data-result="locality">The second update is {vector(changed.output)}. The first remains {vector(fixed.output)} because no attention operation occurs between these direct inputs and the FFN.</FlowReadout>
  </FlowLab>;
}
export function BlockActivationLab() {
  const [response, setResponse] = useState(-1), fixture = blockDefault();
  const names = ['relu', 'gelu', 'silu'];
  const activated = names.map(name => feedforwardTrace([response, 0, 0, 0], fixture.up, fixture.down, name).hidden[0]);
  return <FlowLab id="block-activation" label="Compare three activation rules for one detector response"><BlockArray label="The same response through each activation" values={[[response, ...activated]]} columns={['response', 'ReLU', 'GELU', 'SiLU']} />
    <FlowControls><FlowSlider name="One detector's response before activation" value={response} min={-4} max={4} step={.1} onChange={setResponse} /></FlowControls>
    <FlowReadout data-result="activation">At response {f(response)}, ReLU gives {f(activated[0])}, GELU {f(activated[1])}, and SiLU {f(activated[2])}; the last two can retain a small negative write.</FlowReadout>
  </FlowLab>;
}
export function BlockGateLab() {
  const [first, setFirst] = useState(1), [gateCoefficient, setGateCoefficient] = useState(1), [write, setWrite] = useState(.5);
  const fixture = blockDefault(), input = [first, 2, -1, -2];
  const gate = [[gateCoefficient, 0, 0], [0, -1, 0], [0, 0, 1], [0, 0, 0]];
  const down = fixture.down.map((row, i) => row.map((v, j) => i === 2 && j === 2 ? write : v));
  const trace = gatedFeedforwardTrace(input, fixture.up, gate, down);
  return <FlowLab id="block-gate" label="Follow both learned routes in a gated FFN"><BlockGateDrawing trace={trace} input={input} up={fixture.up} gate={gate} down={down} />
    <FlowControls><FlowSlider name="Input feature 1" value={first} min={-3} max={3} step={.25} onChange={setFirst} /><FlowSlider name="Gate 1's coefficient on input 1" value={gateCoefficient} min={-2} max={2} step={.25} onChange={setGateCoefficient} /><FlowSlider name="Write 3's coefficient on output 3" value={write} min={-2} max={2} step={.25} onChange={setWrite} /></FlowControls>
    <FlowReadout data-result="gate">The gated hidden responses are {vector(trace.hidden)}, writing {vector(trace.output)}. A gate response may be negative and is not a probability.</FlowReadout>
  </FlowLab>;
}
export function BlockTraceLab() {
  const [other, setOther] = useState(3), [branch, setBranch] = useState(1), [position, setPosition] = useState(2);
  const fixture = blockDefault(), settings = { ...fixture, branch, inputs: [fixture.inputs[0], [other, 0, 2, 1]] };
  const traces = [true, false].map(pre => traceBlock({ ...settings, pre }));
  const pre = traces[0], receiver = position - 1;
  const products = pre.attentionInput.map(key => key.map((v, i) => v * pre.attentionInput[receiver][i]));
  return <FlowLab id="block-trace" label="Follow the complete block at the same input and weights">
    <BlockArray label="Pre-norm receiver query × each donor key, coordinate products" values={products} rows={['key position 1', 'key position 2']} /><BlockArray label="Sum products / √4 → softmax over both keys" values={[products.map(row => mean(row) * 2), pre.weights[receiver]]} rows={['scaled score', 'weight']} columns={['donor 1', 'donor 2']} />
    <BlockArray label="Pre-norm donor values: each attention input divided by four" values={pre.attentionInput.map(row=>row.map(x=>x/4))} rows={['donor 1','donor 2']} />
    <BlockArray label="Each donor value × its receiving weight × λ; sum rows to get the update" values={pre.attentionInput.map((row,i)=>row.map(x=>x/4*pre.weights[receiver][i]*branch))} rows={['donor 1 contribution','donor 2 contribution']} />
    <PairTrace settings={settings} position={receiver} />
    <FlowControls><FlowSlider name="Position 2's first input feature" value={other} min={-3} max={6} step={.25} onChange={setOther} /><FlowSlider name="Both learned update multipliers λ" value={branch} min={0} max={2} step={.1} onChange={setBranch} /><FlowSlider name="Receiver position to inspect" value={position} min={1} max={2} step={1} onChange={setPosition} /></FlowControls>
    <FlowReadout data-result="block">For receiver {position}, pre-norm outputs {vector(traces[0].output[receiver])}; post-norm outputs {vector(traces[1].output[receiver])}. The input, learned maps and λ match; their normalizer placement differs.</FlowReadout>
  </FlowLab>;
}
export function BlockProbeLab() {
  const [contrast, setContrast] = useState(0), [spread, setSpread] = useState(1);
  const input = [1, 2, 5, 8].map(x => 4 + spread * (x - 4)), probe = [1, 1 - 2 * contrast, 1 - contrast, 1 - contrast];
  const result = normalizationProbe(input, probe);
  return <FlowLab id="block-probe" label="Change the scalar question and the input spread"><BlockProbeDrawing input={input} probe={probe} gradient={result.gradient} scalar={result.scalar} />
    <FlowControls><FlowSlider name="Contrast amount: 0 = sum, 1 = first minus second" value={contrast} min={0} max={1} step={.05} onChange={setContrast} /><FlowSlider name="Input spread about mean 4" value={spread} min={.01} max={2} step={.01} onChange={setSpread} /></FlowControls>
    <FlowReadout data-result="probe">The scalar is {f(result.scalar)}; input-gradient L2 is {f(Math.hypot(...result.gradient))}. A central difference with step 10⁻⁵ agrees within {maxDifference(result.gradient, result.finite).toExponential(3)}.</FlowReadout>
  </FlowLab>;
}
function MovementDrawing({ points, times, selected = 22, validity }) {
  const original = points.slice(0, 45), path = original.map(([x, y]) => `${48 + 260 * x},${306 - 260 * y}`).join(' ');
  return <figure className="block-movement-drawing"><svg viewBox="0 0 380 400" role="img" aria-label="Movement path with equal x and y scales; start circle, end square, selected point ring; the selected time tag is printed">
    <line x1="48" y1="306" x2="308" y2="306" stroke="#99978f" /><line x1="48" y1="306" x2="48" y2="46" stroke="#99978f" />
    {[0, .5, 1].map(v => <g key={v}><text x={48 + v * 260} y="330" textAnchor="middle">{v}</text><text x="39" y={311 - v * 260} textAnchor="end">{v}</text></g>)}
    <polyline points={path} fill="none" stroke="#77cddb" strokeWidth="2" />
    <circle cx={48 + original[0][0] * 260} cy={306 - original[0][1] * 260} r="5" fill="#77cddb" /><rect x={44 + original[44][0] * 260} y={302 - original[44][1] * 260} width="8" height="8" fill="#e4b752" />
    <circle cx={48 + original[selected][0] * 260} cy={306 - original[selected][1] * 260} r="9" fill="none" stroke="#be9cf5" strokeWidth="2" />
    {points.slice(45).map(([x,y],i)=><g key={i}><line x1={43+260*x} x2={53+260*x} y1={301-260*y} y2={311-260*y} stroke="#99978f"/><line x1={53+260*x} x2={43+260*x} y1={301-260*y} y2={311-260*y} stroke="#99978f"/></g>)}
    <text x="178" y="356" textAnchor="middle">x → · y ↑ · circle start · square end</text><text x="178" y="382" textAnchor="middle">Ring: point {selected + 1}; time tag {f(times[selected], 4)}</text>
  </svg>{validity && <BlockArray label="Record validity is data, independent of either exclusion choice" values={validity.map(v => v ? 'valid' : 'PAD')} role="input" columns={validity.map((_, i) => i + 1)} />}</figure>;
}
function PairedProbabilities({ results, data }) {
  return <div className="block-flow-pair">{['pre-norm', 'post-norm'].map((name, i) => <div key={name}>
    <BlockFeatureRow label={`${name}: all 15 class probabilities`} values={results[i].probabilities} coordinate="class" />
    <FlowReadout data-result={`movement-${name}`}>{name} selects class {results[i].probabilities.indexOf(Math.max(...results[i].probabilities)) + 1}; class-4 probability {f(data[name].original.probabilities[3], 6)} → {f(results[i].probabilities[3], 6)}; maximum logit change {f(maxDifference(results[i].logits, data[name].original.logits))}.</FlowReadout>
  </div>)}</div>;
}
function MovementExperiment({ kind, data, baseline }) {
  const original = data['pre-norm'];
  const [selected, setSelected] = useState(23), [points, setPoints] = useState(original.points), [times, setTimes] = useState(original.times);
  const [reversed, setReversed] = useState(false), [count, setCount] = useState(0), [keys, setKeys] = useState(true), [pool, setPool] = useState(true);
  const currentPoints = kind.startsWith('reverse') && reversed ? [...original.points].reverse() : kind === 'padding' ? [...original.points, ...Array.from({ length: count }, () => [.75, .75])] : points;
  const currentTimes = kind === 'reverse-records' && reversed ? [...original.times].reverse() : kind === 'padding' ? [...original.times, ...Array(count).fill(0)] : times;
  const validity = currentPoints.map((_, i) => i < 45);
  const results = useMemo(() => {
    if (currentPoints === original.points && currentTimes === original.times) return baseline;
    return ['pre-norm', 'post-norm'].map(name => movementBlockForwardWithMasks(data[name], currentPoints, currentTimes, { validity, excludeInvalidKeys: keys, excludeInvalidPool: pool }));
  }, [data, baseline, original, currentPoints, currentTimes, keys, pool]);
  const index = selected - 1;
  return <FlowLab id={`block-movement-${kind}`} label={`Movement ${kind} investigation`}>
    <MovementDrawing points={currentPoints} times={currentTimes} selected={index} validity={kind === 'padding' ? validity : undefined} />
    <FlowControls>
      {(kind === 'point' || kind === 'time') && <FlowSlider name="Selected point" value={selected} min={1} max={45} step={1} onChange={setSelected} />}
      {kind === 'point' && <><FlowSlider name="Selected point x" value={points[index][0]} min={0} max={1} step={.01} onChange={value => setPoints(previous => previous.map((row,i)=>i === index ? [value,row[1]] : row))} /><FlowSlider name="Selected point y" value={points[index][1]} min={0} max={1} step={.01} onChange={value => setPoints(previous => previous.map((row,i)=>i === index ? [row[0],value] : row))} /></>}
      {kind === 'time' && <FlowSlider name="Selected point time tag" value={times[index]} min={-2} max={2} step={.05} onChange={value=>setTimes(previous=>previous.map((v,i)=>i===index?value:v))} />}
      {kind.startsWith('reverse') && <FlowChoice label={kind === 'reverse-records' ? 'Reverse complete point/time records' : 'Reverse coordinates; retain each row’s time tag'} options={[[false, 'Original'],[true,'Reversed']]} value={reversed} onChange={setReversed} />}
      {kind === 'padding' && <><FlowSlider name="Appended invalid padding records" value={count} min={0} max={15} step={1} onChange={setCount} /><FlowChoice label="Exclude invalid keys in both blocks" options={[[true,'Exclude'],[false,'Include']]} value={keys} onChange={setKeys} /><FlowChoice label="Exclude invalid rows from final mean" options={[[true,'Exclude'],[false,'Include']]} value={pool} onChange={setPool} /></>}
    </FlowControls>
    <PairedProbabilities results={results} data={data} />
  </FlowLab>;
}
function MovementInspection({ data, baseline }) {
  const [layer, setLayer] = useState(1), selected = 22;
  return <FlowLab id="block-movement-inspect" label="Inspect both fitted blocks at the original point 23">
    <div className="block-flow-pair">{baseline.map((result,i)=>{
      const trace=result.traces[layer-1];
      return <div key={i}>{['input','attentionInput','update','context','ffnInput','hidden','ffnUpdate','output'].map(name=><BlockFeatureRow key={name} label={`${i?'Post':'Pre'}-norm block ${layer}, point 23: ${name}`} values={trace[name][selected]} coordinate={name==='hidden'?'hidden':'feature'} role={name==='input'?'input':'computed'} />)}{trace.weights.map((head,j)=><BlockFeatureRow key={j} label={`Head ${j+1}: point 23's weights on all 45 valid keys; sum one`} values={head[selected]} coordinate="key" />)}</div>;
    })}</div>
    <FlowControls><FlowSlider name="Block to inspect at unchanged point 23" value={layer} min={1} max={2} step={1} onChange={setLayer} /></FlowControls>
    <FlowReadout>Each head mixes 12-wide values; concatenation restores 24 features. The same point can carry different context after block 2. All feature and hidden coordinates above come from the retained model.</FlowReadout>
  </FlowLab>;
}
function MovementSuite({ data }) {
  const baseline = useMemo(()=>['pre-norm','post-norm'].map(name=>movementBlockForward(data[name],data[name].points,data[name].times)),[data]);
  return <>
    <p>Start with source row 77, the observed class-4 anticlockwise arc. Both retained seed-101 models misclassify it. Cyan traces are the current observations; edited paths have no newly measured label.</p>
    <p>What changes if one location moves, with its sampling time held fixed? The selected point and its x and y coordinates are the only controls.</p><MovementExperiment kind="point" data={data} baseline={baseline} />
    <p>Keep the observed path and change when one point is tagged as occurring. This changes a feature supplied to the stem, rather than changing its storage index.</p><MovementExperiment kind="time" data={data} baseline={baseline} />
    <p>Now reverse the coordinates while retaining the original increasing time tags. The location/time associations change, so these are different records.</p><MovementExperiment kind="reverse-coordinates" data={data} baseline={baseline} />
    <p>In contrast, reverse each complete point/time record. This only permutes storage; shared row operations and valid-row mean pooling preserve the classifier in exact arithmetic.</p><MovementExperiment kind="reverse-records" data={data} baseline={baseline} />
    <p>Finally append invalid records at (.75,.75) with tag zero. Their validity is explicitly labelled below. Blocking their keys stops valid queries reading them in both blocks; excluding their final rows prevents them changing the mean. Those are independent operations.</p><MovementExperiment kind="padding" data={data} baseline={baseline} />
    <p>Return to the unchanged observed point 23 to inspect the actual 24-wide carried states, 48 hidden responses and both attention heads. The layer control switches which already-taught block is shown.</p><MovementInspection data={data} baseline={baseline} />
  </>;
}
export function BlockMovementLab() {
  const resource = useAsset('movement-runtime.json');
  return <div ref={resource.container}><ResourceState resource={resource}>{data=><MovementSuite data={data}/>}</ResourceState></div>;
}
export function BlockEvidenceFigure({ gradients = false }) {
  const resource=useAsset('evidence-runtime.json'), [selection,setSelection]=useState(0);
  return <div ref={resource.container}><ResourceState resource={resource}>{data=>{
    if(gradients){
      const depth=[1,4,12][selection%3], rows=data.gradientDepth.filter(row=>row.depth===depth);
      return <FlowLab id="block-gradient-depth" label="Inspect recorded initialization sensitivities">
        {['state_gradient_l2','state_rms'].map((key,i)=><Plot key={key} title={i?'Carried-state RMS':'State gradient L2'} xLabel="carried state index" yLabel={i?'feature RMS':'gradient L2'} xDomain={[0,depth]} yDomain={[0,1.1*Math.max(...rows.flatMap(row=>row[key]))]} series={rows.map((row,j)=>({label:row.pre_norm?'pre-norm':'post-norm',color:colors[j],values:row[key].map((v,k)=>[k,v])}))}/>)}
        <FlowControls><FlowChoice label="Recorded stack depth" options={[[0,'1 block'],[1,'4 blocks'],[2,'12 blocks']]} value={selection%3} onChange={setSelection}/></FlowControls>
        <FlowReadout>At depth {depth}, input-gradient lengths are {f(rows[0].state_gradient_l2[0])} pre-norm and {f(rows[1].state_gradient_l2[0])} post-norm. This is one unit random probe, not a singular-value bound or training score.</FlowReadout>
        <NeuralTable caption="Every recorded state" headers={['State','Pre gradient L2','Post gradient L2','Pre RMS','Post RMS']} rows={rows[0].state_rms.map((_,i)=>[i,...['state_gradient_l2','state_rms'].flatMap(key=>rows.map(row=>f(row[key][i])))])}/>
      </FlowLab>;
    }
    const fit=data.fits[selection%6];
    return <FlowLab id="block-fit-history" label="Inspect six recorded learning histories">
      <Plot title={`Recorded cross entropy; selected epoch ${fit.selected_epoch}`} xLabel="epoch" yLabel="nats / example" xDomain={[1,180]} yDomain={[0,1.05*Math.max(...fit.history.flatMap(row=>[row.train.loss,row.validation.loss]))]} series={['train','validation'].map((key,i)=>({label:key,color:colors[i],values:fit.history.map(row=>[row.epoch,row[key].loss])}))} points={[{id:'selected',x:fit.selected_epoch,y:fit.history[fit.selected_epoch-1].validation.loss,label:`Selected epoch ${fit.selected_epoch}`,selected:true}]}/>
      <FlowControls><label className="block-flow-select">Recorded fit<select value={selection%6} onChange={e=>setSelection(Number(e.target.value))}>{data.fits.map((row,i)=><option key={i} value={i}>{row.placement}, seed {row.seed}</option>)}</select></label></FlowControls>
      <FlowReadout>The recorded {fit.placement}, seed {fit.seed} checkpoint at epoch {fit.selected_epoch} classifies {fit.test.correct} of 60 test observations correctly. Changing this control selects evidence; it does not retrain.</FlowReadout>
      <NeuralTable caption="All six validation-selected checkpoints" headers={['Placement','Seed','Epoch','Test correct / 60','Test macro F1']} rows={data.fits.map(row=>[row.placement,row.seed,row.selected_epoch,row.test.correct,f(row.test.macro_f1,6)])}/>
    </FlowLab>;
  }}</ResourceState></div>;
}
export function BlockCostsLab() {
  const [length,setLength]=useState(512),[width,setWidth]=useState(512),result=blockCosts(length,width,4*width);
  return <FlowLab id="block-cost" label="Change sequence length and width in a derived work model">
    <Plot title="Derived dense-map and pairwise work" xLabel="sequence length L" yLabel="billion MACs" xDomain={[64,8192]} yDomain={[0,1.05*Math.max(blockCosts(8192,width,4*width).maps,blockCosts(8192,width,4*width).pairs)/1e9]} series={['maps','pairs'].map((key,i)=>({label:key==='maps'?'Shared projections + FFN':'Scores + value mixtures',color:colors[i],values:Array.from({length:33},(_,j)=>{const l=64+(8192-64)*j/32;return[l,blockCosts(l,width,4*width)[key]/1e9];})}))}/>
    <FlowControls><FlowSlider name="Sequence length L" value={length} min={64} max={8192} step={64} onChange={setLength}/><FlowSlider name="Feature width d" value={width} min={64} max={1024} step={64} onChange={setWidth}/></FlowControls>
    <FlowReadout data-result="cost">At L={length}, d={width}, f={4*width} and N=1, parameters stay {result.parameters.toLocaleString()} when L changes. Maps require {f(result.maps/1e9)} billion MACs, pairwise attention {f(result.pairs/1e9)} billion; these are arithmetic counts, not measured seconds.</FlowReadout>
    <NeuralTable caption="Different objects, different units; 8 ordinary equal-total-width heads" headers={['Quantity','Value','Unit']} rows={Object.entries(result).map(([name,value])=>[name,value.toLocaleString(),name==='parameters'?'scalars':['maps','pairs'].includes(name)?'MACs':'entries'])}/>
  </FlowLab>;
}
