import { createContext, useContext, useState } from 'react';
import { exactFixture } from '../../data/cross-attention-flow-models.js';
import { originalEvents } from '../../data/cross-attention-models.js';

const Context = createContext(null);
export function CrossFlowProvider({ children }) {
  const [read, setRead] = useState(() => exactFixture()), [reader, setReader] = useState(0), [cell, setCell] = useState(['key', 0, 0]), [pinned, setPinned] = useState(null);
  const [shape, setShape] = useState({ readers: 2, memory: 3, heads: 1, keyWidth: 2, valueWidth: 2, readerWidth: 2, memoryWidth: 3 });
  const [order, setOrder] = useState([...originalEvents]), [policy, setPolicy] = useState('recent'), [encoder, setEncoder] = useState('independent'), [depth, setDepth] = useState(2);
  const [gate, setGate] = useState({ x: 1, value: 2, target: 3, alpha: 0, rate: .1 }), [gatePinned, setGatePinned] = useState(null);
  return <Context.Provider value={{ read, setRead, reader, setReader, cell, setCell, pinned, setPinned, shape, setShape,
    order, setOrder, policy, setPolicy, encoder, setEncoder, depth, setDepth, gate, setGate, gatePinned, setGatePinned }}>{children}</Context.Provider>;
}
export function useCrossFlow() {
  const value = useContext(Context);
  if (!value) throw new Error('Cross-attention flow views require their topic provider.');
  return value;
}
