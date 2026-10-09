import { dot, squaredLength } from './pca-geometry.js';
import { tinyDirectSvd } from './pca-computation.js';

export const kernelTraining = [-1, 0, 1];
export const kernelFeatures = [1, 0, 1];
export const kernelMeans = [2 / 3, 0, 2 / 3];
export const kernelGrandMean = 4 / 9;

export function kernelQuery(value) {
  const feature = value ** 2;
  const raw = kernelFeatures.map(training => feature * training);
  const ownMean = raw.reduce((sum, entry) => sum + entry, 0) / 3;
  const centered = raw.map((entry, index) => entry - ownMean - kernelMeans[index] + kernelGrandMean);
  const normalizedDirection = [.5, -1, .5];
  const products = centered.map((entry, index) => entry * normalizedDirection[index]);
  return { value, feature, raw, ownMean, centered, normalizedDirection, products,
    score: products.reduce((sum, entry) => sum + entry, 0) };
}

export function sparseServing(ridge) {
  const atoms = [[1, 0], [Math.SQRT1_2, Math.SQRT1_2]];
  const row = [1, 1];
  const naive = atoms.map(atom => dot(row, atom));
  const gram = [[1 + ridge, Math.SQRT1_2], [Math.SQRT1_2, 1 + ridge]];
  const determinant = (1 + ridge) ** 2 - .5;
  const coefficients = [((1 + ridge) * naive[0] - Math.SQRT1_2 * naive[1]) / determinant,
    ((1 + ridge) * naive[1] - Math.SQRT1_2 * naive[0]) / determinant];
  function decode(values) {
    return row.map((_, column) => values.reduce((sum, value, index) => sum + value * atoms[index][column], 0));
  }
  return { atoms, row, naive, naiveDecoded: decode(naive), gram, determinant,
    coefficients, decoded: decode(coefficients), dependentGram: [[1 + ridge, 1], [1, 1 + ridge]],
    dependentStatus: ridge === 0 ? 'singular; multiple coefficients; minimum-norm route required' : 'positive ridge makes the dependent Gram invertible' };
}

export function softThreshold(value, threshold) {
  return Math.sign(value) * Math.max(Math.abs(value) - threshold, 0);
}

export function singularThreshold(matrix, threshold) {
  if (threshold === 0) return matrix.map(row => [...row]);
  const factors = tinyDirectSvd(matrix);
  return matrix.map((row, index) => row.map((_, column) => factors.reduce((sum, factor) => {
    if (factor.singular === 0) return sum;
    return sum + factor.left[index] / factor.singular * Math.max(factor.singular - threshold, 0) * factor.direction[column];
  }, 0)));
}

export function thresholdComparison(threshold) {
  const matrix = [[2, 1], [1, 2]];
  const values = [Math.max(3 - threshold, 0), Math.max(1 - threshold, 0)];
  const svt = [[(values[0] + values[1]) / 2, (values[0] - values[1]) / 2],
    [(values[0] - values[1]) / 2, (values[0] + values[1]) / 2]];
  return { matrix, threshold, singular: [3, 1], shrunk: values,
    soft: matrix.map(row => row.map(value => softThreshold(value, threshold))), svt };
}

export function pcpFirstStep() {
  const observed = [[4, 1, 1], [1, 1, 1], [1, 1, 1]];
  const low = singularThreshold(observed, 1);
  const sparseOperand = observed.map((row, index) => row.map((value, column) => value - low[index][column]));
  const sparse = sparseOperand.map(row => row.map(value => softThreshold(value, .5)));
  const residual = sparseOperand.map((row, index) => row.map((value, column) => value - sparse[index][column]));
  return { observed, lowOperand: observed, low, sparseOperand, sparse, dual: residual,
    primal: Math.sqrt(residual.reduce((sum, row) => sum + squaredLength(row), 0)),
    dualChange: Math.sqrt(sparse.reduce((sum, row) => sum + squaredLength(row), 0)) };
}
