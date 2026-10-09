// Reading cutaways of the exact saved forecasting computation, not another model.
import { add, dot, gelu, layerNorm, linear, rotate } from './grouped-query-models.js';

export function groupedForecastTrace(weights, points, kvHeads, head, shift, result) {
  const scaled = points.map(point => point.map(value => 2 * value - 1));
  const stem = scaled.map(point => linear(point, weights, 'stem'));
  const normalized = stem.map(row => layerNorm(row, weights, 'norm_attention'));
  const projectedQuery = linear(normalized.at(-1), weights, 'query').slice(head * 6, (head + 1) * 6);
  const query = rotate(projectedQuery, points.length - 1 + shift);
  const group = Math.floor(head / (4 / kvHeads));
  const keys = result.cache.keys[group], values = result.cache.values[group];
  const probabilities = result.attention.at(-1)[head];
  const scores = keys.map(key => dot(query, key) / Math.sqrt(6));
  const products = keys.map(key => key.map((value, j) => value * query[j]));
  const contributions = values.map((value, i) => value.map(x => x * probabilities[i]));
  const headOutputs = result.heads.at(-1), concatenated = headOutputs.flat();
  const attentionUpdate = linear(concatenated, weights, 'output');
  const context = add(stem.at(-1), attentionUpdate);
  const feedforwardInput = layerNorm(context, weights, 'norm_feedforward');
  const expanded = linear(feedforwardInput, weights, 'feedforward.0');
  const activated = expanded.map(gelu);
  const feedforwardUpdate = linear(activated, weights, 'feedforward.2');
  const final = add(context, feedforwardUpdate);
  const finalNormalized = layerNorm(final, weights, 'norm_final');
  const transformedPrediction = linear(finalNormalized, weights, 'forecast');
  return { scaled, stem, normalized, projectedQuery, query, group, keys, values,
    probabilities, scores, products, contributions, headOutputs, concatenated,
    attentionUpdate, context, feedforwardInput, expanded, activated,
    feedforwardUpdate, final, finalNormalized, transformedPrediction,
    prediction: transformedPrediction.map(value => (value + 1) / 2) };
}
