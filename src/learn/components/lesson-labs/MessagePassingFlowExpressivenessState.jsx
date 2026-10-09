import { createContext, useContext, useState } from 'react';
const Context = createContext(null);
export function MessagePassingExpressivenessProvider({
  children
}) {
  const [lists, setLists] = useState({
      A: [1, 3],
      B: [2, 2]
    }),
    [selected, setSelected] = useState({
      list: 'A',
      occurrence: 0
    }),
    [raw, setRaw] = useState('sum'),
    [lifted, setLifted] = useState(false),
    [revision, setRevision] = useState({
      sizes: 0,
      values: 0,
      route: 0
    }),
    [sageRule, setSageRule] = useState('mean');
  const resize = (name, count) => {
    setLists(old => ({
      ...old,
      [name]: Array.from({
        length: count
      }, (_, i) => old[name][i] ?? 0)
    }));
    setSelected(old => old.list === name ? {
      ...old,
      occurrence: Math.min(old.occurrence, count - 1)
    } : old);
  };
  const chooseList = name => setSelected({
    list: name,
    occurrence: 0
  });
  const edit = value => setLists(old => ({
    ...old,
    [selected.list]: old[selected.list].map((v, i) => i === selected.occurrence ? value : v)
  }));
  const copyReverse = () => {
    setLists(old => ({
      ...old,
      B: [...old.A].reverse()
    }));
    setSelected(old => old.list === 'B' ? {
      ...old,
      occurrence: 0
    } : old);
    setRevision(old => ({
      ...old,
      values: old.values + 1,
      sizes: old.sizes + 1
    }));
  };
  const resetSizes = () => {
    setLists(old => Object.fromEntries(['A', 'B'].map(name => [name, Array.from({
      length: 2
    }, (_, i) => old[name][i] ?? 0)])));
    setSelected(old => ({
      ...old,
      occurrence: Math.min(old.occurrence, 1)
    }));
    setRevision(old => ({
      ...old,
      sizes: old.sizes + 1
    }));
  };
  const resetValues = () => {
    setLists(old => ({
      A: old.A.map((_, i) => [1, 3][i] ?? 0),
      B: old.B.map((_, i) => [2, 2][i] ?? 0)
    }));
    setSelected({
      list: 'A',
      occurrence: 0
    });
    setRevision(old => ({
      ...old,
      values: old.values + 1
    }));
  };
  const resetRoute = () => {
    setRaw('sum');
    setLifted(false);
    setRevision(old => ({
      ...old,
      route: old.route + 1
    }));
  };
  const resetLists = () => {
    setLists({
      A: [1, 3],
      B: [2, 2]
    });
    setSelected({
      list: 'A',
      occurrence: 0
    });
    setRevision(old => ({
      ...old,
      sizes: old.sizes + 1,
      values: old.values + 1
    }));
  };
  return <Context.Provider value={{
    lists,
    selected,
    setSelected,
    chooseList,
    resize,
    edit,
    copyReverse,
    raw,
    setRaw,
    lifted,
    setLifted,
    revision,
    resetSizes,
    resetValues,
    resetRoute,
    resetLists,
    sageRule,
    setSageRule
  }}>
    {children}
  </Context.Provider>;
}
export function useExpressiveness() {
  const value = useContext(Context);
  if (!value) throw Error('Wrap section-eight paired-multiset views in MessagePassingExpressivenessProvider.');
  return value;
}
