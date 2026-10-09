// Topic-local exact, bounded query arithmetic. No fitting or study execution.
import { normalizeNaiveBayesScores, gaussianLogDensity } from './naive-bayes-models.js';
export const words = ['free', 'money', 'win', 'meeting', 'agenda'];
export const wordColors = ['#b79cff', '#78d3ea', '#f49c91', '#93b5f5', '#e7c37d'];
export const classColors = ['#93b5f5', '#e7c37d', '#b79cff'];
export const classCounts = [[0, 0, 0, 1, 1], [3, 2, 1, 0, 0]];
export const sparseRows = [[2, 0, 1], [0, 1, 0], [1, 0, 0], [0, 2, 1], [1, 1, 0], [0, 0, 2]];
export const complementCounts = [[8, 2, 0], [1, 7, 2], [0, 2, 8]];
// Count mass in the eight recorded feature-selection texts, [class 0,class 1]
// in alarm, inspection, meeting, repair, review, routine, urgent order.
export const featureCountMasses = [[0, 3], [1, 1], [2, 0], [0, 2], [2, 0], [4, 0], [0, 4]];
export const sum = xs => xs.reduce((a, b) => a + b, 0);
export const finite = (x, low, high, name = 'Value') => {
  if (!Number.isFinite(x) || x < low || x > high) throw new RangeError(`${name}: use a finite value from ${low} to ${high}.`);
  return x;
};
export function vector(text, {
  minLength = 1,
  maxLength = 100,
  low = -1e6,
  high = 1e6,
  integer = false,
  infinity = false,
  empty = false
} = {}) {
  const source = String(text).trim().replace(/^\[/, '').replace(/\]$/, '');
  if (!source) {
    if (empty) return [];
    throw new RangeError('Enter a complete nonempty vector.');
  }
  if (/(?:^\s*,|,\s*$|,\s*,)/.test(source)) throw new RangeError('Do not leave an empty vector entry.');
  const pieces = source.split(/[,\s]+/);
  if (pieces.length < minLength || pieces.length > maxLength) throw new RangeError(`Use ${minLength}–${maxLength} entries.`);
  return pieces.map(piece => {
    if (infinity && (piece === '-Infinity' || piece === '-inf')) return -Infinity;
    const x = Number(piece);
    finite(x, low, high, 'Each entry');
    if (integer && !Number.isInteger(x)) throw new RangeError('Counts must be integers.');
    return x;
  });
}
export function scores(values) {
  const result = normalizeNaiveBayesScores(values);
  return {
    ...result,
    scores: [...values],
    decision: result.probabilities === null ? null : result.probabilities.indexOf(Math.max(...result.probabilities))
  };
}
export function alphaValue(x) {
  if (x === 0) return x;
  return finite(x, 1e-8, 10, 'Alpha');
}
export function logGamma(z) {
  finite(z, 1e-8, 1e6, 'Gamma argument');
  const p = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  if (z < .5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = .99999999999980993;
  p.forEach((v, i) => x += v / (z + i + 1));
  const t = z + 7.5;
  return .5 * Math.log(2 * Math.PI) + (z + .5) * Math.log(t) - t + Math.log(x);
}
export function countLaw(counts) {
  if (counts.length < 2 || counts.length > 5 || counts.some(x => !Number.isInteger(x) || x < 0 || x > 10) || sum(counts) > 10) throw new RangeError('Use 2–5 integer counts, each 0–10, with total at most 10.');
  const theta = counts.length === 2 ? [.8, .2] : counts.map(() => 1 / counts.length),
    n = sum(counts);
  const coefficient = Math.exp(logGamma(n + 1) - sum(counts.map(x => logGamma(x + 1))));
  const ordered = Math.exp(sum(counts.map((x, j) => x * Math.log(theta[j]))));
  return {
    counts,
    theta,
    n,
    coefficient: Math.round(coefficient),
    ordered,
    mass: coefficient * ordered
  };
}
export function simplex(a, b) {
  finite(a, 0, 1, 'A');
  finite(b, 0, 1, 'B');
  if (a + b > 1) throw new RangeError('A + B cannot exceed one.');
  const theta = [a, b, 1 - a - b],
    counts = [2, 1, 1];
  return {
    theta,
    counts,
    logLikelihood: sum(theta.map((t, j) => t === 0 ? -Infinity : counts[j] * Math.log(t))),
    gradient: theta.map((t, j) => t === 0 ? Infinity : counts[j] / t)
  };
}
// Contour segments from a fine triangular mesh on the actual simplex, never
// an unrelated heatmap. Linear edge interpolation approximates each isoline.
export function simplexContours(levels = [-8, -6, -5, -4.3], resolution = 80) {
  const at = (i, j) => {
    const theta = [i / resolution, j / resolution, 1 - (i + j) / resolution];
    return {
      theta,
      value: theta.some(x => x <= 0) ? -100 : 2 * Math.log(theta[0]) + Math.log(theta[1]) + Math.log(theta[2])
    };
  };
  const contours = [];
  const triangle = vertices => levels.forEach(level => {
    const crossings = [];
    [[0, 1], [1, 2], [2, 0]].forEach(([a, b]) => {
      const left = vertices[a],
        right = vertices[b];
      if (left.value < level === right.value < level) return;
      const t = (level - left.value) / (right.value - left.value);
      crossings.push(left.theta.map((x, j) => x + t * (right.theta[j] - x)));
    });
    if (crossings.length === 2) contours.push({
      level,
      points: crossings
    });
  });
  for (let i = 0; i < resolution; i++) for (let j = 0; j < resolution - i; j++) {
    triangle([at(i, j), at(i + 1, j), at(i, j + 1)]);
    if (i + j + 2 <= resolution) triangle([at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]);
  }
  return contours;
}
export const textFoldRoles = {
  train: [2, 15, 11, 10, 17, 4, 18, 9, 1, 5, 3, 19, 0, 12],
  test: [14, 8, 13, 6, 16, 7],
  folds: [{
    fit: [15, 11, 10, 4, 18, 9, 3, 0, 12],
    validation: [2, 17, 1, 5, 19]
  }, {
    fit: [2, 11, 17, 18, 1, 5, 3, 19, 0],
    validation: [15, 10, 4, 9, 12]
  }, {
    fit: [2, 15, 10, 17, 4, 9, 1, 5, 19, 12],
    validation: [11, 18, 3, 0]
  }]
};
export function moments(values) {
  if (values.length > 100 || values.some(x => !Number.isFinite(x) || Math.abs(x) > 1e6)) throw new RangeError('Use up to 100 finite readings within ±1,000,000.');
  let n = 0,
    mean = 0,
    M2 = 0;
  values.forEach(x => {
    n++;
    const delta = x - mean;
    mean += delta / n;
    M2 += delta * (x - mean);
  });
  return {
    n,
    mean: n ? mean : null,
    M2,
    variance: n ? M2 / n : null
  };
}
export function mergeMoments(left, right) {
  if (left.n === 0) return {
    ...right,
    correction: 0,
    delta: 0
  };
  if (right.n === 0) return {
    ...left,
    correction: 0,
    delta: 0
  };
  const n = left.n + right.n,
    delta = right.mean - left.mean,
    correction = delta * delta * left.n * right.n / n;
  const mean = left.mean + delta * right.n / n,
    M2 = left.M2 + right.M2 + correction;
  return {
    n,
    mean,
    M2,
    variance: M2 / n,
    correction,
    delta
  };
}
export function complement(alpha = 1, norm = false, query = [2, 0, 1]) {
  alphaValue(alpha);
  if (query.length !== 3 || query.some(x => !Number.isInteger(x) || x < 0 || x > 20)) throw new RangeError('Use exactly three integer query counts from 0 to 20.');
  const pooled = complementCounts.map((_, c) => [0, 1, 2].map(j => sum(complementCounts.filter((__, k) => k !== c).map(row => row[j]))));
  const theta = pooled.map(row => row.map(x => (x + alpha) / (sum(row) + 3 * alpha)));
  const raw = theta.map(row => row.map(x => -Math.log(x)));
  const weights = raw.map(row => norm ? row.map(x => x / sum(row)) : row);
  const values = weights.map(row => sum(row.map((w, j) => query[j] === 0 ? 0 : w * query[j])));
  if (values.some(x => !Number.isFinite(x))) return {
    alpha,
    norm,
    query,
    pooled,
    theta,
    raw,
    weights,
    values,
    probabilities: null,
    decision: null
  };
  // Positive negative-log complements: large means poor fit to the other
  // classes. Match the accepted reference's maximum and positive softmax.
  return {
    ...scores(values),
    alpha,
    norm,
    query,
    pooled,
    theta,
    raw,
    weights,
    values
  };
}
export function categorical(status = 0, link = 1) {
  if (!Number.isInteger(status) || status < 0 || status > 3) throw new RangeError('Status support is 0–3; code 4 is outside the fitted schema.');
  if (link !== 0 && link !== 1) throw new RangeError('Link must be wired or radio.');
  const raw = [[[3, 1, 0, 0], [1, 3]], [[1, 3, 0, 0], [3, 1]]];
  const tables = raw.map(cls => cls.map(row => row.map(x => (x + 1) / (4 + row.length))));
  const selected = tables.map(cls => [cls[0][status], cls[1][link]]);
  return {
    status,
    link,
    raw,
    tables,
    selected,
    ...scores(selected.map(row => Math.log(.5) + sum(row.map(Math.log))))
  };
}
export function mixed(status = 0, alarm = 1, reading = .5, mask = [true, true, true]) {
  if (status !== 0 && status !== 1) throw new RangeError('Status must be 0 or 1.');
  if (alarm !== 0 && alarm !== 1) throw new RangeError('Alarm must be 0 or 1.');
  finite(reading, -5, 5, 'Reading');
  if (mask.length !== 3 || mask.some(v => typeof v !== 'boolean')) throw new RangeError('Use one measured/missing value per family.');
  const table = [[2 / 3, 1 / 3], [1 / 3, 2 / 3]],
    terms = [0, 1].map(c => [Math.log(table[c][status]), Math.log(table[c][alarm === 1 ? 0 : 1]), gaussianLogDensity(reading, c === 0 ? .5 : 1.5, 1.25 + 1e-9)]);
  const values = terms.map(row => Math.log(.5) + sum(row.map((x, j) => mask[j] ? x : 0)));
  return {
    terms,
    mask,
    values,
    ...scores(values)
  };
}
export function integrated(shapes, counts) {
  if (shapes.length < 2 || shapes.length > 20 || shapes.some(x => !Number.isFinite(x) || x < 1e-8 || x > 100) || counts.length !== shapes.length || counts.some(x => !Number.isInteger(x) || x < 0 || x > 100)) throw new RangeError('Use 2–20 positive shapes from 1e-8 to 100, with matching integer counts from 0 to 100.');
  const n = sum(counts),
    total = sum(shapes),
    mean = shapes.map(x => x / total);
  if (n === 0) return {
    shapes,
    counts,
    n,
    total,
    mean,
    logCoefficient: 0,
    integratedLog: 0,
    pluginLog: 0,
    integrated: 1,
    plugin: 1
  };
  const logCoefficient = logGamma(n + 1) - sum(counts.map(x => logGamma(x + 1)));
  const integratedLog = logCoefficient + logGamma(total) - logGamma(total + n) + sum(shapes.map((a, j) => logGamma(a + counts[j]) - logGamma(a)));
  const pluginLog = logCoefficient + sum(counts.map((x, j) => x * Math.log(mean[j])));
  return {
    shapes,
    counts,
    n,
    total,
    mean,
    logCoefficient,
    integratedLog,
    pluginLog,
    integrated: Math.exp(integratedLog),
    plugin: Math.exp(pluginLog)
  };
}
export function betaCdf(x, a, b) {
  finite(x, 0, 1, 'Beta coordinate');
  finite(a, 1e-8, 100, 'Shape A');
  finite(b, 1e-8, 100, 'Shape B');
  if (x === 0 || x === 1) return x;
  const fraction = (aa, bb, xx) => {
    const tiny = 1e-300;
    let c = 1,
      d = 1 - (aa + bb) * xx / (aa + 1);
    if (Math.abs(d) < tiny) d = tiny;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 300; m++) {
      const m2 = 2 * m;
      let step = m * (bb - m) * xx / ((aa + m2 - 1) * (aa + m2));
      d = 1 + step * d;
      if (Math.abs(d) < tiny) d = tiny;
      c = 1 + step / c;
      if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      h *= d * c;
      step = -(aa + m) * (aa + bb + m) * xx / ((aa + m2) * (aa + m2 + 1));
      d = 1 + step * d;
      if (Math.abs(d) < tiny) d = tiny;
      c = 1 + step / c;
      if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      const delta = d * c;
      h *= delta;
      if (Math.abs(delta - 1) < 3e-14) return h;
    }
    throw Error('Beta interval calculation did not converge.');
  };
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x));
  return x < (a + 1) / (a + b + 2) ? front * fraction(a, b, x) / a : 1 - front * fraction(b, a, 1 - x) / b;
}
export function expectedLoss(p, q) {
  finite(p, 0, 1, 'Reported p');
  finite(q, 0, 1, 'True q');
  const term = (weight, probability) => weight === 0 ? 0 : probability === 0 ? Infinity : -weight * Math.log(probability);
  return {
    brier: (p - q) ** 2 + q * (1 - q),
    excess: (p - q) ** 2,
    irreducible: q * (1 - q),
    logLoss: term(q, p) + term(1 - q, 1 - p)
  };
}
export function action(p, fp, fn) {
  finite(p, 0, 1, 'Probability');
  finite(fp, .01, 100, 'False-positive cost');
  finite(fn, .01, 100, 'False-negative cost');
  const flag = fp * (1 - p),
    allow = fn * p;
  const threshold = fp / (fp + fn);
  // Compare with the shared threshold so its represented equality is stable;
  // evaluating two products can round an exact tie to opposite sides.
  return {
    p,
    fp,
    fn,
    flag,
    allow,
    threshold,
    action: p > threshold ? 'flag' : 'allow',
    preferred: p > .5 ? 1 : 0
  };
}
const softplus = x => Math.max(0, x) + Math.log1p(Math.exp(-Math.abs(x)));
export function savedInference(raw, family, state) {
  if (raw.length !== 57) throw new RangeError('Keep all 57 schema fields.');
  raw.forEach((x, j) => finite(x, 0, j < 54 ? 100 : 1e9, `Field ${j + 1}`));
  if (!Number.isInteger(raw[55]) || !Number.isInteger(raw[56])) throw new RangeError('Longest and total capital counts must be integers.');
  const [avg, long, total] = raw.slice(54);
  if (!(avg === 0 && long === 0 && total === 0 || 1 <= avg && avg <= long && long <= total)) throw new RangeError('Capital fields must all be zero, or 1 ≤ average ≤ longest ≤ total.');
  let values, transformed;
  if (family === 'logistic') {
    const m = state.models.candidate_11;
    transformed = raw.map((x, j) => (x - m.scaler.mean[j]) / m.scaler.scale[j]);
    const z = sum(transformed.map((x, j) => x * m.coefficients[0][j])) + m.intercept[0];
    return {
      transformed,
      score: z,
      logs: [-softplus(z), -softplus(-z)],
      probabilities: [Math.exp(-softplus(z)), Math.exp(-softplus(-z))]
    };
  }
  if (family === 'Gaussian') {
    const model = state.models.candidate_06,
      m = model.scratch;
    transformed = raw.map((x, j) => (Math.log1p(x) - model.scaler.mean[j]) / model.scaler.scale[j]);
    values = m.class_count.map((mass, c) => Math.log(mass / sum(m.class_count)) + sum(transformed.map((x, j) => gaussianLogDensity(x, m.mean[c][j], m.M2[c][j] / mass + m.variance_floor[j]))));
  } else if (family === 'Bernoulli') {
    const m = state.models.candidate_07.scratch;
    transformed = raw.slice(0, 54).map(x => Number(x > 0));
    values = m.class_count.map((mass, c) => Math.log(mass / sum(m.class_count)) + sum(transformed.map((x, j) => {
      const p = (m.feature_count[c][j] + m.alpha) / (mass + 2 * m.alpha);
      return x ? Math.log(p) : Math.log1p(-p);
    })));
  } else throw new RangeError('Unknown saved model family.');
  const result = scores(values);
  return {
    ...result,
    transformed,
    logs: result.logProbabilities
  };
}
