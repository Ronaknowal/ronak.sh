// Complete intermediate ownership for the retained one-block MLA forecaster.
// This adds inspection, not new weights, fitting or a changed scientific model.
import { latentForecast, matvec, transpose, multiply } from './latent-attention-models.js';
import { linear, layerNorm, gelu, rotate, add } from './grouped-query-models.js';

function rmsTrace(raw, gains) {
  const squares = raw.map(row => row.map(value => value * value));
  const means = squares.map(row => row.reduce((sum, value) => sum + value, 0) / row.length);
  const divisors = means.map(mean => Math.sqrt(mean + 1e-6));
  const unit = raw.map((row, index) => row.map(value => value / divisors[index]));
  return { raw, squares, means, epsilon: 1e-6, divisors, unit, gains, output: unit.map(row => row.map((value, coordinate) => value * gains[coordinate])) };
}

export function latentForecastTrace(weights, points, { basis = null, shift = 0, wrongScale = false } = {}) {
  const result = latentForecast(weights, points, { basis, shift, wrongScale });
  const scaledInput = points.map(row => row.map(value => 2 * value - 1));
  const stem = scaledInput.map(row => linear(row, weights, 'stem'));
  const attentionInput = stem.map(row => layerNorm(row, weights, 'norm_attention'));
  const rawLatents = attentionInput.map(row => linear(row, weights, 'kv_down'));
  const latentNorm = rmsTrace(rawLatents, weights['kv_norm.scale']);
  const latent = basis ? latentNorm.output.map(row => matvec(transpose(basis), row)) : latentNorm.output;
  const rawQueryLatents = attentionInput.map(row => linear(row, weights, 'query_down'));
  const queryNorm = rmsTrace(rawQueryLatents, weights['query_norm.scale']);
  const queryContent = queryNorm.output.map(row => linear(row, weights, 'query_content'));
  const rawQueryRotary = queryNorm.output.map(row => linear(row, weights, 'query_rotary'));
  const queryRotary = rawQueryRotary.map((row, index) => Array.from({ length: 4 }, (_, head) => rotate(row.slice(2 * head, 2 * head + 2), index + shift)));
  const rawKeyRotary = attentionInput.map(row => linear(row, weights, 'rotary_key'));
  const keyRotary = rawKeyRotary.map((row, index) => rotate(row, index + shift));
  const keyMaps = Array.from({ length: 4 }, (_, head) => weights['key_up.weight'].slice(4 * head, 4 * head + 4)).map(map => basis ? multiply(map, basis) : map);
  const valueMaps = Array.from({ length: 4 }, (_, head) => weights['value_up.weight'].slice(4 * head, 4 * head + 4)).map(map => basis ? multiply(map, basis) : map);
  const keys = keyMaps.map(map => latent.map(row => matvec(map, row)));
  const values = valueMaps.map(map => latent.map(row => matvec(map, row)));
  const joinedHeads = result.traces.map(heads => heads.flatMap(head => head.output));
  const writtenAttention = joinedHeads.map(row => linear(row, weights, 'output'));
  const attentionResidual = stem.map((row, index) => add(row, writtenAttention[index]));
  const feedforwardInput = attentionResidual.map(row => layerNorm(row, weights, 'norm_feedforward'));
  const feedforwardExpanded = feedforwardInput.map(row => linear(row, weights, 'feedforward.0'));
  const feedforwardActivated = feedforwardExpanded.map(row => row.map(gelu));
  const feedforwardWritten = feedforwardActivated.map(row => linear(row, weights, 'feedforward.2'));
  const feedforwardResidual = attentionResidual.map((row, index) => add(row, feedforwardWritten[index]));
  const finalNormalized = feedforwardResidual.map(row => layerNorm(row, weights, 'norm_final'));
  const taskScaled = finalNormalized.map(row => linear(row, weights, 'forecast'));
  const taskOutput = taskScaled.map(row => row.map(value => (value + 1) / 2));
  return { ...result, weights, basis, shift, wrongScale, points, scaledInput, stem, attentionInput,
    latentNorm, latent, queryNorm, queryContent, rawQueryRotary, queryRotary, rawKeyRotary, keyRotary,
    keyMaps, valueMaps, keys, values, joinedHeads, writtenAttention, attentionResidual, feedforwardInput,
    feedforwardExpanded, feedforwardActivated, feedforwardWritten, feedforwardResidual, finalNormalized, taskScaled, taskOutput };
}
