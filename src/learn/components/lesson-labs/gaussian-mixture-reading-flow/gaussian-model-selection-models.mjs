import saved from "./gmm_saved_iris.json" with { type: 'json' };
import { IRIS_OBSERVATIONS, IRIS_ROLES, irisObservation } from "./gaussian-observation-data.mjs";

const freeze = object => { if (object && typeof object === 'object') { Object.values(object).forEach(freeze); Object.freeze(object); } return object; };
export const MODEL_SELECTION_SAVED = freeze(saved);
export const SAVED_CANDIDATES = saved.iris.candidates;
export const FAMILY_IDENTITIES = freeze({ full: { color: '#6bc6ba', dash: '', glyph: 'circle' }, tied: { color: '#87baf1', dash: '7 4', glyph: 'square' }, diag: { color: '#c4a0e8', dash: '2 4', glyph: 'diamond' }, spherical: { color: '#edb489', dash: '9 3 2 3', glyph: 'triangle' } });

export function criterionComparison(n = 100) {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('Positive integer row count required');
  return [{ id: 'A', logLikelihood: -150, parameters: 5 }, { id: 'B', logLikelihood: -143, parameters: 11 }].map(row => ({ ...row, n, fitCost: -2 * row.logLikelihood, aicPenalty: 2 * row.parameters, bicPenalty: row.parameters * Math.log(n), aic: -2 * row.logLikelihood + 2 * row.parameters, bic: -2 * row.logLikelihood + row.parameters * Math.log(n) }));
}

// Same physical observation, same coordinate map for every compared model.
// These constructed n=100 totals are the D43 operands, not a fresh Iris fit.
export function densityUnitConversion(factor = 10) {
  if (factor !== 1 && factor !== 10) throw new RangeError('Use cm (1) or mm (10)');
  const determinant = factor * factor, perRowLogShift = -Math.log(determinant), n = 100;
  return { factor, unit: factor === 1 ? 'cm' : 'mm', determinant, perRowLogShift, totalLogShift: n * perRowLogShift,
    productMultiplier: determinant ** -n, observation: irisObservation(34), converted: [5.5 * factor, 4.2 * factor],
    rows: criterionComparison(n).map(row => ({ ...row, productCm: Math.exp(row.logLikelihood), productConverted: Math.exp(row.logLikelihood + n * perRowLogShift), logConverted: row.logLikelihood + n * perRowLogShift })) };
}

export function savedObservationTransform(id = 34) {
  if (!Number.isInteger(id)) throw new RangeError('An integer observed ID in [1,150] is required');
  const observation = irisObservation(id), raw = [observation.lengthCm, observation.widthCm];
  const mean = saved.iris.scale_mean, scale = saved.iris.scale;
  const role = Object.entries(IRIS_ROLES).find(([, ids]) => ids.includes(id))?.[0];
  return { id, role, raw, mean, scale, residual: raw.map((value, i) => value - mean[i]), standardized: raw.map((value, i) => (value - mean[i]) / scale[i]) };
}

// A fixed retained covariance is converted and drawn; training assignments are
// never queried or reconstructed. Average paired cross entries by the accepted
// GaussianFactor roundoff policy; retain the original tiny entries in saved.
export function retainedThinComponent() {
  const candidate = SAVED_CANDIDATES.find(row => row.covariance_type === 'full' && row.components === 4);
  const source = candidate.covariances[0], scales = saved.iris.scale;
  const cross = (source[0][1] + source[1][0]) / 2;
  const standardizedCovariance = [[source[0][0], cross], [cross, source[1][1]]];
  const covariance = standardizedCovariance.map((row, i) => row.map((value, j) => value * scales[i] * scales[j]));
  const mean = candidate.means[0].map((value, i) => value * scales[i] + saved.iris.scale_mean[i]);
  const a = Math.sqrt(covariance[0][0]), b = covariance[1][0] / a, c = Math.sqrt(covariance[1][1] - b * b);
  const ellipse = Array.from({ length: 129 }, (_, i) => { const angle = i * Math.PI * 2 / 128; return [mean[0] + a * Math.cos(angle), mean[1] + b * Math.cos(angle) + c * Math.sin(angle)]; });
  const training = IRIS_ROLES.training.map(irisObservation);
  return { id: 'full K4 / component 0', weight: candidate.weights[0], mean, covariance, standardizedCovariance, standardizedMean: candidate.means[0], sd: covariance.map((row, i) => Math.sqrt(row[i])), ellipse, training, recordedWidth3: training.filter(row => row.widthCm === 3), resolution: .1, historicalAssignedCount: 14, assignedIds: null };
}

export function reservedTestComparison() {
  const iris = saved.iris;
  return { selected: { id: 'full K2', value: iris.test_mean_log_density }, baseline: { id: 'full K1', value: iris.baseline_test_mean_log_density }, difference: iris.test_mean_log_density - iris.baseline_test_mean_log_density,
    rows: iris.test_ids_in_order.map((id, i) => ({ id, ...irisObservation(id), logDensity: iris.test_log_density[i], componentId: iris.test_component_labels[i], responsibilities: iris.test_responsibilities[i] })) };
}

export function savedSelectionWinners() {
  return { validation: SAVED_CANDIDATES.reduce((best, row) => row.validation_mean_log_density > best.validation_mean_log_density ? row : best), bic: SAVED_CANDIDATES.reduce((best, row) => row.bic < best.bic ? row : best) };
}
export { IRIS_OBSERVATIONS, IRIS_ROLES };
