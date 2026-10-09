import * as balance from './OrdinaryDifferentialEquationsBalanceDrawings.jsx';
import * as scalar from './OrdinaryDifferentialEquationsScalarDrawings.jsx';
import * as motion from './OrdinaryDifferentialEquationsMotionDrawings.jsx';
import * as linear from './OrdinaryDifferentialEquationsLinearDrawings.jsx';
import * as stability from './OrdinaryDifferentialEquationsStabilityDrawings.jsx';
import * as forcing from './OrdinaryDifferentialEquationsForcingDrawings.jsx';
import * as ordered from './OrdinaryDifferentialEquationsOrderedDrawings.jsx';
import * as numerical from './OrdinaryDifferentialEquationsNumericalDrawings.jsx';
import * as solver from './OrdinaryDifferentialEquationsSolverDrawings.jsx';
import * as boundary from './OrdinaryDifferentialEquationsBoundaryDrawings.jsx';

export const odeMechanisms = {
  E01: balance.BalanceObject, E02: balance.RateAndMinute, E03: balance.WholeHistory,
  E04: balance.AccumulatedRate, E05: balance.ThermalBalanceLab, E06: balance.LocalDirection,
  E07: balance.LogisticPhaseLine, E08: balance.InitialCurveLab, E09: balance.UniqueTrajectories,
  E10: scalar.LocalTheoremRectangle, E11: scalar.LipschitzSeparations, E12: scalar.WaitingDepartureLab,
  E13: scalar.PicardFunctions, E14: scalar.PerturbationEnvelope, E15: scalar.FiniteLifetimeLab,
  E16: scalar.UndefinedInitialTime, E17: scalar.PreserveConstantBranches, E18: scalar.SeparatedCoordinate,
  E19: scalar.ProductRuleStrips, E20: scalar.WeightedScalarInput, E21: scalar.AffineSolutionFamily,
  E22: scalar.ReciprocalSubstitution, E23: scalar.ExactPotentialCurve,
  E24: motion.CompleteMotionState, E25: motion.DampingRoots, E26: motion.DampedMotionLab,
  E27: motion.EnergyExchange, E28: motion.HigherOrderState,
  E29: linear.CouplingAtAState, E30: linear.EvolveIndependentColumns, E31: linear.MatrixPowerPaths,
  E32: linear.SingularGeneratorFlow, E33: linear.BasisEvolutionLab, E34: linear.RepeatedModeCoupling,
  E35: linear.ScalingAndSquaring,
  E36: stability.StabilityPortraits, E37: stability.HiddenGrowingMode, E38: stability.StableTransientShape,
  E39: stability.TransientGainLab, E40: stability.ConservedAmount,
  E41: forcing.PropagatedInputTimeline, E42: forcing.SeparateInputIntervals, E43: forcing.ResonantAccumulation,
  E44: forcing.PulseTimingLab, E45: forcing.AugmentedHeldInput, E46: forcing.HeldAccelerationAreas,
  E47: ordered.TwoTimeBasis, E48: ordered.SwappedShearPaths, E49: ordered.OrderedShearLab,
  E50: ordered.CommutingVariableShear,
  E51: numerical.OrdinarySeriesChains, E52: numerical.EulerRateRectangle, E53: numerical.MidpointRateProbe,
  E54: numerical.NumericalStageLab, E55: numerical.PropagatedNumericalDefects,
  E56: numerical.CommonHorizonSteps, E57: numerical.NumericalRefinementLab,
  E58: solver.ScaledErrorComponents, E59: solver.AdaptiveTrialLab, E60: solver.AcceptedMeshAndQueries,
  E61: solver.StiffDifferenceLab, E62: solver.MissedEventBrackets, E63: solver.SolverStatusLocations,
  E64: boundary.BoundarySelectsSlope, E65: boundary.ResonantBoundaryCollapse,
  E66: boundary.BoundaryFamilyLab, E67: boundary.CheckCandidateObligations,
  E68: boundary.StructuralMethodObjects,
};

export function OdeMechanism({ id }) {
  const Drawing = odeMechanisms[id];
  if (!Drawing) throw new RangeError(`Unknown ODE mechanism ${id}.`);
  return <Drawing />;
}
