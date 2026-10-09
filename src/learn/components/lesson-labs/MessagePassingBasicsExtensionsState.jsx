import { createContext, useContext, useState } from 'react';
import { initialIntroGraph, initialGcnGraph, resizeIntro, editEdge, reconcilePairs, captureIntroPin, gcnPairs, gcnTrace } from '../../data/message-basics-extensions-models.js';
const Intro = createContext(null),
  Gcn = createContext(null);
export function MessagePassingBasicsExtensionsProvider({
  children
}) {
  const [intro, setIntro] = useState(initialIntroGraph),
    [gcn, setGcn] = useState(initialGcnGraph),
    [revisions, setRevisions] = useState({});
  const tick = key => setRevisions(old => ({
    ...old,
    [key]: (old[key] ?? 0) + 1
  }));
  const editIntro = (key, value) => setIntro(old => ({
      ...old,
      [key]: value
    })),
    editGcn = (key, value) => setGcn(old => ({
      ...old,
      [key]: value
    }));
  const resetIntro = scope => {
    setIntro(old => {
      const fresh = initialIntroGraph();
      if (scope === 'size') return resizeIntro(old, 3);
      if (scope === 'edge') return {
        ...old,
        a: old.a.map((row, v) => row.map((_, u) => v < 3 && u < 3 ? fresh.a[v][u] : 0)),
        receiver: 0,
        source: 1
      };
      if (scope === 'pairs') return {
        ...old,
        paired: true,
        a: reconcilePairs(old.a)
      };
      if (scope === 'feature') return {
        ...old,
        selected: 0,
        x: old.x.map((_, i) => fresh.x[i] ?? 0)
      };
      if (scope === 'order') return {
        ...old,
        reverse: false
      };
      if (scope === 'loops') return {
        ...old,
        loops: true
      };
      if (scope === 'reach') return {
        ...old,
        rounds: 2
      };
      if (scope === 'rounds') return {
        ...old,
        rounds: 2,
        inPlace: false
      };
      if (scope === 'pin') return {
        ...old,
        pin: null
      };
      return fresh;
    });
    tick(scope);
  };
  const resetGcn = scope => {
    setGcn(old => {
      const f = initialGcnGraph();
      if (scope === 'feature') return {
        ...old,
        x: f.x,
        selected: 0
      };
      if (scope === 'edge') return {
        ...old,
        a: f.a,
        edge: 0
      };
      if (scope === 'loops') return {
        ...old,
        loops: true
      };
      if (scope === 'normalizer') return {
        ...old,
        rule: 'symmetric'
      };
      if (scope === 'bias') return {
        ...old,
        bias: 1
      };
      if (scope === 'supervision') return {
        ...old,
        receiver: 0,
        target: 1,
        weight: .5
      };
      if (scope === 'step') return {
        ...old,
        rate: .1
      };
      return f;
    });
    tick('gcn-' + scope);
  };
  return <Intro.Provider value={{
    s: intro,
    revisions,
    edit: editIntro,
    reset: resetIntro,
    resize: n => {
      setIntro(old => resizeIntro(old, n));
      tick('size');
    },
    editFeature: value => setIntro(old => ({
      ...old,
      x: old.x.map((v, i) => i === old.selected ? value : v)
    })),
    edge: value => setIntro(old => ({
      ...old,
      a: editEdge(old.a, old.source, old.receiver, value, old.paired)
    })),
    paired: value => setIntro(old => ({
      ...old,
      paired: value,
      a: value ? reconcilePairs(old.a) : old.a
    })),
    pin: () => setIntro(old => ({
      ...old,
      pin: captureIntroPin(old)
    }))
  }}>
    <Gcn.Provider value={{
      s: gcn,
      revisions,
      edit: editGcn,
      reset: resetGcn,
      editFeature: value => setGcn(old => ({
        ...old,
        x: old.x.map((v, i) => i === old.selected ? value : v)
      })),
      edge: value => setGcn(old => ({
        ...old,
        a: editEdge(old.a, ...gcnPairs[old.edge], value, true)
      })),
      apply: () => setGcn(old => {
        const t = gcnTrace(old);
        return t.applyAllowed ? {
          ...old,
          weight: t.nextWeight
        } : old;
      })
    }}>
      {children}
    </Gcn.Provider>
  </Intro.Provider>;
}
export function useIntroExtensions() {
  const c = useContext(Intro);
  if (!c) throw Error('Wrap introductory extensions in MessagePassingBasicsExtensionsProvider.');
  return c;
}
export function useGcnExtensions() {
  const c = useContext(Gcn);
  if (!c) throw Error('Wrap GCN extensions in MessagePassingBasicsExtensionsProvider.');
  return c;
}
