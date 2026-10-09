import { gaussianDetails, correlatedGaussian, ellipseCoordinates } from "./gaussian-geometry-models.mjs";

const freeze = object => { if (object && typeof object === 'object') { Object.values(object).forEach(freeze); Object.freeze(object); } return object; };
export const CONDITIONAL_INPUT = freeze({ weights: [.5, .5], means: [[0, 0], [2, 4]], covariances: [[[1, .5], [.5, 1]], [[1, .5], [.5, 1]]], ids: ['Left', 'Right'] });
const finite = values => values.every(value => typeof value === 'number' && Number.isFinite(value));
export function conditionalLogSum(logs) {
  if (!Array.isArray(logs) || !logs.length || logs.some(v => Number.isNaN(v) || v === Infinity)) throw new RangeError('Finite or negative-infinite nonempty log terms required');
  const maximum = Math.max(...logs);
  if (!Number.isFinite(maximum)) throw new RangeError('No represented supported source');
  const result = maximum + Math.log(logs.reduce((sum, value) => sum + Math.exp(value - maximum), 0));
  if (!Number.isFinite(result)) throw new RangeError('Log density exceeds the represented range');
  return result;
}
function covariance2(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== 2 || matrix.some(row => !Array.isArray(row) || row.length !== 2 || !finite(row))) throw new RangeError('Finite two-by-two covariance required');
  const scale = Math.max(1, ...matrix.flat().map(Math.abs));
  if (Math.abs(matrix[0][1] - matrix[1][0]) > 1e-12 * scale) throw new RangeError('Symmetric covariance required');
  const cross = (matrix[0][1] + matrix[1][0]) / 2, a = Math.sqrt(matrix[0][0]);
  const b = cross / a, c = Math.sqrt(matrix[1][1] - b * b);
  if (!finite([a, b, c]) || a <= 0 || c <= 0) throw new RangeError('Positive-definite covariance required');
  return freeze({ covariance: [[matrix[0][0], cross], [cross, matrix[1][1]]], lower: [[a, 0], [b, c]], determinant: a * a * c * c });
}
function logGaussian2(values, mean, prepared) {
  if (!Array.isArray(values) || values.length !== 2 || !finite(values)) throw new RangeError('Two finite query coordinates required');
  const lower = prepared.lower, whiteU = (values[0] - mean[0]) / lower[0][0], whiteV = (values[1] - mean[1] - lower[1][0] * whiteU) / lower[1][1];
  const result = -Math.log(2 * Math.PI) - Math.log(lower[0][0]) - Math.log(lower[1][1]) - (whiteU * whiteU + whiteV * whiteV) / 2;
  if (!Number.isFinite(result)) throw new RangeError('Joint log density exceeds the represented range');
  return result;
}

// This is a supplied two-coordinate conditional plan, not a learned estimator.
// Prepare observed factors/gains/Schur covariances once. Queries recenter only.
export function prepareConditional2D(input = CONDITIONAL_INPUT, observed = [0], remaining) {
  if (!Array.isArray(observed) || (remaining !== undefined && !Array.isArray(remaining))) throw new RangeError('Coordinate index arrays required');
  remaining = remaining ?? [0, 1].filter(i => !observed.includes(i));
  const all = [...observed, ...remaining];
  if (all.length !== 2 || all.some(i => !Number.isInteger(i)) || [...all].sort().join(',') !== '0,1') throw new RangeError('Unique observed/remaining indices must partition coordinates0,1');
  const { weights, means, covariances } = input;
  if (!Array.isArray(weights) || !weights.length || !finite(weights) || weights.some(w => w < 0) || Math.abs(weights.reduce((a,b)=>a+b,0)-1) > 1e-12 || !Array.isArray(means) || means.length !== weights.length || means.some(row => !Array.isArray(row) || row.length !== 2 || !finite(row)) || !Array.isArray(covariances) || covariances.length !== weights.length) throw new RangeError('Compatible finite unit-sum supplied mixture state required');
  const fullFactors = covariances.map(covariance2), model = freeze({ weights: [...weights], means: means.map(row=>[...row]), covariances: fullFactors.map(f=>f.covariance), ids: input.ids ? [...input.ids] : weights.map((_,i)=>String(i)), dimension: 2 });
  const blocks = observed.length === 1 ? fullFactors.map((factor, k) => {
    const a = observed[0], b = remaining[0], cov = factor.covariance, uu = cov[a][a], vu = cov[b][a], gain = vu / uu, variance = cov[b][b] - gain * cov[a][b];
    if (!Number.isFinite(variance) || variance <= 0) throw new RangeError('Positive Schur-complement variance required');
    return freeze({ componentId: model.ids[k], uu, uv: cov[a][b], vu, vv: cov[b][b], observedLower: [[Math.sqrt(uu)]], forwardSolve: vu / Math.sqrt(uu), gain, conditionalCovariance: [[variance]], conditionalLower: [[Math.sqrt(variance)]] });
  }) : [];
  const partition = freeze({ observed: [...observed], remaining: [...remaining], complete: true });
  const jointLogDensity = coordinates => conditionalLogSum(model.weights.map((weight,k)=>weight ? Math.log(weight)+logGaussian2(coordinates, model.means[k],fullFactors[k]) : -Infinity));
  function condition(values) {
    if (!Array.isArray(values) || values.length !== observed.length || !finite(values)) throw new RangeError('One finite observed-coordinate vector required');
    if (!observed.length) return model;
    const marginalLogs = model.weights.map((weight,k)=>weight === 0 ? -Infinity : Math.log(weight)+(observed.length === 2 ? logGaussian2([values[observed.indexOf(0)],values[observed.indexOf(1)]],model.means[k],fullFactors[k]) : gaussianDetails(values[0],model.means[k][observed[0]],blocks[k].observedLower[0][0]).logDensity));
    const marginalLogDensity = conditionalLogSum(marginalLogs), updatedWeights = marginalLogs.map(log=>Math.exp(log-marginalLogDensity));
    if (!remaining.length) return freeze({ dimension: 0, weights: updatedWeights, means: model.weights.map(()=>[]), covariances: model.weights.map(()=>[]), marginalLogDensity, logDensity: vector => { if (!Array.isArray(vector) || vector.length) throw new RangeError('The empty vector is required'); return 0; }, moments: () => ({ mean: [], covariance: [] }) });
    const conditionalMeans = blocks.map((block,k)=>[model.means[k][remaining[0]]+block.gain*(values[0]-model.means[k][observed[0]])]);
    const conditionalCovariances = blocks.map(block=>block.conditionalCovariance);
    const logDensity = vector => { if (!Array.isArray(vector) || vector.length !== 1 || !finite(vector)) throw new RangeError('One finite remaining-coordinate vector required'); return conditionalLogSum(updatedWeights.map((weight,k)=>weight ? Math.log(weight)+gaussianDetails(vector[0],conditionalMeans[k][0],blocks[k].conditionalLower[0][0]).logDensity : -Infinity)); };
    return freeze({ dimension: 1, weights: updatedWeights, means: conditionalMeans, covariances: conditionalCovariances, marginalLogs, marginalLogDensity, factors: blocks.map(block=>block.conditionalLower), logDensity });
  }
  return Object.freeze({ model, partition, blocks: Object.freeze(blocks), fullFactors: Object.freeze(fullFactors), condition, jointLogDensity });
}

export const CONDITIONAL_PLAN = prepareConditional2D();
const SINGLE_PLAN = prepareConditional2D({ weights: [1], means: [[0,0]], covariances: [[[1,.5],[.5,1]]], ids: ['One Gaussian'] });
function observedValue(u) { if (typeof u !== 'number' || !Number.isFinite(u) || u < -2 || u > 4) throw new RangeError('Observed u must be finite in [-2,4]'); return u; }
export function singleGaussianSlice(u = 1) {
  observedValue(u); const conditional = SINGLE_PLAN.condition([u]), marginal = gaussianDetails(u, 0, 1);
  return { u, mean: conditional.means[0][0], variance: conditional.covariances[0][0][0], standardDeviation: Math.sqrt(conditional.covariances[0][0][0]), marginal, covariance: SINGLE_PLAN.model.covariances[0], jointContours: [1,2,3].map(radius=>ellipseCoordinates(.5).map(([x,y])=>[radius*x,radius*y])), joint: (x,y)=>correlatedGaussian(x,y,.5), sliceDensity: v=>Math.exp(SINGLE_PLAN.jointLogDensity([u,v])), conditionalDensity: v=>Math.exp(conditional.logDensity([v])), logDensity: v=>conditional.logDensity([v]) };
}
export function conditionalMixture(u = 1) {
  observedValue(u); const result = CONDITIONAL_PLAN.condition([u]);
  const components = CONDITIONAL_INPUT.ids.map((id,k)=>({ id, index: k, sourceMean: CONDITIONAL_INPUT.means[k], sourceWeight: CONDITIONAL_INPUT.weights[k], block: CONDITIONAL_PLAN.blocks[k], marginal: gaussianDetails(u,CONDITIONAL_INPUT.means[k][0],1), weightedMarginal: Math.exp(result.marginalLogs[k]), weight: result.weights[k], mean: result.means[k][0], variance: result.covariances[k][0][0], standardDeviation: CONDITIONAL_PLAN.blocks[k].conditionalLower[0][0] }));
  const mean = components.reduce((sum,c)=>sum+c.weight*c.mean,0), within = components.reduce((sum,c)=>sum+c.weight*c.variance,0), between = components.reduce((sum,c)=>sum+c.weight*(c.mean-mean)**2,0), variance = within+between;
  return { u, components, mean, within, between, variance, standardDeviation: Math.sqrt(variance), interval: [mean-Math.sqrt(variance),mean+Math.sqrt(variance)], marginalLogDensity: result.marginalLogDensity, marginalDensity: Math.exp(result.marginalLogDensity), partition: CONDITIONAL_PLAN.partition, preparedFactors: result.factors, logDensity: v=>result.logDensity([v]), density: v=>Math.exp(result.logDensity([v])), componentDensity: (k,v)=>components[k].weight*gaussianDetails(v,components[k].mean,components[k].standardDeviation).density, betweenContributions: components.map(c=>c.weight*(c.mean-mean)**2) };
}
