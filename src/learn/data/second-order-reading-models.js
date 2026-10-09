export const transpose = matrix => matrix[0].map((_, j) => matrix.map(row => row[j]));
export const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
export const multiply = (a, b) => a.map(row => transpose(b).map(column => dot(row, column)));
export const mv = (a, b) => a.map(row => dot(row, b));
export const scale = (a, factor) => a.map(row => row.map(v => factor * v));
export const add = (a, b) => a.map((row, i) => row.map((v, j) => v + b[i][j]));
export const outer = (a, b = a) => a.map(x => b.map(y => x * y));
export const kron = (a, b) => a.flatMap(row => b.map(inner => row.flatMap(v => inner.map(x => v * x))));
export const eye = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => Number(i === j)));
export function solve2(a, b) {
  const det = a[0][0] * a[1][1] - a[0][1] * a[1][0];
  if (Math.abs(det) < 1e-14) throw new RangeError('Singular two-coordinate solve');
  return [(a[1][1] * b[0] - a[0][1] * b[1]) / det, (-a[1][0] * b[0] + a[0][0] * b[1]) / det];
}
export function enumerateLayer(input, probabilities) {
  return [[0, 0], [0, 1], [1, 0], [1, 1]].map(outcome => {
    const mass = outcome.reduce((v, y, j) => v * (y ? probabilities[j] : 1 - probabilities[j]), 1);
    const u = outcome.map((y, j) => y - probabilities[j]);
    const score = outer(u, input);
    const flat = transpose(score).flat();
    return { outcome, mass, u, score, flat, outer: outer(flat) };
  });
}
export function matrixGeometryState(minus = 1, iteration = 0) {
  if (!Number.isFinite(minus) || minus < 0 || minus > 3 || !Number.isInteger(iteration) || iteration < 0 || iteration > 5) throw new RangeError('Use stretch 0..3 and integer iteration 0..5');
  const matrix = (plus, other) => [[(plus + other) / 2, (plus - other) / 2], [(plus - other) / 2, (plus + other) / 2]];
  const norm = Math.hypot(3, minus);
  const polynomial = s => 3.4445 * s - 4.775 * s ** 3 + 2.0315 * s ** 5;
  let plusGain = 3 / norm, minusGain = minus / norm;
  const frames = [];
  for (let i = 0; i <= 5; i += 1) {
    frames.push({ iteration: i, plusGain, minusGain, matrix: matrix(plusGain, minusGain) });
    plusGain = polynomial(plusGain); minusGain = polynomial(minusGain);
  }
  return { minus, iteration, raw: matrix(3, minus), rank: minus === 0 ? 1 : 2, norm, frames, current: frames[iteration], polar: matrix(1, minus === 0 ? 0 : 1), polarGains: [1, minus === 0 ? 0 : 1] };
}
