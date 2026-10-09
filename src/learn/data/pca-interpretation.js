import { centered, diagonal, dot, multiply, originalRows, thinSvdFixture, transpose } from './pca-geometry.js';

export function biplotFactors(gamma, reverseFirst = false) {
  const signs = [reverseFirst ? -1 : 1, 1];
  const singular = [Math.sqrt(18), Math.sqrt(2)];
  const records = thinSvdFixture.u.map(row => row.map((value, index) =>
    value * singular[index] ** gamma * signs[index]));
  const features = transpose(thinSvdFixture.vh).map(row => row.map((value, index) =>
    value * singular[index] ** (1 - gamma) * signs[index]));
  const reconstructed = multiply(records, transpose(features));
  const target = centered(originalRows).rows;
  const loss = reconstructed.reduce((sum, row, index) => sum + row.reduce((inner, value, column) =>
    inner + (value - target[index][column]) ** 2, 0), 0);
  return { records, features, reconstructed, target, loss, gamma, signs };
}

export function labelledRectangle(spread, axis) {
  const rows = [[-spread, -1], [-spread, 1], [spread, -1], [spread, 1]];
  const coordinates = rows.map(row => axis === 'both' ? row : [row[axis === 'PC1' ? 0 : 1], 0]);
  const ratio = axis === 'both' ? 1 : (axis === 'PC1' ? spread ** 2 : 1) / (spread ** 2 + 1);
  return { rows, coordinates, labels: rows.map(row => row[1] > 0 ? 'positive' : 'negative'), ratio };
}

export function coefficientCorrelation() {
  const coefficient = diagonal[0];
  const covariance = [[10 / 3, 8 / 3], [8 / 3, 10 / 3]];
  const numerator = dot(covariance[0], diagonal);
  const featureDeviation = Math.sqrt(10 / 3);
  const scoreDeviation = Math.sqrt(6);
  return { coefficient, numerator, featureDeviation, scoreDeviation,
    correlation: numerator / (featureDeviation * scoreDeviation) };
}
