import { dot, multiply, squaredLength, transpose } from './pca-geometry.js';

export const rangeTable = [[-2, 0, 1], [-1, 1, -1], [1, -1, -1], [2, 0, 1]];
export const rangeProbe = [[1, 0, 1], [0, 1, 1], [1, 1, 0]];

// Tiny bounded drawing engine; the downloadable general implementation uses
// maintained reduced QR and direct SVD. Two reorthogonalization passes avoid
// treating a nearly dependent probe column as a fresh unit direction.
export function reducedOrthonormalColumns(matrix) {
  const columns = transpose(matrix);
  const basis = [];
  const largest = Math.max(...columns.map(column => Math.sqrt(squaredLength(column))), 0);
  for (const original of columns) {
    const column = [...original];
    for (let repeat = 0; repeat < 2; repeat++) {
      for (const previous of basis) {
        const product = dot(column, previous);
        for (let index = 0; index < column.length; index++) column[index] -= product * previous[index];
      }
    }
    const norm = Math.sqrt(squaredLength(column));
    if (norm > 1e-12 * largest) basis.push(column.map(value => value / norm));
  }
  return basis.length ? transpose(basis) : matrix.map(() => []);
}

export function tinyDirectSvd(matrix) {
  const columns = transpose(matrix).map(column => [...column]);
  const dimension = columns.length;
  const directions = Array.from({ length: dimension }, (_, index) =>
    Array.from({ length: dimension }, (_, column) => Number(index === column)));
  for (let sweep = 0; sweep < 60; sweep++) {
    let changed = false;
    for (let left = 0; left < dimension; left++) {
      for (let right = left + 1; right < dimension; right++) {
        const alpha = squaredLength(columns[left]);
        const beta = squaredLength(columns[right]);
        const cross = dot(columns[left], columns[right]);
        if (alpha === 0 || beta === 0 || Math.abs(cross) <= 1e-14 * Math.sqrt(alpha) * Math.sqrt(beta)) continue;
        const zeta = (beta - alpha) / (2 * cross);
        const tangent = (zeta >= 0 ? 1 : -1) / (Math.abs(zeta) + Math.hypot(1, zeta));
        const cosine = 1 / Math.hypot(1, tangent);
        const sine = cosine * tangent;
        for (const pair of [columns, directions]) {
          const oldLeft = [...pair[left]];
          const oldRight = [...pair[right]];
          pair[left] = oldLeft.map((value, index) => cosine * value - sine * oldRight[index]);
          pair[right] = oldLeft.map((value, index) => sine * value + cosine * oldRight[index]);
        }
        changed = true;
      }
    }
    if (!changed) break;
    if (sweep === 59) throw new Error('Tiny drawing SVD exhausted its bounded rotation budget');
  }
  return columns.map((column, index) => ({ singular: Math.sqrt(squaredLength(column)),
    direction: directions[index], left: column })).sort((a, b) => b.singular - a.singular);
}

export function rangeFinder(powers, oversampling) {
  const ell = Math.min(1 + oversampling, 3);
  const omega = rangeProbe.map(row => row.slice(0, ell));
  const initial = multiply(rangeTable, omega);
  let q = reducedOrthonormalColumns(initial);
  const stages = [{ name: 'Y = AΩ', matrix: initial }, { name: 'Q = QR(Y)', matrix: q }];
  for (let repeat = 0; repeat < powers; repeat++) {
    const z = multiply(transpose(rangeTable), q);
    const qz = reducedOrthonormalColumns(z);
    const y = multiply(rangeTable, qz);
    q = reducedOrthonormalColumns(y);
    stages.push({ name: `Power${repeat + 1}: AᵀQ`, matrix: z },
      { name: `Power${repeat + 1}: QR(AᵀQ)`, matrix: qz },
      { name: `Power${repeat + 1}: A QR(AᵀQ)`, matrix: y },
      { name: `Power${repeat + 1}: QR return`, matrix: q });
  }
  const small = multiply(transpose(q), rangeTable);
  const singular = tinyDirectSvd(small);
  const direction = singular[0].direction;
  const scores = rangeTable.map(row => dot(row, direction));
  const reconstructed = scores.map(score => direction.map(value => score * value));
  const total = rangeTable.reduce((sum, row) => sum + squaredLength(row), 0);
  const loss = rangeTable.reduce((sum, row, index) => sum + row.reduce((inner, value, column) =>
    inner + (value - reconstructed[index][column]) ** 2, 0), 0);
  const qtq = multiply(transpose(q), q);
  const orthogonality = Math.sqrt(qtq.reduce((sum, row, index) => sum + row.reduce((inner, value, column) =>
    inner + (value - Number(index === column)) ** 2, 0), 0));
  return { ell, omega, stages, q, small, singular, direction, scores, reconstructed,
    relativeResidual: Math.sqrt(loss / total), orthogonality, passes: 2 * powers + 2 };
}

export function pixelDecode(a, b, kept) {
  const mean = Array(9).fill(.5);
  const patterns = [[Math.SQRT1_2, -Math.SQRT1_2, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, Math.SQRT1_2, -Math.SQRT1_2, 0]];
  const original = mean.map((value, index) => value + a * patterns[0][index] + b * patterns[1][index]);
  const decoded = mean.map((value, index) => value + a * patterns[0][index] + (kept === 2 ? b * patterns[1][index] : 0));
  const residual = original.map((value, index) => value - decoded[index]);
  return { mean, patterns, original, decoded, residual, loss: squaredLength(residual) };
}

export function batchMeans(nextMean) {
  const oldMean = [-1, 0];
  const batchMean = [nextMean, 0];
  const combinedMean = oldMean.map((value, index) => value + .5 * (batchMean[index] - value));
  const correction = oldMean.map((value, index) => value - batchMean[index]);
  const scatter = correction.map(value => correction.map(other => value * other));
  return { oldMean, batchMean, combinedMean, correction, scatter,
    stack: [[0, 0], [0, 0], [0, 0], [0, 0], correction] };
}
