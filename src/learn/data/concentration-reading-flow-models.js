// Separately bounded adapters; existing concentration-inequalities-models.js contracts stay intact.
export function integerRange(x, low, high, name) {
  if (!Number.isInteger(x) || x < low || x > high) throw new RangeError(`${name}: integer ${low} through ${high} required.`);
}
export function logAdd(a, b) {
  if (a === -Infinity) return b;
  if (b === -Infinity) return a;
  const m = Math.max(a, b);
  return m + Math.log1p(Math.exp(Math.min(a, b) - m));
}
export function logTotal(values) { return values.reduce(logAdd, -Infinity); }
export function logCombination(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0) throw new RangeError('Integer combination inputs required.');
  if (k < 0 || k > n) return -Infinity;
  let sum = 0;
  for (let i = 1; i <= Math.min(k, n - k); i++) sum += Math.log(n - i + 1) - Math.log(i);
  return sum;
}
export function probabilityLaw(n, p) {
  integerRange(n, 1, 1000, 'Count');
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('Probability in [0,1] required.');
  if (p === 0 || p === 1) return Array.from({ length: n + 1 }, (_, k) => k === n * p ? 0 : -Infinity);
  const raw = [n * Math.log1p(-p)];
  for (let k = 1; k <= n; k++) raw.push(raw[k - 1] + Math.log(n - k + 1) - Math.log(k) + Math.log(p) - Math.log1p(-p));
  const norm = logTotal(raw);
  return raw.map(v => v - norm);
}
export function hypergeometricLaw(M, K, n) {
  integerRange(M, 1, 150, 'Frame size'); integerRange(K, 0, M, 'Marked count'); integerRange(n, 1, M, 'Draw count');
  const raw = Array.from({ length: n + 1 }, (_, k) => logCombination(K, k) + logCombination(M - K, n - k) - logCombination(M, n));
  const norm = logTotal(raw);
  return raw.map(v => v - norm);
}
export function inclusiveTail(law, k) {
  integerRange(k, 0, law.length, 'Inclusive threshold');
  return k === 0 ? 0 : Math.min(0, logTotal(law.slice(k)));
}
export function empiricalRadius(n, k, delta = .05) {
  integerRange(n, 2, 1000, 'Count'); integerRange(k, 0, n, 'Observed successes');
  if (!(delta > 0 && delta < 1)) throw new RangeError('Budget in (0,1) required.');
  const mean = k / n, variance = k * (n - k) / (n * (n - 1)), L = Math.log(4 / delta);
  const spread = Math.sqrt(2 * variance * L / n), correction = 7 * L / (3 * (n - 1));
  return { n, k, mean, variance, spread, correction, radius: spread + correction };
}
export function empiricalState(n = 100, k = 0) {
  const selected = empiricalRadius(n, k), p = 1 / 40, law = probabilityLaw(n, p);
  const rows = law.map((logMass, count) => {
    const r = empiricalRadius(n, count);
    return { ...r, logMass, failed: Math.abs(r.mean - p) > r.radius };
  });
  return { ...selected, p, law, rows, failureLog: logTotal(rows.filter(r => r.failed).map(r => r.logMass)) };
}
export function bennettLog(n, p, k) {
  integerRange(n, 1, 1000, 'Count'); integerRange(k, 0, n + 1, 'Threshold');
  if (!(p >= 0 && p <= 1)) throw new RangeError('Probability in [0,1] required.');
  if (k <= 0) return 0;
  if (k > n || p === 0) return -Infinity;
  if (p === 1) return 0;
  const t = k - n * p, v = n * p * (1 - p);
  if (t <= 0) return 0;
  const u = t / v;
  return -v * ((1 + u) * Math.log1p(u) - u);
}
export function irisState(n = 30, k = 15) {
  integerRange(n, 1, 150, 'Draw count'); integerRange(k, 0, n + 1, 'Inclusive threshold');
  const subset = hypergeometricLaw(150, 50, n), iid = probabilityLaw(n, 1 / 3);
  return { n, k, subset, iid, subsetLog: inclusiveTail(subset, k), iidLog: inclusiveTail(iid, k), subsetVariance: (2 / 9) / n * (150 - n) / 149, iidVariance: (2 / 9) / n };
}
export function mixtureRadius(t, rho = 25, delta = .05) {
  integerRange(t, 1, 1000, 'Time');
  if (!(rho > 0 && Number.isFinite(rho) && delta > 0 && delta < 1)) throw new RangeError('Positive finite rho and budget in (0,1) required.');
  const V = t / 4;
  return Math.sqrt((V + rho) * (Math.log1p(V / rho) + 2 * Math.log(1 / delta))) / t;
}
export function unionRadius(t, delta = .05) {
  integerRange(t, 1, 1000, 'Time');
  if (!(delta > 0 && delta < 1)) throw new RangeError('Budget in (0,1) required.');
  return Math.sqrt(Math.log(2 * t * (t + 1) / delta) / (2 * t));
}
export function mixtureLog(t, S, rho = 25) {
  integerRange(t, 1, 1000, 'Time');
  if (!Number.isFinite(S) || !(rho > 0 && Number.isFinite(rho))) throw new RangeError('Finite centered sum and positive rho required.');
  return .5 * Math.log(rho / (t / 4 + rho)) + S * S / (2 * (t / 4 + rho));
}
export function sequenceRows(n = 4) {
  integerRange(n, 1, 8, 'Enumerated coin count');
  return Array.from({ length: 2 ** n }, (_, index) => {
    const digits = index.toString(2).padStart(n, '0'), count = [...digits].reduce((s, v) => s + Number(v), 0);
    return { digits, count, fraction: count / n, mass: 2 ** -n };
  });
}
