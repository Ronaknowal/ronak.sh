import { createContext, useContext, useState } from 'react';
const Context = createContext(null);
export function MessagePassingApplicationsProvider({
  children
}) {
  const [fanouts, setFanouts] = useState([4, 3]),
    [replacement, setReplacement] = useState(true),
    [revision, setRevision] = useState({
      depth: 0,
      fanouts: 0,
      replacement: 0
    });
  const resize = depth => setFanouts(old => Array.from({
    length: depth
  }, (_, i) => old[i] ?? 2));
  const editFanout = (index, value) => setFanouts(old => old.map((v, i) => i === index ? value : v));
  const resetDepth = () => {
    resize(2);
    setRevision(old => ({
      ...old,
      depth: old.depth + 1
    }));
  };
  const resetFanouts = () => {
    setFanouts(old => old.map((_, i) => [4, 3, 2][i]));
    setRevision(old => ({
      ...old,
      fanouts: old.fanouts + 1
    }));
  };
  const resetReplacement = () => {
    setReplacement(true);
    setRevision(old => ({
      ...old,
      replacement: old.replacement + 1
    }));
  };
  return <Context.Provider value={{
    fanouts,
    replacement,
    setReplacement,
    resize,
    editFanout,
    revision,
    resetDepth,
    resetFanouts,
    resetReplacement
  }}>
    {children}
  </Context.Provider>;
}
export function useApplications() {
  const value = useContext(Context);
  if (!value) throw Error('Wrap section-nine cyclic sampling views in MessagePassingApplicationsProvider.');
  return value;
}
