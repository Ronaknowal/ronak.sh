import { parcelObservations, sigmoid, binaryScoreLoss } from './linear-logistic-models.js';
export const overlappingBinaryRows = Object.freeze([[-2, 0], [-1, 0], [-1, 1], [0, 0], [0, 1], [1, 0], [1, 1], [2, 1]]);
export function binaryCurvatureReport(slope = 0, intercept = 0, penalty = .1) {
  if (![slope, intercept, penalty].every(Number.isFinite) || penalty < 0) {
    throw new RangeError('Use finite coefficients and a nonnegative penalty.');
  }
  const rows = overlappingBinaryRows.map(([feature, label]) => {
    const score = intercept + slope * feature;
    const probability = sigmoid(score);
    const curvature = probability * (1 - probability);
    return {
      feature,
      label,
      score,
      probability,
      curvature,
      workingResponse: curvature > 0 ? score + (label - probability) / curvature : null
    };
  });
  const count = rows.length;
  const objective = rows.reduce((sum, row) => sum + binaryScoreLoss(row.score, row.label) / count, 0) + penalty * slope ** 2 / 2;
  const biasGradient = rows.reduce((sum, row) => sum + (row.probability - row.label) / count, 0);
  const slopeGradient = rows.reduce((sum, row) => sum + (row.probability - row.label) * row.feature / count, 0) + penalty * slope;
  const hessian = [[rows.reduce((sum, row) => sum + row.curvature / count, 0), rows.reduce((sum, row) => sum + row.curvature * row.feature / count, 0)], [rows.reduce((sum, row) => sum + row.curvature * row.feature / count, 0), rows.reduce((sum, row) => sum + row.curvature * row.feature ** 2 / count, 0) + penalty]];
  return {
    rows,
    objective,
    biasGradient,
    slopeGradient,
    hessian
  };
}

// Closed-form two-column weighted regression. The displayed Python programme
// generalizes the weighted-design construction through a stable least-squares
// primitive; this helper makes the browser's one-weight investigation inexpensive.
export function weightedParcelReport(lastImportance = .25) {
  if (!Number.isFinite(lastImportance) || lastImportance < 0 || lastImportance > 1) {
    throw new RangeError('Shipment D importance must lie in [0, 1].');
  }
  const rows = parcelObservations.map((row, index) => ({
    ...row,
    importance: index === 3 ? lastImportance : 1
  }));
  const total = rows.reduce((sum, row) => sum + row.importance, 0);
  const meanX = rows.reduce((sum, row) => sum + row.importance * row.distance, 0) / total;
  const meanY = rows.reduce((sum, row) => sum + row.importance * row.hours, 0) / total;
  const numerator = rows.reduce((sum, row) => sum + row.importance * (row.distance - meanX) * (row.hours - meanY), 0);
  const denominator = rows.reduce((sum, row) => sum + row.importance * (row.distance - meanX) ** 2, 0);
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  const predictedRows = rows.map(row => {
    const predicted = intercept + slope * row.distance;
    const residual = row.hours - predicted;
    return {
      ...row,
      predicted,
      residual,
      weightedSquared: row.importance * residual ** 2
    };
  });
  return {
    intercept,
    slope,
    total,
    meanX,
    meanY,
    numerator,
    denominator,
    rows: predictedRows,
    mse: predictedRows.reduce((sum, row) => sum + row.weightedSquared, 0) / total
  };
}
export function leveragedParcelReport(selected = 3, change = 1) {
  if (!Number.isInteger(selected) || selected < 0 || selected >= 4 || !Number.isFinite(change) || Math.abs(change) > 2) {
    throw new RangeError('Select an original shipment and a target change between −2 and 2.');
  }
  const rows = parcelObservations.map((row, index) => ({
    ...row,
    hours: row.hours + (index === selected ? change : 0)
  }));
  const mean = rows.reduce((sum, row) => sum + row.hours, 0) / 4;
  const slope = rows.reduce((sum, row) => sum + (row.distance - 1.5) * (row.hours - mean), 0) / 5;
  const intercept = mean - 1.5 * slope;
  return {
    intercept,
    slope,
    leverage: .25 + (selected - 1.5) ** 2 / 5,
    rows: rows.map(row => ({
      ...row,
      predicted: intercept + slope * row.distance,
      predictionChange: change * (.25 + (row.distance - 1.5) * (selected - 1.5) / 5)
    }))
  };
}
