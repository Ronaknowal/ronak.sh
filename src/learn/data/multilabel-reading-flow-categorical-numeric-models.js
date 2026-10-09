export const categoricalIllustration = {
  provenance: 'Constructed interface illustration, not fitted categorical.py probabilities',
  outputs: [
    { name: 'Fruit', classes: ['apple', 'orange', 'pear'], probabilities: [.6, .25, .15], colors: ['#f0b45b', '#ef8ca4', '#bc9aff'] },
    { name: 'Condition', classes: ['damaged', 'fresh'], probabilities: [.2, .8], colors: ['#ef8ca4', '#59cbd3'] },
  ],
};

export const legalCubeStates = Array.from({ length: 8 }, (_, index) => ({
  index, bits: [index >> 2 & 1, index >> 1 & 1, index & 1], key: index.toString(2).padStart(3, '0'),
}));
export const constraintMasses = [.2, .15, .05, .3, .1, .05, .1, .05];

export function legalVector(bits, rule) {
  if (!Array.isArray(bits) || bits.length !== 3 || bits.some(bit => bit !== 0 && bit !== 1)) throw new Error('Use a known three-bit answer.');
  const implication = !bits[2] || Boolean(bits[0]);
  const exclusive = !(bits[0] && bits[1]);
  if (rule === 'implication') return implication;
  if (rule === 'exclusive') return exclusive;
  if (rule === 'both') return implication && exclusive;
  if (rule === 'conflict') return Boolean(bits[0]) && !bits[0];
  throw new Error('Choose a declared rule.');
}

export function constrainedCube(rule = 'implication', selected = 3) {
  if (!Number.isInteger(selected) || selected < 0 || selected > 7) throw new Error('Choose an actual cube vertex.');
  const states = legalCubeStates.map(row => ({ ...row, legal: legalVector(row.bits, rule), mass: constraintMasses[row.index] }));
  const feasible = states.filter(row => row.legal);
  const feasibleMass = feasible.reduce((sum, row) => sum + row.mass, 0);
  const best = feasible.reduce((winner, row) => winner === null || row.mass > winner.mass ? row : winner, null);
  const candidate = states[selected];
  const repairBits = [...candidate.bits];
  if (repairBits[2]) repairBits[0] = 1;
  const repairIndex = repairBits[0] * 4 + repairBits[1] * 2 + repairBits[2];
  return { states, feasible, feasibleMass, best, candidate, repair: states[repairIndex], conditional: states.map(row => row.legal && feasibleMass > 0 ? row.mass / feasibleMass : null) };
}

// Explicit supplied arithmetic witness. These are not rows/predictions from
// the preserved 120-row fitted regression experiment printed in the prose.
export const unitResidualWitness = {
  provenance: 'Two supplied observed/predicted pairs for first-use residual arithmetic; no fitted or held-out result',
  units: ['°C', 'Wh'], observed: [[20, 100], [22, 110]], predicted: [[21, 103], [21, 107]],
};

export function residualArithmetic(observed, predicted) {
  if (!Array.isArray(observed) || !observed.length || !Array.isArray(predicted) || observed.length !== predicted.length || observed.some((row, i) => !Array.isArray(row) || row.length !== 2 || !Array.isArray(predicted[i]) || predicted[i].length !== 2 || row.some(value => !Number.isFinite(value)) || predicted[i].some(value => !Number.isFinite(value)))) throw new Error('Align finite rows with two declared numerical outputs.');
  const residuals = predicted.map((row, i) => row.map((value, j) => value - observed[i][j]));
  const sse = [0, 1].map(j => residuals.reduce((sum, row) => sum + row[j] ** 2, 0));
  return { residuals, sse, mse: sse.map(value => value / observed.length), rmse: sse.map(value => Math.sqrt(value / observed.length)) };
}

export function numericForwardTrace(saved, rowIndex, output) {
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= saved.inputs.length || !Number.isInteger(output) || output < 0 || output > 1) throw new Error('Choose a recorded row and output column.');
  const meanX = [0, 1, 2].map(j => saved.inputs.reduce((sum, row) => sum + row[j], 0) / saved.inputs.length);
  const meanY = [0, 1].map(j => saved.targets.reduce((sum, row) => sum + row[j], 0) / saved.targets.length);
  const centeredX = saved.inputs.map(row => row.map((value, j) => value - meanX[j]));
  const centeredY = saved.targets.map(row => row.map((value, j) => value - meanY[j]));
  const gram = [0, 1, 2].map(j => [0, 1, 2].map(k => centeredX.reduce((sum, row) => sum + row[j] * row[k], 0)));
  const cross = [0, 1, 2].map(j => [0, 1].map(k => centeredX.reduce((sum, row, i) => sum + row[j] * centeredY[i][k], 0)));
  const products = centeredX[rowIndex].map((value, j) => value * saved.olsWeights[j][output]);
  const centeredPrediction = products.reduce((sum, value) => sum + value, 0);
  const prediction = saved.inputs[rowIndex].reduce((sum, value, j) => sum + value * saved.olsWeights[j][output], saved.olsIntercept[output]);
  return { meanX, meanY, centeredX, centeredY, gram, cross, products, centeredPrediction, prediction, restored: centeredPrediction + meanY[output] };
}

export function rootAggregation(first, second) {
  if (![first, second].every(value => Number.isFinite(value) && value >= 0 && value <= 100)) throw new Error('Use two MSE values in the declared 0–100 domain.');
  const roots = [Math.sqrt(first), Math.sqrt(second)];
  return { roots, rootsThenMean: (roots[0] + roots[1]) / 2, mean: (first + second) / 2, meanThenRoot: Math.sqrt((first + second) / 2) };
}
