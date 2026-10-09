// Constructed diagnostic arithmetic. Historical scientific owners stay unchanged.
export const diagnosticSum = values => {
  let sum = 0, correction = 0;
  for (const value of values) {
    const next = sum + value;
    correction += Math.abs(sum) >= Math.abs(value) ? (sum - next) + value : (value - next) + sum;
    sum = next;
  }
  return sum + correction;
};
export function scalarTrace(rows, weight, rate) {
  const details = rows.map(row => {
    const prediction = weight * row.x, residual = prediction - row.y;
    return { ...row, prediction, residual, loss: residual * residual / 2, contribution: residual * row.x };
  });
  const lossSum = diagnosticSum(details.map(r => r.loss));
  const contributionSum = diagnosticSum(details.map(r => r.contribution));
  const loss = lossSum / rows.length, gradient = contributionSum / rows.length;
  const intendedChange = -rate * gradient, after = weight + intendedChange;
  const representedChange = after - weight;
  const curvature = diagnosticSum(rows.map(r => r.x * r.x)) / rows.length;
  const optimum = curvature === 0 ? null : diagnosticSum(rows.map(r => r.x * r.y)) / rows.length / curvature;
  return { details, lossSum, contributionSum, loss, gradient, intendedChange, representedChange, after,
    omitted: weight, distinguishes: after !== weight, curvature, optimum,
    nextLoss: diagnosticSum(rows.map(r => (after * r.x - r.y) ** 2 / 2)) / rows.length };
}
export function modeTrace({ values, mean, variance, training, graph, module }) {
  const batchMean = (values[0] + values[1]) / 2;
  const deviations = values.map(value => value - batchMean);
  const squares = deviations.map(value => value * value);
  const populationVariance = diagnosticSum(squares) / 2, sampleVariance = diagnosticSum(squares);
  const usedMean = training ? batchMean : mean, usedVariance = training ? populationVariance : variance;
  const denominator = Math.sqrt(usedVariance + 1e-5);
  return { values, batchMean, deviations, squares, populationVariance, sampleVariance, usedMean, usedVariance,
    denominator, output: module === 'linear' ? values.map(x => 2 * x + 1) : values.map(x => (x - usedMean) / denominator),
    nextMean: module === 'linear' || !training ? mean : .9 * mean + .1 * batchMean,
    nextVariance: module === 'linear' || !training ? variance : .9 * variance + .1 * sampleVariance,
    graph, module, training, savedMean: mean, savedVariance: variance };
}
export function pairTrace(pairs, direction = 'smaller') {
  const details = pairs.map(row => ({ ...row, difference: row.b - row.a }));
  const mean = diagnosticSum(details.map(row => row.difference)) / details.length;
  const deviations = details.map(row => row.difference - mean), squares = deviations.map(x => x * x);
  const squaredSum = diagnosticSum(squares);
  const variance = details.length > 1 ? squaredSum / (details.length - 1) : null;
  const sd = variance === null ? null : Math.sqrt(variance);
  const signed = details.map(row => row.difference * (direction === 'larger' ? 1 : -1));
  return { details, mean, deviations, squares, squaredSum, variance, sd, direction,
    wins: signed.filter(x => x > 0).length, losses: signed.filter(x => x < 0).length,
    ties: signed.filter(x => x === 0).length };
}
export function restartTrace({ target, weight, rate, momentum, save, steps }) {
  const step = (w, v, index) => {
    const gradient = w - target, carried = momentum * v;
    const nextVelocity = carried + gradient, movement = rate * nextVelocity, nextWeight = w - movement;
    return { index, weight: w, velocity: v, gradient, loss: gradient * gradient / 2, carried, nextVelocity, movement, nextWeight };
  };
  const prefix = []; let w = weight, v = 0;
  for (let index = 1; index <= save; index++) { const row = step(w, v, index); prefix.push(row); w = row.nextWeight; v = row.nextVelocity; }
  const saved = { weight: w, velocity: v, completed: save }, full = [], reset = [];
  let fw = w, fv = v, rw = w, rv = 0;
  for (let index = save + 1; index <= save + steps; index++) {
    const a = step(fw, fv, index), b = step(rw, rv, index);
    full.push(a); reset.push(b); fw = a.nextWeight; fv = a.nextVelocity; rw = b.nextWeight; rv = b.nextVelocity;
  }
  let first = null;
  for (let i = 0; i < full.length && !first; i++) {
    for (const field of ['gradient', 'nextVelocity', 'nextWeight']) {
      if (full[i][field] !== reset[i][field]) { first = { step: full[i].index, field }; break; }
    }
  }
  return { prefix, saved, full, reset, first, finalFull: fw, finalReset: rw };
}
export const meanVariance = (common, count, privateVariance = .6) => common + privateVariance / count;
export const finiteScalarLoss = weight => ((weight - 1) ** 2 + (2 * weight) ** 2) / 4;
export const diagnosticVector = ([a, b]) => [a * a + 3 * b, a * b];
export const diagnosticJacobian = ([a, b]) => [[2 * a, 3], [b, a]];
export function groupTrace(rows, weight, rate, cursor) {
  const contributions = rows.map(row => (weight * row.x - row.y) * row.x);
  const prefix = diagnosticSum(contributions.slice(0, cursor)), suffix = diagnosticSum(contributions.slice(cursor));
  const policies = [['restore', prefix + suffix], ['lost prefix', suffix], ['double prefix', 2 * prefix + suffix]]
    .map(([policy, total]) => ({ policy, total, gradient: total / rows.length, after: weight - rate * total / rows.length }));
  return { contributions, prefix, suffix, denominator: rows.length, cursor, policies };
}
