import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { ensembleNumber } from '../../data/ensemble-methods-models.js';

const VoteContext = createContext(null);
const ResidualContext = createContext(null);

export function EnsembleCombinationProvider({ children }) {
  const [probabilities, setProbabilities] = useState([.51, .51, .01]);
  const [quantities, setQuantities] = useState([1, 1, 1]);
  const [voteRevision, setVoteRevision] = useState(0);
  const [residuals, setResiduals] = useState({ a: [-3, -1, 2, 2], b: [1, 1, -1, -3], weight: .5, preset: 'complementary' });
  const [residualRevision, setResidualRevision] = useState(0);
  const resetVotes = () => {
    setProbabilities([.51, .51, .01]);
    setQuantities([1, 1, 1]);
    setVoteRevision(previous => previous + 1);
  };
  const resetResiduals = () => {
    setResiduals({ a: [-3, -1, 2, 2], b: [1, 1, -1, -3], weight: .5, preset: 'complementary' });
    setResidualRevision(previous => previous + 1);
  };
  return <VoteContext.Provider value={{ probabilities, quantities, setProbabilities, setQuantities, revision: voteRevision, reset: resetVotes }}>
    <ResidualContext.Provider value={{ ...residuals, setResiduals, revision: residualRevision, reset: resetResiduals }}>
      {children}
    </ResidualContext.Provider>
  </VoteContext.Provider>;
}

export function useEnsembleVotes() {
  const state = useContext(VoteContext);
  if (!state) throw new Error('Place the connected vote views inside EnsembleCombinationProvider.');
  return state;
}

export function useEnsembleResiduals() {
  const state = useContext(ResidualContext);
  if (!state) throw new Error('Place the connected residual views inside EnsembleCombinationProvider.');
  return state;
}

export function EnsembleQuantity({ label, value, onChange, min, max, step = .05, integer = false, revision = 0 }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  const committed = useRef(value);
  const observedRevision = useRef(revision);
  useEffect(() => {
    if (!Object.is(value, committed.current) || revision !== observedRevision.current) {
      setDraft(String(value));
      setError('');
    }
    committed.current = value;
    observedRevision.current = revision;
  }, [value, revision]);
  const change = next => {
    setDraft(String(next));
    setError('');
    committed.current = next;
    onChange(next);
  };
  const edit = text => {
    setDraft(text);
    const parsed = Number(text);
    const complete = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text.trim());
    if (!complete || !Number.isFinite(parsed)) {
      setError('Enter a finite number. The last valid result remains visible.');
      return;
    }
    if (parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
      setError(`Enter ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}. The last valid result remains visible.`);
      return;
    }
    setError('');
    committed.current = parsed;
    onChange(parsed);
  };
  return <fieldset className="ensemble-flow-quantity">
    <legend>{label} <output>{ensembleNumber(value, 9)}</output></legend>
    <input type="range" aria-label={`${label}: slider`} value={value} min={min} max={max} step={integer ? 1 : 'any'}
      onChange={event => change(Number(event.target.value))}
      onKeyDown={event => {
        if (integer || !['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? min : event.key === 'End' ? max : Math.min(max, Math.max(min,
          value + (['ArrowLeft', 'ArrowDown'].includes(event.key) ? -step : step)));
        change(next);
      }} />
    <label htmlFor={id}>Exact value</label>
    <input id={id} type="text" inputMode="decimal" value={draft} aria-label={`${label}: exact value`}
      aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
      onChange={event => edit(event.target.value)} />
    {error && <span id={`${id}-error`} role="alert" className="ensemble-flow-error">{error}</span>}
  </fieldset>;
}

export function EnsembleVectorEntry({ label, values, onChange, min = -1e6, max = 1e6, revision = 0 }) {
  const id = useId();
  const serial = values.map(String).join(', ');
  const [draft, setDraft] = useState(serial);
  const [error, setError] = useState('');
  const committed = useRef(serial);
  const observedRevision = useRef(revision);
  useEffect(() => {
    if (serial !== committed.current || revision !== observedRevision.current) {
      setDraft(serial);
      setError('');
    }
    committed.current = serial;
    observedRevision.current = revision;
  }, [serial, revision]);
  return <fieldset className="ensemble-flow-quantity">
    <legend>{label}</legend>
    <label htmlFor={id}>Exact coordinates, separated by commas</label>
    <input id={id} type="text" value={draft} aria-label={label} aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      onChange={event => {
        const text = event.target.value;
        setDraft(text);
        const parts = text.split(',').map(part => part.trim());
        const pattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
        const next = parts.map(Number);
        if (parts.length !== values.length || parts.some(part => !pattern.test(part)) ||
          next.some(value => !Number.isFinite(value) || value < min || value > max)) {
          setError(`Enter ${values.length} finite coordinates from ${min} to ${max}. The last valid result remains visible.`);
          return;
        }
        committed.current = next.map(String).join(', ');
        setError('');
        onChange(next);
      }} />
    {error && <span id={`${id}-error`} role="alert" className="ensemble-flow-error">{error}</span>}
  </fieldset>;
}
