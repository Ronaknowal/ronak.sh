import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { foundationalModel, parseTargets, valid } from '../../../data/gbt-reading-flow-model.js';
import {validationInvestigation} from '../../../data/gradient-boosted-trees-models.js';
import './reading-flow.css';

export const number = (value, digits = 6) => {
  if (!Number.isFinite(value)) return 'unavailable';
  if (value === 0) return '0';
  const rounded = Number(value.toFixed(digits));
  return (rounded === 0 ? value.toExponential(Math.min(digits, 3)) : String(rounded)).replaceAll('-', '−');
};
const defaults = {
  found: { query: 4.5, rate: .5, round: 1, row: 2, targets: [2, 2, 3, 7, 8, 8] },
  loss: { score: 0, label: 1, robust: [-2, -1, 10], residual: 0, delta: 2, tau: .8, scores: [0, 0, 0], selectedClass: 0, target: 1 },
  newton: { kind: 'square', split: 2, lambda: 1, alpha: 0, gamma: 0, rate: .3 },
  hist: { coarse: false, missingTarget: 8, mass: 6, cell: 0 },
  goss: { sample: 0 },
  bundle: { rows: [[0, 0, 0], [2, 0, 0], [0, 1, 0], [0, 0, 2]], row: 0, feature: 0 },
  category: { row: 2, reverse: false, ownFlip: false, earlierFlip: false, strength: 1, historyRound: 2, prefix: 4 },
  validation: { rate: .3, depth: 2, cursor: 5 },
  diagnostic: { query: 2, p: .1, weight: 9 },
  study: { trial: 6, row: 0, prefix: 294 }
};
const Context = createContext(null);
export function ReadingState({ children }) {
  const [state, setState] = useState(() => structuredClone(defaults)), [resets, setResets] = useState({}), [before, setBefore] = useState(null);
  const model = useMemo(() => foundationalModel(state.found), [state.found.targets, state.found.rate]);
  const validation = useMemo(() => validationInvestigation(state.validation), [state.validation.rate,state.validation.depth]);
  function update(group, patch) {
    if (group === 'found' && ('targets' in patch || 'rate' in patch)) {
      setBefore(model); patch = { ...patch, round: 1 };
    }
    if (group === 'validation' && ('rate' in patch || 'depth' in patch)) patch = { ...patch, cursor: 1 };
    if (group === 'category' && ('row' in patch || 'reverse' in patch)) patch = { ...patch, ownFlip: false, earlierFlip: false };
    setState(previous => ({ ...previous, [group]: { ...previous[group], ...patch } }));
  }
  function reset(group) {
    if (group === 'found') setBefore(null);
    setState(previous => ({ ...previous, [group]: structuredClone(defaults[group]) }));
    setResets(previous => ({ ...previous, [group]: (previous[group] || 0) + 1 }));
  }
  return <Context.Provider value={{ state, update, reset, resets, model, before, validation }}>{children}</Context.Provider>;
}
export const useReading = () => useContext(Context);
export function Figure({ id, label, caption, children }) {
  return <figure className="gbf-figure" data-gbt-drawing={id} aria-label={label}>{children}<figcaption>{caption}</figcaption></figure>;
}
export function Scroll({ label, className = '', children }) {
  const ref = useRef(null), [wide, setWide] = useState(false);
  useEffect(() => {
    const element = ref.current, measure = () => setWide(element.scrollWidth > element.clientWidth + 1);
    measure(); const observer = new ResizeObserver(measure);
    observer.observe(element); if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, []);
  function pan(event) {
    const element = ref.current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); element.scrollLeft += event.key === 'ArrowRight' ? 80 : -80; }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); element.scrollLeft = event.key === 'Home' ? 0 : element.scrollWidth; }
  }
  return <div className="gbf-scroll-region"><div ref={ref} className={'gbf-scroll ' + className} tabIndex={0} role="region" aria-label={label + '; arrow keys or Home/End pan horizontally'} onKeyDown={pan}>{children}</div>{wide && <p className="gbf-scroll-cue">↔ Pan this figure, equation or table; arrow keys and Home/End work when focused.</p>}</div>;
}
export function Equation({children}){return <Scroll className="neural-equation" label="Displayed equation in mathematical notation">{children}</Scroll>;}
export function Scene({ label, width = 272, height = 220, children }) {
  const id = useId();
  return <Scroll className="gbf-scene" label={label}>
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: width / 16 + 'rem' }} role="img" aria-labelledby={id}><title id={id}>{label}</title>{children}</svg>
  </Scroll>;
}
export function Table({ headers, rows, caption }) {
  return <Scroll label={caption}><table><caption>{caption}</caption><thead><tr>{headers.map((v, i) => <th key={i} scope="col">{v}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{value}</td>)}</tr>)}</tbody></table></Scroll>;
}
export function Numeric({ label, value, onChange, min, max, integer = false, step = .25, resetKey = 0, entityKey = '' }) {
  const id = useId(), [draft, setDraft] = useState(String(value)), [invalid, setInvalid] = useState(false);
  useEffect(() => { setDraft(String(value)); setInvalid(false); }, [value, resetKey, entityKey]);
  function input(raw) {
    setDraft(raw); const candidate = raw.trim() === '' ? NaN : Number(raw), okay = valid(candidate, min, max, integer);
    setInvalid(!okay); if (okay) onChange(candidate);
  }
  function navigate(delta) {
    const next = Math.max(min, Math.min(max, value + delta));
    setDraft(String(next)); setInvalid(false); onChange(next);
  }
  return <div className="gbf-number"><label htmlFor={id}>{label} ({min}…{max}{integer ? ', integer' : ''})</label><div className="gbf-number-row">
    <button type="button" aria-label={'Decrease ' + label} onClick={() => navigate(-step)}>−</button>
    <input id={id} type="number" step="any" value={draft} aria-invalid={invalid} aria-describedby={id + '-status'} onChange={event => input(event.target.value)} />
    <button type="button" aria-label={'Increase ' + label} onClick={() => navigate(step)}>+</button></div>
    <span id={id + '-status'} className={invalid ? 'gbf-error' : 'gbf-valid'}>{invalid ? 'Invalid draft; retaining ' : 'Current: '}{String(value)}</span></div>;
}
export function Choice({ label, value, onChange, options }) {
  const id = useId();
  return <label className="gbf-choice" htmlFor={id}>{label}<select id={id} value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, text]) => <option value={key} key={key}>{text}</option>)}</select></label>;
}
export function Controls({ group, children }) {
  const { reset } = useReading();
  return <div className="gbf-controls">{children}<button type="button" onClick={() => reset(group)}>Reset connected {group === 'found' ? 'correction' : group} state</button></div>;
}
export function Targets() {
  const { state, update, resets } = useReading(), [draft, setDraft] = useState(state.found.targets.join(', ')), [error, setError] = useState('');
  const id = useId();
  useEffect(() => { setDraft(state.found.targets.join(', ')); setError(''); }, [state.found.targets, resets.found]);
  function apply() { try { update('found', { targets: parseTargets(draft) }); setError(''); } catch (failure) { setError(failure.message); } }
  return <div className="gbf-targets"><label htmlFor={id}>Six training targets (−30…30; decimal/exponent)</label><textarea id={id} value={draft} aria-invalid={Boolean(error)} aria-describedby={id + '-status'} onChange={event => setDraft(event.target.value)} /><button type="button" onClick={apply}>Apply targets together</button><span id={id + '-status'} role={error ? 'alert' : 'status'}>{error || 'Current model targets: ' + state.found.targets.join(', ')}</span></div>;
}
export function Arrow({ x1, y1, x2, y2, active = false, label }) {
  const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
  if (length === 0) return <g className={active ? 'gbf-active' : ''}><circle cx={x1} cy={y1} r={3}/></g>;
  const ux = dx / length, uy = dy / length;
  return <g className={active ? 'gbf-active' : ''}><path d={`M${x1},${y1}L${x2},${y2}`} /><path d={`M${x2 - 7 * ux - 4 * uy},${y2 - 7 * uy + 4 * ux}L${x2},${y2}L${x2 - 7 * ux + 4 * uy},${y2 - 7 * uy - 4 * ux}`} />{label && <text x={(x1 + x2) / 2 + 8} y={(y1 + y2) / 2 - 8}>{label}</text>}</g>;
}
