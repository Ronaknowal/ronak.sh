import { gaussianDetails } from "./gaussian-geometry-models.mjs";
import { overlappingAllocationRows } from "./gaussian-mixture-models.mjs";

const finite = value => typeof value === 'number' && Number.isFinite(value);
const sum = values => values.reduce((total, value) => total + value, 0);
const copy = value => structuredClone(value);
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export function defaultEmObservations() {
  return overlappingAllocationRows().map(row => ({ id: row.id, x: row.query }));
}

export function defaultEmParameters() {
  return { ids: ['Left', 'Right'], weights: [0.5, 0.5], means: [-1, 1], variances: [1, 1] };
}

function validateState(observations, parameters) {
  if (!Array.isArray(observations) || !observations.length || observations.length > 12 ||
      observations.some(row => typeof row.id !== 'string' || !finite(row.x)) ||
      new Set(observations.map(row => row.id)).size !== observations.length) {
    throw new RangeError('Use at most twelve finite observations with distinct IDs.');
  }
  const { ids, weights, means, variances } = parameters;
  if (!Array.isArray(ids) || ids.length !== 2 || ids.some(id => typeof id !== 'string') || new Set(ids).size !== 2 ||
      [weights, means, variances].some(values => !Array.isArray(values) || values.length !== 2 || !values.every(finite)) ||
      weights.some(value => value <= 0) || Math.abs(sum(weights) - 1) > 1e-12 || variances.some(value => value <= 0)) {
    throw new RangeError('Two identified components need positive variances and positive normalized weights.');
  }
}

// Log-sum-exp inside each observation, then a separate sum across observed IDs.
// Reuse the existing Gaussian density kernel without importing scientific code.
export function emExpectation(observations, parameters) {
  validateState(observations, parameters);
  const rows = observations.map(({ id, x }) => {
    const components = parameters.ids.map((componentId, index) => {
      const gaussian = gaussianDetails(x, parameters.means[index], Math.sqrt(parameters.variances[index]));
      const logWeightedDensity = Math.log(parameters.weights[index]) + gaussian.logDensity;
      return { id: componentId, weightedDensity: parameters.weights[index] * gaussian.density, logWeightedDensity };
    });
    const maximum = Math.max(...components.map(component => component.logWeightedDensity));
    const shifted = components.map(component => Math.exp(component.logWeightedDensity - maximum));
    const denominator = sum(shifted);
    const logDensity = maximum + Math.log(denominator);
    if (!finite(logDensity)) throw new RangeError(`Observation ${id} has an unrepresentable log density.`);
    return { id, x, density: Math.exp(logDensity), logDensity,
      components: components.map((component, index) => ({ ...component, share: shifted[index] / denominator })) };
  });
  const totalLogLikelihood = sum(rows.map(row => row.logDensity));
  const likelihood = rows.reduce((product, row) => product * row.density, 1);
  if (!finite(totalLogLikelihood)) throw new RangeError('The total log likelihood exceeds the represented range.');
  return { rows, totalLogLikelihood, meanLogLikelihood: totalLogLikelihood / rows.length, likelihood };
}

// Centered residual sums: no Nk-1 denominator, hidden floor, or raw-moment subtraction.
export function fractionalScalarUpdate(observations, allocationRows) {
  if (!Array.isArray(observations) || !Array.isArray(allocationRows) || !observations.length || observations.some(row => !finite(row.x)) || allocationRows.length !== observations.length || observations.some((row, index) =>
    row.id !== allocationRows[index].id || row.x !== allocationRows[index].x)) {
    throw new RangeError('Every allocation must keep its observed ID and coordinate.');
  }
  if (allocationRows.some(row => row.components.length !== 2 || row.components.some(component => !finite(component.share) || component.share < 0) ||
      Math.abs(sum(row.components.map(component => component.share)) - 1) > 1e-12)) {
    throw new RangeError('Use two normalized nonnegative shares per observation.');
  }
  const componentIds = allocationRows[0].components.map(component => component.id);
  if (componentIds.some(id => typeof id !== 'string') || new Set(componentIds).size !== 2 || allocationRows.some(row => row.components.some((component, index) => component.id !== componentIds[index]))) {
    throw new RangeError('Allocation columns must preserve two distinct component IDs in the same order.');
  }
  const components = [0, 1].map(index => {
    const count = sum(allocationRows.map(row => row.components[index].share));
    const numerator = sum(allocationRows.map(row => row.components[index].share * row.x));
    if (count === 0) return { id: allocationRows[0].components[index].id, count, weight: 0, numerator, mean: null, variance: null, rows: [], identified: false };
    const origin = observations[0].x;
    const mean = origin + sum(allocationRows.map(row => row.components[index].share * (row.x - origin))) / count;
    const rows = allocationRows.map(row => {
      const share = row.components[index].share, residual = row.x - mean;
      return { id: row.id, x: row.x, share, signedProduct: share * row.x, residual, square: residual * residual, weightedSquare: share * residual * residual };
    });
    const scatter = sum(rows.map(row => row.weightedSquare)), variance = scatter / count;
    if (![count, numerator, mean, scatter, variance].every(finite)) throw new RangeError('Weighted moments exceed the represented range.');
    return { id: allocationRows[0].components[index].id, count, weight: count / observations.length, numerator, mean, scatter, variance,
      standardDeviation: Math.sqrt(variance), rows, identified: true };
  });
  return { components, parameters: { ids: components.map(component => component.id), weights: components.map(component => component.weight),
    means: components.map(component => component.mean), variances: components.map(component => component.variance) } };
}

export function weightedPointScatter(points, shares) {
  if (!points.length || points.length !== shares.length || points.some(point => point.length !== 2 || !point.every(finite)) || shares.some(value => !finite(value) || value < 0)) {
    throw new RangeError('Finite paired points and matching nonnegative shares are required.');
  }
  const count = sum(shares);
  if (count === 0) return { count, identified: false, mean: null, covariance: null, contributions: [] };
  const mean = [0, 1].map(coordinate => points[0][coordinate] + sum(points.map((point, index) => shares[index] * (point[coordinate] - points[0][coordinate]))) / count);
  const contributions = points.map((point, index) => {
    const residual = point.map((value, coordinate) => value - mean[coordinate]);
    const outer = residual.map(left => residual.map(right => left * right));
    return { id: ['A', 'B', 'C'][index] ?? String(index), point: [...point], share: shares[index], residual, outer, weighted: outer.map(row => row.map(value => shares[index] * value)) };
  });
  const scatter = [0, 1].map(row => [0, 1].map(column => sum(contributions.map(entry => entry.weighted[row][column]))));
  if (![count, ...mean, ...scatter.flat()].every(finite)) throw new RangeError('Paired weighted moments exceed the represented range.');
  return { count, identified: true, mean, contributions, scatter, covariance: scatter.map(row => row.map(value => value / count)) };
}

export function createEmSnapshot(observations = defaultEmObservations(), parameters = defaultEmParameters()) {
  const objective = emExpectation(observations, parameters);
  return freeze({ observations: copy(observations), parameters: copy(parameters), iteration: 0, phase: 'E',
    usedAllocations: copy(objective.rows), allocationIteration: 0, allocationLabel: 'initial preview under θ₀', objective, status: 'ready', gain: null });
}

// Publish one complete new snapshot only after its supported arithmetic succeeds.
// Refusal retains a usable parameter/ID/used-allocation/objective snapshot.
export function advanceEmHalfStep(snapshot) {
  if (snapshot.status === 'refused' || (snapshot.iteration >= 50 && snapshot.phase === 'M')) return snapshot;
  try {
    if (snapshot.phase === 'E') {
      const objective = emExpectation(snapshot.observations, snapshot.parameters);
      return freeze({ ...copy(snapshot), usedAllocations: copy(objective.rows), allocationIteration: snapshot.iteration,
        allocationLabel: `E allocation under θ${snapshot.iteration}`, objective, phase: 'M', status: 'ready', gain: null });
    }
    const update = fractionalScalarUpdate(snapshot.observations, snapshot.usedAllocations);
    if (update.components.some(component => !component.identified || component.variance <= 0)) {
      throw new RangeError('Raw scatter is zero or a component has no mass. The next Gaussian needs positive spread; this preview does not add a floor.');
    }
    const objective = emExpectation(snapshot.observations, update.parameters);
    return freeze({ ...copy(snapshot), parameters: update.parameters, objective, iteration: snapshot.iteration + 1, phase: 'E',
      status: 'ready', update, gain: objective.totalLogLikelihood - snapshot.objective.totalLogLikelihood });
  } catch (error) {
    return freeze({ ...copy(snapshot), status: 'refused', reason: error.message });
  }
}

export function scalarEmTrace(observations = defaultEmObservations(), parameters = defaultEmParameters(), cap = 50) {
  if (!Number.isInteger(cap) || cap < 0 || cap > 50) throw new RangeError('An integer cycle cap from zero to fifty is required.');
  let snapshot = createEmSnapshot(observations, parameters);
  const states = [snapshot];
  for (let iteration = 0; iteration < cap; iteration += 1) {
    const allocated = advanceEmHalfStep(snapshot), updated = advanceEmHalfStep(allocated);
    if (updated.status === 'refused') return { states, status: 'refused', reason: updated.reason, refusedSnapshot: updated };
    states.push(updated); snapshot = updated;
  }
  return { states, status: 'cap', cap };
}

export function logWeightedHeightDifference(x, means, variances, weights) {
  return Math.log(weights[0]) + gaussianDetails(x, means[0], Math.sqrt(variances[0])).logDensity -
    Math.log(weights[1]) - gaussianDetails(x, means[1], Math.sqrt(variances[1])).logDensity;
}

// Literal branches are never replaced by a tolerance. Near diagnostics are separate.
export function weightedGaussianCrossings(means, variances, weights) {
  if ([means, variances, weights].some(values => !Array.isArray(values) || values.length !== 2 || !values.every(finite)) ||
      variances.some(value => value <= 0) || weights.some(value => value < 0) || Math.abs(sum(weights) - 1) > 1e-12) {
    throw new RangeError('Two finite means, positive variances and normalized nonnegative weights are required.');
  }
  if (weights.some(value => value === 0)) return { status: 'no finite crossing', roots: [], coefficients: [], nearDiscriminant: false, nearLinear: false };
  const [left, right] = means, [vLeft, vRight] = variances;
  const a = 0.5 * (1 / vRight - 1 / vLeft), b = left / vLeft - right / vRight;
  const c = Math.log(weights[0]) - Math.log(weights[1]) - 0.5 * (Math.log(vLeft) - Math.log(vRight)) - left * left / (2 * vLeft) + right * right / (2 * vRight);
  const coefficients = [a, b, c], scale = Math.max(1, ...coefficients.map(Math.abs));
  if (!coefficients.every(finite)) throw new RangeError('Crossing coefficients exceed the represented range.');
  const nearLinear = Math.abs(a) <= 1e-12 * scale;
  if (a === 0) return b !== 0 ? { status: 'one linear crossing', roots: [-c / b], coefficients, nearLinear, nearDiscriminant: false } :
    { status: c === 0 ? 'equal everywhere' : 'no crossing', roots: [], coefficients, nearLinear, nearDiscriminant: false };
  const discriminant = b * b - 4 * a * c;
  if (!finite(discriminant)) throw new RangeError('Discriminant exceeds the represented range.');
  const nearDiscriminant = Math.abs(discriminant) <= 1e-12 * Math.max(1, b * b, Math.abs(4 * a * c));
  const result = { coefficients, discriminant, nearLinear, nearDiscriminant };
  if (discriminant < 0) return { ...result, status: 'no crossing', roots: [] };
  if (discriminant === 0) return { ...result, status: 'tangent', roots: [-b / (2 * a)] };
  const q = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(discriminant));
  const roots = [q / a, c / q].sort((leftRoot, rightRoot) => leftRoot - rightRoot);
  if (!roots.every(finite)) throw new RangeError('Crossing root exceeds the represented range.');
  return { ...result, status: 'two crossings', roots };
}
