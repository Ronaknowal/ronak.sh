import { rowPartitions, scalarLoopTrace, weightedBatchGradient, normalizationBatchComparison } from './minibatch-loop-models.js';

export const minibatchScalarRows = () => [
  { id: 1, x: 1, y: 1, end: false }, { id: 2, x: 2, y: 2, end: true }, { id: 3, x: 4, y: 1, end: false },
];
export const minibatchMassRows = () => [
  { id: 1, x: 1, y: 1, weight: 1, included: true, group: 0 },
  { id: 2, x: 2, y: 1, weight: 1, included: true, group: 0 },
  { id: 3, x: 3, y: 2, weight: 3, included: true, group: 1 },
  { id: 4, x: 1, y: 4, weight: 0, included: false, group: 1 },
];
export const minibatchNormalizationRows = () => [1, 3, 7, 9].map((x, i) => ({ id: i + 1, x, y: [0, 1, 0, 2][i], group: Math.floor(i / 2) }));
export const sumBatch = values => values.reduce((total, value) => total + value, 0);
export const meanBatch = values => sumBatch(values) / values.length;
export const minibatchNumber = (value, places = 6) => value === null || value === undefined ? 'undefined'
  : !Number.isFinite(value) ? 'unrepresentable'
    : (value !== 0 && Math.abs(value) < 1e-5 ? value.toExponential(3) : Number(value.toFixed(places)).toString()).replaceAll('-', '−');

export function scalarBatchState(rows, settings) {
  const groups = rowPartitions(rows, rows.map(row => row.end));
  const current = scalarLoopTrace(rows, groups, settings);
  const reference = scalarLoopTrace(rows, groups, { ...settings, policy: 'correct' });
  return { groups, current, reference };
}
export { weightedBatchGradient, normalizationBatchComparison };

export function scalarRowObjects(x, y, weight = 0) {
  const prediction = weight * x, residual = prediction - y;
  return { x, y, weight, prediction, residual, loss: .5 * residual ** 2, derivative: residual * x };
}
export function subsetGradientCloud(size) {
  if (![1, 2, 3].includes(size)) throw new RangeError('Sample size is 1, 2 or 3.');
  const source = [-2, 0, -3], combinations = [];
  function append(start, indices) {
    if (indices.length === size) { combinations.push({ indices, value: meanBatch(indices.map(i => source[i])) }); return; }
    for (let i = start; i < source.length; i++) append(i + 1, [...indices, i]);
  }
  append(0, []);
  const average = meanBatch(combinations.map(row => row.value));
  return { source, combinations, mean: average, variance: meanBatch(combinations.map(row => (row.value - average) ** 2)) };
}
export function itemMemory(items, beta) {
  if (!Number.isFinite(items) || items < 1 || items > 20 || !Number.isFinite(beta) || beta <= 0 || beta >= 1) throw new RangeError('Use 1–20 items and 0 < beta < 1.');
  return { beta, items, halfLife: -items * Math.log(2) / Math.log(beta), matchedFive: beta ** (5 / items), tenItemDecay: beta ** (10 / items) };
}
export function constructedDropout(mode) {
  const x = [1, 2, 3, 4], y = [1, 0, 1, 0], mask = mode === 'complement' ? [0, 1, 0, 1] : [1, 0, 1, 0];
  const activations = x.map((v, i) => mode === 'disabled' ? v : 2 * v * mask[i]);
  const derivatives = activations.map((v, i) => (v - y[i]) * v);
  return { x, y, mask, activations, derivatives, gradient: meanBatch(derivatives) };
}
