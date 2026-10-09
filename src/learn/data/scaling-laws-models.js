// Literal counts. Constructed surface; measured data is fetched separately with provenance.
export const SCALING_TOY = Object.freeze({ E: 1, A: 10000, B: 20000, alpha: .5, beta: .5 });
export const SCALING_COLORS = Object.freeze({ parameter: '#e2b55a', data: '#60a5fa', floor: '#aaa', compute: '#c084fc', heldout: '#f472b6', selected: '#fff' });
export function lossParts(n, d, law = SCALING_TOY) {
  const parameter = law.A * n ** -law.alpha;
  const data = law.B * d ** -law.beta;
  return { floor: law.E, parameter, data, total: law.E + parameter + data };
}
export function optimalAllocation(compute, law = SCALING_TOY) {
  const n = Math.exp((Math.log(law.alpha * law.A / (law.beta * law.B)) + law.beta * Math.log(compute / 6)) / (law.alpha + law.beta));
  const d = compute / (6 * n);
  return { n, d, ...lossParts(n, d, law) };
}
export function powerCurve(x, alpha = .5, floor = 0) { return { excess: x ** -alpha, total: floor + x ** -alpha }; }
export function lossContour(n, target, law = SCALING_TOY) {
  if (target <= law.E || n <= (law.A / (target - law.E)) ** (1 / law.alpha)) return null;
  const gap = target - law.E - law.A * n ** -law.alpha;
  return gap > 0 ? (law.B / gap) ** (1 / law.beta) : null;
}
export function goldenMinimum(fn, lower, upper) {
  const ratio = (Math.sqrt(5) - 1) / 2;
  let left = upper - ratio * (upper - lower), right = lower + ratio * (upper - lower);
  let fLeft = fn(left), fRight = fn(right);
  for (let step = 0; step < 300 && upper - lower > 1e-10; step++) {
    if (fLeft < fRight) {
      upper = right; right = left; fRight = fLeft; left = upper - ratio * (upper - lower); fLeft = fn(left);
    } else {
      lower = left; left = right; fLeft = fRight; right = lower + ratio * (upper - lower); fRight = fn(right);
    }
  }
  return [lower, (lower + upper) / 2, upper].reduce((best, x) => fn(x) < fn(best) ? x : best);
}
export const RELEASED_LAW = Object.freeze({ A: Math.exp(6.255414), B: Math.exp(7.3049974), E: Math.exp(.6254804), alpha: .3526596, beta: .3526596, dataReuse: 15.387756, parameterReuse: 5.309743 });
export function effectiveAmount(base, total, reuseScale) {
  if (base <= 0 || total < base || reuseScale <= 0) return null;
  return base + base * reuseScale * -Math.expm1(-(total / base - 1) / reuseScale);
}
export function repeatedLoss(n, d, unique, law = RELEASED_LAW) {
  if (n <= 0 || unique <= 0 || d < unique) return null;
  const g = (law.alpha * law.A / (law.beta * law.B)) ** (1 / (law.alpha + law.beta));
  const baseline = Math.min(n, (unique * g) ** (law.beta / law.alpha) * g);
  const effectiveN = effectiveAmount(baseline, n, law.parameterReuse);
  const effectiveD = effectiveAmount(unique, d, law.dataReuse);
  return { baseline, effectiveN, effectiveD, ...lossParts(effectiveN, effectiveD, law) };
}
export function lifetimeAllocation(target, demand, law = SCALING_TOY) {
  if (target <= law.E || demand < 0) return null;
  const minimum = (law.A / (target - law.E)) ** (1 / law.alpha);
  const cost = logN => { const n = Math.exp(logN); return 6 * n * lossContour(n, target, law) + 2 * n * demand; };
  const n = Math.exp(goldenMinimum(cost, Math.log(minimum) + 1e-8, Math.log(1e12)));
  const d = lossContour(n, target, law);
  return { n, d, minimum, training: 6 * n * d, serving: 2 * n * demand, total: cost(Math.log(n)) };
}
export function hardwareBudget(compute, devices, peak, utilization, hourly = 2) {
  if (devices <= 0 || peak <= 0 || utilization <= 0 || utilization > 1) return null;
  const rate = devices * peak * utilization;
  const seconds = compute / rate;
  return { rate, seconds, hours: seconds / 3600, cost: devices * hourly * seconds / 3600 };
}
export function binomialMasses(n, q) {
  if (q === 0 || q === 1) return Array.from({ length: n + 1 }, (_, k) => +(k === n * q));
  const reflected = q > .5, p = reflected ? 1 - q : q;
  const values = [(1 - p) ** n];
  for (let k = 0; k < n; k++) values.push(values[k] * (n - k) / (k + 1) * p / (1 - p));
  return reflected ? values.reverse() : values;
}
export function metricValues(p, length, threshold = .5, testSize = 100) {
  const exact = p ** length;
  return { exact, thresholded: +(exact >= threshold), masses: binomialMasses(testSize, exact), zero: (1 - exact) ** testSize, increment: 1 / testSize };
}
export function sensitivityRows(fixed = false, floor = 1) {
  const a = 3 - floor, b = 3, alpha = .5, beta = .25;
  return (fixed ? [1] : [1, 2, 4, 8, 16, 32]).flatMap(n => [1, 2, 4, 8, 16, 32].map(d => {
    const p = a * n ** -alpha, q = b * d ** -beta;
    return { n, d, loss: floor + p + q, jacobian: [floor, p, q, -p * alpha * Math.log(n), -q * beta * Math.log(d)] };
  }));
}
export const logGrid = (minimum, maximum, count = 81) => Array.from({ length: count }, (_, i) => minimum * (maximum / minimum) ** (i / (count - 1)));
