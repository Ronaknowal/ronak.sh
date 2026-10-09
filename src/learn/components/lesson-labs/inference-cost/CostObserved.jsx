import React, { useEffect, useRef, useState } from 'react';
import { Figure, Controls, Choice, Select, Readout, Note, Bars, useSavedJson, Loading, n } from './CostPrimitives.jsx';
const source = '/learn/examples/inference-cost/native-observations.json';
function Observations({
  children
}) {
  const state = useSavedJson(source);
  return state.data ? children(state.data) : <Loading state={state} />;
}
export function DeferredObservation({
  kind
}) {
  const ref = useRef(null),
    [near, setNear] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNear(true);
        observer.disconnect();
      }
    }, {
      rootMargin: '600px'
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="cost-observation-slot">{near ? <Observations>{data => kind === 'tensors' ? <TensorObservation data={data} /> : <ForwardObservation data={data} />}</Observations> : <Figure id={kind === 'tensors' ? 'D28' : 'D29'} label="Saved native observation"><p>Saved CPU observations load as this part of the lesson approaches.</p></Figure>}</div>;
}
function TensorObservation({
  data
}) {
  const [which, setWhich] = useState('0'),
    [kind, setKind] = useState('parameters'),
    [request, setRequest] = useState('0'),
    [step, setStep] = useState('0'),
    [tensor, setTensor] = useState('0');
  const tensors = kind === 'parameters' ? data.parameters.tensors : data.resident_tensors.tensors;
  const item = tensors[Math.min(Number(which), tensors.length - 1)],
    saved = data.requests[Number(request)].steps[Number(step)],
    kv = saved.cache.tensors[Number(tensor)];
  const parameterCount = data.parameters.tensors.reduce((sum, row) => sum + row.elements, 0);
  return <Figure id="D28" label="Actual named tensor storage"><div className="cost-observed-tensor"><strong>{item.name}</strong><div className="cost-shape">{item.shape.map((size, i) => <span key={i}>axis {i}<br /><b>{n(size)}</b></span>)}<span>× {item.element_bytes} bytes / element</span></div><Readout>{n(item.elements)} elements × {item.element_bytes} = {n(item.logical_bytes)} logical bytes; backing {n(item.backing_bytes)} bytes; {item.first_storage_occurrence ? 'first occurrence of this storage' : 'shared storage already encountered'}.</Readout></div><Bars rows={[{
      label: 'All parameter logical bytes',
      value: data.parameters.logical_bytes,
      color: '#b595ff'
    }, {
      label: 'Parameters + buffers',
      value: data.resident_tensors.logical_bytes,
      color: '#ffc04d'
    }]} unit="bytes" /><div className="cost-observed-kv" style={{
      borderColor: kv.name.endsWith('.K') ? '#5da9ff' : '#59d9ed'
    }}><strong>{kv.name} · {data.requests[Number(request)].request_id} · step {step}</strong><div className="cost-shape">{kv.shape.map((size, i) => <span key={i}>{['batch', 'KV heads', 'positions', 'width'][i]}<br /><b>{size}</b></span>)}</div><span>{n(kv.elements)} elements × {kv.element_bytes} bytes = {n(kv.logical_bytes)} logical bytes; {n(kv.backing_bytes)} backing bytes.</span></div><Readout>{n(parameterCount)} parameters; {n(data.parameters.logical_bytes)} parameter bytes; {n(data.resident_tensors.logical_bytes - data.parameters.logical_bytes)} additional buffer bytes. Unique resident backing {n(data.resident_tensors.unique_storage_bytes)} bytes. Cache total: {n(saved.cache.logical_bytes)} logical / {n(saved.cache.unique_storage_bytes)} unique backing bytes.</Readout><Controls><Choice name="Named resident set" value={kind} onChange={v => {
        setKind(v);
        setWhich('0');
      }} options={[['parameters', 'Parameters'], ['resident', 'Parameters and buffers']]} /><Select name="Actual named resident tensor" value={which} onChange={setWhich} options={tensors.map((row, i) => [String(i), row.name])} /><Select name="Saved request" value={request} onChange={setRequest} options={data.requests.map((row, i) => [String(i), row.request_id])} /><Choice name="Recorded step" value={step} onChange={setStep} options={[['0', 'Prefill'], ['1', 'First decode'], ['2', 'Final inspection']]} /><Select name="Actual cache tensor" value={tensor} onChange={setTensor} options={saved.cache.tensors.map((row, i) => [String(i), row.name])} /></Controls><Note>Pinned Pythia-14M, CPU float32, two threads. Counts describe these actual tensors; they exclude process RSS, allocator metadata, peak workspace and a GPU budget.</Note></Figure>;
}
function ForwardObservation({
  data
}) {
  const [request, setRequest] = useState('0'),
    [step, setStep] = useState('0'),
    [call, setCall] = useState('0');
  const row = data.requests[Number(request)],
    s = row.steps[Number(step)],
    linear = s.linear_operations[Number(call)],
    flops = s.linear_operations.reduce((sum, item) => sum + item.nominal_flops, 0);
  return <Figure id="D29" label="Actual forward calls and output positions"><div className="cost-recorded-steps">{row.steps.map(record => <button type="button" key={record.step} aria-pressed={String(record.step) === step} onClick={() => setStep(String(record.step))}><strong>Forward {record.step}</strong><span>{record.query_positions} query positions</span><span>cache length {record.cache_positions}</span><span>{record.selected_output_id === null ? 'inspection only; no output selected' : `selected ID ${record.selected_output_id}`}</span></button>)}</div><div className="cost-token-sequence">{s.query_ids.map((id, i) => <span key={i}>query {i}<br /><code>{id}</code></span>)}</div><Bars rows={[{
      label: 'Retained cache logical bytes',
      value: s.cache.logical_bytes,
      color: '#5da9ff'
    }, {
      label: 'Logits logical bytes',
      value: s.logits.logical_bytes,
      color: '#ff83ad'
    }]} unit="bytes" /><div className="cost-linear-call"><strong>{linear.name}</strong><div className="cost-shape"><span>input [{linear.input_shape.join(', ')}]</span><span>→ Linear →</span><span>output [{linear.output_shape.join(', ')}]</span></div><span>Nominal multiply/add operations: {n(linear.nominal_flops)}</span></div><Readout>{row.request_id}, forward {s.step}: {s.query_positions} query positions; {s.cache_positions} cached positions. {s.selected_output_id === null ? 'No additional output is selected.' : `Selected output ID ${s.selected_output_id}.`} All {s.linear_operations.length} Linear calls sum to {n(flops)} nominal operations. Two emitted IDs: {row.emitted_ids.join(', ')}.</Readout><Controls><Select name="Actual saved request" value={request} onChange={setRequest} options={data.requests.map((r, i) => [String(i), r.request_id])} /><Select name="Actual Linear call" value={call} onChange={setCall} options={s.linear_operations.map((r, i) => [String(i), `${i + 1}. ${r.name}`])} /></Controls><Note>Read-only retained trace: twelve forwards, eight emitted tokens; original parameter digest unchanged. Linear hooks count a stated arithmetic subset, excluding attention and other operations. These records do not measure latency, throughput, peak memory or answer quality.</Note></Figure>;
}
