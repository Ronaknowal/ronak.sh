// Presentation traces compose the conserved scientific engine; no weights here.
import { dot, softmax, top, route, dispatch, balance, frozenMoE } from './moe-models.js';

export const coreScores = [4, 2, 1].map(Math.log);
export const coreOutputs = [[2, 0], [0, 3], [-1, 1]];
export const routingDefaults = () => ({
  scores: [1, 3, 2, 4].map(Math.log), outputs: [[2, -1], [1, 2], [-1, 4], [3, 0]],
  k: 2, expert: 2, direction: 0, offset: 0, units: 'logit', pinned: null,
});
export const capacityDefaults = () => ({
  routes: [[0, 1], [0, 2], [0, 3], [1, 2], [0, 1]],
  gates: Array.from({ length: 5 }, () => [.5, .5]), values: [1, 2, 3, 4],
  order: [0, 1, 2, 3, 4], capacity: 2, token: 0, expert: 0, renormalize: false,
});
export const balanceDefaults = () => ({
  scores: [[.6, .3, .1], [.5, .4, .1], [.2, .7, .1], [.1, .2, .7]].map(row => row.map(Math.log)),
  row: 0, expert: 0, k: 1, offset: 0,
});
export const budgetDefaults = () => ({ d: 48, m: 80, n: 10, k: 2, tokens: 24, bytes: 4, remote: 1, shared: 0 });
export const changedAt = (array, index, value) => array.map((old, i) => i === index ? value : old);

export function routingPair(caseState) {
  const direction = caseState.direction === 0 ? [1, 0] : caseState.direction === 1 ? [0, 1] : [1, 1];
  const scores = caseState.scores.map(value => value + caseState.offset);
  return {
    selected: route(scores, caseState.outputs, caseState.k, true, direction),
    full: route(scores, caseState.outputs, caseState.k, false, direction),
    direction, scores,
  };
}

export function allocationPair(caseState) {
  const options = { order: caseState.order, values: caseState.values, gates: caseState.gates,
    renormalize: caseState.renormalize };
  return {
    capped: dispatch(caseState.routes, caseState.capacity, options),
    dropless: dispatch(caseState.routes, Infinity, options),
  };
}

export function objectiveScopes(caseState) {
  const rows = caseState.scores.map(row => row.map(value => value + caseState.offset));
  const global = balance(rows, caseState.k);
  const pairs = [rows.slice(0, 2), rows.slice(2)].map(group => balance(group, caseState.k));
  const singles = rows.map(row => balance([row], caseState.k));
  return { global, pairs, singles, pairMean: pairs.reduce((sum, group) => sum + group.value / 2, 0),
    rowMean: singles.reduce((sum, group) => sum + group.value / rows.length, 0) };
}

export function affineTrace(input, weight, bias = []) {
  const products = weight.map(row => row.map((value, i) => value * input[i]));
  const sums = products.map(row => row.reduce((sum, value) => sum + value, 0));
  return { input, weight, bias: sums.map((_, i) => bias[i] ?? 0), products, sums,
    output: sums.map((value, i) => value + (bias[i] ?? 0)) };
}

export function normTrace(input, gain, offset) {
  const mean = input.reduce((sum, value) => sum + value, 0) / input.length;
  const centered = input.map(value => value - mean);
  const variance = centered.reduce((sum, value) => sum + value * value, 0) / input.length;
  const divisor = Math.sqrt(variance + 1e-5);
  const standardized = centered.map(value => value / divisor);
  return { input, gain, offset, mean, centered, variance, divisor, standardized,
    output: standardized.map((value, i) => value * gain[i] + offset[i]) };
}

export function expertTrace(input, gate, up, down) {
  const gatePath = affineTrace(input, gate);
  const upPath = affineTrace(input, up);
  const activated = gatePath.output.map(value => value / (1 + Math.exp(-value)));
  const product = activated.map((value, i) => value * upPath.output[i]);
  const downPath = affineTrace(product, down);
  return { input, gatePath, upPath, activated, product, downPath, output: downPath.output };
}

export function modelTrace(state, pixels, { temperature = 1, disabled = null } = {}) {
  const reference = frozenMoE(state, pixels, { temperature, disabled });
  const linear = (input, name) => affineTrace(input, state[`${name}.weight`], state[`${name}.bias`]);
  const norm = (input, name) => normTrace(input, state[`${name}.weight`], state[`${name}.bias`]);
  const projection = reference.patches.map(input => linear(input, 'project'));
  const positioned = projection.map((path, p) => path.output.map((value, i) => value + state.position[p][i]));
  const attentionNorm = positioned.map(input => norm(input, 'norm_attention'));
  const qkv = attentionNorm.map(path => linear(path.output, 'qkv'));
  const queries = [0, 1].map(head => qkv.map(path => path.output.slice(head * 8, head * 8 + 8)));
  const keys = [0, 1].map(head => qkv.map(path => path.output.slice(16 + head * 8, 24 + head * 8)));
  const values = [0, 1].map(head => qkv.map(path => path.output.slice(32 + head * 8, 40 + head * 8)));
  const attentionScores = queries.map((rows, head) => rows.map(query => keys[head].map(key => dot(query, key) / Math.sqrt(8))));
  const contexts = positioned.map((_, t) => Array.from({ length: 16 }, (_, i) =>
    qkv.reduce((sum, path, s) => sum + reference.attention[Math.floor(i / 8)][t][s] * path.output[32 + i], 0)));
  const attentionProjection = contexts.map(input => linear(input, 'attention_output'));
  const afterAttention = attentionProjection.map((path, t) => path.output.map((value, i) => value + positioned[t][i]));
  const expertNorm = afterAttention.map(input => norm(input, 'norm_ffn'));
  const router = expertNorm.map(path => linear(path.output, 'router'));
  const expertPaths = expertNorm.map((path, t) => Array.from({ length: 4 }, (_, e) =>
    reference.selected[t].includes(e) && e !== disabled
      ? expertTrace(path.output, state[`experts.${e}.gate.weight`], state[`experts.${e}.value.weight`], state[`experts.${e}.down.weight`])
      : null));
  const afterExperts = afterAttention.map((row, t) => row.map((value, i) => value + reference.combined[t][i]));
  const finalNorm = afterExperts.map(input => norm(input, 'norm_final'));
  const mean = finalNorm[0].output.map((_, i) => finalNorm.reduce((sum, path) => sum + path.output[i] / 16, 0));
  const classifier = linear(mean, 'classifier');
  return { reference, projection, positioned, attentionNorm, qkv, queries, keys, values, attentionScores,
    contexts, attentionProjection, afterAttention, expertNorm, router, expertPaths,
    afterExperts, finalNorm, mean, classifier, probabilities: softmax(classifier.output),
    predicted: top(classifier.output, 1)[0] };
}

export function softMoEFixture() {
  const x = [[1, 0], [0, 1]], phi = [[Math.log(3), 0], [0, Math.log(3)]];
  const scores = x.map(row => phi[0].map((_, e) => row.reduce((sum, value, i) => sum + value * phi[i][e], 0)));
  const dispatchWeights = scores.map((_, t) => scores[0].map((__, e) => softmax(scores.map(row => row[e]))[t]));
  const combine = scores.map(softmax);
  const slots = scores[0].map((_, e) => x[0].map((__, j) => x.reduce((sum, row, t) => sum + dispatchWeights[t][e] * row[j], 0)));
  const answers = slots.map((row, e) => row.map(value => value * (e + 1)));
  const output = combine.map(row => x[0].map((_, j) => row.reduce((sum, value, e) => sum + value * answers[e][j], 0)));
  return { x, phi, scores, dispatchWeights, combine, slots, answers, output };
}

export function noisyProbability(clean, sigma, threshold = .5) {
  if (!(sigma > 0)) return null;
  // Abramowitz-Stegun CDF approximation; exact Python erf oracle is supplied.
  const z = (clean - threshold) / sigma;
  const t = 1 / (1 + .2316419 * Math.abs(z));
  const density = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  const tail = density * t * (.319381530 + t * (-.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - tail : tail;
}
