import { createContext, useContext, useMemo, useState } from 'react';
import { signedBoostingTrace } from '../../data/ensemble-methods-models.js';
import { retainedBoostingState } from '../../data/ensemble-boosting-flow-models.js';

const BoostingContext = createContext(null);
export function EnsembleBoostingProvider({ children }) {
  const [fixture, setFixture] = useState('mixed');
  const [rounds, setRounds] = useState(8);
  const [stage, setStage] = useState(1);
  const [query, setQuery] = useState(2.5);
  const [revision, setRevision] = useState(0);
  const state = useMemo(() => retainedBoostingState(fixture, rounds, stage, query), [fixture, rounds, stage, query]);
  const changeFixture = next => {
    setFixture(next);
    setStage(1);
    setRevision(value => value + 1);
  };
  const changeRounds = next => {
    const available = signedBoostingTrace(fixture, next).frames.length;
    setRounds(next);
    setStage(previous => Math.min(previous, available));
    setRevision(value => value + 1);
  };
  const reset = () => {
    setFixture('mixed'); setRounds(8); setStage(1); setQuery(2.5);
    setRevision(value => value + 1);
  };
  return <BoostingContext.Provider value={{ ...state, fixture, rounds, query, revision,
    changeFixture, changeRounds, setStage, setQuery, reset }}>{children}</BoostingContext.Provider>;
}

export function useRetainedBoosting() {
  const state = useContext(BoostingContext);
  if (!state) throw new Error('Place connected signed trace views inside EnsembleBoostingProvider.');
  return state;
}
