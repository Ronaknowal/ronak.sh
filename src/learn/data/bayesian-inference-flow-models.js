// Bounded state adapters for the reading-flow investigations.
// Original bayesian-inference-models.js contracts remain unchanged.
import {
  betaPriors, betaDensity, betaTail, betaQuantile, logBeta,
  batchPredictionState, exposureUpdateState, gammaDensity,
  sequencePatterns, predictivePatternState,
} from './bayesian-inference-models.js';
import { studentDensity, studentSurvival, studentQuantile } from './bayesian-inference-student-reference.js';
import { sleepPairs } from './bayesian-inference-sleep-data.js';

export const gridValues = (fn, low, high, count = 240) => Array.from({ length: count + 1 }, (_, i) => {
  const x = low + (high - low) * i / count;
  return [x, fn(x)];
});
const integer = (value, low, high, name) => {
  if (!Number.isInteger(value) || value < low || value > high) {
    throw new RangeError(`${name} must be an integer from ${low} to ${high}.`);
  }
};
const choice = (value, values, name) => {
  if (!values.includes(value)) throw new RangeError(`Choose a displayed ${name}.`);
};
export function betaPosteriorState(priorId = 'moderate', successes = 8, failures = 2) {
  const prior = betaPriors.find(p => p.id === priorId);
  if (!prior) throw new RangeError('Choose a displayed proper prior.');
  integer(successes, 0, 40, 'Successes');
  integer(failures, 0, 40, 'Failures');
  const a = prior.a + successes, b = prior.b + failures;
  const region = betaRegionState(a, b, .7, .95);
  return {
    ...region, prior, successes, failures,
    priorCurve: gridValues(x => betaDensity(x, prior.a, prior.b), 0, 1),
    mean: a / (a + b), variance: a * b / ((a + b) ** 2 * (a + b + 1)),
    mode: a === 1 && b === 1 ? null : a === 1 ? 0 : b === 1 ? 1 : (a - 1) / (a + b - 2),
    modeKind: a === 1 && b === 1 ? 'flat, no unique mode' : a === 1 || b === 1 ? 'boundary mode' : 'interior mode',
    sampleRate: successes + failures === 0 ? null : successes / (successes + failures),
  };
}
export function betaRegionState(a = 10, b = 4, threshold = .7, level = .95) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new RangeError('Threshold must be from zero to one.');
  choice(level, [.9, .95, .99], 'credible level');
  const tail = (1 - level) / 2;
  return {
    a, b, threshold, level,
    low: betaQuantile(tail, a, b), high: betaQuantile(1 - tail, a, b),
    above: betaTail(threshold, a, b, true),
    curve: gridValues(x => betaDensity(x, a, b), 0, 1),
  };
}
export function freshEvidenceState(successes = 3, failures = 2) {
  integer(successes, 0, 20, 'Fresh successes');
  integer(failures, 0, 20, 'Fresh failures');
  const state = betaPosteriorState('moderate', 8 + successes, 2 + failures);
  return { ...state, freshSuccesses: successes, freshFailures: failures, first: [10, 4], duplicate: [18, 6], pooled: [2 + 8 + successes, 2 + 2 + failures] };
}
export function exposureState(hours = .5, horizon = 1) {
  choice(hours, [.5, 1, 2, 4], 'first duration');
  choice(horizon, [.5, 1, 2], 'future duration');
  const state = exposureUpdateState(3, hours, 6, 2);
  const p = state.rate / (state.rate + horizon);
  const masses = Array.from({ length: 26 }, (_, k) => {
    let choose = 1;
    for (let i = 1; i <= k; i += 1) choose *= (state.shape + i - 1) / i;
    return { k, mass: choose * p ** state.shape * (1 - p) ** k };
  });
  return { ...state, horizon, masses, futureMean: state.shape * horizon / state.rate, futureVariance: state.shape * horizon * (state.rate + horizon) / state.rate ** 2, beyond: Math.max(0, 1 - masses.reduce((s, x) => s + x.mass, 0)) };
}
export function categoryState(countC = 1) {
  integer(countC, 0, 5, 'Category C count');
  const counts = [6, 3, countC], shapes = counts.map(n => n + 1), total = shapes.reduce((s, x) => s + x, 0);
  const means = shapes.map(a => a / total);
  const covariance = shapes.map((a, i) => shapes.map((b, j) => (i === j ? a * (total - a) : -a * b) / (total ** 2 * (total + 1))));
  return { counts, shapes, total, means, covariance };
}
export const normalDensity = (x, mean, variance) => Math.exp(-((x - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance);
export function knownNormalState(n = 4) {
  choice(n, [1, 4, 16, 64], 'hypothetical dataset size');
  const precision = 1 + n / 4, variance = 1 / precision, mean = n / precision;
  const futureVariance = 4 + variance;
  const z = 1.959963984540054;
  return { n, precision, variance, mean, futureVariance,
    meanInterval: [mean - z * Math.sqrt(variance), mean + z * Math.sqrt(variance)],
    futureInterval: [mean - z * Math.sqrt(futureVariance), mean + z * Math.sqrt(futureVariance)],
  };
}
export function summarize(values) {
  if (values.some(x => !Number.isFinite(x))) throw new RangeError('Observations must be finite.');
  if (!values.length) return { n: 0, mean: 0, sse: 0 };
  const mean = values.reduce((s, x) => s + x, 0) / values.length;
  const sse = values.reduce((s, x) => s + (x - mean) ** 2, 0);
  if (!Number.isFinite(mean + sse)) throw new RangeError('Summary exceeds finite arithmetic.');
  return { n: values.length, mean, sse };
}
export function mergeSummaries(first, second) {
  if (!first.n) return { ...second };
  if (!second.n) return { ...first };
  const n = first.n + second.n, difference = second.mean - first.mean;
  return { n, mean: first.mean + difference * second.n / n,
    sse: first.sse + second.sse + difference ** 2 * first.n * second.n / n };
}
export function normalInverseGammaState(values = [2, 3, 4, 7], kappa = 1) {
  choice(kappa, [.25, 1, 4], 'proper prior weight');
  const summary = summarize(values), posteriorKappa = kappa + summary.n;
  const mean = summary.mean * summary.n / posteriorKappa;
  const between = kappa * summary.n * summary.mean ** 2 / posteriorKappa;
  const alpha = 2 + summary.n / 2, beta = 2 + (summary.sse + between) / 2, df = 2 * alpha;
  choice(df, [8, 14], 'supported Student degree');
  const meanScale = Math.sqrt(beta / (alpha * posteriorKappa));
  const futureScale = meanScale * Math.sqrt(posteriorKappa + 1);
  const critical = studentQuantile(.975, df);
  const interval = scale => [mean - critical * scale, mean + critical * scale];
  return { values, summary, priorKappa: kappa, kappa: posteriorKappa, mean, between, alpha, beta, df,
    meanScale, futureScale, meanSd: meanScale * Math.sqrt(df / (df - 2)), futureSd: futureScale * Math.sqrt(df / (df - 2)),
    meanInterval: interval(meanScale), futureInterval: interval(futureScale), expectedVariance: beta / (alpha - 1),
    meanAboveZero: studentSurvival(-mean / meanScale, df), futureAboveZero: studentSurvival(-mean / futureScale, df),
  };
}
export function sleepInferenceState(kappa = 1, contrast = 'second-first') {
  choice(contrast, ['second-first', 'first-second'], 'paired contrast');
  const sign = contrast === 'second-first' ? 1 : -1;
  const values = sleepPairs.map(row => sign * (row.drug2 - row.drug1));
  return { ...normalInverseGammaState(values, kappa), rows: sleepPairs, contrast, sign };
}
export function inverseGammaDensity(v, alpha, beta) {
  if (v <= 0) return 0;
  let logGamma = 0;
  for (let k = 1; k < alpha; k += 1) logGamma += Math.log(k);
  return Math.exp(alpha * Math.log(beta) - logGamma - (alpha + 1) * Math.log(v) - beta / v);
}
export const studentLocationDensity = (x, mean, scale, df) => studentDensity((x - mean) / scale, df) / scale;
export const allWords = Object.freeze(Array.from({ length: 1024 }, (_, mask) => {
  const word = Array.from({ length: 10 }, (_, i) => (mask >> (9 - i)) & 1);
  const successes = word.reduce((s, x) => s + x, 0);
  const runs = 1 + word.slice(1).filter((x, i) => x !== word[i]).length;
  return Object.freeze({ mask, word: Object.freeze(word), successes, runs });
}));
export function wordsState(pattern = 'clustered', reference = 'posterior') {
  const state = predictivePatternState(pattern, reference);
  const a = reference === 'prior' ? 2 : 10, b = reference === 'prior' ? 2 : 4;
  const words = allWords.filter(row => reference !== 'same-count' || row.successes === 8).map(row => ({ ...row,
    mass: reference === 'same-count' ? 1 / 45 : Math.exp(logBeta(a + row.successes, b + 10 - row.successes) - logBeta(a, b)),
  }));
  return { ...state, words };
}
export function modelEvidenceState(priorId = 'uniform', modelPrior = .5) {
  choice(priorId, ['uniform', 'moderate', 'strong'], 'proper M1 prior');
  choice(modelPrior, [.1, .5, .9], 'model probability');
  const prior = betaPriors.find(p => p.id === priorId);
  const evidence1 = Math.exp(logBeta(prior.a + 8, prior.b + 2) - logBeta(prior.a, prior.b)), evidence0 = .5 ** 10;
  const joint1 = modelPrior * evidence1, joint0 = (1 - modelPrior) * evidence0;
  return { prior, modelPrior, evidence0, evidence1, factor: evidence1 / evidence0, joint0, joint1, posterior1: joint1 / (joint0 + joint1) };
}
export function lossState(cost = 19, view = 'loss') {
  integer(cost, 1, 25, 'Wrong-launch cost');
  choice(view, ['loss', 'utility'], 'decision rule');
  const q = betaTail(.7, 10, 4, true), launch = cost * (1 - q), wait = q;
  const difference = launch - wait;
  return { q, cost, launch, wait, view, cutoff: q / (1 - q), utility: 100 * 10 / 14 - 70,
    action: view === 'utility' ? 'launch' : Math.abs(difference) < 1e-12 ? 'indifferent' : difference < 0 ? 'launch' : 'wait' };
}
const choose = (n, k) => {
  let result = 1;
  for (let i = 1; i <= k; i += 1) result *= (n - i + 1) / i;
  return result;
};
export const reporterComponents = (() => {
  const contributions = [];
  const masses = Array(11).fill(0);
  for (let j = 0; j <= 8; j += 1) for (let k = 0; k <= 2; k += 1) {
    const coefficient = choose(8, j) * .9 ** j * .1 ** (8 - j) * choose(2, k) * .1 ** k * .9 ** (2 - k);
    const a = 2 + j + k, b = 12 - j - k;
    const mass = coefficient * Math.exp(logBeta(a, b) - logBeta(2, 2));
    masses[j + k] += mass;
    contributions.push({ j, k, a, b, coefficient, mass });
  }
  const evidence = masses.reduce((s, x) => s + x, 0);
  const components = masses.map((mass, n) => ({ n, a: 2 + n, b: 12 - n, weight: mass / evidence }));
  const mean = components.reduce((s, row) => s + row.weight * row.a / 14, 0);
  const above = components.reduce((s, row) => s + row.weight * betaTail(.7, row.a, row.b, true), 0);
  return { contributions, components, evidence, mean, above };
})();
export function reporterDensity(x) {
  return reporterComponents.components.reduce((s, row) => s + row.weight * betaDensity(x, row.a, row.b), 0);
}
export function reporterGridState(cells = 100) {
  choice(cells, [100, 1000, 10000], 'cell count');
  const width = 1 / cells;
  const logs = Array.from({ length: cells }, (_, i) => {
    const x = (i + .5) * width, q = .1 + .8 * x;
    return { x, q, log: Math.log(6) + Math.log(x) + Math.log1p(-x) + 8 * Math.log(q) + 2 * Math.log1p(-q) };
  });
  const peak = Math.max(...logs.map(row => row.log));
  const scaledTotal = logs.reduce((s, row) => s + Math.exp(row.log - peak), 0);
  const rows = logs.map(row => {
    const mass = Math.exp(row.log - peak) / scaledTotal;
    return { ...row, mass, density: mass / width, unnormalizedMass: Math.exp(row.log) * width };
  });
  return { cells, width, peak, scaledTotal, rows,
    evidence: Math.exp(peak) * scaledTotal * width,
    mean: rows.reduce((s, row) => s + row.x * row.mass, 0),
    above: rows.filter(row => row.x > .7).reduce((s, row) => s + row.mass, 0),
    reference: reporterComponents,
  };
}
export { betaPriors, betaDensity, betaTail, betaQuantile, logBeta, batchPredictionState, gammaDensity, sequencePatterns, studentDensity, studentSurvival, studentQuantile, sleepPairs };
