// Constructed section-four mechanisms. These never fit or alter the saved study.
import { scalarGat, sageScalar, softmax } from './message-passing-models.js';

export const aggregationNumber = (value, digits = 6) => {
  if (value === null || value === undefined) return 'undefined';
  if (value === 0) return '0';
  if (!Number.isFinite(value)) return 'unavailable';
  const rounded = Number(value.toFixed(digits));
  return (rounded === 0 ? value.toExponential(3) : String(rounded)).replaceAll('-', '−');
};

const total = values => values.reduce((sum, value) => sum + value, 0);
const dot = (left, right) => total(left.map((value, index) => value * right[index]));
export const stableSigmoid = value => value >= 0
  ? 1 / (1 + Math.exp(-value))
  : Math.exp(value) / (1 + Math.exp(value));
export const stableSoftplus = value => Math.max(value, 0) + Math.log1p(Math.exp(-Math.abs(value)));
export const leakyValue = (value, slope = .2) => value >= 0 ? value : slope * value;

export function ownNeighborTrace(own, neighbors, selfWeight, neighborWeight) {
  return { ...sageScalar(own, neighbors, selfWeight, neighborWeight),
    own, neighbors: [...neighbors], count: neighbors.length, sum: total(neighbors),
    selfWeight, neighborWeight };
}

export function transformedPoolTrace(first = -2) {
  const donors = [first, 1, 3];
  const affine = donors.map(value => [value, -value]);
  const transformed = affine.map(row => row.map(value => Math.max(value, 0)));
  const pooled = [0, 1].map(channel => Math.max(...transformed.map(row => row[channel])));
  const winners = pooled.map((value, channel) => transformed.flatMap((row, index) => row[channel] === value ? [index] : []));
  const rawMaximum = Math.max(...donors);
  return { donors, affine, transformed, pooled, winners, rawMaximum,
    transformedRawMaximum: [Math.max(rawMaximum, 0), Math.max(-rawMaximum, 0)],
    encoded: donors.map(value => [value, 0]), weight: [[1, 0], [-1, 0]],
    postWeight: [[1, 0], [0, 1]] };
}

export function directionTrace(magnitude = 1) {
  const original = [3 * magnitude, 4 * magnitude];
  const scale = Math.max(...original.map(Math.abs));
  const scaled = scale === 0 ? [0, 0] : original.map(value => value / scale);
  const scaledLength = Math.hypot(...scaled);
  const unit = scaledLength === 0 ? [0, 0] : scaled.map(value => value / scaledLength);
  return { magnitude, original, length: Math.hypot(...original), unit,
    directionDefined: scale !== 0, unitLength: Math.hypot(...unit) };
}

// Matches ordered_example() in the preserved graph-aggregation-variants.py.
const inputWeights = [.4, .1, .6, .2];
const hiddenWeights = [.2, -.1, .3, .15];
const inputBias = [.1, .2, -.05, 0];
const hiddenBias = [-.02, .03, .04, -.01];
export function orderedNeighborTrace(first = 1, descending = false) {
  const occurrences = [{ id: 0, value: first }, { id: 1, value: 3 }, { id: 2, value: 5 }];
  if (descending) occurrences.reverse(); // Reverse this same list, not a value sort.
  let hidden = 0, cell = 0;
  const steps = occurrences.map((occurrence, position) => {
    const oldHidden = hidden, oldCell = cell;
    const affine = inputWeights.map((weight, gate) => weight * occurrence.value
      + hiddenWeights[gate] * oldHidden + inputBias[gate] + hiddenBias[gate]);
    const gates = [stableSigmoid(affine[0]), stableSigmoid(affine[1]), Math.tanh(affine[2]), stableSigmoid(affine[3])];
    cell = gates[1] * oldCell + gates[0] * gates[2];
    hidden = gates[3] * Math.tanh(cell);
    return { occurrence, position, oldHidden, oldCell, affine, gates, hidden, cell };
  });
  return { occurrences, steps, hidden, cell, weights: { inputWeights, hiddenWeights, inputBias, hiddenBias } };
}

export function graphMemoryTrace(retain = .5) {
  const old = [1, 2, 4], incoming = [2, 5, 2], receiver = 1, reset = .5;
  const candidateInput = .1 * incoming[receiver];
  const candidateRecurrent = .2 * old[receiver];
  const candidateArgument = candidateInput + reset * candidateRecurrent;
  const candidate = Math.tanh(candidateArgument);
  const oldProduct = retain * old[receiver], candidateProduct = (1 - retain) * candidate;
  return { old, incoming, receiver, reset, retain, candidateInput, candidateRecurrent,
    candidateArgument, candidate, oldProduct, candidateProduct, next: oldProduct + candidateProduct };
}

export function scoreStageTrace(state) {
  return scalarGat(state.senders, state.receivers, state.values, state.allowed, state.slope);
}

export function normalizedReadTrace(secondScore = Math.log(3), secondValue = 5) {
  const scores = [0, secondScore], values = [1, secondValue], maximum = Math.max(...scores);
  const shifted = scores.map(value => value - maximum), masses = shifted.map(Math.exp);
  const denominator = total(masses), coefficients = masses.map(value => value / denominator);
  const products = coefficients.map((value, index) => value * values[index]);
  return { scores, values, maximum, shifted, masses, denominator, coefficients, products, output: total(products) };
}

export const attentionHeadParameters = [
  { weight: [[1, 0], [0, 1]], receiverVector: [1, 0], senderVector: [1, 0] },
  { weight: [[0, 1], [1, 0]], receiverVector: [1, 0], senderVector: [0, 1] },
  { weight: [[1, 1], [1, -1]], receiverVector: [.5, .5], senderVector: [1, 0] },
];

export function paperAttentionTrace(features, head = 0) {
  const parameters = attentionHeadParameters[head];
  if (!parameters || features.length !== 3 || features.some(row => row.length !== 2 || row.some(value => !Number.isFinite(value)))) {
    throw new RangeError('Use three finite two-channel paper rows and a declared head.');
  }
  const projected = features.map(row => parameters.weight.map(weight => dot(weight, row)));
  const receiverTerms = projected.map(row => dot(parameters.receiverVector, row));
  const senderTerms = projected.map(row => dot(parameters.senderVector, row));
  const allowed = [[true, true, false], [true, true, true], [false, true, true]];
  const raw = receiverTerms.map(receiver => senderTerms.map(sender => receiver + sender));
  const scores = raw.map(row => row.map(value => leakyValue(value)));
  const maxima = scores.map((row, receiver) => Math.max(...row.filter((_, source) => allowed[receiver][source])));
  const shifted = scores.map((row, receiver) => row.map(value => value - maxima[receiver]));
  const masses = shifted.map((row, receiver) => row.map((value, source) => allowed[receiver][source] ? Math.exp(value) : 0));
  const denominators = masses.map(total);
  const coefficients = scores.map((row, receiver) => softmax(row, allowed[receiver]));
  const products = coefficients.map(row => row.map((coefficient, source) => projected[source].map(value => coefficient * value)));
  const output = products.map(rows => [0, 1].map(channel => total(rows.map(row => row[channel]))));
  return { parameters, features: features.map(row => [...row]), projected, receiverTerms,
    senderTerms, allowed, raw, scores, maxima, shifted, masses, denominators, coefficients, products, output };
}

export function graphHeadTrace(features, count = 2) {
  if (!Number.isInteger(count) || count < 1 || count > 3) throw new RangeError('Use one, two or three declared heads.');
  const heads = Array.from({ length: count }, (_, head) => paperAttentionTrace(features, head));
  const concatenated = features.map((_, node) => heads.flatMap(head => head.output[node]));
  const averaged = features.map((_, node) => [0, 1].map(channel => total(heads.map(head => head.output[node][channel])) / count));
  return { heads, concatenated, averaged, nodeCount: features.length, headCount: count, width: 2 };
}

export function dynamicAttentionTrace(receiver = -1) {
  const senders = [-1, 1], receiverProjection = [receiver, -receiver];
  const senderProjections = senders.map(value => [-value, value]);
  const pairSums = senderProjections.map(row => row.map((value, channel) => value + receiverProjection[channel]));
  const activated = pairSums.map(row => row.map(value => leakyValue(value)));
  const scoreProducts = activated.map(row => row.map(value => -1.25 * value));
  const scores = scoreProducts.map(total), coefficients = softmax(scores);
  const products = senderProjections.map((row, sender) => row.map(value => value * coefficients[sender]));
  return { receiver, senders, receiverProjection, senderProjections, pairSums, activated,
    scoreProducts, scores, coefficients, products, output: [0, 1].map(channel => total(products.map(row => row[channel]))) };
}

export function sampledContextTrace(negative = -1) {
  const anchor = 1, positive = 2, positiveScore = anchor * positive, negativeScore = anchor * negative;
  const positiveLikelihood = stableSigmoid(positiveScore), negativeLikelihood = stableSigmoid(-negativeScore);
  const positiveLoss = stableSoftplus(-positiveScore), negativeLoss = stableSoftplus(negativeScore);
  const positiveDerivative = -positive * stableSigmoid(-positiveScore);
  const negativeDerivative = negative * stableSigmoid(negativeScore);
  return { anchor, positive, negative, positiveScore, negativeScore, positiveLikelihood,
    negativeLikelihood, positiveLoss, negativeLoss, loss: positiveLoss + negativeLoss,
    positiveDerivative, negativeDerivative, derivative: positiveDerivative + negativeDerivative };
}
