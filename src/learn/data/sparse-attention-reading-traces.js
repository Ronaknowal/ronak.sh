import { erf, forecastTrajectory, featureMemory, normalizedScores } from './sparse-attention-models.js';

// Reading-flow traces expose the original fitted calculation without changing
// the saved models, fitting protocol or reference helper. Products are produced
// only for the particular map row a drawing inspects, not for every layer/point.
const sum = values => values.reduce((total, value) => total + value, 0);
const dot = (left, right) => sum(left.map((value, index) => value * right[index]));
const add = (left, right) => left.map((value, index) => value + right[index]);
const linear = (input, weights, bias) => weights.map((row, index) => dot(row, input) + (bias?.[index] ?? 0));

export function sparseFeatureMemory(query, keys, values, valueWidth = 2) {
  if (keys.length) return featureMemory(query, keys, values);
  // The live manual memory may inspect zero writes. Keep its two value
  // coordinates even though an empty list cannot supply that shape itself.
  return { matrix: query.map(() => Array(valueWidth).fill(0)), normalizer: query.map(() => 0),
    numerator: Array(valueWidth).fill(0), denominator: 0, output: null, weights: null, history: [] };
}

export function sparseAffineTrace(input, weight, bias = null) {
  const products = weight.map(row => row.map((value, coordinate) => value * input[coordinate]));
  const sums = products.map(sum);
  return { input, weight, bias, products, sums, output: sums.map((value, index) => value + (bias?.[index] ?? 0)) };
}

export function sparseNormalizationTrace(input, gain = input.map(() => 1), offset = input.map(() => 0), epsilon = 1e-5) {
  const mean = sum(input) / input.length;
  const centered = input.map(value => value - mean);
  const squares = centered.map(value => value * value);
  const variance = sum(squares) / input.length;
  const divisor = Math.sqrt(variance + epsilon);
  const unit = centered.map(value => value / divisor);
  return { input, mean, centered, squares, variance, epsilon, divisor, unit, gain, offset,
    output: unit.map((value, coordinate) => value * gain[coordinate] + offset[coordinate]) };
}

export function sparseForecastTrace(weights, points, mode) {
  const reference = forecastTrajectory(weights, points, mode);
  const scaled = points.map(point => point.map(value => 2 * value - 1));
  const stem = scaled.map(point => linear(point, weights['stem.weight'], weights['stem.bias']));
  const positions = points.map((_, index) => Array.from({ length: 24 }, (_, coordinate) => {
    const angle = index * 10000 ** (-2 * Math.floor(coordinate / 2) / 24);
    return coordinate % 2 ? Math.cos(angle) : Math.sin(angle);
  }));
  const state = stem.map((row, index) => add(row, positions[index]));
  const attentionNorm = state.map(row => sparseNormalizationTrace(row, weights['norm_attention.weight'], weights['norm_attention.bias']));
  const qkv = attentionNorm.map(row => linear(row.output, weights['qkv.weight']));
  const headOutputs = reference.values.map((values, head) => reference.weightRows[head].map(row =>
    Array.from({ length: 8 }, (_, coordinate) => sum(values.map((value, record) => value[coordinate] * row[record])))));
  const merged = points.map((_, receiver) => headOutputs.flatMap(head => head[receiver]));
  const attentionWrite = merged.map(row => linear(row, weights['output.weight']));
  const residual = state.map((row, index) => add(row, attentionWrite[index]));
  const feedforwardNorm = residual.map(row => sparseNormalizationTrace(row, weights['norm_feedforward.weight'], weights['norm_feedforward.bias']));
  const expanded = feedforwardNorm.map(row => linear(row.output, weights['feedforward.0.weight'], weights['feedforward.0.bias']));
  const activated = expanded.map(row => row.map(value => value * 0.5 * (1 + erf(value / Math.sqrt(2)))));
  const feedforwardWrite = activated.map(row => linear(row, weights['feedforward.2.weight'], weights['feedforward.2.bias']));
  const fed = residual.map((row, index) => add(row, feedforwardWrite[index]));
  const finalNorm = fed.map(row => sparseNormalizationTrace(row, weights['norm_final.weight'], weights['norm_final.bias']));
  const projectedForecast = finalNorm.map(row => linear(row.output, weights['forecast.weight'], weights['forecast.bias']));
  const tracedPredictions = projectedForecast.map(row => row.map(value => (value + 1) / 2));
  const maximumDifference = Math.max(...tracedPredictions.flatMap((row, record) => row.map((value, coordinate) => Math.abs(value - reference.predictions[record][coordinate]))));
  return { ...reference, mode, points, weights, scaled, stem, positions, state, attentionNorm, qkv,
    headOutputs, merged, attentionWrite, residual, feedforwardNorm, expanded, activated,
    feedforwardWrite, fed, finalNorm, projectedForecast, tracedPredictions, maximumDifference };
}

export function sparseHeadTrace(trace, head = 0, receiver = trace.points.length - 1) {
  const query = trace.queries[head][receiver];
  const keys = trace.keys[head];
  const values = trace.values[head];
  const products = keys.map(key => key.map((value, coordinate) => query[coordinate] * value));
  const dots = products.map(sum);
  const scale = Math.sqrt(8);
  const legal = keys.map((_, record) => record <= receiver && (trace.mode !== 'window' || receiver - record < 5));
  const scores = dots.map(value => value / scale);
  const weights = trace.weightRows[head][receiver];
  const contributions = values.map((row, record) => row.map(value => value * weights[record]));
  const output = trace.headOutputs[head][receiver];
  const result = { query, keys, values, products, dots, scale, legal, scores, weights, contributions, output, receiver, head };
  if (trace.mode !== 'kernel') {
    const maximum = Math.max(...scores.filter((_, record) => legal[record]));
    const shifted = scores.map((value, record) => legal[record] ? value - maximum : null);
    const exponentials = shifted.map(value => value === null ? 0 : Math.exp(value));
    return { ...result, maximum, shifted, exponentials, mass: sum(exponentials) };
  }
  const feature = value => value >= 0 ? value + 1 : Math.exp(value);
  const queryFeatures = query.map(value => feature(value / 8 ** 0.25));
  const keyFeatures = keys.map(row => row.map(value => feature(value / 8 ** 0.25)));
  const memory = featureMemory(queryFeatures, keyFeatures.slice(0, receiver + 1), values.slice(0, receiver + 1));
  return { ...result, queryFeatures, keyFeatures, matrix: memory.matrix, normalizer: memory.normalizer,
    numerator: memory.numerator, denominator: memory.denominator, appliedDenominator: Math.max(1e-9, memory.denominator),
    history: memory.history };
}

export function sparseQuotientGradient(query, keys, values, upstream) {
  const read = sparseFeatureMemory(query, keys, values, upstream.length);
  if (!read.output) return { defined: false, read, reason: 'There is no positive overlap, so this normalized read and its derivative are undefined.' };
  const outputCredit = dot(upstream, read.output);
  const queryGradient = read.matrix.map((row, coordinate) => (dot(row, upstream) - outputCredit * read.normalizer[coordinate]) / read.denominator);
  const keyGradients = values.map(value => query.map(entry => entry * (dot(value, upstream) - outputCredit) / read.denominator));
  const valueGradients = keys.map(key => upstream.map(entry => dot(query, key) * entry / read.denominator));
  const numeratorGradient = upstream.map(value => value / read.denominator);
  const denominatorGradient = -outputCredit / read.denominator;
  const stateGradient = query.map(entry => numeratorGradient.map(value => entry * value));
  const normalizerGradient = query.map(entry => entry * denominatorGradient);
  return { defined: true, read, upstream, outputCredit, numeratorGradient, denominatorGradient,
    stateGradient, normalizerGradient, queryGradient, keyGradients, valueGradients };
}

export function sparseOpeningRead() {
  const query = [1], keys = [[Math.log(2)], [0], [0]], values = [[2], [-1], [4]];
  const products = keys.map(key => key.map((value, coordinate) => query[coordinate] * value));
  const scores = products.map(sum);
  const exponentials = scores.map(Math.exp);
  const mass = sum(exponentials);
  const weights = normalizedScores(scores);
  const contributions = values.map((value, record) => value.map(entry => entry * weights[record]));
  return { query, keys, values, products, scores, exponentials, mass, weights, contributions, output: [sum(contributions.flat())] };
}

export function sparseNystromTrace(fixture) {
  const [[a, b], [c, d]] = fixture.middle;
  const determinant = a * d - b * c;
  if (Math.abs(determinant) < 1e-12) throw new Error('This fixed two-landmark drawing expects its preserved nonsingular middle matrix.');
  const inverse = [[d / determinant, -b / determinant], [-c / determinant, a / determinant]];
  const multiply = (left, right) => left.map(row => right[0].map((_, column) => sum(row.map((value, index) => value * right[index][column]))));
  const first = multiply(fixture.back, fixture.value);
  const corrected = multiply(inverse, first);
  const output = multiply(fixture.front, corrected);
  return { ...fixture, determinant, inverse, first, corrected, output };
}
