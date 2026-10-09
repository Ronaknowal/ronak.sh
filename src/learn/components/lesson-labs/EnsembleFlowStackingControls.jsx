import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { stackingOwnershipState, fitEditedCombiner, initialCombinerMatrix, initialCombinerTargets,
  parseCombinerMatrix, serializeCombinerMatrix } from '../../data/ensemble-stacking-flow-models.js';

const StackingContext = createContext(null);
const CombinerContext = createContext(null);
const freshProblem = () => ({ matrix: initialCombinerMatrix.map(row => [...row]), targets: [...initialCombinerTargets] });

export function EnsembleStackingProvider({ children }) {
  const [mode, setMode] = useState('honest');
  const [completed, setCompleted] = useState(1);
  const [row, setRow] = useState(0);
  const [query, setQuery] = useState(2.5);
  const [revision, setRevision] = useState(0);
  const [problem, setProblem] = useState(freshProblem);
  const [constraint, setConstraint] = useState('simplex');
  const [strength, setStrength] = useState(.2);
  const [combinerRevision, setCombinerRevision] = useState(0);
  const ownership = useMemo(() => stackingOwnershipState(mode, completed, query, row), [mode, completed, query, row]);
  const fitted = useMemo(() => fitEditedCombiner(problem.matrix, problem.targets, strength, constraint), [problem, strength, constraint]);
  const resetOwnership = () => {
    setMode('honest'); setCompleted(1); setRow(0); setQuery(2.5);
    setRevision(value => value + 1);
  };
  const resetCombiner = () => {
    setProblem(freshProblem()); setConstraint('simplex'); setStrength(.2);
    setCombinerRevision(value => value + 1);
  };
  return <StackingContext.Provider value={{ ...ownership, mode, completed, row, query, revision,
    setMode, setCompleted, setRow, setQuery, reset: resetOwnership }}>
    <CombinerContext.Provider value={{ ...fitted, problem, setProblem, setConstraint, setStrength,
      revision: combinerRevision, reset: resetCombiner }}>{children}</CombinerContext.Provider>
  </StackingContext.Provider>;
}

export function useStackingOwnership() {
  const state = useContext(StackingContext);
  if (!state) throw new Error('Place OOF ownership views inside EnsembleStackingProvider.');
  return state;
}

export function useEditedCombiner() {
  const state = useContext(CombinerContext);
  if (!state) throw new Error('Place the general fit view inside EnsembleStackingProvider.');
  return state;
}

export function CombinerMatrixEntry({ problem, onChange, revision }) {
  const id = useId();
  const serial = serializeCombinerMatrix(problem.matrix, problem.targets);
  const [draft, setDraft] = useState(serial);
  const [error, setError] = useState('');
  const previous = useRef({ serial, revision });
  useEffect(() => {
    if (serial !== previous.current.serial || revision !== previous.current.revision) { setDraft(serial); setError(''); }
    previous.current = { serial, revision };
  }, [serial, revision]);
  return <fieldset className="ensemble-flow-quantity ensemble-stacking-matrix-entry">
    <legend>Prediction matrix and targets</legend>
    <label htmlFor={id}>One row per line: 2–5 forecasts separated by commas, then =&gt; target; 1–20 rows, finite values within ±1e6</label>
    <textarea id={id} rows={6} value={draft} aria-label="Combiner matrix and targets" aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined} onChange={event => {
        const text = event.target.value;
        setDraft(text);
        try {
          const next = parseCombinerMatrix(text);
          previous.current.serial = serializeCombinerMatrix(next.matrix, next.targets);
          setError(''); onChange(next);
        } catch (failure) { setError(`${failure.message} The last valid matrix remains visible.`); }
      }} />
    {error && <span id={`${id}-error`} role="alert" className="ensemble-flow-error">{error}</span>}
  </fieldset>;
}
