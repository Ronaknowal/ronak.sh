import { createContext, useContext, useState } from 'react';
import { propagationFixture, propagationTrace } from '../../data/message-propagation-flow-models.js';
const Context = createContext(null);
export function MessagePassingPropagationProvider({
  children
}) {
  const [graph, setGraph] = useState(() => ({
    ...propagationFixture(),
    fixture: 'path'
  }));
  const [node, setNode] = useState(0),
    [left, setLeft] = useState(0),
    [right, setRight] = useState(1);
  const [round, setRound] = useState(4),
    [modeRound, setModeRound] = useState(2),
    [mode, setMode] = useState(1),
    [coordinate, setCoordinate] = useState('raw');
  const [revision, setRevision] = useState({
    features: 0,
    edges: 0,
    rounds: 0,
    modes: 0
  });
  const [epsilon, setEpsilon] = useState(.001),
    [routeRevision, setRouteRevision] = useState(0);
  const choose = fixture => {
    setGraph({
      ...propagationFixture(fixture),
      fixture
    });
    setNode(0);
    setLeft(0);
    setRight(1);
    setRound(4);
    setModeRound(2);
    setMode(1);
    setCoordinate('raw');
    setRevision(old => Object.fromEntries(Object.entries(old).map(([key, value]) => [key, value + 1])));
  };
  const editFeature = value => setGraph(old => ({
    ...old,
    features: old.features.map((entry, i) => i === node ? value : entry)
  }));
  const editEdge = value => setGraph(old => ({
    ...old,
    adjacency: old.adjacency.map((row, i) => row.map((entry, j) => i === left && j === right || i === right && j === left ? value : entry))
  }));
  const selectLeft = value => {
    setLeft(value);
    if (value === right) setRight((value + 1) % graph.features.length);
  };
  const resetFeatures = () => {
    setGraph(old => ({
      ...old,
      features: propagationFixture(old.fixture).features
    }));
    setRevision(old => ({
      ...old,
      features: old.features + 1
    }));
  };
  const resetEdges = () => {
    setGraph(old => ({
      ...old,
      adjacency: propagationFixture(old.fixture).adjacency
    }));
    setRevision(old => ({
      ...old,
      edges: old.edges + 1
    }));
  };
  const resetRounds = () => {
    setRound(4);
    setGraph(old => ({
      ...old,
      loops: propagationFixture(old.fixture).loops
    }));
    setRevision(old => ({
      ...old,
      rounds: old.rounds + 1
    }));
  };
  const resetModes = () => {
    setModeRound(2);
    setMode(1);
    setRevision(old => ({
      ...old,
      modes: old.modes + 1
    }));
  };
  const trace = propagationTrace(graph.adjacency, graph.features, graph.loops, 40);
  return <Context.Provider value={{
    graph,
    trace,
    node,
    setNode,
    left,
    selectLeft,
    right,
    setRight,
    round,
    setRound,
    modeRound,
    setModeRound,
    mode,
    setMode,
    coordinate,
    setCoordinate,
    revision,
    choose,
    editFeature,
    editEdge,
    resetFeatures,
    resetEdges,
    resetRounds,
    resetModes,
    setLoops: loops => setGraph(old => ({
      ...old,
      loops
    })),
    epsilon,
    setEpsilon,
    routeRevision,
    resetRoute: () => {
      setEpsilon(.001);
      setRouteRevision(value => value + 1);
    }
  }}>
    {children}
  </Context.Provider>;
}
export function usePropagation() {
  const context = useContext(Context);
  if (!context) throw Error('Wrap section-seven views in MessagePassingPropagationProvider.');
  return context;
}
