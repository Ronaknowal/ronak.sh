import { createContext, useContext, useState } from 'react';
import observations from '../../data/svm-reading-flow-observations.js';
import { svmPairFixture, nystrom } from '../../data/svm-reading-flow-models.js';
import { ScoreCircuit, Geometry, Foot, SupportMotion, Stability, Shortfalls, Losses, ObjectiveAssembly, SoftPair, HingeUpdate, CertificateBracket, Elimination, Kkt, DuplicateExpansion } from './SvmReadingFlowGeometry.jsx';
import { XorLift, GramAssembly, SpectralWitness, RbfLength, KernelPrediction, PairInvestigation, MaintainedGradient, SavedSolver } from './SvmReadingFlowKernels.jsx';
import { DataRoles, MoonsSelection, WineStudy, CalibrationFolds, WeightsAndPairs, RectangularState, Tube, UnitConversion, EpsilonPullback } from './SvmReadingFlowEvidence.jsx';
import { SequenceWindows, StorageRoutes, FourierFeatures, NystromFeatures } from './SvmReadingFlowFeatures.jsx';
import './svm-reading-flow.css';

const State = createContext(null);
const featureDefault = () => {
  const recorded = observations['kernel-feature-mechanisms'];
  return { training: structuredClone(recorded.inputs.x), queries: structuredClone(recorded.inputs.queries), indices: [...recorded.nystrom.indices], gamma: .45, cutoff: 1e-12 };
};
export function SvmReadingFlowProvider({ children }) {
  const [geometry, setGeometry] = useState({ angle: 0, offset: 0, scale: 1 });
  const [fit, setFit] = useState({ kind: 'rbf', c: 1, gamma: .5 }), [query, setQuery] = useState([.5, .5]), [fitRevision, setFitRevision] = useState(0);
  const [pairModel, setPairModel] = useState(() => svmPairFixture()), [pair, setPair] = useState([0, 1]), [commits, setCommits] = useState(0), [pairRevision, setPairRevision] = useState(0);
  const [tube, setTube] = useState({ amplitude: 2, epsilon: .5, c: .5 }), [tubeRevision, setTubeRevision] = useState(0);
  const [features, setFeatureState] = useState(featureDefault), [featureRevision, setFeatureRevision] = useState(0);
  // Both views share one transaction: validate spectral arithmetic before any
  // editor commits, so a numerical limit cannot replace the whole reader.
  const setFeatures = next => { nystrom(next.training, next.indices, next.gamma, next.cutoff, next.queries); setFeatureState(next); };
  const resetFit = () => { setFit({ kind: 'rbf', c: 1, gamma: .5 }); setQuery([.5, .5]); setFitRevision(r => r + 1); };
  const resetPair = () => { setPairModel(svmPairFixture()); setPair([0, 1]); setCommits(0); setPairRevision(r => r + 1); };
  const resetTube = () => { setTube({ amplitude: 2, epsilon: .5, c: .5 }); setTubeRevision(r => r + 1); };
  const resetFeatures = () => { setFeatures(featureDefault()); setFeatureRevision(r => r + 1); };
  return <State.Provider value={{ geometry, setGeometry, fit, setFit, query, setQuery, fitRevision, resetFit, pairModel, setPairModel, pair, setPair, commits, setCommits, pairRevision, resetPair, tube, setTube, tubeRevision, resetTube, features, setFeatures, featureRevision, resetFeatures }}>{children}</State.Provider>;
}
const jobs = {
  D01: () => <ScoreCircuit/>,
  D02: s => <Geometry state={s.geometry} setState={s.setGeometry}/>,
  D03: () => <Foot/>, D04: () => <Foot scaling/>,
  D05: s => <Geometry state={s.geometry} setState={s.setGeometry} canonical/>,
  D06: () => <SupportMotion/>, D07: () => <Stability/>, D08: () => <Shortfalls/>, D09: () => <Losses/>, D10: () => <ObjectiveAssembly/>, D11: () => <SoftPair/>, D12: () => <HingeUpdate/>, D13: () => <CertificateBracket/>, D14: () => <Elimination/>, D15: () => <Kkt/>, D16: () => <DuplicateExpansion/>,
  D17: () => <XorLift/>, D18: () => <GramAssembly/>, D19: () => <SpectralWitness/>,
  D20: s => <KernelPrediction fit={s.fit} setFit={s.setFit} query={s.query} setQuery={s.setQuery} revision={s.fitRevision} reset={s.resetFit}/>,
  D21: s => <RbfLength fit={s.fit} setFit={s.setFit}/>,
  D22: s => <PairInvestigation model={s.pairModel} setModel={s.setPairModel} pair={s.pair} setPair={s.setPair} commits={s.commits} setCommits={s.setCommits} revision={s.pairRevision} reset={s.resetPair}/>,
  D23: s => <PairInvestigation model={s.pairModel} setModel={s.setPairModel} pair={s.pair} setPair={s.setPair} commits={s.commits} setCommits={s.setCommits} revision={s.pairRevision} reset={s.resetPair} gainOnly/>,
  D24: () => <MaintainedGradient/>, D25: () => <SavedSolver/>, D26: () => <DataRoles/>, D27: () => <MoonsSelection/>, D28: () => <WineStudy/>, D29: () => <CalibrationFolds/>, D30: () => <WeightsAndPairs/>, D31: () => <RectangularState/>,
  D32: s => <Tube state={s.tube} setState={s.setTube} revision={s.tubeRevision} reset={s.resetTube}/>,
  D33: () => <EpsilonPullback/>, D34: s => <UnitConversion state={s.tube}/>, D35: () => <SequenceWindows/>, D36: () => <StorageRoutes/>,
  D37: s => <FourierFeatures state={s.features} setState={s.setFeatures} revision={s.featureRevision} reset={s.resetFeatures}/>,
  D38: s => <NystromFeatures state={s.features} setState={s.setFeatures} revision={s.featureRevision} reset={s.resetFeatures}/>,
};
export function SvmReadingFlowFigure({ job }) {
  const state = useContext(State), render = jobs[job];
  if (!state || !render) throw new Error(`Missing SVM reading-flow state or drawing ${job}`);
  return <div data-svm-drawing={job}>{render(state)}</div>;
}
