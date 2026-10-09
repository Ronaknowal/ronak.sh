import { SourceLaw, Halving, ProductTree, Units, Expectation, Coin, Concavity } from './EntropyProbabilityDrawings.jsx';
import { Prefix, Decoder, CodeLengths, RoundLengths, Blocks, KraftCapacity, KraftGap } from './EntropyCodingDrawings.jsx';
import { CrossPrices, DivergenceLab, MissingSupport, WeightContract, LogBound, SupportProof, CrossCurve, UniformBound, Direction, TriangleFailure, InfiniteTail } from './EntropyDivergenceDrawings.jsx';
import { TargetSelection, Conditional, ORCondition, LikelihoodTraces, Logits, UnderflowPaths, TensorContract, AccuracyCosts, Perplexity, PenguinSplit, PenguinCosts, RealizedPath } from './EntropyPredictionDrawings.jsx';
import { UniformLab, QuantizationLab, DensityKL, EmpiricalContinuous } from './EntropyContinuousDrawings.jsx';
import { ProbabilitySimplex, FeasibleSlice, MaximumCandidate, MovingConstraint, BaseMeasure } from './EntropyMaximumDrawings.jsx';
import './entropy-reading.css';
const drawings = {
  E01: SourceLaw,
  E02: Halving,
  E03: ProductTree,
  E04: Units,
  E05: Expectation,
  E06: Coin,
  E07: Concavity,
  E08: Prefix,
  E09: Decoder,
  E10: CodeLengths,
  E11: RoundLengths,
  E12: Blocks,
  E13: CrossPrices,
  E14: DivergenceLab,
  E15: MissingSupport,
  E16: WeightContract,
  E17: LogBound,
  E18: SupportProof,
  E19: CrossCurve,
  E20: UniformBound,
  E21: KraftCapacity,
  E22: KraftGap,
  E23: Direction,
  E24: TriangleFailure,
  E25: InfiniteTail,
  E26: TargetSelection,
  E27: Conditional,
  E28: ORCondition,
  E29: LikelihoodTraces,
  E30: Logits,
  E31: UnderflowPaths,
  E32: TensorContract,
  E33: AccuracyCosts,
  E34: Perplexity,
  E35: PenguinSplit,
  E36: PenguinCosts,
  E37: RealizedPath,
  E38: UniformLab,
  E39: QuantizationLab,
  E40: DensityKL,
  E41: EmpiricalContinuous,
  E42: ProbabilitySimplex,
  E43: FeasibleSlice,
  E44: MaximumCandidate,
  E45: MovingConstraint,
  E46: BaseMeasure
};
export default function Drawing({
  id
}) {
  const Component = drawings[id];
  if (!Component) throw Error('Unknown entropy drawing ' + id);
  return <Component />;
}
