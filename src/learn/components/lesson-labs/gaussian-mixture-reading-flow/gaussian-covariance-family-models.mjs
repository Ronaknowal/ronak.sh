import { emExpectation, weightedPointScatter } from "./gaussian-em-models.mjs";

export const covarianceFamilies = ['full', 'tied', 'diag', 'spherical'];
const finite = x => typeof x === 'number' && Number.isFinite(x);
const sum = xs => xs.reduce((a, b) => a + b, 0);
const matrix = (a, b, c) => [[a, b], [b, c]];
const familyGuard = family => { if (!covarianceFamilies.includes(family)) throw new RangeError('Unknown covariance family.'); };

// Factor once: the two-dimensional contour is L times the unit circle.
export function covarianceFactor(covariance) {
  if (!Array.isArray(covariance) || covariance.length !== 2 || covariance.some(row => !Array.isArray(row) || row.length !== 2 || !row.every(finite))) throw new RangeError('Finite 2×2 covariance required.');
  const [[a, b], [paired, c]] = covariance;
  if (Math.abs(b - paired) > 1e-12 * Math.max(1, ...covariance.flat().map(Math.abs))) throw new RangeError('Asymmetric covariance.');
  const cross = b * .5 + paired * .5;
  const l00 = Math.sqrt(a), l10 = cross / l00, l11 = Math.sqrt(c - l10 * l10);
  if (![l00, l10, l11].every(finite) || l00 <= 0 || l11 <= 0) throw new RangeError('Covariance must be positive definite.');
  return [[l00, 0], [l10, l11]];
}
export function covarianceContour(covariance, mean = [0, 0], samples = 128) {
  if (!Array.isArray(mean) || mean.length !== 2 || !mean.every(finite) || !Number.isInteger(samples) || samples < 16 || samples > 512) throw new RangeError('Finite paired mean and bounded contour resolution required.');
  const lower = covarianceFactor(covariance);
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = 2 * Math.PI * i / samples, u = Math.cos(t), v = Math.sin(t);
    return [mean[0] + lower[0][0] * u, mean[1] + lower[1][0] * u + lower[1][1] * v];
  });
}
export function permutationWitness(swapped = false) {
  if (typeof swapped !== 'boolean') throw new RangeError('Use a literal component permutation.');
  const order = swapped ? [1, 0] : [0, 1], original = { ids: ['Left', 'Right'], weights: [.5, .5], means: [-2, 2], variances: [1, 1] };
  const parameters = Object.fromEntries(Object.entries(original).map(([key, values]) => [key, order.map(i => values[i])]));
  const batch = values => {
    const result = emExpectation(values.map((x, i) => ({ id: `${values.length === 4 ? 'U' : 'T'}${i + 1}`, x })), parameters);
    return { ...result, labels: result.rows.map(row => row.components[0].logWeightedDensity >= row.components[1].logWeightedDensity ? 0 : 1) };
  };
  const contrast = weights => emExpectation([{ id: 'Q', x: .25 }], { ...original, weights }).rows[0].density;
  const unequalBefore = contrast([.25, .75]);
  const unequalMeansOnly = emExpectation([{ id: 'Q', x: .25 }], { ...original, weights: [.25, .75], means: [2, -2] }).rows[0].density;
  const coincident = [.2, .8].map(left => emExpectation([{ id: 'C', x: 1 }], { ...original, weights: [left, 1 - left], means: [0, 0] }).rows[0]);
  return { parameters, untied: batch([-3, -1, 1, 3]), tied: batch([-3, 0, 3]), unequalBefore, unequalMeansOnly, coincident };
}
export function covarianceFamilyFixtures() {
  return { full: [matrix(2, .75, 1), matrix(.5, -.25, 1.5)], tied: [matrix(1, .5, 1), matrix(1, .5, 1)], diag: [matrix(2, 0, 1), matrix(.5, 0, 1.5)], spherical: [matrix(1.5, 0, 1.5), matrix(1, 0, 1)] };
}
export function restrictCovarianceScatters(scatters, counts, family = 'full', addition = .05) {
  familyGuard(family);
  if (!Array.isArray(counts) || !counts.length || counts.some(x => !finite(x) || x <= 0) || !Array.isArray(scatters) || scatters.length !== counts.length || !finite(addition) || addition < 0) throw new RangeError('Positive masses and nonnegative finite addition required.');
  scatters.forEach(s => {
    if (!Array.isArray(s) || s.length !== 2 || s.some(row => !Array.isArray(row) || row.length !== 2 || !row.every(finite))) throw new RangeError('Finite paired scatter matrices required.');
    const scale = Math.max(1, ...s.flat().map(Math.abs)), tolerance = 1e-12 * scale;
    if (Math.abs(s[0][1] - s[1][0]) > tolerance || s[0][0] < -tolerance || s[1][1] < -tolerance || s[0][0] * s[1][1] - s[0][1] * s[1][0] < -tolerance * scale) throw new RangeError('Scatter must be symmetric positive semidefinite.');
  });
  const rawFull = scatters.map((s, k) => s.map(row => row.map(x => x / counts[k])));
  let restricted;
  if (family === 'tied') {
    const pooled = [0, 1].map(i => [0, 1].map(j => sum(scatters.map(s => s[i][j])) / sum(counts)));
    restricted = counts.map(() => pooled.map(row => [...row]));
  } else restricted = rawFull.map(s => family === 'full' ? s.map(row => [...row]) : family === 'diag' ? matrix(s[0][0], 0, s[1][1]) : matrix((s[0][0] + s[1][1]) / 2, 0, (s[0][0] + s[1][1]) / 2));
  const used = restricted.map(s => s.map((row, i) => row.map((x, j) => x + (i === j ? addition : 0))));
  if (![...rawFull.flat(2), ...used.flat(2)].every(finite)) throw new RangeError('Covariance exceeds represented range.');
  return { rawFull, restricted, used, counts: [...counts], addition, family };
}
export function suppliedFamilyUpdate(family = 'full') {
  const points = [[0, 0], [2, 0], [0, 2]], left = [.8, .4, .1];
  const components = [left, left.map(r => 1 - r)].map(shares => weightedPointScatter(points, shares));
  return { points, shares: points.map((_, i) => [left[i], 1 - left[i]]), components, ...restrictCovarianceScatters(components.map(c => c.scatter), components.map(c => c.count), family) };
}
export function covarianceParameterCount(K = 3, d = 2, family = 'full') {
  familyGuard(family);
  if (![K, d].every(x => Number.isInteger(x) && x >= 1 && x <= 5)) throw new RangeError('Integer K and d from 1 to 5 required.');
  const weights = K - 1, means = K * d;
  const covariance = family === 'full' ? K * d * (d + 1) / 2 : family === 'tied' ? d * (d + 1) / 2 : family === 'diag' ? K * d : K;
  return { K, d, family, weights, means, covariance, total: weights + means + covariance };
}
export function diagonalMixtureMoments(means = [[-2, -2], [2, 2]]) {
  if (!Array.isArray(means) || means.length !== 2 || means.some(row => !Array.isArray(row) || row.length !== 2 || !row.every(finite))) throw new RangeError('Two finite paired means required.');
  const mean = [0, 1].map(j => means[0][j] * .5 + means[1][j] * .5);
  const offsets = means.map(m => m.map((x, j) => x - mean[j]));
  const outers = offsets.map(o => o.map(x => o.map(y => x * y)));
  const between = [0, 1].map(i => [0, 1].map(j => .5 * outers[0][i][j] + .5 * outers[1][i][j]));
  const within = matrix(1, 0, 1), total = between.map((row, i) => row.map((x, j) => x + within[i][j]));
  if (![...mean, ...between.flat(), ...total.flat()].every(finite)) throw new RangeError('Moments exceed represented range.');
  return { means, mean, offsets, outers, within, between, total };
}

export function constructedBlockRows() {
  return Array.from({ length: 64 }, (_, i) => ({ id: `X${String(i + 1).padStart(2, '0')}`, point: [-3.5 + i % 8, -1.75 + Math.floor(i / 8) * .5] }));
}
export function constructedBlockState() {
  return { ids: ['Left', 'Middle', 'Right'], weights: [1 / 3, 1 / 3, 1 / 3], means: [[-2, 0], [0, 0], [2, 0]], covariances: [matrix(1, 0, 1), matrix(1, 0, 1), matrix(1, 0, 1)] };
}
export function preparedPairedExpectation(state) {
  const { ids, weights, means, covariances } = state, K = ids?.length;
  if (!K || K > 5 || !Array.isArray(ids) || ids.some(id => typeof id !== 'string') || new Set(ids).size !== K || [weights, means, covariances].some(x => !Array.isArray(x) || x.length !== K) || weights.some(x => !finite(x) || x < 0) || Math.abs(sum(weights) - 1) > 1e-12 || means.some(x => !Array.isArray(x) || x.length !== 2 || !x.every(finite))) throw new RangeError('Identified finite paired state with unit-sum nonnegative weights required.');
  const factors = covariances.map(covarianceFactor);
  return rows => rows.map(row => {
    if (!Array.isArray(row.point) || row.point.length !== 2 || !row.point.every(finite)) throw new RangeError('Finite paired observations required.');
    const terms = means.map((m, k) => {
      const f = factors[k], u = (row.point[0] - m[0]) / f[0][0], v = (row.point[1] - m[1] - f[1][0] * u) / f[1][1];
      return Math.log(weights[k]) - Math.log(2 * Math.PI) - Math.log(f[0][0]) - Math.log(f[1][1]) - .5 * (u * u + v * v);
    });
    const max = Math.max(...terms);
    if (!finite(max) || terms.some(x => Number.isNaN(x) || x === Infinity)) throw new RangeError(`Unsupported row ${row.id}.`);
    const denominator = sum(terms.map(x => Math.exp(x - max)));
    return { ...row, terms, shares: terms.map(x => Math.exp(x - max) / denominator), logDensity: max + Math.log(denominator) };
  });
}
// One supplied update only. This inspection API returns diagnostic records,
// distinct from the bounded working buffers represented by D42.
export function twoPassCovarianceUpdate(rows = constructedBlockRows(), old = constructedBlockState(), B = 8, family = 'full', addition = .05) {
  if (!Number.isInteger(B) || B < 1 || B > 64 || !Array.isArray(rows) || rows.length < old.ids?.length || rows.length > 64 || rows.some(row => typeof row.id !== 'string') || new Set(rows.map(row => row.id)).size !== rows.length) throw new RangeError('Distinct observed IDs, K≤n≤64 and integer block size 1–64 required.');
  const evaluate = preparedPairedExpectation(structuredClone(old)), K = old.ids.length, counts = Array(K).fill(0), means = Array.from({ length: K }, () => [0, 0]), passOne = [], passTwo = [];
  for (let start = 0; start < rows.length; start += B) {
    const allocated = evaluate(rows.slice(start, start + B)), origin = allocated[0].point;
    const blocks = old.ids.map((id, k) => {
      const mass = sum(allocated.map(r => r.shares[k]));
      if (mass === 0) return { id, mass, center: null, count: counts[k], mean: [...means[k]] };
      const center = [0, 1].map(j => origin[j] + sum(allocated.map(r => r.shares[k] * (r.point[j] - origin[j]))) / mass), total = counts[k] + mass;
      means[k] = means[k].map((m, j) => m + mass / total * (center[j] - m)); counts[k] = total;
      return { id, mass, center, count: total, mean: [...means[k]] };
    });
    passOne.push({ start, rows: allocated, blocks });
  }
  const empty = counts.flatMap((c, k) => c <= 1e-12 * rows.length ? [old.ids[k]] : []);
  if (empty.length) return { status: 'refused', reason: `Numerically empty component IDs: ${empty.join(', ')}. Old state retained; no reseed.`, old: structuredClone(old), counts, passOne, passTwo: [], updated: null };
  const scatters = Array.from({ length: K }, () => matrix(0, 0, 0));
  for (let start = 0; start < rows.length; start += B) {
    const allocated = evaluate(rows.slice(start, start + B));
    const contributions = old.ids.map((id, k) => {
      const scatter = [0, 1].map(i => [0, 1].map(j => sum(allocated.map(r => r.shares[k] * (r.point[i] - means[k][i]) * (r.point[j] - means[k][j])))));
      scatters[k] = scatters[k].map((row, i) => row.map((x, j) => x + scatter[i][j]));
      return { id, scatter, accumulated: structuredClone(scatters[k]) };
    });
    passTwo.push({ start, rows: allocated, contributions });
  }
  const covariance = restrictCovarianceScatters(scatters, counts, family, addition);
  covariance.used.forEach(covarianceFactor);
  return { status: 'ready', old: structuredClone(old), counts, means, scatters, passOne, passTwo, covariance,
    updated: { ids: [...old.ids], weights: counts.map(c => c / rows.length), means, covariances: covariance.used },
    storage: { input: rows.length * 2, block: B * (2 + K), state: K * 4 + K * 2 + K, working: B * (2 + K) + K * 4 + K * 2 + K } };
}
