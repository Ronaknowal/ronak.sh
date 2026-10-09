// Reuse the established positive-term normal integral; no hidden fitting.
import { normalCdf } from "../../../data/perceptron-models.js";

const finite = values => values.every(value => typeof value === 'number' && Number.isFinite(value));
export function gaussianDetails(query, mean = 0, standardDeviation = 1) {
  if (!finite([query, mean, standardDeviation]) || standardDeviation <= 0) throw new RangeError('Finite coordinates and positive standard deviation required');
  const displacement = query - mean;
  const standardized = displacement / standardDeviation;
  const variance = standardDeviation ** 2;
  if (!Number.isFinite(variance) || variance === 0) throw new RangeError('Variance exceeds the represented range');
  const logDensity = -0.5 * Math.log(2 * Math.PI) - Math.log(standardDeviation) - 0.5 * standardized ** 2;
  if (!Number.isFinite(logDensity)) throw new RangeError('Log density exceeds the represented range');
  return { query, mean, standardDeviation, displacement, standardized, variance, logDensity, density: Math.exp(logDensity) };
}

// D05's bounded endpoints are [-3,3]. The shared series evaluates the CDF,
// rather than estimating area from the displayed polygon's sampled knots.
export function normalInterval(lower, upper) {
  if (!finite([lower, upper]) || lower > upper || lower < -3 || upper > 3) throw new RangeError('Ordered endpoints in [-3,3] required');
  return lower === upper ? 0 : normalCdf(upper) - normalCdf(lower);
}

export function gaussianUnitComparison(factor) {
  if (![1, 10].includes(factor)) throw new RangeError('Use the taught centimetre or millimetre conversion');
  const point = gaussianDetails(factor, 0, factor);
  return { ...point, factor, lower: -factor, upper: factor, probability: normalInterval(-1, 1), unit: factor === 1 ? 'cm' : 'mm' };
}

export function residualOuterProduct(x, y) {
  if (!finite([x, y]) || Math.abs(x) > 3 || Math.abs(y) > 3) throw new RangeError('Residual coordinates in [-3,3] required');
  return [[x * x, x * y], [y * x, y * y]];
}

export function correlatedGaussian(queryX, queryY, correlation = 0.75) {
  if (!finite([queryX, queryY, correlation]) || Math.abs(correlation) >= 1) throw new RangeError('Finite query and nonsingular correlation required');
  const determinant = 1 - correlation ** 2;
  const projectionPlus = (queryX + queryY) / Math.SQRT2;
  const projectionMinus = (queryX - queryY) / Math.SQRT2;
  const contributions = [projectionPlus ** 2 / (1 + correlation), projectionMinus ** 2 / (1 - correlation)];
  const squaredDistance = contributions[0] + contributions[1];
  const logDensity = -Math.log(2 * Math.PI) - 0.5 * Math.log(determinant) - 0.5 * squaredDistance;
  if (!Number.isFinite(logDensity)) throw new RangeError('Log density exceeds the represented range');
  return { correlation, covariance: [[1, correlation], [correlation, 1]], determinant, projections: [projectionPlus, projectionMinus], contributions, squaredDistance, logDensity, density: Math.exp(logDensity) };
}

export function ellipseCoordinates(correlation, samples = 128) {
  if (!Number.isFinite(correlation) || Math.abs(correlation) >= 1 || !Number.isInteger(samples) || samples < 16 || samples > 512) throw new RangeError('Nonsingular correlation and bounded sampling required');
  const major = Math.sqrt(1 + correlation), minor = Math.sqrt(1 - correlation);
  return Array.from({ length: samples + 1 }, (_, index) => {
    const angle = 2 * Math.PI * index / samples;
    const alongPlus = major * Math.cos(angle), alongMinus = minor * Math.sin(angle);
    return [(alongPlus + alongMinus) / Math.SQRT2, (alongPlus - alongMinus) / Math.SQRT2];
  });
}
