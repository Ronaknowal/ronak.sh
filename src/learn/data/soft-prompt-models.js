// Constructed two-coordinate mechanism from the frozen soft_attention.py.
export const colors = {
  real: '#82b5ff', prompt: '#ec94bc', key: '#be9afa', value: '#75c7d2',
  fixed: '#a6aebb', target: '#edbc65', taskB: '#efad7f', blocked: '#4d5360',
};
export const initialPrompt = [[.2, -.4], [.5, .1]];
export const realRows = [[.4, .7], [-.3, .5]];
export const query = [.6, -.2];
export const WK = [[.8, -.3], [.2, .6]];
export const WV = [[.7, .1], [-.4, .9]];
export const head = [[.9, -.5], [.3, .8]];
export const dot = (a, b) => a.reduce((total, value, i) => total + value * b[i], 0);
export const transpose = matrix => matrix[0].map((_, i) => matrix.map(row => row[i]));
export const vectorMatrix = (vector, matrix) => transpose(matrix).map(column => dot(vector, column));
export const multiply = (left, right) => left.map(row => vectorMatrix(row, right));
export const softmax = values => {
  const weights = values.map(value => Math.exp(value - Math.max(...values)));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map(value => value / total);
};
export function attention(prefixKeys, prefixValues, target = 0) {
  const keys = [...prefixKeys, ...multiply(realRows, WK)];
  const values = [...prefixValues, ...multiply(realRows, WV)];
  const scores = keys.map(key => dot(query, key) / Math.sqrt(2));
  const weights = softmax(scores);
  const output = vectorMatrix(weights, values);
  const logits = vectorMatrix(output, head);
  const probabilities = softmax(logits);
  const dLogits = probabilities.map((value, i) => value - Number(i === target));
  const dOutput = vectorMatrix(dLogits, transpose(head));
  const dAttention = values.map(value => dot(value, dOutput));
  const weightedDerivative = dot(weights, dAttention);
  const dScores = weights.map((weight, i) => weight * (dAttention[i] - weightedDerivative));
  const dKeys = prefixKeys.map((_, i) => query.map(q => dScores[i] * q / Math.sqrt(2)));
  const dValues = prefixValues.map((_, i) => dOutput.map(value => weights[i] * value));
  return { keys, values, scores, weights, output, logits, probabilities,
    loss: -Math.log(probabilities[target]), dLogits, dOutput, dAttention, dScores, dKeys, dValues };
}
export function inputAttention(prompt = initialPrompt, target = 0) {
  const result = attention(multiply(prompt, WK), multiply(prompt, WV), target);
  const keyPath = multiply(result.dKeys, transpose(WK));
  const valuePath = multiply(result.dValues, transpose(WV));
  const gradient = keyPath.map((row, i) => row.map((value, j) => value + valuePath[i][j]));
  return { ...result, keyPath, valuePath, gradient };
}
export function promptStep(prompt, rate, target = 0) {
  const before = inputAttention(prompt, target);
  const updated = prompt.map((row, i) => row.map((value, j) => value - rate * before.gradient[i][j]));
  return { before, updated, after: inputAttention(updated, target) };
}
export function finitePrompt(prompt, row, column, target = 0, epsilon = 1e-6) {
  const shifted = sign => prompt.map((values, i) => values.map((value, j) =>
    value + (i === row && j === column ? sign * epsilon : 0)));
  return (inputAttention(shifted(1), target).loss - inputAttention(shifted(-1), target).loss) / (2 * epsilon);
}
export function inputPositions(count) {
  const tokens = [...Array.from({ length: count }, (_, i) => `P${i}`), 'BOS', 'Q', 'A', 'EOS'];
  return { tokens, targets: tokens.map((_, i) => i === count + 2 ? 'A' : i === count + 3 ? 'EOS' : '−100'),
    predictors: [count + 1, count + 2], mask: tokens.map((_, i) => tokens.map((__, j) => j <= i)) };
}
export function prefixMask(real = 3, prefix = 2, paddedLast = false) {
  return Array.from({ length: real }, (_, i) => Array.from({ length: prefix + real }, (__, j) =>
    j < prefix || (j - prefix <= i && !(paddedLast && j - prefix === real - 1))));
}
export function workCounts(prefix, kvHeads = 4, real = 32) {
  return { input: prefix * 128, kv: 2 * 6 * prefix * kvHeads * 32,
    inputEntries: (real + prefix) ** 2, kvEntries: real * (real + prefix), baselineEntries: real ** 2 };
}
export function infixLayout(insertion = 1, bidirectional = false) {
  const originals = ['BOS', 'context', 'anchor', 'target'];
  const tokens = [...originals.slice(0, insertion), 'P0', 'P1', ...originals.slice(insertion)];
  const map = originals.map((_, i) => i + (i >= insertion ? 2 : 0));
  const predictor = map[1];
  return { tokens, map, predictor, promptVisible: bidirectional || insertion <= 1,
    visible: tokens.map((_, i) => bidirectional || i <= predictor) };
}
