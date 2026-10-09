import { bootstrapRows, bootstrapPresets, fitBootstrapStump } from './ensemble-methods-models.js';

export { bootstrapRows, bootstrapPresets };

export function parseBootstrapDraws(text) {
  if (typeof text !== 'string') throw new TypeError('Supply row identities A–F.');
  const tokens = text.trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length < 1 || tokens.length > 12 || tokens.some(token => !/^[A-F]$/i.test(token))) {
    throw new RangeError('Enter 1–12 row identities A–F, separated by commas or spaces.');
  }
  return tokens.map(token => token.toUpperCase().charCodeAt(0) - 65);
}

export function bootstrapFitTrace(draws) {
  const fit = fitBootstrapStump(draws);
  const occurrences = draws.map((index, position) => ({ ...bootstrapRows[index], index, position }));
  const distinct = [...new Set(occurrences.map(row => row.x))].sort((a, b) => a - b);
  const split = threshold => {
    const left = occurrences.filter(row => threshold === null || row.x <= threshold);
    const right = occurrences.filter(row => threshold !== null && row.x > threshold);
    const mean = rows => rows.length ? rows.reduce((sum, row) => sum + row.y, 0) / rows.length : null;
    const leftMean = mean(left);
    const rightMean = mean(right);
    const sse = (rows, value) => rows.reduce((sum, row) => sum + (row.y - value) ** 2, 0);
    return { threshold, left, right, leftMean, rightMean,
      leftSSE: sse(left, leftMean), rightSSE: sse(right, rightMean) };
  };
  const candidates = distinct.slice(1).map((x, index) => split((x + distinct[index]) / 2));
  return { ...fit, ...split(fit.threshold), occurrences, candidates };
}

export function editedBootstrapState(bags, inspectedRow = 0) {
  if (!Array.isArray(bags) || bags.length !== 3) throw new RangeError('Keep three named bags.');
  if (!Number.isInteger(inspectedRow) || inspectedRow < 0 || inspectedRow > 5) throw new RangeError('Choose row A–F.');
  const fits = bags.map(bootstrapFitTrace);
  const eligible = fits.flatMap((fit, index) => fit.counts[inspectedRow] === 0 ? [index] : []);
  const mean = indices => indices.reduce((sum, index) => sum + fits[index].predictions[inspectedRow], 0) / indices.length;
  return { fits, eligible, inspectedRow, oobPrediction: eligible.length ? mean(eligible) : null,
    ensemblePrediction: mean([0, 1, 2]) };
}

export function bootstrapAbsenceLaw(drawCount, bagCount) {
  if (!Number.isInteger(drawCount) || drawCount < 1 || drawCount > 12) throw new RangeError('Draw count is 1–12.');
  if (!Number.isInteger(bagCount) || bagCount < 1 || bagCount > 50) throw new RangeError('Bag count is 1–50.');
  const numerator = 5 ** drawCount;
  const denominator = 6 ** drawCount;
  const absence = numerator / denominator;
  return { drawCount, bagCount, numerator, denominator, absence,
    expectedDistinct: 6 * (1 - absence), noEligible: (1 - absence) ** bagCount };
}
