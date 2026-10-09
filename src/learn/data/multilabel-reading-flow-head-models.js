// Atomic constructed head arithmetic, never a fitted program replay.
export const headInputs = Object.freeze([1, -1]);
export const headWeights = Object.freeze([[1, -1, .5], [.5, 1, -.5]]);
export const initialHeadBiases = () => [0, .5, -1];
export function binarySigmoid(logit) {
  return logit >= 0 ? 1 / (1 + Math.exp(-logit)) : Math.exp(logit) / (1 + Math.exp(logit));
}
export function constructedHeads(biases = initialHeadBiases()) {
  if (biases.length !== 3 || biases.some(value => !Number.isFinite(value) || value < -5 || value > 5)) throw new Error('Use three head biases in [−5, 5].');
  return biases.map((bias, output) => {
    const products = headInputs.map((value, input) => value * headWeights[input][output]);
    const logit = products.reduce((sum, value) => sum + value, bias);
    return { output, bias, weights: headWeights.map(row => row[output]), products, logit, probability: binarySigmoid(logit), decision: Number(logit >= 0) };
  });
}
export function atomicBinaryLoss(logit = 0, target = 1) {
  if (!Number.isFinite(logit) || logit < -100 || logit > 100 || (target !== 0 && target !== 1)) throw new Error('Use logit −100…100 and target 0 or 1.');
  const probability = binarySigmoid(logit);
  const loss = Math.max(logit, 0) - target * logit + Math.log1p(Math.exp(-Math.abs(logit)));
  const residual = probability - target;
  return { logit, target, probability, loss, residual, biasGradient: residual, slopeGradients: headInputs.map(value => value * residual) };
}
export const observedHeadDesign = Object.freeze([[1, -1], [1, 0], [1, 1], [1, 2]]);
export const observedHeadTargets = Object.freeze([[0, 1], [0, 0], [1, 1], [1, 0]]);
export const initialObservedHeadMask = () => [[true, true], [true, false], [true, true], [false, true]];
export function zeroWeightObservedHead(mask, output = 0) {
  if (![0, 1].includes(output) || mask.length !== 4 || mask.some(row => row.length !== 2 || row.some(value => typeof value !== 'boolean'))) throw new Error('Align four rows and two boolean output-mask columns.');
  const rows = observedHeadDesign.map((design, index) => {
    const target = observedHeadTargets[index][output];
    return { id: index, design: [...design], target, observed: mask[index][output], probability: .5, residual: .5 - target,
      products: design.map(value => value * (.5 - target)) };
  });
  const known = rows.filter(row => row.observed);
  const counts = [known.filter(row => row.target === 0).length, known.filter(row => row.target === 1).length];
  const gradientSums = [0, 1].map(coordinate => known.reduce((sum, row) => sum + row.products[coordinate], 0));
  const gradient = known.length ? gradientSums.map(value => value / known.length) : [null, null];
  return { output, rows, count: known.length, counts, gradientSums, gradient, lambda: .1, C: known.length ? 1 / (known.length * .1) : null,
    fittingStatus: !known.length ? 'empty' : counts.includes(0) ? 'one-class' : 'two-class' };
}
