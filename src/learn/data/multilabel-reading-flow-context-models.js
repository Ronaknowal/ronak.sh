import { binarySigmoid } from './multilabel-reading-flow-head-models.js';

const probability = value => Number.isFinite(value) && value >= 0 && value <= 1;
export const binaryPairs = Object.freeze([[0, 0], [0, 1], [1, 0], [1, 1]]);
export function independentContextMass(rate) {
  if (!probability(rate)) throw Error('Use a context rate from zero to one.');
  return [(1 - rate) ** 2, (1 - rate) * rate, rate * (1 - rate), rate ** 2];
}
export function pooledContext(low = .1, high = .9, share = .5) {
  if (![low, high, share].every(probability)) throw Error('Use low, high and mixture share from zero to one.');
  const lowMass = independentContextMass(low);
  const highMass = independentContextMass(high);
  const masses = lowMass.map((mass, index) => (1 - share) * mass + share * highMass[index]);
  const marginal = (1 - share) * low + share * high;
  return { low, high, share, lowMass, highMass, masses, marginal,
    conditional: marginal === 0 ? null : masses[3] / marginal,
    covariance: masses[3] - marginal ** 2 };
}

export function entropyOfMasses(masses) {
  return -masses.reduce((sum, mass) => sum + (mass > 0 ? mass * Math.log2(mass) : 0), 0);
}
export const entropyRows = Object.freeze([
  { id: 0, x: 0, vector: [0, 0] }, { id: 1, x: 1, vector: [0, 0] },
  { id: 2, x: 2, vector: [1, 1] }, { id: 3, x: 3, vector: [1, 1] },
]);
export function rowEntropies(rows) {
  if (!rows.length) throw Error('An entropy bucket must contain at least one row.');
  const fractions = [0, 1].map(output => rows.reduce((sum, row) => sum + row.vector[output], 0) / rows.length);
  const marginalEntropies = fractions.map(rate => entropyOfMasses([1 - rate, rate]));
  const masses = binaryPairs.map(vector => rows.filter(row => row.vector.every((bit, index) => bit === vector[index])).length / rows.length);
  return { fractions, marginalEntropies, sum: marginalEntropies.reduce((a, b) => a + b, 0),
    masses, joint: entropyOfMasses(masses) };
}
export function entropySplit(cut = 1.5) {
  if (![.5, 1.5, 2.5].includes(cut)) throw Error('Choose a threshold between adjacent rows.');
  const parent = rowEntropies(entropyRows);
  const children = [entropyRows.filter(row => row.x <= cut), entropyRows.filter(row => row.x > cut)]
    .map(rows => ({ rows, fraction: rows.length / entropyRows.length, ...rowEntropies(rows) }));
  const weightedSum = children.reduce((sum, child) => sum + child.fraction * child.sum, 0);
  const weightedJoint = children.reduce((sum, child) => sum + child.fraction * child.joint, 0);
  return { cut, parent, children, weightedSum, weightedJoint,
    gainSum: parent.sum - weightedSum, gainJoint: parent.joint - weightedJoint };
}

export function pairLogLinear(interaction = Math.log(4), observed = 3) {
  if (!Number.isFinite(interaction) || interaction < -3 || interaction > 3 || !Number.isInteger(observed) || observed < 0 || observed > 3) {
    throw Error('Use interaction −3 to 3 and one of the four observed vectors.');
  }
  const features = binaryPairs.map(([a, b]) => [a, b, a * b]);
  const scores = features.map(row => interaction * row[2]);
  const masses = scores.map(Math.exp);
  const normalizer = masses.reduce((a, b) => a + b, 0);
  const probabilities = masses.map(value => value / normalizer);
  const expectation = [0, 1, 2].map(index => features.reduce((sum, row, state) => sum + probabilities[state] * row[index], 0));
  const covariance = [0, 1, 2].map(i => [0, 1, 2].map(j => features.reduce((sum, row, state) =>
    sum + probabilities[state] * (row[i] - expectation[i]) * (row[j] - expectation[j]), 0)));
  return { interaction, observed, features, scores, masses, normalizer, probabilities, expectation, covariance,
    gradient: expectation.map((value, index) => value - features[observed][index]),
    loss: Math.log(normalizer) - scores[observed] };
}

// Finite saved-state forward arithmetic only. The source parameters stay literal in observations.
export function serveSavedMember(state, query) {
  const scaled = query.map((value, index) => (value - state.scaler_mean[index]) / state.scaler_scale[index]);
  const prefix = [];
  const stages = state.stages.map(stage => {
    const features = [...scaled, ...prefix];
    if (features.length !== stage.feature_width || stage.weights.length !== features.length + 1) throw Error('Saved stage width mismatch.');
    const products = features.map((feature, index) => feature * stage.weights[index + 1]);
    const logit = products.reduce((sum, value) => sum + value, stage.weights[0]);
    const positive = binarySigmoid(logit);
    const bit = Number(positive >= .5);
    const factor = bit ? positive : 1 - positive;
    const result = { column: stage.column, features, prefix: [...prefix], products,
      bias: stage.weights[0], weights: stage.weights.slice(1), logit, positive, bit, factor };
    prefix.push(bit);
    return result;
  });
  const restored = [0, 1, 2].map(column => prefix[state.order.indexOf(column)]);
  return { scaled, stages, restored, pathProbability: stages.reduce((mass, stage) => mass * stage.factor, 1) };
}
export function jointSavedMember(state, query) {
  const scaled = query.map((value, index) => (value - state.scaler_mean[index]) / state.scaler_scale[index]);
  const leaves = Array.from({ length: 8 }, (_, index) => [(index >> 2) & 1, (index >> 1) & 1, index & 1]);
  const probabilities = leaves.map(vector => {
    const prefix = [];
    return state.stages.reduce((mass, stage) => {
      const features = [...scaled, ...prefix];
      const positive = binarySigmoid(features.reduce((sum, feature, index) => sum + feature * stage.weights[index + 1], stage.weights[0]));
      const bit = vector[stage.column];
      prefix.push(bit);
      return mass * (bit ? positive : 1 - positive);
    }, 1);
  });
  return { leaves, probabilities };
}
