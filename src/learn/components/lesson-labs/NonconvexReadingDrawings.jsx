import { Candidate, EqualWells, TiltedWells, ThreeRoots, ScalarStep, Existence, SolverSuccess, ThreeGeometries, HessianColumns, TaylorChange, EigenRestrictions, UniformBound, DegenerateGeometry, Boundary } from './NonconvexFoundations.jsx';
import { SaddleStep, Multipliers, SampleGradients, NoiseWeights, NoiseDistribution, PerturbationBand } from './NonconvexDynamics.jsx';
import { FactorWiring, Hyperbola, FactorHessian, FiniteTangent, NetworkAnatomy, NetworkPermutation, BiasScaling, ParameterPenalty, CoordinateGrid, ObservedMeasurements, RegressionMoments, MeasuredFactors } from './NonconvexRepresentations.jsx';
import { PositiveConnection, OppositeConnection, SliceDomain, HiddenDescent, ProjectedHessian, TrainingFunctions, TrainingLosses, InactiveSignal, InactiveRegion, AutogradMeaning, AppliedUpdate } from './NonconvexTransfer.jsx';
import { WellLab, GeometryLab, SaddleLab, NoiseLab, FactorLab, NetworkLab, PathLab, GeneralizationLab, InactiveLab } from './NonconvexInvestigations.jsx';
import './nonconvex-reading.css';
const drawings = {
  'N01': Candidate,
  'N02': EqualWells,
  'N03': TiltedWells,
  'N04': ThreeRoots,
  'N05': ScalarStep,
  'N06': WellLab,
  'N07': Existence,
  'N08': SolverSuccess,
  'N09': ThreeGeometries,
  'N10': HessianColumns,
  'N11': TaylorChange,
  'N12': EigenRestrictions,
  'N13': UniformBound,
  'N14': DegenerateGeometry,
  'N15': GeometryLab,
  'N16': Boundary,
  'N17': SaddleStep,
  'N18': Multipliers,
  'N19': SaddleLab,
  'N20': SampleGradients,
  'N21': NoiseLab,
  'N22': NoiseWeights,
  'N23': NoiseDistribution,
  'N24': PerturbationBand,
  'N25': FactorWiring,
  'N26': Hyperbola,
  'N27': FactorHessian,
  'N28': FiniteTangent,
  'N29': FactorLab,
  'N30': NetworkAnatomy,
  'N31': NetworkPermutation,
  'N32': BiasScaling,
  'N33': NetworkLab,
  'N34': ParameterPenalty,
  'N35': CoordinateGrid,
  'N36': ObservedMeasurements,
  'N37': RegressionMoments,
  'N38': MeasuredFactors,
  'N39': PositiveConnection,
  'N40': OppositeConnection,
  'N41': PathLab,
  'N42': SliceDomain,
  'N43': HiddenDescent,
  'N44': ProjectedHessian,
  'N45': TrainingFunctions,
  'N46': TrainingLosses,
  'N47': GeneralizationLab,
  'N48': InactiveSignal,
  'N49': InactiveRegion,
  'N50': InactiveLab,
  'N51': AutogradMeaning,
  'N52': AppliedUpdate
};
export default function Drawing({
  id
}) {
  const Component = drawings[id];
  if (!Component) throw new Error('Unknown Nonconvex mechanism ' + id);
  return <Component />;
}
