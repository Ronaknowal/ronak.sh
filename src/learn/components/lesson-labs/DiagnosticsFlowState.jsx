import { createContext, useContext, useRef, useState } from 'react';
import { scalarTrace, modeTrace, pairTrace, restartTrace, meanVariance } from '../../data/diagnostics-reading-models.js';

const Scalar = createContext(null), Mode = createContext(null), Restart = createContext(null), Pairs = createContext(null), Variance = createContext(null);
const scalarInitial = () => ({ rows: [{ id: 1, x: 1, y: 2 }, { id: 2, x: 2, y: 0 }, { id: 3, x: 3, y: 1 }], selected: 1, weight: 0, rate: .1 });
const modeInitial = () => ({ values: [1, 3], mean: 0, variance: 1, training: true, graph: true, module: 'batchnorm' });
const restartInitial = () => ({ target: 3, weight: 1, rate: .1, momentum: .5, save: 1, steps: 1, cursor: 0 });
const pairsInitial = () => ({ rows: [{ id: 1, a: .7, b: .6 }, { id: 2, a: .8, b: .85 }, { id: 3, a: .9, b: .85 }], selected: 1,
  unit: 'loss', direction: 'smaller', note: 'Constructed arithmetic fixture; no named system was measured.' });

function ScalarProvider({ children }) {
  const [state, setState] = useState(scalarInitial), [pin, setPin] = useState(null), [epoch, setEpoch] = useState(0), nextId = useRef(4);
  const trace = scalarTrace(state.rows, state.weight, state.rate), selected = state.rows.find(row => row.id === state.selected);
  const update = fields => setState(old => ({ ...old, ...fields }));
  const edit = (field, value) => setState(old => ({ ...old, rows: old.rows.map(row => row.id === old.selected ? { ...row, [field]: value } : row) }));
  const add = () => { const id = nextId.current++; setState(old => old.rows.length >= 4 ? old : ({ ...old, rows: [...old.rows, { id, x: 1, y: 1 }], selected: id })); };
  const remove = () => setState(old => { if (old.rows.length <= 1) return old; const rows = old.rows.filter(row => row.id !== old.selected); return { ...old, rows, selected: rows[0].id }; });
  const reset = () => { setState(scalarInitial()); setPin(null); nextId.current = 4; setEpoch(x => x + 1); };
  const copy = () => ({ ...state, rows: state.rows.map(row => ({ ...row })) });
  const pinCase = () => setPin({ state: copy(), trace: scalarTrace(state.rows.map(row => ({ ...row })), state.weight, state.rate) });
  const restore = () => { if (!pin) return; setState({ ...pin.state, rows: pin.state.rows.map(row => ({ ...row })) }); nextId.current = Math.max(nextId.current, ...pin.state.rows.map(row => row.id + 1)); setEpoch(x => x + 1); };
  return <Scalar.Provider value={{ state, trace, selected, epoch, update, edit, add, remove, reset, pin, pinCase, restore, clearPin: () => setPin(null) }}>{children}</Scalar.Provider>;
}
function ModeProvider({ children }) {
  const [state, setState] = useState(modeInitial), [epoch, setEpoch] = useState(0), trace = modeTrace(state);
  const update = fields => setState(old => ({ ...old, ...fields }));
  const reset = () => { setState(modeInitial()); setEpoch(x => x + 1); };
  const resetBuffers = () => { update({ mean: 0, variance: 1 }); setEpoch(x => x + 1); };
  const carry = () => { update({ mean: trace.nextMean, variance: trace.nextVariance }); setEpoch(x => x + 1); };
  return <Mode.Provider value={{ state, trace, epoch, update, reset, resetBuffers, carry }}>{children}</Mode.Provider>;
}
function RestartProvider({ children }) {
  const [state, setState] = useState(restartInitial), [epoch, setEpoch] = useState(0);
  const trace = restartTrace(state), length = state.save + state.steps;
  const update = fields => setState(old => { const next = { ...old, ...fields }; next.cursor = Math.min(next.cursor, next.save + next.steps - 1); return next; });
  const reset = () => { setState(restartInitial()); setEpoch(x => x + 1); };
  return <Restart.Provider value={{ state, trace, epoch, length, update, reset }}>{children}</Restart.Provider>;
}
function PairProvider({ children }) {
  const [state, setState] = useState(pairsInitial), [epoch, setEpoch] = useState(0), nextId = useRef(4);
  const invalid = state.rows.some(row => row.a < 0 || row.b < 0 || row.a > (state.unit === 'accuracy' ? 1 : 100) || row.b > (state.unit === 'accuracy' ? 1 : 100));
  const trace = pairTrace(state.rows, state.direction), selected = state.rows.find(row => row.id === state.selected);
  const update = fields => setState(old => ({ ...old, ...fields }));
  const edit = (field, value) => setState(old => ({ ...old, rows: old.rows.map(row => row.id === old.selected ? { ...row, [field]: value } : row) }));
  const add = () => { const id = nextId.current++; setState(old => old.rows.length >= 6 ? old : ({ ...old, rows: [...old.rows, { id, a: .7, b: .7 }], selected: id })); };
  const remove = () => setState(old => { if (old.rows.length <= 2) return old; const rows = old.rows.filter(row => row.id !== old.selected); return { ...old, rows, selected: rows[0].id }; });
  const reset = () => { setState(pairsInitial()); nextId.current = 4; setEpoch(x => x + 1); };
  const selfPair = () => setState(old => ({ ...old, rows: old.rows.map(row => ({ ...row, b: row.a })) }));
  return <Pairs.Provider value={{ state, trace, invalid, selected, epoch, update, edit, add, remove, reset, selfPair }}>{children}</Pairs.Provider>;
}
function VarianceProvider({ children }) {
  const [state, setState] = useState({ common: .4, count: 3 }), [epoch, setEpoch] = useState(0);
  return <Variance.Provider value={{ state, value: meanVariance(state.common, state.count), epoch,
    update: fields => setState(old => ({ ...old, ...fields })), reset: () => { setState({ common: .4, count: 3 }); setEpoch(x => x + 1); } }}>{children}</Variance.Provider>;
}
export function DiagnosticsCaseProviders({ children }) {
  return <ScalarProvider><ModeProvider><RestartProvider><PairProvider><VarianceProvider>{children}</VarianceProvider></PairProvider></RestartProvider></ModeProvider></ScalarProvider>;
}
export const useDiagnosticScalar = () => useContext(Scalar);
export const useDiagnosticMode = () => useContext(Mode);
export const useDiagnosticRestart = () => useContext(Restart);
export const useDiagnosticPairs = () => useContext(Pairs);
export const useDiagnosticVariance = () => useContext(Variance);
