import { metricPooling } from './multilabel-reading-flow-metric-models.js';

export const thresholdTruth = Object.freeze([0, 1, 0, 1, 1, 0]);
export const referenceThresholdScores = () => [.9, .8, .8, .55, .4, .2];

export function thresholdTrace(scores = referenceThresholdScores(), threshold = .5) {
  if (scores.length !== 6 || scores.some(value => !Number.isFinite(value) || value < 0 || value > 1) ||
      !Number.isFinite(threshold) || threshold < 0 || threshold > 1.01) {
    throw new Error('Use six scores in [0,1] and a finite cutoff in [0,1.01].');
  }
  const rows = scores.map((score, id) => ({ id, score, truth: thresholdTruth[id], selected: score >= threshold }));
  const tp = rows.filter(row => row.selected && row.truth).length;
  const fp = rows.filter(row => row.selected && !row.truth).length;
  const fn = rows.filter(row => !row.selected && row.truth).length;
  return { rows, threshold, tp, fp, fn, f1: 2 * tp / (2 * tp + fp + fn) };
}

export function thresholdStaircase(scores = referenceThresholdScores()) {
  // With >=, the old value belongs to the exact score and the new value to its right.
  const breakpoints = [...new Set([0, ...scores, 1.01])].sort((a, b) => a - b);
  const edges = breakpoints.slice(0, -1).map((left, index) => {
    const right = breakpoints[index + 1];
    const inside = thresholdTrace(scores, (left + right) / 2);
    return { left, right, f1: inside.f1 };
  });
  return { edges, points: breakpoints.map(value => ({ threshold: value, f1: thresholdTrace(scores, value).f1 })) };
}

export const pooledThresholdTruth = Object.freeze([[1, 0], [1, 0], [0, 1], [0, 0]]);
export const pooledThresholdScores = Object.freeze([[.9, .7], [.8, .6], [.4, .55], [.1, .45]]);
export function pooledThresholdTrace(thresholds = [.5, .5], evaluation = 'micro') {
  if (thresholds.length !== 2 || thresholds.some(value => !Number.isFinite(value) || value < 0 || value > 1) ||
      !['micro', 'macro'].includes(evaluation)) throw new Error('Use two cutoffs in [0,1] and micro or macro evaluation.');
  const predictions = pooledThresholdScores.map(row => row.map((score, column) => Number(score >= thresholds[column])));
  const state = metricPooling(pooledThresholdTruth, predictions);
  return { ...state, predictions, thresholds: [...thresholds], evaluation, f1: state[evaluation].f1 };
}

export function weightedProbabilityTrace(probability = .2, positiveWeight = 4) {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1 ||
      !Number.isFinite(positiveWeight) || positiveWeight <= 0) throw new Error('Use p in [0,1] and a positive finite weight.');
  const q = positiveWeight * probability / (1 - probability + positiveWeight * probability);
  const recovered = q / (positiveWeight - (positiveWeight - 1) * q);
  return { probability, positiveWeight, odds: probability === 1 ? null : probability / (1 - probability),
    weightedOdds: probability === 1 ? null : positiveWeight * probability / (1 - probability), q, recovered };
}
