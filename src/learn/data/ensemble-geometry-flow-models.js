import { projectSimplex } from './ensemble-combination-flow-models.js';

export function simplexProjectionTrace(candidate) {
  const projection = projectSimplex(candidate);
  const positive = candidate.map(value => Math.max(value, 0));
  const sum = positive.reduce((total, value) => total + value, 0);
  const renormalized = sum === 0 ? null : positive.map(value => value / sum);
  const sortedMembers = candidate.map((value, index) => ({ id: ['A', 'B', 'C'][index], index, value }))
    .sort((left, right) => right.value - left.value || left.index - right.index);
  const squaredDistance = point => candidate.reduce((total, value, index) => total + (value - point[index]) ** 2, 0);
  return {
    ...projection,
    sortedMembers,
    renormalized,
    displacement: projection.weights.map((weight, index) => weight - candidate[index]),
    squaredDistance: squaredDistance(projection.weights),
    renormalizedDistance: renormalized === null ? null : squaredDistance(renormalized)
  };
}

export function fixedCombinerStep() {
  const forecasts = [[1, 2, 4], [3, 2, 1], [2, 5, 0]];
  const targets = [2, 1, 3];
  const weights = [1 / 3, 1 / 3, 1 / 3];
  const penalty = .2;
  const step = .02;
  const rows = forecasts.map((values, index) => {
    const products = values.map((value, member) => value * weights[member]);
    const forecast = products.reduce((total, value) => total + value, 0);
    return { id: ['A', 'B', 'C'][index], values, products, forecast, target: targets[index], residual: forecast - targets[index] };
  });
  const gradient = weights.map((weight, member) => rows.reduce(
    (total, row) => total + row.values[member] * row.residual / rows.length, 0
  ) + penalty * weight);
  const candidate = weights.map((weight, member) => weight - step * gradient[member]);
  return { forecasts, targets, weights, penalty, step, rows, gradient, candidate, projection: simplexProjectionTrace(candidate) };
}

export function equicorrelationCalculation(count, variance, correlation) {
  if (!Number.isSafeInteger(count) || count < 1 || !Number.isFinite(variance) || variance < 0 ||
      !Number.isFinite(correlation) || correlation > 1 || (count > 1 && correlation < -1 / (count - 1))) {
    throw new RangeError('Use a nonnegative variance and a feasible common correlation.');
  }
  const diagonalSum = variance / count;
  const offDiagonalSum = variance * correlation * (count - 1) / count;
  return {
    count, variance, correlation,
    diagonalSum, offDiagonalSum,
    combinedVariance: diagonalSum + offDiagonalSum,
    parallelEigenvalue: variance * (1 + (count - 1) * correlation),
    contrastEigenvalue: variance * (1 - correlation)
  };
}

export function constructedBiasVarianceLaw() {
  // Explicit invented independent laws, not observations from repeated fitting.
  const conditionalMean = 10;
  const predictions = [10, 14];
  const noises = [-1, 1];
  const predictionMean = predictions.reduce((total, value) => total + value / predictions.length, 0);
  const bias = predictionMean - conditionalMean;
  const variance = predictions.reduce((total, value) => total + (value - predictionMean) ** 2 / predictions.length, 0);
  const noiseVariance = noises.reduce((total, value) => total + value * value / noises.length, 0);
  const paths = predictions.flatMap(prediction => noises.map(noise => {
    const outcome = conditionalMean + noise;
    return { prediction, noise, outcome, probability: .25, squaredError: (prediction - outcome) ** 2 };
  }));
  return { conditionalMean, predictions, noises, predictionMean, bias, variance, noiseVariance, paths,
    expectedSquaredError: paths.reduce((total, row) => total + row.probability * row.squaredError, 0) };
}
