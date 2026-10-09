import { angleDirection, diagonal, dot, multiply, perpendicular, projection, queryProjection, thinSvdFixture, transpose } from './pca-geometry.js';

export const squareRows = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

export function squareProjector(angle, kept) {
  const direction = angleDirection(angle);
  const state = projection(squareRows, direction, kept);
  const projector = direction.map((value, row) => direction.map((other, column) =>
    kept === 0 ? 0 : kept === 2 ? Number(row === column) : value * other));
  return { ...state, projector };
}

export function rankOneTables() {
  return [0, 1].map(component => thinSvdFixture.u.map(row =>
    thinSvdFixture.vh[component].map(value => row[component] * thinSvdFixture.singular[component][component] * value)));
}

export function whiteningState(kept) {
  const factors = [Math.sqrt(6), Math.sqrt(2 / 3)].slice(0, kept);
  const scores = thinSvdFixture.u.map(row => row.slice(0, kept).map((value, index) =>
    value * thinSvdFixture.singular[index][index]));
  const white = scores.map(row => row.map((value, index) => value / factors[index]));
  const restored = white.map(row => row.map((value, index) => value * factors[index]));
  const directions = [diagonal, perpendicular].slice(0, kept);
  return { factors, scores, white, restored, decoded: multiply(restored, directions),
    unwhitenedDecoded: multiply(scores, directions),
    sampleVariances: factors.map((_, index) => white.reduce((sum, row) => sum + row[index] ** 2, 0) / 3),
    populationVariances: factors.map((_, index) => white.reduce((sum, row) => sum + row[index] ** 2, 0) / 4) };
}

export function ppcaQuery(query) {
  const pca = queryProjection(query);
  const rhs = 2 * pca.score;
  const latentMean = rhs / 4.5;
  const decodedDisplacement = diagonal.map(value => 2 * latentMean * value);
  return { ...pca, rhs, latentMean, posteriorVariance: 1 / 9,
    posteriorDecoded: decodedDisplacement.map((value, index) => value + pca.mean[index]),
    posteriorDisplacement: decodedDisplacement };
}

export function denoisePoint(amount, parallel) {
  const clean = [2, 2];
  const noise = parallel ? [amount, amount] : [amount, -amount];
  const noisy = clean.map((value, index) => value + noise[index]);
  const score = dot(noisy, diagonal);
  const decoded = diagonal.map(value => value * score);
  return { clean, noise, noisy, decoded, cleanLoss: decoded.reduce((sum, value, index) =>
    sum + (value - clean[index]) ** 2, 0), inputLoss: decoded.reduce((sum, value, index) =>
    sum + (value - noisy[index]) ** 2, 0) };
}

export function covarianceEllipse(matrix) {
  const angle = .5 * Math.atan2(2 * matrix[0][1], matrix[0][0] - matrix[1][1]);
  const gap = Math.hypot(matrix[0][0] - matrix[1][1], 2 * matrix[0][1]);
  const trace = matrix[0][0] + matrix[1][1];
  return { degrees: angle * 180 / Math.PI, radii: [Math.sqrt((trace + gap) / 2), Math.sqrt((trace - gap) / 2)] };
}
