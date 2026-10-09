// Exact accepted saved-state input. These helpers perform legal forward algebra;
// they never discover directions, refit preprocessing, or rerun scientific data.
import saved from "./pca-reading-flow-state.json" with { type: 'json' };
import { dot, squaredLength } from './pca-geometry.js';

export const wineState = saved;
export const featureColors = [
  '#4EA3D8', '#AB83D8', '#DD8C78', '#55B7BD', '#CC7EB8', '#E3A24E',
  '#7D94E8', '#BFA0EA', '#B66D69', '#6BA6BC', '#D99BBA', '#B6BDD4', '#DAA879'
];
export const cultivarColors = ['#4EA3D8', '#DD8C78', '#AB83D8'];

export function savedQuery(row, branch, kept) {
  if (!Number.isInteger(kept) || kept < 0 || kept > branch.components.length) {
    throw new Error('Kept count must address the saved basis');
  }
  if (row.length !== branch.mean.length || !row.every(Number.isFinite)) {
    throw new Error('Finite measurements must follow the saved feature order');
  }
  const standardized = row.map((value, feature) =>
    (value - branch.mean[feature]) / branch.scale[feature]);
  const directions = branch.components.slice(0, kept);
  const scoreProducts = directions.map(direction =>
    direction.map((coefficient, feature) => coefficient * standardized[feature]));
  const scores = directions.map(direction => dot(standardized, direction));
  const decoderProducts = branch.mean.map((_, feature) =>
    scores.map((score, component) => score * directions[component][feature]));
  const decodedStandardized = decoderProducts.map(products =>
    products.reduce((sum, value) => sum + value, 0));
  const decoded = decodedStandardized.map((value, feature) =>
    value * branch.scale[feature] + branch.mean[feature]);
  const residualStandardized = standardized.map((value, feature) => value - decodedStandardized[feature]);
  return {
    row, kept, standardized, scores, scoreProducts, decoderProducts,
    decodedStandardized, decoded, residualStandardized,
    residual: row.map((value, feature) => value - decoded[feature]),
    standardizedSquaredLoss: squaredLength(residualStandardized)
  };
}

export function budgetCrossing(budget) {
  if (!Number.isFinite(budget) || budget < 0 || budget > 1) {
    throw new Error('Budget must lie between zero and one');
  }
  const found = saved.wineSplit.lossRatios.findIndex(value => value <= budget);
  return found < 0 ? null : found;
}

export function descriptiveCoordinates(pair) {
  const branch = saved.wineFullFit;
  return saved.wineRows.map((row, index) => {
    const standardized = row.map((value, feature) =>
      (value - branch.mean[feature]) / branch.scale[feature]);
    return {
      index,
      cultivar: saved.wineCultivar[index],
      coordinates: pair.map(component => dot(standardized, branch.components[component]))
    };
  });
}

export function storageCounts(observations, features, kept) {
  if (![observations, features, kept].every(Number.isInteger) || observations < 1 ||
      features < 1 || kept < 0 || kept > features) throw new Error('Invalid storage dimensions');
  const original = observations * features;
  const scores = observations * kept;
  const decoder = kept * features;
  const mean = features;
  return { original, scores, decoder, mean, total: scores + decoder + mean,
    fraction: (scores + decoder + mean) / original };
}

export function rectangleMetric(multiplier) {
  if (!Number.isFinite(multiplier) || multiplier <= 0) throw new Error('Use a positive unit multiplier');
  const rawEnergies = [16, 4 * multiplier ** 2];
  const gap = Math.abs(rawEnergies[0] - rawEnergies[1]);
  const tied = gap <= 1e-12 * Math.max(...rawEnergies);
  return {
    rawRows: [[-2, -multiplier], [-2, multiplier], [2, -multiplier], [2, multiplier]],
    rawEnergies,
    rawDirection: tied ? null : rawEnergies[0] > rawEnergies[1] ? [1, 0] : [0, 1],
    rawFraction: Math.max(...rawEnergies) / (rawEnergies[0] + rawEnergies[1]),
    exactTie: multiplier === 2,
    numericalTie: tied,
    standardizedRows: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    standardizedEnergies: [4, 4],
    standardizedFraction: .5
  };
}
