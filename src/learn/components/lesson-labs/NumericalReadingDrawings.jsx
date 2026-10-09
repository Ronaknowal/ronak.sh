import { PumpSlope, PumpArea, AccuracyObjects, ErrorOperations, ResidualScaling, BracketPremise, BracketReplacements, BracketWidths, BracketFailures, FirstNewton, ReevaluateNewton, NewtonCycle, RepeatedRoot, Safeguard, Secant } from './NumericalRootDrawings.jsx';
import { CentralStencil, TaylorCancellation, SecondDifference, BoundaryStencil, StencilMoments, ErrorBalance, StoredValues, CoordinateCollapse, DirectionalDifference } from './NumericalDifferenceDrawings.jsx';
import { TrapezoidGeometry, SharedTrapezoidWeight, SimpsonBasis, CompositeSimpsonWeights, UnequalSamples, DischargeSamples, SampleAccess, RichardsonCancellation, SimpsonRefinement, AdaptiveSplit, BlindPolynomial, EndpointSubstitution, GaussianMoments, GaussianMapping, GaussianBoundary } from './NumericalQuadratureDrawings.jsx';
import { PumpBound, IntervalDecisions, InverseSensitivity, WeakDirection, EulerDefect, EulerHorizon, DerivativeGraph } from './NumericalTransferDrawings.jsx';
import { BracketLab, NewtonLab, DifferenceLab, QuadratureLab, AdaptiveLab, CalibrationLab, NestedSearchLab } from './NumericalLiveInvestigations.jsx';
import './numerical-reading.css';
const drawings = {
  'NM01': PumpSlope,
  'NM02': PumpArea,
  'NM03': AccuracyObjects,
  'NM04': ErrorOperations,
  'NM05': ResidualScaling,
  'NM06': BracketPremise,
  'NM07': BracketReplacements,
  'NM08': BracketWidths,
  'NM09': BracketFailures,
  'NM10': BracketLab,
  'NM11': FirstNewton,
  'NM12': ReevaluateNewton,
  'NM13': NewtonCycle,
  'NM14': RepeatedRoot,
  'NM15': Safeguard,
  'NM16': Secant,
  'NM17': NewtonLab,
  'NM18': CentralStencil,
  'NM19': TaylorCancellation,
  'NM20': SecondDifference,
  'NM21': BoundaryStencil,
  'NM22': StencilMoments,
  'NM23': ErrorBalance,
  'NM24': StoredValues,
  'NM25': CoordinateCollapse,
  'NM26': DifferenceLab,
  'NM27': DirectionalDifference,
  'NM28': TrapezoidGeometry,
  'NM29': SharedTrapezoidWeight,
  'NM30': SimpsonBasis,
  'NM31': CompositeSimpsonWeights,
  'NM32': QuadratureLab,
  'NM33': UnequalSamples,
  'NM34': DischargeSamples,
  'NM35': SampleAccess,
  'NM36': RichardsonCancellation,
  'NM37': SimpsonRefinement,
  'NM38': AdaptiveSplit,
  'NM39': AdaptiveLab,
  'NM40': BlindPolynomial,
  'NM41': EndpointSubstitution,
  'NM42': GaussianMoments,
  'NM43': GaussianMapping,
  'NM44': GaussianBoundary,
  'NM45': PumpBound,
  'NM46': IntervalDecisions,
  'NM47': InverseSensitivity,
  'NM48': CalibrationLab,
  'NM49': NestedSearchLab,
  'NM50': WeakDirection,
  'NM51': EulerDefect,
  'NM52': EulerHorizon,
  'NM53': DerivativeGraph
};
export default function Drawing({
  id
}) {
  const Component = drawings[id];
  if (!Component) throw new Error('Unknown Numerical mechanism ' + id);
  return <Component />;
}
