import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ensembleServingBundle, ensembleServingEvidence, ensembleServingForward, servingFaultBundle, verifyEnsembleServingIdentity } from '../../data/ensemble-serving-flow-models.js';

const Serving = createContext(null);
export function EnsembleServingProvider({ children }) {
  const [query, setQuery] = useState([...ensembleServingEvidence.defaultQuery]);
  const [selected, setSelected] = useState('line'), [feature, setFeature] = useState(0), [fault, setFault] = useState('valid');
  const [revision, setRevision] = useState(0), [identity, setIdentity] = useState(null), [loadError, setLoadError] = useState('');
  useEffect(() => {
    let mounted = true;
    verifyEnsembleServingIdentity().then(value => { if (mounted) setIdentity(value); }).catch(error => { if (mounted) setLoadError(error.message); });
    return () => { mounted = false; };
  }, []);
  const computation = useMemo(() => {
    if (!identity || loadError) return { trace: null, error: loadError };
    try { return { trace: ensembleServingForward(servingFaultBundle(fault), query, selected), error: '' }; }
    catch (error) { return { trace: null, error: error.message }; }
  }, [query, selected, fault, identity, loadError]);
  const reset = () => {
    setQuery([...ensembleServingEvidence.defaultQuery]); setSelected('line'); setFeature(0); setFault('valid'); setRevision(x => x + 1);
  };
  const editFeature = value => setQuery(old => old.map((x,i) => i === feature ? value : x));
  return <Serving.Provider value={{ query, setQuery, selected, setSelected, feature, setFeature, editFeature, fault, setFault, revision,
    reset, identity, pending: !identity && !loadError, ...computation, bundle: ensembleServingBundle }}>{children}</Serving.Provider>;
}
export function useEnsembleServing() {
  const state = useContext(Serving);
  if (!state) throw new Error('Place the saved forward and saved state views together inside EnsembleServingProvider.');
  return state;
}
