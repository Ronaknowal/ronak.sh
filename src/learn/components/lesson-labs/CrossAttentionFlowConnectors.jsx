import { useState } from 'react';
import { accessGraph, originalEvents, compression, gateStep } from '../../data/cross-attention-models.js';
import { attention, finiteDepthCredit } from '../../data/cross-attention-flow-models.js';
import { CrossFigure, CrossMatrix, CrossVector, CrossArrow, CrossBranches, CrossNumber, CrossSelect, crossNumber as f } from './CrossAttentionFlowFigures.jsx';
import { FlowLab, FlowControls, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { useCrossFlow } from './CrossAttentionFlowState.jsx';

export function CrossArrivalRoutes() {
  const s = useCrossFlow(), graph = accessGraph(s.order, s.policy, 'independent');
  function move(i, delta) { const next = [...s.order]; [next[i], next[i + delta]] = [next[i + delta], next[i]]; s.setOrder(next); }
  return <FlowLab id="cross-arrivals" label="Move arrivals and inspect direct visual availability">
    <CrossFigure job="D11" label="Time-ordered arrivals determine direct visual donors" caption="The numbered ribbon is arrival order. Each named text reader can directly use only eligible earlier images. Moving a stable event changes time, not its identity.">
      <ol className="cross-flow-arrivals">{s.order.map((event, i) => <li key={event}><span>{event}</span><div className="cross-flow-actions">
        <button type="button" disabled={i === 0} aria-label={`Move ${event} earlier`} onClick={() => move(i, -1)}>Earlier ↑</button>
        <button type="button" disabled={i === 5} aria-label={`Move ${event} later`} onClick={() => move(i, 1)}>Later ↓</button></div></li>)}</ol>
      <CrossArrow>Available images feed each arriving text reader.</CrossArrow>
      <CrossMatrix values={graph.readers.map(row => graph.images.map(image => row.direct.includes(image)))} label="Direct visual reads: text rows → image columns" rows={graph.texts} columns={graph.images} binary />
    </CrossFigure><FlowControls><FlowChoice label="Direct visual policy" value={s.policy} options={[[ 'recent', 'Most recent earlier image'], ['all', 'All earlier images']]} onChange={s.setPolicy} /></FlowControls>
    <FlowReadout>{graph.readers.map(row => `${row.text} directly reads ${row.direct.join(' and ') || 'no image'}.`).join(' ')} Empty context requires a skipped visual residual or an explicit empty-context token.</FlowReadout>
    <div className="cross-flow-actions"><button type="button" onClick={() => { s.setOrder([...originalEvents]); s.setPolicy('recent'); }}>Reset arrivals</button></div>
  </FlowLab>;
}
export function CrossFusionDepth() {
  const s = useCrossFlow(), graph = accessGraph(s.order, s.policy, 'independent');
  return <FlowLab id="cross-fusion-depth" label="Separate arrival order, fusion and insertion depth">
    <CrossFigure job="D12" label="Shared causal stream versus separate image memory" caption="Rows read columns. Shared-stream fusion puts image entries inside the causal stream. Separate fusion combines text self-attention with a rectangular visual read. The layer ruler is depth; it is independent of arrival time.">
      <CrossBranches><CrossMatrix values={s.order.map((_, i) => s.order.map((_, j) => j <= i))} label="Shared-stream causal permissions" rows={s.order} columns={s.order} binary />
        <div><CrossMatrix values={graph.texts.map((_, i) => graph.texts.map((_, j) => j <= i))} label="Separate text self-attention" rows={graph.texts} columns={graph.texts} binary />
          <CrossMatrix values={graph.readers.map(row => graph.images.map(image => row.direct.includes(image)))} label="Separate visual cross-attention" rows={graph.texts} columns={graph.images} binary /></div></CrossBranches>
      <div className="cross-flow-depth-ruler" aria-label="Eight language layers with visual insertions">{Array.from({ length: 8 }, (_, i) => <div key={i}>
        <span className="cross-flow-depth-mark" aria-hidden="true" /><span>Language layer {i + 1}</span>{(i + 1) % s.depth === 0 && <span className="cross-flow-depth-read">← separate visual read</span>}
      </div>)}</div>
    </CrossFigure><FlowControls><CrossNumber label="Insert visual read every N layers" value={s.depth} min={1} max={4} integer onChange={s.setDepth} /></FlowControls>
    <FlowReadout>{Math.floor(8 / s.depth)} visual insertions in eight language layers. Reordering inputs does not select this insertion frequency.</FlowReadout>
  </FlowLab>;
}
export function CrossIndirectRoute() {
  const [layers, setLayers] = useState(2), [carry, setCarry] = useState(1), [earlierValue, setEarlierValue] = useState(1);
  const r = finiteDepthCredit({ layers, carry, earlierValue, directValue: 2 });
  return <FlowLab id="cross-indirect-route" label="An earlier image needs a later operation to influence later text">
    <CrossFigure job="D13" label="Finite layer operations expose an indirect image route" caption="Constructed scalar example: initially imageA carries 1; imageB carries 2. The current inputs and actual operations are shown above. A self read happens before its layer's cross read. Only a later self operation can carry the earlier image contribution.">
      <CrossBranches><CrossVector values={[earlierValue]} label="ImageA carried scalar" role="input" /><CrossVector values={[2]} label="ImageB carried scalar" role="input" /></CrossBranches>
      <CrossArrow>Layer1 self first, then separate visual reads.</CrossArrow>
      <CrossMatrix values={r.steps.map(step => [step.earlier, step.later])} label="Actual composed scalar states" rows={r.steps.map(step => step.operation)} columns={['earlier text', 'later text']} />
      <CrossArrow>Trace the earlier-image contribution through later self operations.</CrossArrow>
      <CrossVector values={[r.indirectContribution]} label="Indirect contribution to the final later text" />
    </CrossFigure><FlowControls><FlowNumberLayers value={layers} onChange={setLayers} /><CrossNumber label="Earlier-text carry coefficient" value={carry} min={-4} max={4} onChange={setCarry} />
      <CrossNumber label="ImageA scalar" value={earlierValue} min={-4} max={4} onChange={setEarlierValue} /></FlowControls>
    <FlowReadout>Later state {f(r.later)} contains indirect contribution {f(r.indirectContribution)}. {layers === 1 ? 'No later self read exists, so this construction has no indirect route.' : carry === 0 ? 'The later operation exists but its carry is zero.' : 'This is a possible computed route; a trained network need not use it.'}</FlowReadout>
  </FlowLab>;
}
function FlowNumberLayers(props) { return <CrossNumber label="Composed layer count" min={1} max={4} integer {...props} />; }
export function CrossSourceDependencies() {
  const s = useCrossFlow(), g = accessGraph(s.order, s.policy, s.encoder);
  return <FlowLab id="cross-source-dependencies" label="Inspect upstream source dependence separately from donor availability">
    <CrossFigure job="D14" label="A donor can carry information from another source" caption="The dependency grid is upstream of the final text mask. A bidirectionally encoded image state can already contain a future image; blocking that future column in the text read cannot remove information inside an allowed donor.">
      <CrossMatrix values={g.dependencies.map(row => g.images.map(image => row.includes(image)))} label="Encoded image row contains these source-image columns" rows={g.images} columns={g.images} binary />
      <CrossArrow>Read eligible donor states; their internal dependencies travel with them.</CrossArrow>
      <CrossMatrix values={g.readers.map(row => g.images.map(image => row.actual.includes(image)))} label="Structural source dependencies reachable by the supplied text history" rows={g.texts} columns={g.images} binary />
    </CrossFigure><FlowControls><FlowChoice label="Image-source encoder" value={s.encoder} options={[[ 'independent', 'Independent images'], ['causal', 'Causal across arrivals'], ['bidirectional', 'Bidirectional whole clip']]} onChange={s.setEncoder} /></FlowControls>
    <FlowReadout>{g.readers.filter(row => row.unavailable.length).map(row => `${row.text} has a future path from ${row.unavailable.join(', ')}.`).join(' ') || 'No future-source path in this declared dependency graph.'} Reachability is structural; the finite operations above determine whether a particular indirect path has already executed.</FlowReadout>
  </FlowLab>;
}
export function CrossAnswerShift() {
  const [shifted, setShifted] = useState(true);
  const input = shifted ? ['start', 'red'] : ['red', 'bicycle'], target = ['red', 'bicycle'];
  return <FlowLab id="cross-answer-shift" label="Shift generated language targets separately from image access">
    <CrossFigure job="D15" label="Teacher-forced input and target are offset by one token" caption="This deliberately switches from digit/parity classification to language generation. The image and question supply context; causal permissions limit text history. Shifting prevents the current target from appearing in the current input.">
      <CrossMatrix values={[input, target]} label="Input and target lanes by answer position" rows={['decoder input', 'loss target']} columns={['position0', 'position1']} role="input" />
      <CrossArrow>Each position predicts its target from permitted inputs and context.</CrossArrow>
      <CrossMatrix values={[[true, false], [true, true]]} label="Answer self-attention: each row reads earlier/current input positions" rows={['predict red', 'predict bicycle']} columns={input} binary />
      <CrossMatrix values={[[true, true], [true, true]]} label="Available context reads" rows={['predict red', 'predict bicycle']} columns={['image', 'question']} binary />
    </CrossFigure><FlowControls><FlowChoice label="Answer input" value={shifted} options={[[true, 'Shift with start token'], [false, 'Wrong: unshifted targets']]} onChange={setShifted} /></FlowControls>
    <FlowReadout>{shifted ? 'The first answer position cannot read red from its own input. It must use the image/question and start token.' : 'The causal diagonal now exposes the current target itself. Causal masking alone does not fix this unshifted input.'} A question may be excluded from answer loss while still being available information.</FlowReadout>
  </FlowLab>;
}
export function CrossSlotResampler() {
  const [slot, setSlot] = useState(0), [patch, setPatch] = useState(0);
  const memory = Array.from({ length: 16 }, (_, i) => [Math.sin(i), Math.cos(i), (i % 4) / 3, Math.floor(i / 4) / 3]);
  const queries = [[1, 0], [0, 1], [-1, 0], [0, -1]], keys = memory.map(row => row.slice(0, 2)), values = memory;
  const r = attention(queries, keys, values);
  return <FlowLab id="cross-slot-resampler" label="Four slots each read every source patch">
    <CrossFigure job="D16" label="Learned-slot anatomy:16 memory rows feed four independently normalized reads" caption="This deterministic constructed example uses four slot query vectors and16 donor rows; its parameters are illustrative, not fitted. Slots are output identities, not fixed image quadrants. All16 donors are eligible for every slot.">
      <CrossMatrix values={memory} label="Sixteen constructed source rows, indexed by spatial patch" rows={memory.map((_, i) => `patch ${i}`)} role="input" selected={[patch, 0]} onSelect={i => setPatch(i)} />
      <CrossMatrix values={queries} label="Four slot query vectors" rows={queries.map((_, i) => `slot ${i}`)} role="parameter" selected={[slot, 0]} onSelect={i => setSlot(i)} />
      <CrossArrow>Every slot compares with all16 donor keys.</CrossArrow>
      <CrossMatrix values={r.weights} label="4×16 slot-to-patch shares" rows={queries.map((_, i) => `slot ${i}`)} selected={[slot, patch]} onSelect={(i, j) => { setSlot(i); setPatch(j); }} />
      <CrossMatrix values={Array.from({ length: 4 }, (_, i) => r.weights[slot].slice(i * 4, i * 4 + 4))} label={`Slot ${slot}: shares at4×4 patch addresses`} />
      <CrossArrow>Combine each slot's weighted donor values.</CrossArrow><CrossMatrix values={r.output} label="Four resampled rows, width4" rows={queries.map((_, i) => `slot ${i}`)} />
    </CrossFigure><FlowReadout>Slot {slot} gives patch {patch} share {f(r.weights[slot][patch])} and returns [{r.output[slot].map(v => f(v)).join(', ')}]. A learned system changes its slot and source projections during training.</FlowReadout>
  </FlowLab>;
}
export function CrossCompressionCollision() {
  const [a, setA] = useState([1, 3]), [b, setB] = useState([2, 2]), [selected, setSelected] = useState([0, 0]), [slots, setSlots] = useState(1), r = compression(a, b, slots);
  const values = selected[0] === 0 ? a : b;
  function edit(value) { const next = values.map((v, i) => i === selected[1] ? value : v); (selected[0] === 0 ? setA : setB)(next); }
  return <FlowLab id="cross-compression-collision" label="Check whether the stored memory preserves a requested distinction">
    <CrossFigure job="D17" label="Two different original memories can share one compressed state" caption="The uniform mean is a declared compressor. One equal stored state forces any deterministic downstream reader to return the same answer; two ordered identity slots retain both original entries.">
      <CrossMatrix values={[a, b]} label="Original memories: select any coordinate" rows={['A', 'B']} role="input" selected={selected} onSelect={(i, j) => setSelected([i, j])} />
      <CrossArrow>{slots === 1 ? 'Uniform mean: add the two entries and divide by2.' : 'Identity: retain both ordered entries.'}</CrossArrow>
      <CrossMatrix values={[r.first, r.second]} label="Stored states" rows={['A', 'B']} />
      <CrossBranches><CrossVector values={r.maximum} label="Original maximum, A then B" /><CrossVector values={r.spread} label="Original spread, A then B" /></CrossBranches>
    </CrossFigure><FlowControls><CrossNumber syncKey={values} label={`Memory ${selected[0] === 0 ? 'A' : 'B'}, coordinate ${selected[1]}`} value={values[selected[1]]} min={-8} max={8} onChange={edit} />
      <FlowChoice label="Compressor" value={slots} options={[[1, 'One uniform-mean slot'], [2, 'Two identity slots']]} onChange={setSlots} /></FlowControls>
    <FlowReadout>{r.identical ? 'The stored states collide.' : 'These stored states differ.'} Original maxima: {f(r.maximum[0])} and {f(r.maximum[1])}.</FlowReadout>
    <div className="cross-flow-actions"><button type="button" onClick={() => setB([...a])}>Make original memories identical</button><button type="button" onClick={() => { setA([1, 3]); setB([2, 2]); setSlots(1); }}>Reset collision</button></div>
  </FlowLab>;
}
export function CrossGateForward() {
  const s = useCrossFlow(), r = gateStep(s.gate), [coordinate, setCoordinate] = useState('x');
  const edit = (key, value) => s.setGate({ ...s.gate, [key]: value });
  return <FlowLab id="cross-gate-forward" label="Trace the gated residual before changing it">
    <CrossFigure job="D18" label="Residual bypass plus tanh-gated adapter output" caption="Amber α is a trainable gate parameter; F is the fixed adapter output in this scalar investigation. The bypass carries X unchanged. A zero gate preserves the original forward value.">
      <CrossBranches><div><CrossVector values={[s.gate.x]} label="Residual input X" role="input" /><CrossArrow>Unchanged bypass</CrossArrow></div>
        <div><CrossVector values={[s.gate.alpha]} label="Gate parameter α" role="parameter" /><CrossArrow>Apply tanh</CrossArrow><CrossVector values={[r.gate]} label="Gate tanh(α)" />
          <CrossVector values={[s.gate.value]} label="Adapter output F" role="input" /><CrossArrow>Multiply F by the gate</CrossArrow><CrossVector values={[r.gate * s.gate.value]} label="Gated update" /></div></CrossBranches>
      <p className="cross-flow-add">⊕</p><CrossVector values={[r.output]} label="Merged Y" /><CrossArrow>Subtract target {f(s.gate.target)}; half-square gives loss.</CrossArrow><CrossVector values={[r.loss]} label="Loss" />
    </CrossFigure><FlowControls><CrossNumber syncKey={s.gate} label="Gate parameter α" value={s.gate.alpha} min={-4} max={4} onChange={v => edit('alpha', v)} /></FlowControls>
    <p>Edit one supplied scalar at a time; the other values remain in the same scenario.</p><FlowControls><CrossSelect label="Scenario scalar" value={coordinate} options={[[ 'x', 'Residual input X'], ['value', 'Adapter output F'], ['target', 'Loss target']]} onChange={setCoordinate} />
      <CrossNumber syncKey={s.gate} label={`Scenario ${coordinate}`} value={s.gate[coordinate]} min={-4} max={4} onChange={v => edit(coordinate, v)} /></FlowControls>
    <FlowReadout>Y={f(r.output)}, loss={f(r.loss)}. The adapter changes the output by {f(r.gate * s.gate.value)}.</FlowReadout>
  </FlowLab>;
}
export function CrossGateCredit() {
  const s = useCrossFlow(), r = gateStep(s.gate), canStep = r.nextAlpha >= -4 && r.nextAlpha <= 4;
  function apply() { if (canStep) { s.setGatePinned({ ...s.gate }); s.setGate({ ...s.gate, alpha: r.nextAlpha }); } }
  return <FlowLab id="cross-gate-credit" label="Open the gate using its own loss credit">
    <CrossFigure job="D19" label="Separate gate-parameter and adapter-output credit" caption="Orange marks derivatives of the current scalar loss. An exact step updates α while holding X,F,target fixed; it is not full adapter training. An out-of-domain proposal is shown and refused, never clipped.">
      <CrossVector values={[r.residual]} label="Loss residual Y−target" role="credit" />
      <CrossBranches><div><CrossArrow>Multiply by tanh(α).</CrossArrow><CrossVector values={[r.valueGradient]} label="dL/dF" role="credit" /></div>
        <div><CrossArrow>Multiply by F and by1−tanh²(α).</CrossArrow><CrossVector values={[r.alphaGradient]} label="dL/dα" role="credit" /></div></CrossBranches>
      <CrossArrow>α − rate × dL/dα</CrossArrow><CrossVector values={[r.nextAlpha, r.nextOutput, r.nextLoss]} label="Proposed α, resulting Y, resulting loss" />
      {s.gatePinned && <CrossVector values={[s.gatePinned.alpha, gateStep(s.gatePinned).output, gateStep(s.gatePinned).loss]} label="Kept pre-step α, Y, loss" />}
    </CrossFigure><FlowControls><CrossNumber syncKey={s.gate} label="One-step rate" value={s.gate.rate} min={0} max={1} onChange={v => s.setGate({ ...s.gate, rate: v })} /></FlowControls>
    <div className="cross-flow-actions"><button type="button" disabled={!canStep} onClick={apply}>Apply exact gate step</button><button type="button" onClick={() => s.setGatePinned({ ...s.gate })}>Keep current gate state</button>
      <button type="button" onClick={() => s.setGate({ ...s.gate, value: 0 })}>Set F=0</button><button type="button" onClick={() => { s.setGate({ x: 1, value: 2, target: 3, alpha: 0, rate: .1 }); s.setGatePinned(null); }}>Reset gate</button></div>
    <FlowReadout>{canStep ? `Proposed α=${f(r.nextAlpha)} is within−4…4.` : `Proposed α=${f(r.nextAlpha)} is outside−4…4; apply is refused.`} Current adapter-output credit is {f(r.valueGradient)}; gate credit is {f(r.alphaGradient)}.</FlowReadout>
  </FlowLab>;
}
export function CrossFrozenCredit() {
  const [detached, setDetached] = useState(false), a = 1, w = 2, target = 3, y = a * w, residual = y - target;
  return <FlowLab id="cross-frozen-credit" label="Compare frozen parameters with a detached computation">
    <CrossFigure job="D20" label="Frozen multiplier can transmit input credit" caption="The frozen w=2 is not updated. With graph recording, the trainable upstream a still receives credit. Detaching this operation breaks the graph route; it does not make w more frozen.">
      <CrossVector values={[a]} label="Trainable upstream a" role="parameter" /><CrossArrow>Multiply by frozen w={w}.</CrossArrow><CrossVector values={[y]} label="Output y" />
      <CrossArrow>Target {target}; half-square loss {f(.5 * residual ** 2)}.</CrossArrow><CrossVector values={[residual]} label="Output loss credit" role="credit" />
      <CrossArrow>{detached ? 'Graph route cut: no upstream autograd credit.' : 'Reverse multiply by frozen w.'}</CrossArrow>
      <CrossVector values={[detached ? null : residual * w]} label="Credit to a" role="credit" />
    </CrossFigure><FlowControls><FlowChoice label="Frozen operation" value={detached} options={[[false, 'Record the input graph'], [true, 'Detach / no_grad this route']]} onChange={setDetached} /></FlowControls>
    <FlowReadout>{detached ? 'Autograd has no recorded route to a; no gradient tensor is produced by this path.' : `a receives ${f(residual * w)} loss credit while w remains unchanged.`} Training/evaluation mode controls behavior such as dropout; it does not by itself freeze parameters or detach inputs.</FlowReadout>
  </FlowLab>;
}
