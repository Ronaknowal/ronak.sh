// New arithmetic only. Historical numerical helpers and recorded fits stay owned
// by their original files. No optimizer or data-study campaign runs at import.
export { marginGeometry, supportMotion, softPairState, xorKernelState, xorScore,
  svmKernel, svmPairFixture, svmPairStep, svrTubeState, spectrumCounts,
  SVM_GEOMETRY_POINTS, SVM_XOR_POINTS, SVM_XOR_LABELS } from './support-vector-machines-models.js';

export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const sum = a => a.reduce((s, v) => s + v, 0);
export function finite(value, lo, hi, name) {
  if (!Number.isFinite(value) || value < lo || value > hi) throw new RangeError(`${name}: use a finite value in [${lo}, ${hi}].`);
  return value;
}
export function numericDraft(text, lo, hi, name, integer = false) {
  if (typeof text !== 'string' || !text.trim()) throw new RangeError(`${name}: enter a number; an empty field is not zero.`);
  const value = finite(Number(text), lo, hi, name);
  if (integer && !Number.isInteger(value)) throw new RangeError(`${name}: enter a whole number.`);
  return value;
}
export function hingeStep(lambda = .5, eta = .1) {
  finite(lambda, 0, 2, 'Lambda'); finite(eta, .001, 1, 'Eta');
  const x = [[-1, 0], [1, 1], [2, -1]], y = [-1, 1, 1], w = [.2, -.1], b = .1;
  const objective = (weights, bias) => lambda * dot(weights, weights) / 2 + sum(x.map((v, i) => Math.max(0, 1 - y[i] * (dot(v, weights) + bias)))) / 3;
  const scores = x.map(v => dot(v, w) + b), margins = scores.map((v, i) => v * y[i]);
  const seeds = margins.map((m, i) => m < 1 ? -y[i] / 3 : 0);
  const gw = w.map((v, d) => lambda * v + sum(x.map((row, i) => seeds[i] * row[d]))), gb = sum(seeds);
  const after = w.map((v, d) => v - eta * gw[d]), afterB = b - eta * gb;
  return { x, y, w, b, scores, margins, seeds, gw, gb, after, afterB, beforeObjective: objective(w, b), afterObjective: objective(after, afterB) };
}
export function epsilonStep() {
  const x = [[-1, 0], [.5, 1], [1.5, -.5], [.3, -.8]], y = [-.4, .6, 1.3, .2], w = [.35, -.12], b = .08, c = .7, epsilon = .2, eta = .02;
  const predictions = x.map(row => dot(row, w) + b), residuals = y.map((v, i) => v - predictions[i]);
  const seeds = residuals.map(r => Math.abs(r) > epsilon ? -c * Math.sign(r) : 0);
  const gw = w.map((v, d) => v + sum(x.map((row, i) => seeds[i] * row[d]))), gb = sum(seeds);
  return { x, y, w, b, c, epsilon, eta, predictions, residuals, seeds, gw, gb, after: w.map((v, i) => v - eta * gw[i]), afterB: b - eta * gb };
}
export function targetUnits(state, offset, scale) {
  finite(offset, -Number.MAX_VALUE, Number.MAX_VALUE, 'Offset'); finite(scale, Number.MIN_VALUE, Number.MAX_VALUE, 'Scale');
  const result = { slope: state.slope / scale, bias: (state.bias - offset) / scale, c: state.c / scale, epsilon: state.epsilon / scale,
    rows: state.rows.map(row => ({ ...row, target: (row.target - offset) / scale, prediction: (row.prediction - offset) / scale, centeredTarget: (row.target - state.bias) / scale, centeredPrediction: (row.prediction - state.bias) / scale, residual: row.residual / scale, excess: row.excess / scale })) };
  const values = [result.slope, result.bias, result.c, result.epsilon, ...result.rows.flatMap(r => [r.target, r.prediction, r.residual, r.excess])];
  if (!values.every(Number.isFinite) || result.c <= 0 || (state.epsilon > 0 && result.epsilon === 0) || (state.slope !== 0 && result.slope === 0)) throw new RangeError('Conversion exceeds finite arithmetic. The previous valid conversion remains visible.');
  result.objective = .5 * result.slope ** 2 + result.c * sum(result.rows.map(r => r.excess));
  if (!Number.isFinite(result.objective) || (state.objective > 0 && result.objective === 0)) throw new RangeError('Converted objective overflows or underflows finite arithmetic.');
  result.inversePredictions = result.rows.map(row => offset + scale * row.prediction);
  result.inverseError = Math.max(...result.inversePredictions.map((value, i) => Math.abs(value - state.rows[i].prediction)));
  return result;
}
export function featureMatrix(x) {
  if (!Array.isArray(x) || x.length < 1 || x.length > 100 || !Array.isArray(x[0]) || x[0].length < 1 || x[0].length > 20) throw new RangeError('Use 1–100 rows and 1–20 features.');
  const d = x[0].length;
  return x.map(row => { if (!Array.isArray(row) || row.length !== d) throw new RangeError('Every row must keep the same feature count.'); return row.map(v => finite(v, -1000, 1000, 'Coordinate')); });
}
export function rbfMatrix(left, right, gamma) {
  const a = featureMatrix(left), b = featureMatrix(right); finite(gamma, .0001, 10, 'Gamma');
  if (a[0].length !== b[0].length) throw new RangeError('Query and training feature counts must match.');
  return a.map(row => b.map(other => Math.exp(-gamma * sum(row.map((v, i) => (v - other[i]) ** 2)))));
}
// Cyclic Jacobi rotations: O(sweeps*m^3), O(m^2) owned state. Stops when the
// off-diagonal Frobenius norm is small, or reports a numerical limit explicitly.
export function symmetricSpectrum(matrix) {
  const n = matrix.length, a = matrix.map(row => [...row]), v = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
  if (n < 1 || n > 100 || a.some((row, i) => row.length !== n || row.some((x, j) => !Number.isFinite(x) || Math.abs(x - a[j]?.[i]) > 1e-12))) throw new RangeError('Use a finite symmetric 1–100 square matrix.');
  const scale = Math.max(1, Math.sqrt(sum(a.flat().map(x => x * x))));
  let residual = Infinity, sweeps = 0;
  for (; sweeps < 50; sweeps++) {
    residual = Math.sqrt(sum(a.flatMap((row, i) => row.map((x, j) => i === j ? 0 : x * x))));
    if (residual <= 1e-13 * scale) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p][q]; if (Math.abs(apq) <= 1e-15 * scale / n) continue;
      const tau = (a[q][q] - a[p][p]) / (2 * apq), t = tau === 0 ? 1 : Math.sign(tau) / (Math.abs(tau) + Math.hypot(1, tau));
      const c = 1 / Math.hypot(1, t), s = t * c;
      a[p][p] -= t * apq; a[q][q] += t * apq; a[p][q] = a[q][p] = 0;
      for (let k = 0; k < n; k++) {
        if (k !== p && k !== q) { const kp = a[k][p], kq = a[k][q]; a[k][p] = a[p][k] = c * kp - s * kq; a[k][q] = a[q][k] = s * kp + c * kq; }
        const vp = v[k][p], vq = v[k][q]; v[k][p] = c * vp - s * vq; v[k][q] = s * vp + c * vq;
      }
    }
  }
  residual = Math.sqrt(sum(a.flatMap((row, i) => row.map((x, j) => i === j ? 0 : x * x))));
  if (residual > 1e-11 * scale) throw new RangeError('Spectral calculation reached its numerical limit; retain the last valid state.');
  const order = Array.from({ length: n }, (_, i) => i).sort((i, j) => a[i][i] - a[j][j]);
  return { eigenvalues: order.map(i => a[i][i]), basis: v.map(row => order.map(i => row[i])), residual, sweeps };
}
export function nystrom(training, indices, gamma = .45, relativeCutoff = 1e-12, queries = training) {
  const x = featureMatrix(training); finite(relativeCutoff, Number.MIN_VALUE, 1 - Number.EPSILON, 'Relative cutoff');
  if (!Array.isArray(indices) || indices.length < 1 || indices.length > x.length || new Set(indices).size !== indices.length || indices.some(i => !Number.isInteger(i) || i < 0 || i >= x.length)) throw new RangeError('Use unique training landmark addresses, between zero and n−1.');
  const landmarks = indices.map(i => [...x[i]]), W = rbfMatrix(landmarks, landmarks, gamma), spectrum = symmetricSpectrum(W);
  const cutoff = relativeCutoff * Math.max(1, ...spectrum.eigenvalues);
  if (Math.min(...spectrum.eigenvalues) < -cutoff) throw new RangeError('A materially negative landmark eigenvalue prevents a valid kernel feature state.');
  const keep = spectrum.eigenvalues.map((e, i) => e > cutoff ? i : -1).filter(i => i >= 0);
  const B = rbfMatrix(queries, landmarks, gamma), projected = B.map(row => keep.map(k => dot(row, spectrum.basis.map(v => v[k]))));
  return { W, B, ...spectrum, cutoff, keep, projected, features: projected.map(row => row.map((value, j) => value / Math.sqrt(spectrum.eigenvalues[keep[j]]))) };
}
export function rffTransform(x, omega, phase) {
  const rows = featureMatrix(x), m = phase.length;
  if (!m || m > 100 || omega.length !== rows[0].length || omega.some(row => row.length !== m || !row.every(Number.isFinite)) || !phase.every(Number.isFinite)) throw new RangeError('Finite frequency/phase state must match feature count and 1–100 components.');
  return rows.map(row => phase.map((p, j) => Math.sqrt(2 / m) * Math.cos(dot(row, omega.map(values => values[j])) + p)));
}
// Additional browser exploration has its own declared seeded generator. The
// exact recorded NumPy seed-17 state is supplied separately, never reconstructed
// by claiming a different random generator produces identical coordinates.
export function browserFrequencies(d, m, gamma, seed = 17) {
  finite(d, 1, 20, 'Feature count'); finite(m, 1, 100, 'Components'); finite(gamma, .0001, 10, 'Gamma');
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(seed)) throw new RangeError('Counts and seed must be integers.');
  let state = seed >>> 0;
  const uniform = () => { state = (1664525 * state + 1013904223) >>> 0; return (state + .5) / 4294967296; };
  const normal = () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
  return { omega: Array.from({ length: d }, () => Array.from({ length: m }, () => Math.sqrt(2 * gamma) * normal())), phase: Array.from({ length: m }, () => 2 * Math.PI * uniform()) };
}
