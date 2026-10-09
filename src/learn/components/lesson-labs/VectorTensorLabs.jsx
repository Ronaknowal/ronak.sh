import { useId, useState } from 'react';
import { applyMatrix, dot, formatVectorNumber as number, linearMapPresets, matrixProduct, measurementTensor, parseSmallMatrix, productCell, projectVector, reduceMeasurementTensor, tensorAxisNames } from '../../data/vector-tensor-models.js';
import { FlowLab, FlowSlider } from './LessonFlow.jsx';
import { CompositionDrawing, MatrixDrawing } from './VectorTensorFigures.jsx';
import './vector-tensor-labs.css';
const pair = v => `(${v.map(number).join(', ')})`;
const point = ([x, y], [lower, upper]) => [38 + (x - lower) * 264 / (upper - lower), 302 - (y - lower) * 264 / (upper - lower)];
function CoordinatePlane({ label, vectors = [], segments = [], polygon, domain = [-6, 6] }) {
  const id = useId().replace(/:/g, ''), xy = v => point(v, domain), origin = xy([0, 0]);
  const ticks = Array.from({ length: domain[1] - domain[0] + 1 }, (_, i) => domain[0] + i), labels = [];
  for (const v of vectors) {
    const same = labels.find(item => item.to[0] === v.to[0] && item.to[1] === v.to[1]);
    if (same) same.label += ` / ${v.label}`; else labels.push({ ...v });
  }
  return <svg className="vector-coordinate-plane" viewBox="0 0 340 340" role="img" aria-label={label} data-domain={domain.join(',')}>
    <title>{label}</title><defs><marker id={id} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" fill="context-stroke" /></marker></defs>
    {ticks.map(t => <g key={t} className="vector-grid-line"><line x1={xy([t, 0])[0]} y1="38" x2={xy([t, 0])[0]} y2="302" /><line x1="38" y1={xy([0, t])[1]} x2="302" y2={xy([0, t])[1]} /></g>)}
    <path d={`M25,${origin[1]} H318 M${origin[0]},315 V25`} className="vector-coordinate-axis" />
    <text x="317" y={origin[1] - 12}>x</text><text x={origin[0] + 11} y="29">y</text><text x={origin[0] - 16} y={origin[1] + 18}>0</text>
    {ticks.filter(t => t !== 0 && t % 2 === 0).map(t => <g key={t} className="vector-tick-label"><text x={xy([t, 0])[0]} y={origin[1] + 18} textAnchor="middle">{t}</text><text x={origin[0] - 17} y={xy([0, t])[1] + 5} textAnchor="end">{t}</text></g>)}
    {polygon && <polygon className="vector-unit-region" points={polygon.map(v => xy(v).join(',')).join(' ')} />}
    {segments.map((s, i) => <line key={i} x1={xy(s.from)[0]} y1={xy(s.from)[1]} x2={xy(s.to)[0]} y2={xy(s.to)[1]} className={`vector-arrow ${s.kind || 'residual'}`} />)}
    {vectors.map((v, i) => { const start = xy(v.from || [0, 0]), end = xy(v.to); return <g key={i}><line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} className={`vector-arrow ${v.kind}`} markerEnd={start[0] === end[0] && start[1] === end[1] ? undefined : `url(#${id})`} /><circle cx={end[0]} cy={end[1]} r="3.5" className={`vector-endpoint ${v.kind}`} /></g>; })}
    {labels.map((v, i) => { const end = xy(v.to); return <text key={i} className="vector-label-halo" x={Math.min(285, Math.max(48, end[0] + (v.dx ?? 10)))} y={Math.min(324, Math.max(25, end[1] + (v.dy ?? -12)))} textAnchor={v.anchor || 'start'}>{v.label}</text>; })}
  </svg>;
}
function NumericMatrix({ values, caption, selectedRow, selectedColumn, selectedCell, onSelect }) {
  return <div className="vector-matrix-scroll" tabIndex={0} role="region" aria-label={caption}><table className="vector-value-matrix"><caption>{caption}</caption><tbody>{values.map((row, i) => <tr key={i}>{row.map((value, j) => {
    const selected = selectedRow === i || selectedColumn === j || (selectedCell?.[0] === i && selectedCell?.[1] === j);
    return <td key={j} className={selected ? 'is-selected' : ''}>{onSelect ? <button type="button" aria-label={`Output row ${i}, column ${j}: ${number(value)}`} aria-pressed={selected} onClick={() => onSelect(i, j)}>{number(value)}</button> : number(value)}</td>;
  })}</tr>)}</tbody></table></div>;
}
export function VectorCombinationFigure() {
  return <figure className="vector-inline-figure" aria-label="Two displacement arrows joined head to tail"><CoordinatePlane domain={[-2, 4]} label="Move (2,1), then (-1,2), ending at (1,3)." vectors={[{ to: [2, 1], kind: 'basis-one', label: 'u=(2,1)', dy: 20 }, { from: [2, 1], to: [1, 3], kind: 'basis-two', label: 'v=(−1,2)', dx: 10 }, { to: [1, 3], kind: 'original', label: 'u+v', dx: -10, anchor: 'end' }]} /><p>First u: two east, one north. Dashed v: one west, two north from u’s tip. Total u+v=(1,3) runs from start to finish. Equal coordinate scales use metres.</p></figure>;
}
export function ProjectionGeometryFigure() {
  return <figure className="vector-inline-figure" aria-label="A vector separated into an along-line point and a perpendicular remainder"><CoordinatePlane domain={[-5,5]} label="v=(3,2), line through u=(2,1), point p=(3.2,1.6), dotted remainder (-.2,.4)." vectors={[{to:[2,1],kind:'basis-two',label:'u',dx:-12,dy:22,anchor:'end'},{to:[3.2,1.6],kind:'basis-one',label:'p',dx:12,dy:10},{to:[3,2],kind:'original',label:'v',dx:0,dy:-18}]} segments={[{from:[3.2,1.6],to:[3,2]}]} /><p>The point p lies along u’s line; the dotted connector from p to v is perpendicular to it. The next calculation finds that point, rather than assuming its coordinates.</p></figure>;
}
export function VectorProjectionLab() {
  const [horizontal, setHorizontal] = useState(3), [vertical, setVertical] = useState(2), [directionKey, setDirectionKey] = useState('diagonal');
  const vector = [horizontal, vertical], direction = { diagonal: [2, 1], horizontal: [1, 0], zero: [0, 0] }[directionKey], result = projectVector(vector, direction);
  return <FlowLab label="Separate a vector into along-line and perpendicular parts"><div className="vector-investigation" data-lab="vector-projection">
    <CoordinatePlane domain={[-5, 5]} label={`v=${pair(vector)}, u=${pair(direction)}; ${result.projection ? `p=${pair(result.projection)}, remainder=${pair(result.residual)}` : 'no projection line'}`} vectors={[{ to: direction, kind: 'basis-two', label: 'u', dx: -12, dy: 22, anchor: 'end' }, ...(result.projection ? [{ to: result.projection, kind: 'basis-one', label: 'p', dx: 12, dy: 10 }] : []), { to: vector, kind: 'original', label: 'v', dx: 0, dy: -18 }]} segments={result.projection ? [{ from: result.projection, to: vector }] : []} />
    <div className="vector-controls"><FlowSlider name="v horizontal coordinate" value={horizontal} onChange={setHorizontal} min={-4} max={4} step={.25} /><FlowSlider name="v vertical coordinate" value={vertical} onChange={setVertical} min={-4} max={4} step={.25} /><label>Direction u<select value={directionKey} onChange={e => setDirectionKey(e.target.value)}><option value="diagonal">u=(2,1)</option><option value="horizontal">u=(1,0)</option><option value="zero">u=(0,0): no direction</option></select></label></div>
    <div className="vector-result" aria-live="polite"><p>v={pair(vector)}; dashed u={pair(direction)}; v·u={number(result.product)}.</p>{result.projection ? <><p data-result="projection">p={pair(result.projection)}, coefficient {number(result.coefficient)}; dotted remainder v−p={pair(result.residual)}.</p><p data-result="residual">Remainder · u={number(dot(result.residual, direction))}. Cosine: {result.cosine === null ? 'undefined for zero v' : number(result.cosine)}.</p></> : <p role="status">u·u=0: no projection line. Dot product remains zero.</p>}</div>
    <button type="button" onClick={() => { setHorizontal(3); setVertical(2); setDirectionKey('diagonal'); }}>Reset projection</button>
    <p>Try v=(−1,2): p=0, so the entire vector is perpendicular remainder. Then v=(−2,−1): p=v, on the opposite half of u’s line. Fixed [−5,5] axes keep lengths comparable; coincident endpoint names are combined without moving points.</p>
  </div></FlowLab>;
}
export function LinearMapLab() {
  const [preset, setPreset] = useState('shear'), [horizontal, setHorizontal] = useState(2), [vertical, setVertical] = useState(1);
  const matrix = linearMapPresets[preset].matrix, vector = [horizontal, vertical], output = applyMatrix(matrix, vector), first = applyMatrix(matrix, [1, 0]), second = applyMatrix(matrix, [0, 1]), contribution = first.map(v => v * horizontal);
  const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
  return <FlowLab label="Matrix columns transform a square and input vector"><div className="vector-investigation" data-lab="linear-map">
    <div className="vector-two-planes"><div><p>Input · e₁=(1,0), e₂=(0,1)</p><CoordinatePlane domain={[-7, 7]} label={`Unit square and x=${pair(vector)}`} polygon={square} vectors={[{ to: [1, 0], kind: 'basis-one', label: 'e₁', dy: 22 }, { to: [0, 1], kind: 'basis-two', label: 'e₂', dx: -12, anchor: 'end' }, { to: vector, kind: 'original', label: 'x', dy: -18 }]} /></div><div><p>Output · columns c₁=Ae₁, c₂=Ae₂</p><CoordinatePlane domain={[-7, 7]} label={`Image square; columns ${pair(first)}, ${pair(second)}; Ax=${pair(output)}`} polygon={square.map(p => applyMatrix(matrix, p))} vectors={[{ to: first, kind: 'basis-one', label: 'c₁', dy: 22 }, { to: second, kind: 'basis-two', label: 'c₂', dx: -12, anchor: 'end' }, { to: output, kind: 'original', label: 'Ax', dy: -18 }]} segments={[{ from: [0, 0], to: contribution }, { from: contribution, to: output }]} /></div></div>
    <div className="vector-controls"><label>Linear map<select value={preset} onChange={e => setPreset(e.target.value)}>{Object.entries(linearMapPresets).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}</select></label><FlowSlider name="x first coordinate" value={horizontal} onChange={setHorizontal} min={-3} max={3} step={.25} /><FlowSlider name="x second coordinate" value={vertical} onChange={setVertical} min={-3} max={3} step={.25} /></div>
    <NumericMatrix values={matrix} caption="A · rows calculate output coordinates" /><p className="vector-result" data-result="map-output" aria-live="polite">c₁={pair(first)}, c₂={pair(second)}; <strong>Ax={horizontal}c₁+{vertical}c₂={pair(output)}</strong>. Dotted segments join the scaled columns head to tail.</p>
    <button type="button" onClick={() => { setPreset('shear'); setHorizontal(2); setVertical(1); }}>Reset map</button><p>Both panels use fixed [−7,7] equal-scale axes. Identity preserves x; collapse keeps only x₁+x₂; zero loses both coordinates. The shaded unit-square image can collapse to a line or point.</p>
  </div></FlowLab>;
}
export function MatrixProductLab() {
  const defaults = { left: [[2, 1], [0, 3], [1, 2]], right: [[3, 2], [5, 4]] };
  const [leftText, setLeftText] = useState('2,1;0,3;1,2'), [rightText, setRightText] = useState('3,2;5,4'), [active, setActive] = useState(defaults), [selection, setSelection] = useState([0, 0]), [terms, setTerms] = useState(0), [error, setError] = useState('');
  const result = productCell(active.left, active.right, selection[0], selection[1], terms);
  function edit(side, text) {
    const leftDraft = side === 'left' ? text : leftText, rightDraft = side === 'right' ? text : rightText;
    if (side === 'left') setLeftText(text); else setRightText(text);
    try { const left = parseSmallMatrix(leftDraft), right = parseSmallMatrix(rightDraft); matrixProduct(left, right); setActive({ left, right }); setSelection(([r, c]) => [Math.min(r, left.length - 1), Math.min(c, right[0].length - 1)]); setTerms(t => Math.min(t, right.length)); setError(''); }
    catch (failure) { setError(failure.message); }
  }
  return <FlowLab label="Inspect a row-column matrix contraction"><div className="vector-investigation" data-lab="matrix-product">
    <div className="vector-product-grid"><NumericMatrix values={active.left} selectedRow={selection[0]} caption={`Left · (${active.left.length},${active.left[0].length}), order row ${selection[0]}`} /><span className="vector-operation-symbol">×</span><NumericMatrix values={active.right} selectedColumn={selection[1]} caption={`Right · (${active.right.length},${active.right[0].length}), resource column ${selection[1]}`} /><span className="vector-operation-symbol">=</span><NumericMatrix values={result.result} selectedCell={selection} caption="Full product · select one output" onSelect={(r, c) => { setSelection([r, c]); setTerms(0); }} /></div>
    <ol className="vector-product-terms">{result.contributions.map(term => <li key={term.index} className={term.index < terms ? 'is-included' : ''}>k={term.index}: {number(term.left)} × {number(term.right)} = {number(term.product)} · {term.index < terms ? 'added' : 'not yet in partial sum'}</li>)}</ol>
    <div className="vector-controls"><label>Left matrix · commas within rows; semicolons between rows<input value={leftText} onChange={e => edit('left', e.target.value)} /></label><label>Right matrix<input value={rightText} onChange={e => edit('right', e.target.value)} /></label></div>
    {error && <p className="vector-error" role="alert">{error} The drawings show the last valid matrices, not the invalid draft.</p>}
    <p className="vector-result" aria-live="polite" data-result="partial">Partial sum: <strong>{number(result.partial)}</strong>, {terms}/{active.right.length} contributions; selected full result <strong>{number(result.result[selection[0]][selection[1]])}</strong>.</p>
    <div className="vector-step-controls"><button type="button" disabled={terms === 0} onClick={() => setTerms(t => t - 1)}>Remove last term</button><button type="button" disabled={terms === active.right.length} onClick={() => setTerms(t => t + 1)}>Add next term</button><button type="button" onClick={() => { setLeftText('2,1;0,3;1,2'); setRightText('3,2;5,4'); setActive(defaults); setSelection([0, 0]); setTerms(0); setError(''); }}>Reset product</button></div>
    <p>Valid edits apply immediately; maximum 3×3 and entries −20…20. Custom matrices need their own axis meanings. Try left 1,2,3 and right 1;0;−1: shape (1,1), result −2. A zero row contributes zero at every step.</p>
  </div></FlowLab>;
}
export function TensorReductionLab() {
  const [dataset, setDataset] = useState('ramp'), [axis, setAxis] = useState(1), [selection, setSelection] = useState([0, 0]);
  const tensor = measurementTensor(dataset), reduction = reduceMeasurementTensor(tensor, axis), selected = reduction.cells[selection[0]][selection[1]], sources = new Set(selected.sources.map(s => s.coordinate.join(',')));
  return <FlowLab label="Average one tensor axis and preserve the other two"><div className="vector-investigation" data-lab="tensor-reduction">
    <div className="vector-tensor-slices">{tensor.map((session, s) => <div key={s}><p>Session {s} · time rows, channel columns</p><table className="vector-tensor-source"><thead><tr><th aria-label="time rows" /><th scope="col">c0</th><th scope="col">c1</th><th scope="col">c2</th></tr></thead><tbody>{session.map((row, t) => <tr key={t}><th scope="row">t{t}</th>{row.map((value, c) => <td key={c} className={sources.has([s, t, c].join(',')) ? 'is-selected' : ''} data-coordinate={[s, t, c].join(',')}><strong>{value}</strong><small>({s},{t},{c})</small></td>)}</tr>)}</tbody></table></div>)}</div>
    <NumericMatrix values={reduction.cells.map(row => row.map(cell => cell.mean))} selectedCell={selection} onSelect={(r, c) => setSelection([r, c])} caption={`Mean shape (${reduction.shape.join(',')}) · rows ${reduction.axisNames[0]}, columns ${reduction.axisNames[1]}`} />
    <div className="vector-controls"><label>Dataset<select value={dataset} onChange={e => { setDataset(e.target.value); setSelection([0, 0]); }}><option value="ramp">Distinct values 0…11</option><option value="repeat">Repeat the same session</option><option value="impulse">One reading of 12; others zero</option></select></label><label>Average over<select value={axis} onChange={e => { setAxis(Number(e.target.value)); setSelection([0, 0]); }}>{tensorAxisNames.map((name, i) => <option key={name} value={i}>axis {i}: {name}</option>)}</select></label></div>
    <p className="vector-result" aria-live="polite" data-result="reduction">Output ({selection.join(',')}): ({selected.sources.map(s => s.value).join(' + ')})/{selected.sources.length}=<strong>{number(selected.mean)}</strong>. Only {tensorAxisNames[axis]} varies; {reduction.axisNames.join(' and ')} survive.</p>
    <button type="button" onClick={() => { setDataset('ramp'); setAxis(1); setSelection([0, 0]); }}>Reset tensor</button><p>Outlined cells supply one mean; coordinates are (session,time,channel). The impulse gives 12/2 under time averaging, 12/3 under channel averaging. Session averaging also divides by 2 but preserves different indices. Repeated sessions supply a null comparison.</p>
  </div></FlowLab>;
}
export function TensorReindexFigure() {
  return <figure className="vector-inline-figure" aria-label="Marker 3 followed through transpose and C-order reshape"><div className="vector-reindex-grid"><MatrixDrawing values={[[0, 1, 2], [3, 4, 5]]} label="Original (2,3) · marker (1,0)" mark={(i, j) => i === 1 && j === 0} /><MatrixDrawing values={[[0, 3], [1, 4], [2, 5]]} label="Transpose (3,2) · marker (0,1)" mark={(i, j) => i === 0 && j === 1} /><MatrixDrawing values={[[0, 1], [2, 3], [4, 5]]} label="C-order reshape (3,2) · marker (1,1)" mark={(i, j) => i === 1 && j === 1} /></div><p>The outline follows the same value 3. Reshape uses row-wise index order; this says nothing about physical storage.</p></figure>;
}
export const CompositionFigure = CompositionDrawing;
