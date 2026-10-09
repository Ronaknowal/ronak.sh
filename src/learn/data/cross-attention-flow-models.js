// Rectangular attention, in row-vector notation. Stored affine weights are out × in.
// Topic-owned calculations; no React, saved-state or dataset imports.
export const sum = xs => xs.reduce((a, b) => a + b, 0);
export const dot = (a, b) => sum(a.map((x, i) => x * b[i]));
export const transpose = x => x[0].map((_, j) => x.map(row => row[j]));
export const matmul = (a, b) => a.map(row => transpose(b).map(col => dot(row, col)));
export const zeros = (n, m) => Array.from({ length: n }, () => Array(m).fill(0));
export function matrix(x, name = 'matrix') {
  if (!Array.isArray(x) || !x.length || !Array.isArray(x[0]) || !x[0].length ||
      x.some(row => !Array.isArray(row) || row.length !== x[0].length || row.some(v => !Number.isFinite(v)))) {
    throw new RangeError(`${name} must be a nonempty finite rectangular matrix.`);
  }
  return x;
}
export function softmax(scores, allowed = scores.map(() => true)) {
  if (!Array.isArray(scores) || !scores.length || scores.some(v => !Number.isFinite(v))) throw new RangeError('Softmax scores must be a nonempty finite vector.');
  if (scores.length !== allowed.length || allowed.some(x => typeof x !== 'boolean')) throw new RangeError('One Boolean permission per donor is required.');
  const legal = scores.filter((_, i) => allowed[i]);
  if (!legal.length) return null;
  const maximum = Math.max(...legal), masses = scores.map((x, i) => allowed[i] ? Math.exp(x - maximum) : 0), total = sum(masses);
  return { maximum, masses, total, shares: masses.map(x => x / total) };
}
export function attention(query, key, value, allowed = query.map(() => key.map(() => true))) {
  matrix(query, 'Q'); matrix(key, 'K'); matrix(value, 'V');
  if (query[0].length !== key[0].length || key.length !== value.length || allowed.length !== query.length || allowed.some(row => row.length !== key.length)) throw new RangeError('Q/K matching widths, K/V donor counts and T × S permissions must agree.');
  const scale = Math.sqrt(query[0].length), scores = query.map(q => key.map(k => dot(q, k) / scale));
  const normalized = scores.map((row, i) => softmax(row, allowed[i]));
  const weights = normalized.map(row => row?.shares ?? null);
  const products = weights.map(row => row ? value.map((v, i) => v.map(x => row[i] * x)) : null);
  const output = products.map(row => row ? transpose(row).map(sum) : null);
  return { query, key, value, allowed, scale, scores, normalized, weights, products, output };
}
export function pullback(tape, credit) {
  matrix(credit, 'output credit');
  if (tape.output.some(row => row === null)) throw new RangeError('An empty donor row has no attention pullback.');
  if (credit.length !== tape.query.length || credit[0].length !== tape.value[0].length) throw new RangeError('Credit must have output shape T × dv.');
  const dValue = matmul(transpose(tape.weights), credit);
  const dWeights = matmul(credit, transpose(tape.value));
  const dScores = tape.weights.map((row, i) => {
    const common = dot(row, dWeights[i]);
    return row.map((a, j) => tape.allowed[i][j] ? a * (dWeights[i][j] - common) : 0);
  });
  const dQuery = matmul(dScores, tape.key).map(row => row.map(x => x / tape.scale));
  const dKey = matmul(transpose(dScores), tape.query).map(row => row.map(x => x / tape.scale));
  return { dValue, dWeights, dScores, dQuery, dKey };
}
export const affine = (x, weight, bias = weight.map(() => 0)) => {
  matrix(x); matrix(weight);
  if (x[0].length !== weight[0].length || bias.length !== weight.length || bias.some(v => !Number.isFinite(v))) throw new RangeError('Affine out × in weight and bias dimensions disagree.');
  return x.map(row => weight.map((w, i) => dot(row, w) + bias[i]));
};
export function crossBlock(readers, memory, state, heads, allowed) {
  const query = affine(readers, state.qWeight, state.qBias), key = affine(memory, state.kWeight, state.kBias), value = affine(memory, state.vWeight, state.vBias);
  const keyWidth = query[0].length / heads, valueWidth = value[0].length / heads;
  if (!Number.isInteger(heads) || heads < 1 || !Number.isInteger(keyWidth) || !Number.isInteger(valueWidth) || key[0].length !== query[0].length) throw new RangeError('Projected matching/value widths must divide into whole heads.');
  if (state.oWeight.length !== readers[0].length || state.oWeight[0].length !== value[0].length) throw new RangeError('Output map must send the joined carried width back to the reader width.');
  const split = (x, h, width) => x.map(row => row.slice(h * width, (h + 1) * width));
  const reads = Array.from({ length: heads }, (_, h) => attention(split(query, h, keyWidth), split(key, h, keyWidth), split(value, h, valueWidth), allowed));
  if (reads.some(read => read.output.some(row => row === null))) return { readers, memory, state, heads, reads, error: 'Every reader needs at least one permitted donor.' };
  const joined = readers.map((_, i) => reads.flatMap(read => read.output[i]));
  return { readers, memory, state, heads, reads, joined, output: affine(joined, state.oWeight, state.oBias) };
}
export function crossBlockPullback(tape, credit) {
  if (tape.error) throw new RangeError(tape.error);
  matrix(credit);
  const dJoined = matmul(credit, tape.state.oWeight), width = tape.reads[0].value[0].length;
  const heads = tape.reads.map((read, h) => pullback(read, dJoined.map(row => row.slice(h * width, (h + 1) * width))));
  const join = field => tape.readers.map((_, i) => heads.flatMap(head => head[field][i]));
  const dQ = join('dQuery'), dK = tape.memory.map((_, i) => heads.flatMap(head => head.dKey[i])), dV = tape.memory.map((_, i) => heads.flatMap(head => head.dValue[i]));
  const dReaders = matmul(dQ, tape.state.qWeight), memoryK = matmul(dK, tape.state.kWeight), memoryV = matmul(dV, tape.state.vWeight);
  const biasCredit = x => transpose(x).map(sum);
  return { heads, dJoined, dQ, dK, dV, dReaders, dMemory: memoryK.map((row, i) => row.map((v, j) => v + memoryV[i][j])),
    dQWeight: matmul(transpose(dQ), tape.readers), dQBias: biasCredit(dQ),
    dKWeight: matmul(transpose(dK), tape.memory), dKBias: biasCredit(dK),
    dVWeight: matmul(transpose(dV), tape.memory), dVBias: biasCredit(dV),
    dOWeight: matmul(transpose(credit), tape.joined), dOBias: biasCredit(credit) };
}
export function exactFixture(readers = 2, donors = 3) {
  if (!Number.isInteger(readers) || readers < 2 || readers > 4 || !Number.isInteger(donors) || donors < 2 || donors > 6) throw new RangeError('Constructed editor retains 2–4 readers and 2–6 donors.');
  return { query: Array.from({ length: readers }, (_, i) => i === 0 ? [Math.SQRT2, 0] : i === 1 ? [0, Math.SQRT2] : [0, 0]),
    key: Array.from({ length: donors }, (_, i) => i === 0 ? [Math.log(2), 0] : i === 1 ? [0, Math.log(2)] : [0, 0]),
    value: Array.from({ length: donors }, (_, i) => i === 0 ? [2, 0] : i === 1 ? [0, 4] : i === 2 ? [2, 2] : [0, 0]),
    allowed: Array.from({ length: readers }, () => Array(donors).fill(true)) };
}
// Surviving IDs/coordinates/permissions stay unchanged. New readers/donors start with
// explicit zero coordinates and all permissions allowed, as the editor explains.
export function resizeFixture(previous, readers, donors) {
  const next = exactFixture(readers, donors);
  for (const name of ['query', 'key', 'value']) next[name] = next[name].map((row, i) => previous[name][i] ? [...previous[name][i]] : (name === 'query' || name === 'key' || name === 'value' ? [0, 0] : row));
  next.allowed = next.allowed.map((row, i) => row.map((v, j) => previous.allowed[i]?.[j] ?? v));
  return next;
}
export function counts({ readers, donors, keyWidth, valueWidth, heads = 1 }) {
  const vals = [readers, donors, keyWidth, valueWidth, heads];
  if (vals.some(v => !Number.isInteger(v) || v < 1)) throw new RangeError('Counts and widths must be positive integers.');
  return { scoreMACs: heads * readers * donors * keyWidth, readMACs: heads * readers * donors * valueWidth,
    totalMACs: heads * readers * donors * (keyWidth + valueWidth), weights: heads * readers * donors };
}
export function causalAvailability(readers, donors) {
  if (readers > donors) throw new RangeError('The prefix comparison needs at least as many donors as readers.');
  return Array.from({ length: readers }, (_, i) => Array.from({ length: donors }, (_, j) => j <= i));
}
export function finiteDepthCredit({ directValue = 2, earlierValue = 1, layers = 2, carry = 1 }) {
  // First cross read follows the first self read. Only a later self read can
  // convey that earlier text state, using actual scalar additions here.
  const steps = [{ operation: 'layer1 self', earlier: 0, later: 0 },
    { operation: 'layer1 cross', earlier: earlierValue, later: directValue }];
  for (let l = 2; l <= layers; l++) {
    const prev = steps.at(-1);
    steps.push({ operation: `layer${l} self`, earlier: prev.earlier, later: prev.later + carry * prev.earlier });
    steps.push({ operation: `layer${l} cross`, earlier: steps.at(-1).earlier, later: steps.at(-1).later + directValue });
  }
  return { steps, later: steps.at(-1).later, indirectContribution: layers > 1 ? (layers - 1) * carry * earlierValue : 0 };
}
