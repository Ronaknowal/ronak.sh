import { recommenderRatings, summarizeRatings } from './recommender-models.js';

export const originalRatings = recommenderRatings.map(row => [...row]);
export const sum = values => values.reduce((total, value) => total + value, 0);
export const mean = values => values.length ? sum(values) / values.length : null;
export const dot = (left, right) => sum(left.map((value, index) => value * right[index]));
export const transpose = rows => rows[0].map((_, column) => rows.map(row => row[column]));

const originalObserved = summarizeRatings(originalRatings).observed;
const later = [
  [0, 2, 4], [1, 1, 2], [2, 0, 4], [3, 2, 2], [4, 4, 2],
  [0, 6, 4], [1, 5, 3], [2, 3, 1], [3, 1, 2], [4, 0, 2], [5, 0, 4]
];
export const originalEvents = [
  ...originalObserved.map(({ user, item, rating }) => [user, item, rating]), ...later
].map(([user, item, rating], index) => ({ id: `E${index + 1}`, user, item, rating, tick: index + 1 }));

export function resizeRatings(matrix, users, items) {
  return Array.from({ length: users }, (_, user) => Array.from({ length: items },
    (_, item) => matrix[user]?.[item] ?? null));
}

export function evidenceLoss(matrix, prediction) {
  const summary = summarizeRatings(matrix);
  const terms = summary.observed.map(entry => ({ ...entry,
    residual: entry.rating - prediction, squared: (entry.rating - prediction) ** 2 }));
  const sse = sum(terms.map(entry => entry.squared));
  return { ...summary, terms, sse, rmse: terms.length ? Math.sqrt(sse / terms.length) : null };
}

export function pairEvidence(matrix, first, second, { mode = 'item', rule = 'adjusted',
  minimum = 2, shrinkage = 2 } = {}) {
  const table = mode === 'item' ? transpose(matrix) : matrix;
  const rowMeans = matrix.map(row => mean(row.filter(value => value !== null)));
  const positions = table[first].map((value, position) => position)
    .filter(position => table[first][position] !== null && table[second][position] !== null);
  const firstMean = mean(positions.map(position => table[first][position]));
  const secondMean = mean(positions.map(position => table[second][position]));
  const pairs = positions.map(position => {
    const left = table[first][position];
    const right = table[second][position];
    const leftCenter = rule === 'raw' ? 0 : rule === 'pair' ? firstMean
      : mode === 'item' ? rowMeans[position] : rowMeans[first];
    const rightCenter = rule === 'raw' ? 0 : rule === 'pair' ? secondMean
      : mode === 'item' ? rowMeans[position] : rowMeans[second];
    const a = left - leftCenter;
    const b = right - rightCenter;
    return { position, left, right, leftCenter, rightCenter, a, b, product: a * b,
      leftSquare: a * a, rightSquare: b * b };
  });
  const numerator = sum(pairs.map(pair => pair.product));
  const leftNorm = Math.sqrt(sum(pairs.map(pair => pair.leftSquare)));
  const rightNorm = Math.sqrt(sum(pairs.map(pair => pair.rightSquare)));
  const raw = first !== second && leftNorm && rightNorm ? numerator / (leftNorm * rightNorm) : null;
  const supported = pairs.length >= minimum && raw !== null;
  const supportFactor = pairs.length ? pairs.length / (pairs.length + shrinkage) : null;
  return { first, second, mode, rule, pairs, numerator, leftNorm, rightNorm, raw,
    supported, supportFactor, weight: supported ? raw * supportFactor : null };
}

export function neighborhoodFlow(matrix, { user = 0, item = 2, mode = 'item',
  rule = 'adjusted', minimum = 2, shrinkage = 2, k = 3, signed = false, prior = 3.1,
  ordinary = false } = {}) {
  const summary = summarizeRatings(matrix);
  const rowMeans = summary.userMeans;
  const itemMeans = transpose(matrix).map(column => mean(column.filter(value => value !== null)));
  const baseline = ordinary && mode === 'item' ? itemMeans[item] ?? summary.globalMean ?? prior
    : rowMeans[user] ?? summary.globalMean ?? prior;
  const target = mode === 'item' ? item : user;
  const count = mode === 'item' ? matrix[0].length : matrix.length;
  const candidates = [];
  for (let other = 0; other < count; other += 1) {
    if (other === target) continue;
    const rating = mode === 'item' ? matrix[user][other] : matrix[other][item];
    if (rating === null) continue;
    const pair = pairEvidence(matrix, target, other, { mode, rule, minimum, shrinkage });
    const center = rule === 'raw' ? 0 : ordinary && mode === 'item' ? itemMeans[other]
      : mode === 'item' ? rowMeans[user] : rowMeans[other];
    const signal = rating - center;
    const accepted = pair.weight !== null && (signed ? pair.weight !== 0 : pair.weight > 0);
    candidates.push({ id: other, rating, center, signal, pair, accepted,
      product: pair.weight === null ? null : pair.weight * signal });
  }
  const selected = candidates.filter(entry => entry.accepted)
    .sort((a, b) => Math.abs(b.pair.weight) - Math.abs(a.pair.weight) || a.id - b.id).slice(0, k);
  const numerator = sum(selected.map(entry => entry.product));
  const denominator = sum(selected.map(entry => Math.abs(entry.pair.weight)));
  const correction = denominator ? numerator / denominator : null;
  const score = denominator ? (rule === 'raw' ? 0 : baseline) + correction : baseline;
  return { summary, rowMeans, itemMeans, baseline, candidates, selected, numerator,
    denominator, correction, score, fallback: !denominator };
}

export function shrunkItem(matrix, item, shrinkage, prior) {
  const values = matrix.map(row => row[item]).filter(value => value !== null);
  const denominator = values.length + shrinkage;
  const numerator = sum(values) + shrinkage * prior;
  const global = summarizeRatings(matrix).globalMean;
  return { values, numerator, denominator, dataSum: sum(values), priorPart: shrinkage * prior,
    quotient: denominator ? numerator / denominator : null,
    score: denominator ? numerator / denominator : global, global };
}

export function clusterEvidence(matrix, members) {
  const columns = transpose(members.map(user => matrix[user]));
  return columns.map(column => {
    const values = column.filter(value => value !== null);
    return { sum: sum(values), count: values.length, mean: mean(values) };
  });
}
