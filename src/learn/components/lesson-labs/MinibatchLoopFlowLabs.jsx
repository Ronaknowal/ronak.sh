import { createContext, useContext, useEffect, useId, useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowReadout } from './LessonFlow.jsx';
import { MinibatchScalarDrawing, MinibatchMeanDrawing, MinibatchAccumulationDrawing, MinibatchUpdateDrawing, MinibatchDrawing, MbArray, MbOperand, MbOperation, MbWire, MinibatchTable, mbColors } from './MinibatchLoopFlowFigures.jsx';
import { minibatchScalarRows, minibatchMassRows, minibatchNormalizationRows, scalarBatchState, weightedBatchGradient, normalizationBatchComparison, minibatchNumber as f, scalarRowObjects, subsetGradientCloud, itemMemory } from '../../data/minibatch-loop-flow-models.js';

export function MinibatchNumber({ name, value, onChange, min, max, resetToken, integer = false, range = true }) {
  const id = useId(), [draft, setDraft] = useState(null);
  useEffect(() => setDraft(null), [value, resetToken]);
  const parsed = draft === null ? value : Number(draft);
  const invalid = draft !== null && (!draft.trim() || !Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed)));
  function edit(text) {
    setDraft(text); const number = Number(text);
    if (text.trim() && Number.isFinite(number) && number >= min && number <= max && (!integer || Number.isInteger(number))) { onChange(number); setDraft(null); }
  }
  return <label className="mb-number" htmlFor={id}><span>{name}</span>
    <input id={id} type="text" inputMode={integer ? 'numeric' : 'decimal'} aria-label={name} value={draft ?? String(value)} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} onChange={event => edit(event.target.value)} />
    {range && <input type="range" min={min} max={max} step={integer ? 1 : 'any'} value={value} aria-label={`${name}: slider`} onChange={event => { onChange(Number(event.target.value)); setDraft(null); }} />}
    {invalid && <span id={`${id}-error`} className="mb-error">Enter {integer ? 'an integer' : 'a finite number'} in [{min}, {max}]. The drawing retains the last valid value {f(value, 12)}.</span>}
  </label>;
}
export function MinibatchSelect({ name, value, onChange, options }) {
  return <label className="mb-select"><span>{name}</span><select aria-label={name} value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>;
}
export function MinibatchCheckbox({ name, checked, onChange }) { return <label className="mb-check"><input type="checkbox" aria-label={name} checked={checked} onChange={event => onChange(event.target.checked)} />{name}</label>; }

const ScalarContext = createContext(null), MassContext = createContext(null), NormalizationContext = createContext(null);
export function MinibatchFlowProvider({ children }) {
  const [rows, setRows] = useState(minibatchScalarRows), [selected, setSelected] = useState(1), [rate, setRate] = useState(.1), [momentum, setMomentum] = useState(0), [policy, setPolicy] = useState('correct'), [cursor, setCursor] = useState(0), [pin, setPin] = useState(null), [revision, setRevision] = useState(0);
  const state = useMemo(() => scalarBatchState(rows, { rate, momentum, policy }), [rows, rate, momentum, policy]);
  const index = Math.max(0, rows.findIndex(row => row.id === selected)), row = rows[index];
  function changeRow(key, value) { setRows(old => old.map(item => item.id === row.id ? { ...item, [key]: value } : item)); setCursor(0); }
  function remove() { if (rows.length === 1) return; const next = rows.filter(item => item.id !== row.id); setRows(next); setSelected(next[Math.min(index, next.length - 1)].id); setCursor(0); }
  function reset() { setRows(minibatchScalarRows()); setSelected(1); setRate(.1); setMomentum(0); setPolicy('correct'); setCursor(0); setPin(null); setRevision(old => old + 1); }
  const value = { rows, setRows, row, index, selected, select: value => setSelected(Number(value)), rate, setRate, momentum, setMomentum, policy, setPolicy, cursor, setCursor, pin, setPin, revision, state, changeRow, remove, reset,
    add: () => { if (rows.length < 8) { setRows(old => [...old, { id: Math.max(...old.map(item => item.id)) + 1, x: 1, y: 0, end: false }]); setCursor(0); } } };
  return <ScalarContext.Provider value={value}><MinibatchMassProvider><MinibatchNormalizationProvider>{children}</MinibatchNormalizationProvider></MinibatchMassProvider></ScalarContext.Provider>;
}

function ScalarSelection({ context, finalAllowed = true }) { const options = (finalAllowed ? context.rows : context.rows.slice(0, -1)).map(row => [row.id, `Stable row ${row.id}`]); return <MinibatchSelect name="Scalar row" value={context.selected} onChange={context.select} options={options} />; }
function ScalarFinalTable({ context }) { const { current, reference } = context.state; return <MinibatchTable caption="Same current rows and settings; the reference changes only the update policy" headers={['Quantity', 'Correct one-update reference', 'Current policy']} rows={[
  ['Final w', reference.weight, current.weight], ['Final momentum', reference.buffer ?? 'no buffer', current.buffer ?? 'no buffer'], ['Backward calls', reference.backwards, current.backwards], ['Optimizer updates', reference.updates, current.updates], ['Post-update mean loss', reference.postLoss, current.postLoss],
]} />; }

export function MinibatchScalarInvestigation({ question }) {
  const c = useContext(ScalarContext), { rows, row, state } = c, token = `${c.revision}:${row.id}`;
  const common = { resetToken: token };
  const position = Math.min(c.cursor, state.current.events.length - 1), event = state.current.events[position];
  if (question === 'row') return <FlowLab label="Edit one scalar row at the unchanged original weight"><MinibatchScalarDrawing x={row.x} y={row.y} /><FlowControls>
    <ScalarSelection context={c} /><MinibatchNumber name="Scalar input x" value={row.x} min={-5} max={5} {...common} onChange={value => c.changeRow('x', value)} /><MinibatchNumber name="Scalar target y" value={row.y} min={-5} max={5} {...common} onChange={value => c.changeRow('y', value)} />
  </FlowControls><FlowReadout>At the original w=0, row {row.id} contributes raw derivative <strong>{f(-row.x * row.y, 12)}</strong>. Its group mean uses all {rows.length} current rows, not only this selected one.</FlowReadout></FlowLab>;
  if (question === 'records') return <FlowLab label="Change scalar group membership"><MinibatchMeanDrawing rows={rows} rate={c.rate} /><FlowControls><ScalarSelection context={c} /><button type="button" onClick={c.add} disabled={rows.length === 8}>Add scalar row</button><button type="button" onClick={c.remove} disabled={rows.length === 1}>Remove selected scalar row</button></FlowControls><FlowReadout>The current group has <strong>{rows.length} rows</strong>; adding/removing changes both the numerator and its actual denominator.</FlowReadout></FlowLab>;
  if (question === 'boundary') {const boundaryRow=rows[Math.min(c.index,Math.max(0,rows.length-2))];return <FlowLab label="Move one physical chunk boundary"><MinibatchAccumulationDrawing rows={rows} groups={state.groups} /><FlowControls>
    {rows.length>1&&<><MinibatchSelect name="Physical boundary after scalar row" value={boundaryRow.id} onChange={c.select} options={rows.slice(0,-1).map(row=>[row.id,`Stable row ${row.id}`])}/><MinibatchCheckbox name={`End a physical chunk after scalar row ${boundaryRow.id}`} checked={boundaryRow.end} onChange={value => {c.setRows(old=>old.map(item=>item.id===boundaryRow.id?{...item,end:value}:item));c.setCursor(0);}} /></>}
  </FlowControls><FlowReadout>Physical chunks contain {state.groups.map(group => `[${group.map(i => rows[i].id).join(', ')}]`).join(' then ')}. The last row always closes delivery. The correct full-group derivative remains <strong>{f(rows.reduce((g, item) => g - item.x * item.y, 0) / rows.length, 12)}</strong>.</FlowReadout></FlowLab>;}
  if (question === 'rate') return <FlowLab label="Change the learning rate or taught momentum memory"><MinibatchUpdateDrawing gradient={state.reference.currentGradient ?? rows.reduce((g, item) => g - item.x * item.y, 0) / rows.length} rate={c.rate} momentum={c.momentum} showMemory /><FlowControls>
    <MinibatchNumber name="Scalar learning rate" value={c.rate} min={0} max={.2} resetToken={c.revision} onChange={value => { c.setRate(value); c.setCursor(0); }} /><MinibatchSelect name="Scalar momentum" value={c.momentum} onChange={value => { c.setMomentum(Number(value)); c.setCursor(0); }} options={[[0, 'No memory: μ=0'], [.9, 'Momentum memory: μ=.9']]} />
  </FlowControls><FlowReadout>The correct policy reaches w=<strong>{f(state.reference.weight, 12)}</strong>. A zero rate changes no weight; it does not stop backward calls or erase optimizer memory.</FlowReadout></FlowLab>;
  if (question === 'clear' || question === 'early') { const fault = question === 'clear' ? 'clear_each' : 'step_each'; return <FlowLab label={question === 'clear' ? 'Erase earlier gradient contributions' : 'Change the weight before the next chunk'}><MinibatchTraceDrawing context={c} event={event} position={position} /><FlowControls><MinibatchCheckbox name={question === 'clear' ? 'Clear G before each chunk' : 'Update w after each chunk'} checked={c.policy === fault} onChange={checked => { c.setPolicy(checked ? fault : 'correct'); c.setCursor(0); }} /></FlowControls><ScalarFinalTable context={c} /><FlowReadout>{c.policy === 'clear_each' ? 'This algorithm erases earlier contributions before the last chunk.' : c.policy === 'step_each' ? 'This algorithm evaluates later rows at a changed weight and updates memory repeatedly.' : 'The correct algorithm keeps the original weight through all backward calls.'} The two faults are alternative policies, not combined hidden switches.</FlowReadout></FlowLab>; }
  if (question === 'cursor') return <FlowLab label="Inspect an operation without changing the current case"><MinibatchTraceDrawing context={c} event={event} position={position} /><FlowControls><button type="button" disabled={position === 0} onClick={() => c.setCursor(position - 1)}>Previous operation</button><button type="button" disabled={position === state.current.events.length - 1} onClick={() => c.setCursor(position + 1)}>Next operation</button><button type="button" onClick={() => c.setCursor(0)}>Restart current trace</button></FlowControls><FlowReadout>Operation {position + 1} of {state.current.events.length}: {event.operation}. Processed {event.examples} rows, {event.backwards} backward calls and {event.updates} optimizer updates.</FlowReadout></FlowLab>;
  if (question === 'pin') return <FlowLab label="Save or restore a whole scalar case"><ScalarFinalTable context={c} /><FlowControls><button type="button" onClick={() => c.setPin({ rows: structuredClone(rows), rate: c.rate, momentum: c.momentum, policy: c.policy, result: structuredClone(state.current) })}>Pin complete scalar case</button><button type="button" onClick={c.reset}>Reset scalar case</button></FlowControls><FlowReadout>{c.pin ? <>Pinned rows {c.pin.rows.map(row => `${row.id}:(${row.x},${row.y})${row.end ? '|' : ''}`).join(' ')}, rate {f(c.pin.rate)}, μ {c.pin.momentum}, policy {c.pin.policy}, final w {f(c.pin.result.weight, 12)}. Current minus pinned w is <strong>{f(state.current.weight - c.pin.result.weight, 12)}</strong>; all intervening edits are included.</> : 'Pin saves rows, boundaries, rate, optimizer choice, policy and the complete result. Reset restores the announced fresh case and clears invalid editor drafts.'}</FlowReadout></FlowLab>;
  throw new Error(`Unknown scalar question: ${question}`);
}

export function MinibatchTraceDrawing({ context, event, position }) {
  const lastForward = [...context.state.current.events.slice(0, position + 1)].reverse().find(item => item.forward);
  return <><MinibatchDrawing label="Current parameter, gradient and optimizer stores are separate" width={620} height={330}>{marker => <>
    <MbOperand x={10} y={40} label="Learned parameter w" value={event.weight} role="parameter" width={180} />
    <MbOperand x={220} y={40} label="Accumulated credit G" value={event.gradient ?? 'None: empty'} role="credit" width={180} />
    <MbOperand x={430} y={40} label="Optimizer memory v" value={event.buffer ?? 'not initialized'} role="neutral" width={180} />
    <MbWire marker={marker} reverse d="M310 80 V138" /><MbOperation x={310} y={138} label="step" width={100} /><MbWire marker={marker} d="M430 60 H417 V158 H360" />
    <MbWire marker={marker} d="M260 158 H100 V82" />
    <text x="10" y="230">Current event: {event.operation}</text><text x="10" y="266" className="mb-small">A step consumes G and updates w/v. A clear empties only G.</text>
    <text x="10" y="305" className="mb-small">Rows {event.examples}; backward calls {event.backwards}; updates {event.updates}.</text>
  </>}</MinibatchDrawing>{lastForward && <MinibatchTable caption={`Most recent forward was evaluated at w=${f(lastForward.weight)}; retained values belong to that forward`} headers={['Stable row', 'Prediction', 'Residual', 'Half-square', 'Raw credit']} rows={lastForward.forward.map(row => [context.rows[row.index].id, row.prediction, row.residual, row.loss, row.derivative])} />}</>;
}

function MinibatchMassProvider({ children }) {
  const [rows, setRows] = useState(minibatchMassRows), [selected, setSelected] = useState(1), [mode, setMode] = useState('chunks'), [revision, setRevision] = useState(0);
  const index = Math.max(0, rows.findIndex(row => row.id === selected)), row = rows[index], result = useMemo(() => weightedBatchGradient(rows, mode), [rows, mode]);
  const change = (key, value) => setRows(old => old.map(item => item.id === row.id ? { ...item, [key]: value } : item));
  function remove() { if (rows.length === 1) return; const next = rows.filter(item => item.id !== row.id); setRows(next); setSelected(next[Math.min(index, next.length - 1)].id); }
  function reset() { setRows(minibatchMassRows()); setSelected(1); setMode('chunks'); setRevision(old => old + 1); }
  const value = { rows, row, selected, select: value => setSelected(Number(value)), result, mode, setMode, revision, change, remove, reset, setRows,
    add: () => { if (rows.length < 8) setRows(old => [...old, { id: Math.max(...old.map(item => item.id)) + 1, x: 1, y: 0, weight: 1, included: true, group: 0 }]); } };
  return <MassContext.Provider value={value}>{children}</MassContext.Provider>;
}
function MassSelection({ context }) { return <MinibatchSelect name="Weighted row" value={context.selected} onChange={context.select} options={context.rows.map(row => [row.id, `Stable row ${row.id}`])} />; }
export function MinibatchMassInvestigation({ question }) {
  const c = useContext(MassContext), { row, result, rows } = c, token = `${c.revision}:${row.id}`;
  let controls;
  if (question === 'row') controls = <><MassSelection context={c} /><MinibatchNumber name="Weighted input x" value={row.x} min={-5} max={5} resetToken={token} onChange={v => c.change('x', v)} /><MinibatchNumber name="Weighted target y" value={row.y} min={-5} max={5} resetToken={token} onChange={v => c.change('y', v)} /></>;
  else if (question === 'mass') controls = <><MassSelection context={c} /><MinibatchNumber name="Row importance weight" value={row.weight} min={0} max={4} resetToken={token} onChange={v => c.change('weight', v)} /><MinibatchCheckbox name="Include weighted row" checked={row.included} onChange={v => c.change('included', v)} /></>;
  else if (question === 'group') controls = <><MassSelection context={c} /><MinibatchSelect name="Weighted physical group" value={row.group} onChange={v => c.change('group', Number(v))} options={[0, 1, 2, 3].map(id => [id, `Group ${id + 1}`])} /></>;
  else if (question === 'records') controls = <><MassSelection context={c} /><button type="button" disabled={rows.length === 8} onClick={c.add}>Add weighted row</button><button type="button" disabled={rows.length === 1} onClick={c.remove}>Remove selected weighted row</button></>;
  else if (question === 'rule') controls = <MinibatchSelect name="Compared objective denominator" value={c.mode} onChange={c.setMode} options={[["mass", "Actual weighted target mass"], ["chunks", "Equal positive-mass chunk means"], ["eligible", "Included row count"], ["slots", "Every row slot"]]} />;
  else if (question === 'nulls') controls = <><button type="button" onClick={() => c.setRows(old => old.map(row => ({ ...row, included: false })))}>Ignore every row</button><button type="button" onClick={() => c.setRows(old => old.map(row => ({ ...row, x: 1, y: 1 })))}>Give every row the same derivative</button><button type="button" onClick={c.reset}>Restore weighted case</button></>;
  else if (question === 'equal-mass') controls = <button type="button" onClick={() => c.setRows(old => { const groups = [...new Set(old.map(row => row.group))]; return old.map(row => ({ ...row, included: true, weight: 1 / old.filter(other => other.group === row.group).length })); })}>Equalize positive group masses</button>;
  else throw new Error(`Unknown mass question: ${question}`);
  const comparison=['rule','nulls','equal-mass'].includes(question);
  return <FlowLab label={`Weighted numerator and mass: ${question}`}><MinibatchMassDrawing rows={rows} result={result} selected={c.selected} comparison={comparison} /><FlowControls>{controls}</FlowControls><FlowReadout>The actual weighted numerator is <strong>{f(result.numerator, 12)}</strong> and target mass is <strong>{f(result.mass, 12)}</strong>, giving {f(result.reference, 12)}. {comparison&&<>The {c.mode} comparison gives {f(result.compared, 12)}. {result.defined ? result.matches ? 'These current derivatives agree; inspect the row coefficients to distinguish a structural equality from an accidental cancellation.' : 'The comparison weights the current rows differently.' : 'A zero denominator has no defined mean: no zero output is fabricated.'}</>}</FlowReadout></FlowLab>;
}
export function MinibatchMassDrawing({ rows, result, selected, comparison = true }) {
  const size = rows.length * 126, totalY = size + 42;
  return <><MinibatchDrawing label="Every included weighted row feeds both derivative and mass rails" width={920} height={totalY + 270}>{marker => <>
    {rows.map((row, i) => { const y = 35 + i * 126, detail = result.details[i]; return <g key={row.id}>
      <text x="8" y={y - 12} className="mb-small">Row {row.id}{selected === row.id ? ' (selected)' : ''}</text><MbOperand x={8} y={y} label="" value={row.weight} role="input" width={100} /><text x="8" y={y + 64} className="mb-small">weight</text>
      <MbOperand x={140} y={y} label="" value={row.included ? 1 : 0} role="input" width={100} /><text x="140" y={y + 64} className="mb-small">include</text><MbWire marker={marker} d={`M8 ${y + 20} H0 V${y + 95} H270 V${y + 20} H278`} /><MbWire marker={marker} d={`M240 ${y + 20} H278`} /><MbOperation x={314} y={y} label="×" />
      <MbWire marker={marker} d={`M350 ${y + 20} H383`} /><MbOperand x={383} y={y} label="q" value={detail.mass} role="value" width={96} />
      <MbWire marker={marker} d={`M479 ${y + 20} H523`} /><MbOperation x={559} y={y} label="×" /><MbOperand x={500} y={y + 67} label="" value={detail.derivative} role="credit" width={118} /><text x="628" y={y+96} className="mb-small">raw −xy</text><MbWire marker={marker} reverse d={`M559 ${y + 67} V${y + 40}`} />
      <MbWire marker={marker} reverse d={`M595 ${y + 20} H650`} /><MbOperand x={650} y={y} label="q × credit" value={detail.numerator} role="credit" width={126} />
      <MbWire marker={marker} reverse d={`M776 ${y + 20} H801 V${totalY} H450`} /><MbWire marker={marker} d={`M431 ${y + 40} V${y + 104} H898 V${totalY + 58} H450`} />
    </g>; })}
    <MbOperation x={414} y={totalY - 20} label="Σ" /><MbOperation x={414} y={totalY + 38} label="Σ" />
    <MbWire marker={marker} reverse d={`M414 ${totalY + 20} H170 V${totalY + 136} H190`} /><MbOperand x={190} y={totalY + 116} label="Derivative numerator" value={result.numerator} role="credit" width={210} />
    <MbWire marker={marker} d={`M414 ${totalY + 78} H780 V${totalY + 136} H760`} /><MbOperand x={550} y={totalY + 116} label="Actual target mass D" value={result.mass} role="neutral" width={210} />
    <MbWire marker={marker} reverse d={`M295 ${totalY + 156} V${totalY + 209} H423`} /><MbWire marker={marker} d={`M655 ${totalY + 156} V${totalY + 209} H495`} /><MbOperation x={459} y={totalY + 189} label="÷ D" />
    <text x="20" y={totalY + 260}>Current weighted derivative: {f(result.reference, 12)}{result.reference === null ? ' (undefined)' : ''}</text>
  </>}</MinibatchDrawing><MinibatchTable caption="Every stable row's influence remains inspectable in this same case" headers={['Row', 'Group', 'Effective mass q', 'Raw credit', 'Target q/D', ...(comparison?['Compared coefficient']:[])]} rows={rows.map((row, i) => [row.id, row.group + 1, result.details[i].mass, result.details[i].derivative, f(result.details[i].referenceCoefficient, 12), ...(comparison?[f(result.details[i].comparedCoefficient, 12)]:[])])} /><MinibatchTable caption="Two independent subtotals for each physical group" headers={['Group', 'Stable rows', 'Numerator', 'Mass']} rows={result.groups.map(group => [group.id + 1, group.indices.map(index => rows[index].id).join(', '), group.numerator, group.mass])} /></>;
}

function MinibatchNormalizationProvider({ children }) {
  const [rows, setRows] = useState(minibatchNormalizationRows), [selected, setSelected] = useState(3), [theta, setTheta] = useState(1), [mode, setMode] = useState('local'), [frozen, setFrozen] = useState({ mean: 5, variance: 10 }), [revision, setRevision] = useState(0);
  const index = Math.max(0, rows.findIndex(row => row.id === selected)), row = rows[index], result = useMemo(() => normalizationBatchComparison(rows, theta, mode, frozen), [rows, theta, mode, frozen]);
  function change(key, value) { setRows(old => old.map(item => item.id === row.id ? { ...item, [key]: value } : item)); }
  function reset() { setRows(minibatchNormalizationRows()); setSelected(3); setTheta(1); setMode('local'); setFrozen({ mean: 5, variance: 10 }); setRevision(old => old + 1); }
  function remove() { if (rows.length <= 4) return; const next = rows.filter(item => item.id !== row.id); setRows(next); setSelected(next[Math.min(index, next.length - 1)].id); }
  const value = { rows, setRows, row, index, selected, select: value => setSelected(Number(value)), theta, setTheta, mode, setMode, frozen, setFrozen, revision, result, change, reset, remove,
    add: () => { if (rows.length < 8) setRows(old => [...old, { id: Math.max(...old.map(item => item.id)) + 1, x: 0, y: 0, group: 0 }]); } };
  return <NormalizationContext.Provider value={value}>{children}</NormalizationContext.Provider>;
}
function NormSelection({ context }) { return <MinibatchSelect name="Normalization row" value={context.selected} onChange={context.select} options={context.rows.map(row => [row.id, `Stable row ${row.id}`])} />; }
export function MinibatchNormalizationInvestigation({ question }) {
  const c = useContext(NormalizationContext), token = `${c.revision}:${c.row.id}`, r = c.result; let controls;
  if (question === 'row') controls = <><NormSelection context={c} /><MinibatchNumber name="Normalization activation x" value={c.row.x} min={-12} max={12} resetToken={token} onChange={v => c.change('x', v)} /><MinibatchNumber name="Normalization target y" value={c.row.y} min={-3} max={3} resetToken={token} onChange={v => c.change('y', v)} /></>;
  else if (question === 'group') controls = <><NormSelection context={c} /><MinibatchSelect name="Normalization physical group" value={c.row.group} onChange={v => c.change('group', Number(v))} options={[0, 1, 2, 3].map(id => [id, `Group ${id + 1}`])} /></>;
  else if (question === 'records') controls = <><NormSelection context={c} /><button type="button" disabled={c.rows.length === 8} onClick={c.add}>Add normalization row</button><button type="button" disabled={c.rows.length === 4} onClick={c.remove}>Remove selected normalization row</button></>;
  else if (question === 'scale') controls = <MinibatchNumber name="Downstream scale θ" value={c.theta} min={-2} max={2} resetToken={c.revision} onChange={c.setTheta} />;
  else if (question === 'rule') controls = <MinibatchSelect name="Normalization forward rule" value={c.mode} onChange={c.setMode} options={[["local", "Training statistics from each group"], ["frozen", "Copied frozen statistics for every row"], ["none", "No normalization"]]} />;
  else if (question === 'frozen') controls = <button type="button" onClick={() => c.setFrozen({ mean: r.fullMean, variance: r.fullVariance })}>Copy current full statistics</button>;
  else if (question === 'nulls') controls = <><button type="button" onClick={() => { c.setRows(old => old.map((row, i) => ({ ...row, x: i % 2 ? 2 : 0, y: [0, 1, 0, 1][i % 4], group: Math.floor(i / 2) }))); c.setRevision(old => old + 1); }}>Give each pair identical statistics</button><button type="button" onClick={() => { c.setRows(old => old.map(row => ({ ...row, x: 2 }))); c.setRevision(old => old + 1); }}>Make every activation constant</button><button type="button" onClick={c.reset}>Reset normalization case</button></>;
  else throw new Error(`Unknown normalization question: ${question}`);
  return <FlowLab label={`Physical normalization comparison: ${question}`}><MinibatchNormalizationDrawing rows={c.rows} theta={c.theta} mode={c.mode} frozen={c.frozen} result={r} selected={c.index} /><FlowControls>{controls}</FlowControls>
    <FlowReadout>{r.valid ? <>The full derivative is <strong>{f(r.full.gradient, 12)}</strong>; the physical-group derivative is <strong>{f(r.local.gradient, 12)}</strong>. Running means are {f(r.fullRunningMean, 12)} and {f(r.localRunningMean, 12)}; gradient agreement and state agreement are different comparisons.</> : r.reason} Copied statistics remain μ={f(c.frozen.mean)}, variance={f(c.frozen.variance)} while later inputs change.</FlowReadout>
  </FlowLab>;
}

export function MinibatchNormalizationDrawing({ rows, theta, mode, frozen, result, selected = 0 }) {
  if (!result.valid) return <><p role="status">{result.reason} Inspect the supplied rows to repair their grouping.</p><MinibatchTable caption="Supplied normalization rows remain available when a group is invalid" headers={['Row', 'Group', 'Activation x', 'Target']} rows={rows.map(row=>[row.id,row.group+1,row.x,row.y])}/></>;
  if(mode==='none')return <><MinibatchDrawing label="No normalization bypass uses the original activation" height={360}>{marker=><>
    <MbOperand x={8} y={35} label="Bypass: original x" value={rows[selected].x} role="input" width={132}/><MbOperand x={160} y={35} label="Scale θ" value={theta} role="parameter" width={132}/><MbWire marker={marker} d="M74 75 V125 H114"/><MbWire marker={marker} d="M226 75 V125 H186"/><MbOperation x={150} y={105} label="×"/><MbWire marker={marker} d="M150 145 V164 H0 V220 H60"/><MbOperand x={60} y={200} label="Prediction θx" value={theta*rows[selected].x} width={180}/><text x="8" y="302" className="mb-small">No mean or variance is read.</text><text x="8" y="338" className="mb-small">Target y={f(rows[selected].y)} stays supplied.</text>
  </>}</MinibatchDrawing><MinibatchTable caption="Unnormalized rows retain their original values and target alignment" headers={['Row','x','Target','θ credit']} rows={rows.map((row,i)=>[row.id,row.x,row.y,result.local.rowGradients[i]])}/></>;
  const i = selected, group = result.groups.find(group => group.indices.includes(i));
  const stats = mode === 'frozen' ? frozen : { mean: group.mean, variance: group.variance };
  return <><MinibatchDrawing label="Original input and shared divisor both enter the normalization operation" width={620} height={580}>{marker => <>
    <MbOperand x={8} y={35} label={`Supplied row ${rows[i].id} activation`} value={rows[i].x} role="input" width={225} />
    <MbOperand x={360} y={35} label={mode === 'frozen' ? 'Copied mean μ' : 'Physical-group mean μ'} value={stats.mean} width={225} />
    <MbWire marker={marker} d="M120 75 V125 H174" /><MbWire marker={marker} d="M470 75 V125 H246" /><MbOperation x={210} y={105} label="x − μ" width={120} />
    <MbOperand x={360} y={162} label="Variance + ε; ε=1e−5" value={stats.variance + 1e-5} width={240} /><MbWire marker={marker} d="M480 202 V242" /><MbOperation x={480} y={242} label="√" />
    <MbWire marker={marker} d="M210 145 V311" /><MbWire marker={marker} d="M480 282 V331 H246" /><MbOperation x={210} y={311} label="÷" />
    <MbWire marker={marker} d="M210 351 V376 H40 V423 H80" /><MbOperand x={80} y={403} label={mode === 'none' ? 'Bypass: original x' : 'Computed normalized z'} value={result.local.z[i]} width={210} />
    <MbOperand x={380} y={403} label="Learned scale θ" value={theta} role="parameter" width={180} /><MbWire marker={marker} d="M185 443 V489 H274" /><MbWire marker={marker} d="M470 443 V489 H346" /><MbOperation x={310} y={469} label="×" />
    <text x="8" y="552">Prediction θz = {f(result.local.predictions[i])}; supplied target {f(rows[i].y)}.</text>
  </>}</MinibatchDrawing><MinibatchTable caption="Full versus physical forward retains every supplied row and target" headers={['Row', 'Group', 'Full z', 'Physical z', 'Target', 'Full row credit', 'Physical row credit']} rows={rows.map((row, i) => [row.id, row.group + 1, result.full.z[i], result.local.z[i], row.y, result.full.rowGradients[i], result.local.rowGradients[i]])} /></>;
}

export function MinibatchNormalizationWorkedDrawing() {
  const rows=[0,2,10,12].map((x,i)=>({id:i+1,x,y:i<2?0:1,group:Math.floor(i/2)}));
  const local=normalizationBatchComparison(rows,1,'local');
  const fullRows=rows.map(row=>({...row,group:0})),full=normalizationBatchComparison(fullRows,1,'local');
  return <><p>The full forward divides by √(26+ε); separate pairs divide by √(1+ε). Both subtract their own actual means first.</p><MinibatchNormalizationDrawing rows={fullRows} theta={1} mode="local" result={full} selected={2}/><MinibatchNormalizationDrawing rows={rows} theta={1} mode="local" result={local} selected={2}/><FlowReadout>The full θ derivative is {f(full.full.gradient,10)}, while the paired θ derivative is {f(local.local.gradient,10)}. Row 3's centered input is +4 in the full group and −1 in its pair; the divisor changes too.</FlowReadout></>;
}

export function MinibatchSampleInvestigation() {
  const [size, setSize] = useState(2), cloud = subsetGradientCloud(size);
  return <FlowLab label="Larger newly sampled subsets reduce this finite population's variance"><MinibatchDrawing label="All actual distinct subsets and their derivative means" width={620} height={280 + cloud.combinations.length * 70}>{marker => <>
    <MbArray x={8} y={35} label="Population a,b,c row credits" values={cloud.source} role="credit" />
    {cloud.combinations.map((row, i) => <g key={i}><text x="8" y={110 + i * 70} className="mb-small">{row.indices.map(i => ['a', 'b', 'c'][i]).join('+')}</text><MbArray x={85} y={87 + i * 70} label="" values={row.indices.map(i => cloud.source[i])} role="credit" cellWidth={75} /><MbWire marker={marker} reverse d={`M${85 + size * 75 - 4} ${107 + i * 70} H337`} /><MbOperation x={373} y={87 + i * 70} label={`Σ/${size}`} /><text x="425" y={115 + i * 70}>{f(row.value)}</text></g>)}
    <path d={`M48 ${180+cloud.combinations.length*70} H540`} stroke="#aaa"/>
    {[-3,-2,-1,0].map(value=><g key={value}><path d={`M${48+(value+3)*164} ${180+cloud.combinations.length*70} v8`} stroke="#aaa"/><text x={48+(value+3)*164} y={222+cloud.combinations.length*70} textAnchor="middle">{value}</text></g>)}
    {cloud.combinations.map((row,i)=><g key={i}><circle cx={48+(row.value+3)*164} cy={180+cloud.combinations.length*70} r="6" fill={mbColors.credit}/><text x={48+(row.value+3)*164} y={161+cloud.combinations.length*70} textAnchor="middle" className="mb-small">subset {i+1}</text></g>)}
    <text x="8" y={265+cloud.combinations.length*70} className="mb-small">Exact subset-mean locations; no fitted distribution.</text>
  </>}</MinibatchDrawing><FlowControls><MinibatchSelect name="Newly sampled distinct examples" value={size} onChange={v => setSize(Number(v))} options={[1, 2, 3].map(n => [n, `${n} of the three population rows`])} /></FlowControls><FlowReadout>The mean of all possible subset means is <strong>{f(cloud.mean, 12)}</strong>; their population variance is <strong>{f(cloud.variance, 12)}</strong>. This samples different subsets; moving physical boundaries inside one fixed subset does not create this change.</FlowReadout></FlowLab>;
}
export function MinibatchMemoryInvestigation() {
  const [items, setItems] = useState(10), [beta, setBeta] = useState(.9), memory = itemMemory(items, beta);
  return <FlowLab label="Change how many supplied items one memory transition covers"><MinibatchDrawing label="Old history alone receives an item-equivalent decay" width={650} height={570}>{marker => <>
    <MbOperand x={8} y={35} label="Old history (stipulated)" value={1} role="neutral" width={220} /><MbOperand x={360} y={35} label={`Decay per ${items} items`} value={beta} role="neutral" width={220} /><MbWire marker={marker} d="M118 75 V138 H274" /><MbWire marker={marker} d="M470 75 V138 H346" /><MbOperation x={310} y={118} label="×" />
    <text x="8" y="214">Five-item factor: {f(memory.matchedFive, 10)}.</text><text x="8" y="249">Ten-item old-history factor: {f(memory.tenItemDecay, 10)}.</text>
    <MbArray x={8} y={315} label="Ten supplied items: matched five + five route" values={Array.from({length:10},(_,i)=>i+1)} role="input" cellWidth={60}/>
    <path d="M8 360 v10 h296 v-10 M308 360 v10 h296 v-10" fill="none" stroke="#aaa"/>
    <MbOperand x={8} y={435} label="After first five" value={memory.matchedFive} role="neutral" width={290}/><MbOperand x={340} y={435} label="After second five" value={memory.tenItemDecay} role="neutral" width={290}/><MbWire marker={marker} d="M298 455 H338"/>
    <text x="8" y="551" className="mb-small">Two factors β^(5/items) multiply to β^(10/items).</text>
  </>}</MinibatchDrawing><FlowControls><MinibatchNumber name="Items per memory transition" value={items} min={1} max={20} integer onChange={setItems} /><MinibatchNumber name="Old-history factor β" value={beta} min={.01} max={.99} onChange={setBeta} /></FlowControls><FlowReadout>Old-history half-life is <strong>{f(memory.halfLife, 8)} supplied items</strong>. Two matched five-item transitions yield the same ten-item old-history decay; changed gradient injections can still produce different states.</FlowReadout></FlowLab>;
}
