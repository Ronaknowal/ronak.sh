// The first fixture is the exact retained metrics.py array, not a new fit.
export const metricLabels = Object.freeze([
  Object.freeze({ id: 'A', name: 'Code', color: '#f0b45b' }),
  Object.freeze({ id: 'B', name: 'Hardware', color: '#75adff' }),
  Object.freeze({ id: 'C', name: 'Energy', color: '#bc9aff' }),
]);
export const metricTruth = Object.freeze([[1, 0, 1], [0, 1, 1], [1, 1, 0], [0, 0, 1]]);
export const metricPredictions = () => [[1, 0, 1], [0, 1, 0], [1, 0, 0], [0, 1, 1]];

function counter() { return { tp: 0, fp: 0, fn: 0, tn: 0, observed: 0 }; }
function addCell(counts, truth, prediction) {
  counts.observed += 1;
  counts[truth ? (prediction ? 'tp' : 'fn') : (prediction ? 'fp' : 'tn')] += 1;
}
export function multilabelMetricCounts(truth, predictions, mask = truth.map(row => row.map(() => true))) {
  const width = truth[0]?.length;
  if (!width || truth.length !== predictions.length || truth.length !== mask.length ||
      truth.some((row, index) => row.length !== width || predictions[index].length !== width || mask[index].length !== width ||
        row.some(value => value !== 0 && value !== 1) || predictions[index].some(value => value !== 0 && value !== 1) || mask[index].some(value => typeof value !== 'boolean'))) {
    throw new Error('Align complete binary truth/prediction arrays with a boolean observation mask.');
  }
  const columns = Array.from({ length: width }, counter);
  const total = counter();
  const rows = truth.map((row, index) => {
    const counts = counter();
    const cells = row.map((value, column) => {
      const prediction = predictions[index][column];
      const observed = mask[index][column];
      if (observed) {
        addCell(counts, value, prediction);
        addCell(columns[column], value, prediction);
        addCell(total, value, prediction);
      }
      return { truth: value, prediction, observed, kind: observed ? (value ? (prediction ? 'TP' : 'FN') : (prediction ? 'FP' : 'TN')) : '?' };
    });
    return { ...counts, cells, complete: counts.observed === width, exact: counts.observed === width ? counts.fp + counts.fn === 0 : null };
  });
  const complete = rows.filter(row => row.complete);
  return { total, columns, rows, hamming: total.observed ? (total.fp + total.fn) / total.observed : null,
    exactAccuracy: complete.length ? complete.filter(row => row.exact).length / complete.length : null,
    completeRows: complete.length };
}

export function counterScores(counts, zeroDivision = 0) {
  const fDenominator = 2 * counts.tp + counts.fp + counts.fn;
  const union = counts.tp + counts.fp + counts.fn;
  return { f1: fDenominator ? 2 * counts.tp / fDenominator : zeroDivision,
    jaccard: union ? counts.tp / union : zeroDivision };
}

export function metricPooling(truth, predictions, zeroDivision = 0) {
  if (zeroDivision !== 0 && zeroDivision !== 1) throw new Error('Choose zero-division convention 0 or 1.');
  const counts = multilabelMetricCounts(truth, predictions);
  const columns = counts.columns.map(column => ({ ...column, ...counterScores(column, zeroDivision) }));
  const rows = counts.rows.map(row => ({ ...row, ...counterScores(row, zeroDivision) }));
  const mean = (objects, field) => objects.reduce((sum, object) => sum + object[field], 0) / objects.length;
  return { ...counts, columns, rows, micro: counterScores(counts.total, zeroDivision),
    macro: { f1: mean(columns, 'f1'), jaccard: mean(columns, 'jaccard') },
    samples: { f1: mean(rows, 'f1'), jaccard: mean(rows, 'jaccard') } };
}

export function rankPairTrace(scores = [.8, .8, .3, .1], truth = [1, 0, 1, 0]) {
  if (scores.length !== 4 || truth.length !== 4 || scores.some(value => !Number.isFinite(value) || value < 0 || value > 1) || truth.some(value => value !== 0 && value !== 1)) {
    throw new Error('Use four finite scores in [0, 1] and four binary relevance bits.');
  }
  const positives = truth.map((value, index) => value ? index : -1).filter(index => index >= 0);
  const negatives = truth.map((value, index) => value ? -1 : index).filter(index => index >= 0);
  const pairs = positives.flatMap(positive => negatives.map(negative => ({ positive, negative,
    tied: scores[positive] === scores[negative], wrong: scores[positive] <= scores[negative] })));
  const labels = scores.map((score, index) => {
    const atOrAbove = scores.map((value, other) => value >= score ? other : -1).filter(other => other >= 0);
    const relevantAtOrAbove = atOrAbove.filter(other => truth[other]);
    return { id: index, score, relevant: Boolean(truth[index]), rank: atOrAbove.length,
      relevantAtOrAbove: relevantAtOrAbove.length, precision: relevantAtOrAbove.length / atOrAbove.length };
  });
  return { pairs, labels, rankingLoss: pairs.length ? pairs.filter(pair => pair.wrong).length / pairs.length : 0,
    lrap: positives.length ? positives.reduce((sum, index) => sum + labels[index].precision, 0) / positives.length : 1,
    coverage: positives.length ? Math.max(...positives.map(index => labels[index].rank)) : 0,
    positiveCount: positives.length, negativeCount: negatives.length };
}
