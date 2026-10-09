import { createContext, useContext, useMemo, useState } from 'react';
import { sparsePathComparison } from '../../data/message-sparse-flow-models.js';

const SparseContext = createContext(null);
export function MessagePassingSparseProvider({ children }) {
  const [rightEdge, setRightEdge] = useState(true);
  const [endpointValue, setEndpointValue] = useState(4);
  const trace = useMemo(() => sparsePathComparison(rightEdge, endpointValue), [rightEdge, endpointValue]);
  const reset = () => { setRightEdge(true); setEndpointValue(4); };
  return <SparseContext.Provider value={{ trace, rightEdge, setRightEdge, endpointValue, setEndpointValue, reset }}>{children}</SparseContext.Provider>;
}
export function useSparsePath() {
  const state = useContext(SparseContext);
  if (!state) throw new Error('Use MessagePassingSparseProvider around connected sparse views.');
  return state;
}
