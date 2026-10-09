import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { bootstrapPresets, parseBootstrapDraws } from '../../data/ensemble-bootstrap-flow-models.js';

const BootstrapContext = createContext(null);
const copyPreset = name => bootstrapPresets[name].map(bag => [...bag]);

export function EnsembleBootstrapProvider({ children }) {
  const [bags, setBags] = useState(() => copyPreset('repeated'));
  const [selectedBag, setSelectedBag] = useState(0);
  const [row, setRow] = useState(0);
  const [preset, setPreset] = useState('repeated');
  const [revision, setRevision] = useState(0);
  const changePreset = name => {
    if (!Object.hasOwn(bootstrapPresets, name)) return;
    setBags(copyPreset(name));
    setPreset(name);
    setRevision(value => value + 1);
  };
  const changeDraws = draws => {
    setBags(previous => previous.map((bag, index) => index === selectedBag ? [...draws] : bag));
    setPreset('edited');
  };
  const reset = () => {
    setBags(copyPreset('repeated'));
    setSelectedBag(0);
    setRow(0);
    setPreset('repeated');
    setRevision(value => value + 1);
  };
  return <BootstrapContext.Provider value={{ bags, selectedBag, setSelectedBag, row, setRow,
    preset, changePreset, changeDraws, revision, reset }}>{children}</BootstrapContext.Provider>;
}

export function useBootstrapBags() {
  const state = useContext(BootstrapContext);
  if (!state) throw new Error('Place connected draw, fit and OOB views inside EnsembleBootstrapProvider.');
  return state;
}

export function BootstrapDrawEntry({ draws, onChange, revision, selectedBag }) {
  const id = useId();
  const serial = draws.map(index => String.fromCharCode(65 + index)).join(', ');
  const [draft, setDraft] = useState(serial);
  const [error, setError] = useState('');
  const previous = useRef({ serial, revision, selectedBag });
  useEffect(() => {
    if (serial !== previous.current.serial || revision !== previous.current.revision || selectedBag !== previous.current.selectedBag) {
      setDraft(serial);
      setError('');
    }
    previous.current = { serial, revision, selectedBag };
  }, [serial, revision, selectedBag]);
  return <fieldset className="ensemble-flow-quantity">
    <legend>Bag {selectedBag + 1}: ordered draws</legend>
    <label htmlFor={id}>Enter 1–12 identities A–F; repeated identities retain every occurrence</label>
    <input id={id} type="text" value={draft} aria-label="Ordered bootstrap draws" aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined} onChange={event => {
        const text = event.target.value;
        setDraft(text);
        try {
          const next = parseBootstrapDraws(text);
          previous.current.serial = next.map(index => String.fromCharCode(65 + index)).join(', ');
          setError('');
          onChange(next);
        } catch (failure) {
          setError(`${failure.message} The last valid bag remains visible.`);
        }
      }} />
    {error && <span id={`${id}-error`} role="alert" className="ensemble-flow-error">{error}</span>}
  </fieldset>;
}
