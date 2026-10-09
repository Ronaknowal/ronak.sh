import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { aggregationNumber } from '../../data/message-aggregation-flow-models.js';

const SageContext = createContext(null);
const PoolContext = createContext(null);
export const initialSageNeighborhood = () => ({ own: 4, neighbors: [1, 3, 5], selfWeight: 2, neighborWeight: 1, selected: 0 });

// The same neighborhood is read by D13/D13a/b/c; later parameters have scoped resets.
export function MessagePassingAggregationProvider({ children }) {
  const [sage, setSage] = useState(initialSageNeighborhood);
  const [revision, setRevision] = useState({ all: 0, values: 0, weights: 0 });
  const [poolFirst, setPoolFirst] = useState(-2);
  const [poolRevision, setPoolRevision] = useState(0);
  const resetSage = () => { setSage(initialSageNeighborhood()); setRevision(r => ({ all: r.all + 1, values: r.values + 1, weights: r.weights + 1 })); };
  const resize = count => setSage(old => ({ ...old, neighbors: Array.from({ length: count }, (_, i) => old.neighbors[i] ?? 0), selected: count ? Math.min(old.selected, count - 1) : 0 }));
  const edit = (key, value) => setSage(old => ({ ...old, [key]: value }));
  const editOccurrence = value => setSage(old => ({ ...old, neighbors: old.neighbors.map((entry, i) => i === old.selected ? value : entry) }));
  const resetValues = () => { setSage(old => ({ ...old, selected: 0, neighbors: old.neighbors.map((_, i) => [1, 3, 5][i] ?? 0) })); setRevision(r => ({ ...r, values: r.values + 1 })); };
  const resetWeights = () => { setSage(old => ({ ...old, selfWeight: 2, neighborWeight: 1 })); setRevision(r => ({ ...r, weights: r.weights + 1 })); };
  return <SageContext.Provider value={{ sage, revision, resetSage, resize, edit, editOccurrence, resetValues, resetWeights }}>
    <PoolContext.Provider value={{ first: poolFirst, setFirst: setPoolFirst, revision: poolRevision, reset: () => { setPoolFirst(-2); setPoolRevision(r => r + 1); } }}>{children}</PoolContext.Provider>
  </SageContext.Provider>;
}

export function useSageNeighborhood() {
  const state = useContext(SageContext);
  if (!state) throw new Error('Wrap section-four aggregation views in MessagePassingAggregationProvider.');
  return state;
}
export function usePoolingNeighborhood() {
  const state = useContext(PoolContext);
  if (!state) throw new Error('Wrap D14 and its library route in MessagePassingAggregationProvider.');
  return state;
}

// Slider + exact entry are one logical quantity. Invalid drafts never change the last valid model.
// Revision clears invalid drafts even when Reset restores an already-default committed value.
export function AggregationQuantity({ label, value, onChange, min, max, step = .05, integer = false, revision = 0 }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  const committed = useRef(value), observedRevision = useRef(revision);
  useEffect(() => {
    // Preserve text being typed here (including -0. and scientific notation).
    // A different source value or an explicit Reset revision replaces the draft.
    if (!Object.is(value, committed.current) || revision !== observedRevision.current) { setDraft(String(value)); setError(''); }
    committed.current = value; observedRevision.current = revision;
  }, [value, revision]);
  const changeText = text => {
    setDraft(text);
    const parsed = Number(text);
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text.trim()) || !Number.isFinite(parsed)) {
      setError('Enter a finite number. The last valid result remains visible.'); return;
    }
    if (parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
      setError(`Use ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}. The last valid result remains visible.`); return;
    }
    setError(''); committed.current = parsed; onChange(parsed);
  };
  const changeRange = value => { setDraft(String(value)); setError(''); committed.current = value; onChange(value); };
  return <fieldset className="mp-aggregation-quantity" data-quantity={label}>
    <legend>{label} <output>{aggregationNumber(value, 9)}</output></legend>
    <input type="range" aria-label={`${label}: slider`} value={value} min={min} max={max} step={integer ? 1 : 'any'}
      onChange={event => changeRange(Number(event.target.value))}
      onKeyDown={event => {
        if (integer || !['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? min : event.key === 'End' ? max : Math.max(min, Math.min(max, value + (['ArrowLeft', 'ArrowDown'].includes(event.key) ? -step : step)));
        changeRange(next);
      }} />
    <label htmlFor={`${id}-exact`}>Exact value</label>
    <input id={`${id}-exact`} type="text" inputMode="decimal" aria-label={`${label}: exact value`} value={draft}
      aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={event => changeText(event.target.value)} />
    {error && <span id={`${id}-error`} className="mp-aggregation-error" role="alert">{error}</span>}
  </fieldset>;
}

export function AggregationOccurrenceSelect({ value, count, onChange }) {
  const id = useId();
  return <label className="mp-aggregation-select" htmlFor={id}>Incoming occurrence
    <select id={id} aria-label="Incoming occurrence" value={value} onChange={event => onChange(Number(event.target.value))}>
      {Array.from({ length: count }, (_, i) => <option key={i} value={i}>o{i}</option>)}
    </select>
  </label>;
}
