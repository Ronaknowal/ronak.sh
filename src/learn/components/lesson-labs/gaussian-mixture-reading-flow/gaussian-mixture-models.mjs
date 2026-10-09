import { gaussianDetails } from "./gaussian-geometry-models.mjs";

// A constructed two-source inference state, not a fitted flower model. Keep
// both component IDs at zero weight and normalize one common log-density.
function inferPair(query, weights, means, variances) {
  const gaussians = means.map((mean, index) => gaussianDetails(query, mean, Math.sqrt(variances[index])));
  const weightedLogs = gaussians.map((state, index) => weights[index] === 0 ? -Infinity : Math.log(weights[index]) + state.logDensity);
  const maximum = Math.max(...weightedLogs);
  const denominator = weightedLogs.reduce((sum, value) => sum + Math.exp(value - maximum), 0);
  const logDensity = maximum + Math.log(denominator);
  return {
    query, weights, means, variances,
    components: gaussians.map((state, index) => ({ id: index ? 'Right' : 'Left', ...state,
      weight: weights[index], weightedDensity: weights[index] * state.density,
      logWeightedDensity: weightedLogs[index], share: Math.exp(weightedLogs[index] - logDensity) })),
    density: Math.exp(logDensity), logDensity,
  };
}

export function scalarMixture(query, leftWeight = 0.5, leftVariance = 1) {
  if (![query, leftWeight, leftVariance].every(Number.isFinite) || Math.abs(query) > 10 || leftWeight < 0 || leftWeight > 1 || leftVariance < 0.25 || leftVariance > 4) {
    throw new RangeError('Use a query in [-10,10], Left weight in [0,1], and Left variance in [.25,4]');
  }
  return inferPair(query, [leftWeight, 1 - leftWeight], [-2, 2], [leftVariance, 1]);
}

// D19 is a separately declared overlap example with closer source centres.
// IDs stay attached to each coordinate and its complete allocation row.
export function overlappingAllocationRows() {
  return [-2, -1, 1, 2].map((query, index) => ({ id: 'ABCD'[index], ...inferPair(query, [0.5, 0.5], [-1, 1], [1, 1]) }));
}

// When both conditional densities coincide, the normalized shares are the
// mixing weights. Compute them through the same inferential route anyway.
export function identicalGaussianComparison(query) {
  if (!Number.isFinite(query) || Math.abs(query) > 4) throw new RangeError('Comparison query in [-4,4] required');
  return inferPair(query, [0.2, 0.8], [0, 0], [1, 1]);
}

export function scalarMixtureMoments(leftWeight = 0.5) {
  if (!Number.isFinite(leftWeight) || leftWeight < 0 || leftWeight > 1) throw new RangeError('Left weight in [0,1] required');
  const mean = leftWeight * -2 + (1 - leftWeight) * 2;
  const within = 1;
  const between = leftWeight * (-2 - mean) ** 2 + (1 - leftWeight) * (2 - mean) ** 2;
  return { mean, within, between, variance: within + between };
}
