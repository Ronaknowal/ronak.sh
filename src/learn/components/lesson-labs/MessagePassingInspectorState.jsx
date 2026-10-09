import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import useLessonViewport from './useLessonViewport.js';
import { FlowControls } from './LessonFlow.jsx';
import { inferGraph } from '../../data/message-passing-models.js';
import { validateSavedGraphModel } from '../../data/message-study-flow-models.js';
import { initialInspectorInputs, updateInspectorInputs, inspectorForwardPair, inspectorReceiverTrace, inspectorLabelTrace,
  inspectorInputSummary, inspectorAdjacency, inspectorFeatures, pinInspectorSnapshot } from '../../data/message-inspector-flow-models.js';

const InspectorContext = createContext(null);
const asset = '/learn-assets/message-passing-graph-convolutions-gcn-gat-graphsage/';

function useCurrentSavedModel(family) {
  const [anchor, ready] = useLessonViewport(), [attempt, setAttempt] = useState(0), [loaded, setLoaded] = useState(null);
  const url = `${asset}${family}-11.json`;
  useEffect(() => {
    if (!ready) return undefined;
    const controller = new AbortController();
    setLoaded({ url, status: 'loading', data: null });
    fetch(url, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Saved parameters are unavailable.');
      return response.json();
    }).then(value => {
      const data = validateSavedGraphModel(value, family);
      if (!controller.signal.aborted) setLoaded({ url, status: 'ready', data });
    }).catch(() => { if (!controller.signal.aborted) setLoaded({ url, status: 'error', data: null }); });
    return () => controller.abort();
  }, [url, family, ready, attempt]);
  const current = loaded?.url === url ? loaded : null;
  return { anchor, ready, url, status: current?.status ?? (ready ? 'loading' : 'deferred'), data: current?.status === 'ready' ? current.data : null,
    retry: () => setAttempt(value => value + 1) };
}

export function MessagePassingInspectorProvider({ children }) {
  // Learner inputs and pin live outside all request-dependent children.
  const [family, setFamily] = useState('gcn'), [inputs, dispatch] = useReducer(updateInspectorInputs, undefined, initialInspectorInputs);
  const [pinned, setPinned] = useState(null), resource = useCurrentSavedModel(family), model = resource.data;
  const forwards = useMemo(() => model ? inspectorForwardPair(inputs.features, inputs.adjacency, model) : null,
    [model, inputs.features, inputs.adjacency]);
  const trace = useMemo(() => model && forwards ? inspectorReceiverTrace(inputs, model, forwards) : null,
    [model, forwards, inputs.features, inputs.adjacency, inputs.receiver, inputs.hiddenChannel, inputs.reversed]);
  const summary = useMemo(() => inspectorInputSummary(inputs), [inputs.features, inputs.adjacency]);
  const originalGraphResult = useMemo(() => model ? summary.removedEdges.length
    ? inferGraph(inputs.features, inspectorAdjacency, model) : forwards.canonical : null,
    [model, forwards, inputs.features, summary.removedEdges.length]);
  const originalFeaturesResult = useMemo(() => model ? inferGraph(inspectorFeatures, inputs.adjacency, model) : null,
    [model, inputs.adjacency]);
  const labels = useMemo(() => inspectorLabelTrace(inputs.adjacency), [inputs.adjacency]);
  const resetAll = () => { dispatch({ type: 'reset-all' }); setPinned(null); };
  const pin = () => { if (model && trace) setPinned(pinInspectorSnapshot(family, model, inputs, trace)); };
  return <InspectorContext.Provider value={{ family, setFamily, inputs, dispatch, pinned, setPinned, resetAll, pin,
    resource, model, forwards, trace, summary, originalGraphResult, originalFeaturesResult, labels }}>{children}</InspectorContext.Provider>;
}

export function useSavedGraphInspector() {
  const value = useContext(InspectorContext);
  if (!value) throw new Error('Use MessagePassingInspectorProvider for connected saved-state investigations.');
  return value;
}

export function InspectorResourceStatus({ primary = false }) {
  const { resource, family } = useSavedGraphInspector();
  if (resource.status === 'error' && primary) return <><p role="alert">Saved {family.toUpperCase()} seed-11 parameters could not be loaded. Your inputs and pin are retained.</p><FlowControls><button type="button" onClick={resource.retry}>Retry current saved model</button></FlowControls></>;
  const text = resource.status === 'error' ? 'Current saved parameters are unavailable; no previous family’s result is shown.'
    : resource.status === 'deferred' ? 'Saved parameters load when this explanation approaches.'
      : `Loading ${family.toUpperCase()} seed-11 parameters; current inputs are retained.`;
  return <p {...(primary ? { role: 'status' } : {})}>{text}</p>;
}
