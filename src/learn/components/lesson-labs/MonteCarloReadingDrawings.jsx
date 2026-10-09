import * as Estimation from './MonteCarloEstimatorDrawings.jsx';
import * as Hamiltonian from './MonteCarloHamiltonianDrawings.jsx';
import * as Nuts from './MonteCarloNutsDrawings.jsx';
import * as Diagnostics from './MonteCarloDiagnosticDrawings.jsx';
import * as Labs from './MonteCarloReadingLabs.jsx';

const mechanisms = {
  M01: Estimation.TargetAreas, M02: Estimation.InputMapping, M03: Estimation.CovarianceCells,
  M04: Estimation.SpreadComparison, M05: Labs.IndependentReadingLab, M06: Estimation.ErrorRadii,
  M07: Estimation.ReflectionDrawing, M08: Labs.PairedReadingLab, M09: Estimation.ControlDrawing,
  M10: Estimation.TriangleDrawing, M11: Estimation.ImportanceAtoms, M12: Estimation.WeightedAccumulators,
  M13: () => <Estimation.ImportanceAtoms missing />, M14: Estimation.RejectionEnvelope,
  M15: Estimation.ProposalGraph, M16: Estimation.PairFlow, M17: Labs.FlowReadingLab,
  M18: Estimation.TransitionDrawing, M19: Hamiltonian.BetaIngredients, M20: Hamiltonian.ProposalTest,
  M21: Labs.TraceReadingLab, M22: Hamiltonian.WaitOccupancy, M23: Hamiltonian.StartDependence,
  M24: Hamiltonian.PhaseObject, M25: Hamiltonian.ForceDrawing, M26: Hamiltonian.ExactOrbit,
  M27: Hamiltonian.LeapfrogSegments, M28: Labs.OneStepReadingLab, M29: Hamiltonian.ShearCell,
  M30: Hamiltonian.ReversiblePath, M31: Hamiltonian.EnergyAcceptance, M32: Labs.PhaseReadingLab,
  M33: Hamiltonian.MetricGeometry, M34: Hamiltonian.FunnelGeometry, M35: Hamiltonian.TransformStrips,
  M36: Hamiltonian.MissingJacobian, M37: Hamiltonian.ObservedPairs, M38: Hamiltonian.JointPosterior,
  M39: Hamiltonian.JointHamiltonian, M40: Nuts.FirstTurnIllustration, M41: Nuts.SliceEligibility,
  M42: Nuts.DoublingTree, M43: Labs.NutsReadingLab, M44: Nuts.EndpointProjections,
  M45: Nuts.SubtreeExclusion, M46: Nuts.CandidateSelection, M47: Diagnostics.LagBands,
  M48: Labs.CorrelationReadingLab, M49: Diagnostics.ThinningTimeline, M50: Diagnostics.DiagnosticChains,
  M51: Diagnostics.RankMapping, M52: Diagnostics.FoldedSpread, M53: Diagnostics.BatchBlocks,
  M54: Diagnostics.AdaptationWindows, M55: Diagnostics.WarningGeometry,
  M56: Diagnostics.ConditionalAlternation, M57: Diagnostics.MaintainedArrays, M58: Diagnostics.MethodObjects,
};

export default function MonteCarloReadingDrawing({ id }) {
  const Drawing = mechanisms[id];
  if (!Drawing) throw new Error(`Unknown Monte Carlo mechanism ${id}`);
  return <Drawing />;
}
