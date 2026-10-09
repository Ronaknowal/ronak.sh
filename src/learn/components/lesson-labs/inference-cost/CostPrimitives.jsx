import React, { useEffect, useState } from 'react';
import { categoryColors } from "../../../data/inference-cost-models.js";
export const n = (value, digits = 3) => value === null || value === undefined ? 'undefined' : value.toLocaleString('en-US', {
  maximumFractionDigits: digits
});
export const money = (value, digits = 7) => value === null ? 'undefined' : `$${n(value, digits)}`;
export function Figure({
  id,
  label,
  children
}) {
  return <section id={`cost-${id}`} className="cost-figure" aria-label={`${id}: ${label}`} data-cost-figure={id}>{children}</section>;
}
export function Controls({
  children
}) {
  return <div className="cost-controls">{children}</div>;
}
export function Choice({
  name,
  value,
  options,
  onChange,
  disabled = false
}) {
  return <fieldset disabled={disabled}><legend>{name}</legend><div className="cost-choices">{options.map(([key, text]) => <button type="button" key={key} aria-pressed={value === key} onClick={() => onChange(key)}>{text}</button>)}</div></fieldset>;
}
export function NumberControl({
  name,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  disabled = false
}) {
  return <label className="cost-number">{name}<input type="number" value={value} min={min} max={max} step={step} disabled={disabled} onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))} /></label>;
}
export function Select({
  name,
  value,
  options,
  onChange
}) {
  return <label className="cost-select">{name}<select value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>;
}
export function Readout({
  children
}) {
  return <p className="cost-readout" aria-live="polite">{children}</p>;
}
export function Note({
  children
}) {
  return <p className="cost-note">{children}</p>;
}
export function SafeResult({
  calculate,
  children
}) {
  let result;
  try {
    result = calculate();
  } catch (error) {
    return <Readout>Calculation refused: {error.message}</Readout>;
  }
  return children(result);
}
export function Bars({
  rows,
  maximum,
  unit = '',
  label = 'Common scale',
  selected,
  onSelect
}) {
  const bound = maximum ?? (Math.max(0, ...rows.map(row => row.value)) || 1);
  return <div className="cost-bars" aria-label={label}>{rows.map((row, index) => <div className="cost-bar-row" key={row.id ?? index}><div className="cost-bar-label">{row.label}</div><div className="cost-bar-track"><span className={`cost-bar-fill ${selected === index ? 'is-selected' : ''}`} style={{
          width: `${Math.max(0, row.value / bound * 100)}%`,
          background: row.color || categoryColors[index % 5]
        }} />{onSelect && <button type="button" className="cost-bar-hit" aria-label={`Inspect ${row.label}`} aria-pressed={selected === index} onClick={() => onSelect(index)} />}</div><span className="cost-bar-value">{n(row.value, 7)} {unit}</span></div>)}<p className="cost-axis">0 — {n(bound, 7)} {unit}; {label}</p></div>;
}
export function Strip({
  pieces,
  total,
  label
}) {
  const sum = total ?? pieces.reduce((acc, item) => acc + item.value, 0);
  return <div className="cost-strip-wrap"><div className="cost-strip" aria-label={label}>{pieces.map((piece, i) => <span key={i} title={`${piece.label}: ${n(piece.value)}`} style={{
        flexBasis: `${sum ? piece.value / sum * 100 : 0}%`,
        background: piece.color || categoryColors[i % 5],
        outline: piece.selected ? '3px solid white' : undefined
      }} />)}</div><div className="cost-legend">{pieces.map((piece, i) => <span key={i}><i style={{
          background: piece.color || categoryColors[i % 5]
        }} />{piece.label}: {n(piece.value)}</span>)}</div></div>;
}
export function Matrix({
  rows,
  label,
  selected,
  selectedRow,
  onSelect,
  color = '#5da9ff'
}) {
  return <div className="cost-matrix" tabIndex={0} role="region" aria-label={`${label}; scroll horizontally when needed`}><span>{label}</span><div role="group" aria-label={label} className="cost-matrix-grid" style={{
      gridTemplateColumns: `repeat(${rows[0]?.length || 1}, minmax(2.5em,1fr))`
    }}>{rows.flatMap((row, i) => row.map((value, j) => <button type="button" key={`${i}-${j}`} disabled={!onSelect} style={{
        '--entity-color': color
      }} aria-label={`${label} row ${i + 1}, column ${j + 1}: ${value}`} aria-pressed={selectedRow === i || selected?.[0] === i && selected?.[1] === j} onClick={() => onSelect?.([i, j])}>{n(value)}</button>))}</div>{!rows.length && <span>Zero rows</span>}</div>;
}
const observations = new Map();
export function useSavedJson(path) {
  const [state, setState] = useState(() => observations.has(path) ? {
      data: observations.get(path)
    } : {}),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (observations.has(path)) {
      setState({
        data: observations.get(path)
      });
      return;
    }
    const controller = new AbortController();
    setState({});
    fetch(path, {
      signal: controller.signal
    }).then(r => {
      if (!r.ok || /text\/html/.test(r.headers.get('content-type') || '')) throw new Error('Saved data unavailable');
      return r.json();
    }).then(data => {
      observations.set(path, data);
      if (!controller.signal.aborted) setState({
        data
      });
    }).catch(error => {
      if (!controller.signal.aborted) setState({
        error: error.message
      });
    });
    return () => controller.abort();
  }, [path, attempt]);
  return {
    ...state,
    retry: () => setAttempt(v => v + 1)
  };
}
export function Loading({
  state
}) {
  return state.error ? <p role="alert">Saved observation could not load. <button type="button" onClick={state.retry}>Retry observation</button></p> : <p role="status">Loading saved observation…</p>;
}
