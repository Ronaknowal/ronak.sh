// Bounded browser arithmetic. No scientific programme or historical fit runs here.
export const SOURCE = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
export const IDS = ['A', 'B', 'C', 'D'];
export const ORDER = [0, 2, 1, 3];
export const SQRT2 = Math.sqrt(2);
export const WHITE = [[-SQRT2, 0], [0, -SQRT2], [0, SQRT2], [SQRT2, 0]];
export const MIXING = [[2, 1], [1, 2]];
export const K = [[1 / (3 * SQRT2), 1 / (3 * SQRT2)], [1 / SQRT2, -1 / SQRT2]];
export const Q = [[1 / SQRT2, 1 / SQRT2], [1 / SQRT2, -1 / SQRT2]];
export const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
export const add = (a, b) => a.map((value, i) => value + b[i]);
export const scale = (a, value) => a.map(v => v * value);
export const subtract = (a, b) => add(a, scale(b, -1));
export const multiply = (matrix, vector) => matrix.map(row => dot(row, vector));
export const norm = vector => Math.hypot(...vector);
export const direction = degrees => [Math.cos(degrees * Math.PI / 180), Math.sin(degrees * Math.PI / 180)];
export const rotated = (rows, angle) => {
  const [c, s] = direction(angle);
  return rows.map(([x, y]) => [c * x + s * y, -s * x + c * y]);
};
export function unit(vector) {
  const length = norm(vector);
  return !Number.isFinite(length) || length <= 1e-12 ? null : scale(vector, 1 / length);
}
export const movement = (a, b) => Math.max(0, Math.min(1, 1 - Math.abs(dot(a, b))));
export function crossWeight(a) {
  if (!Number.isFinite(a) || a < 0 || a > 2) throw Error('Cross-weight must be from 0 to 2.');
  const operator = [[2, a], [a, 2]];
  return { operator, rows: SOURCE.map(row => multiply(operator, row)), determinant: 4 - a * a,
    gain: 2 - a, condition: a === 2 ? null : (2 + a) / (2 - a), nullContrast: multiply(operator, [1, -1]) };
}
export function probability(q) {
  if (!Number.isFinite(q) || q < 0 || q > 1) throw Error('Dependence weight must be from 0 to 1.');
  const product = [[1/9, 2/9], [1/9, 2/9], [1/9, 2/9]];
  const dependent = [[0, 1/3], [1/3, 0], [0, 1/3]];
  const joint = product.map((row, i) => row.map((p, j) => (1 - q) * p + q * dependent[i][j]));
  const entropy = values => -values.flat().reduce((sum, p) => sum + (p === 0 ? 0 : p * Math.log(p)), 0);
  const jointEntropy = entropy(joint);
  const marginalEntropy = entropy([1/3, 1/3, 1/3]) + entropy([1/3, 2/3]);
  return { joint, product, covariance: 0, means: [0, 2/3], mi: marginalEntropy - jointEntropy,
    jointEntropy, marginalEntropy, conditional: joint[1].map(p => p * 3) };
}
export function projection(angle) {
  const w = direction(angle);
  const readings = SOURCE.map(row => dot(row, w));
  const atoms = [];
  for (const value of readings) {
    const atom = atoms.find(item => Math.abs(item.value - value) < 1e-12);
    if (atom) atom.mass += .25;
    else atoms.push({ value: Math.abs(value) < 1e-12 ? 0 : value, mass: .25 });
  }
  atoms.sort((a, b) => a.value - b.value);
  return { w, readings, atoms, kurtosis: -2 * w.reduce((sum, v) => sum + v ** 4, 0), variance: 1 };
}
export function cubicStep(w) {
  const rows = WHITE.map(z => {
    const y = dot(z, w);
    return { z, y, cube: y ** 3, contribution: scale(z, y ** 3) };
  });
  const average = rows.reduce((sum, row) => add(sum, scale(row.contribution, .25)), [0, 0]);
  const derivativeMean = rows.reduce((sum, row) => sum + 3 * row.y ** 2 / 4, 0);
  const correction = scale(w, derivativeMean);
  const raw = subtract(average, correction);
  const normalized = unit(raw);
  const aligned = normalized && dot(normalized, w) < 0 ? scale(normalized, -1) : normalized;
  return { rows, average, derivativeMean, correction, raw, normalized, aligned,
    movement: normalized ? movement(normalized, w) : null };
}
export function deflate(angle, exactParallel = false) {
  const p = [.6, .8];
  const candidate = exactParallel ? p : direction(angle);
  const overlap = scale(p, dot(candidate, p));
  const residual = subtract(candidate, overlap);
  return { p, candidate, overlap, residual, length: norm(residual), normalized: unit(residual) };
}
export function ambiguity(value, swap = false) {
  const scores = SOURCE.map(([s1, s2]) => swap ? [s2, value * s1] : [value * s1, s2]);
  if (value === 0) return { scores, decoder: null, correlations: swap ? [[0, null], [1, null]] : [[null, 0], [null, 1]], usable: false };
  const decoder = swap ? [[1, 2 / value], [2, 1 / value]] : [[2 / value, 1], [1 / value, 2]];
  return { scores, decoder, correlations: swap ? [[0, Math.sign(value)], [1, 0]] : [[Math.sign(value), 0], [0, 1]], usable: true,
    rows: scores.map(row => multiply(decoder, row)) };
}
export function lagModel(second) {
  if (!Number.isFinite(second) || second < 0 || second > .8) throw Error('Second lag must be from 0 to .8.');
  const diagonal = (.8 + second) / 2, off = (.8 - second) / 2;
  return { matrix: [[diagonal, off], [off, diagonal]], gap: .8 - second, resolved: second !== .8 };
}
export function delayedImpulse(delay) {
  if (!Number.isInteger(delay) || delay < 0 || delay > 2) throw Error('Use an integer delay from 0 to 2.');
  const s1 = [1, 0, 0, 0, 0, 0], s2 = [0, 1, 0, 0, 0, 0];
  const x1 = [...s1], x2 = [...s2];
  x1[1 + delay] += .5;
  x2[2] -= .25;
  return { s1, s2, x1, x2 };
}
export function leakage(epsilon) {
  return { mixed: -3 + 2 * epsilon, extra: [4 * epsilon, -2 * epsilon], error: [-4 * epsilon, 2 * epsilon], nuisance: [-6, 3] };
}
export const calibrate = count => (count + 32768) * 6553.6 / 65535 - 3276.8;
