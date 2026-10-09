// Pure, bounded browser calculations. Recorded scientific experiments are never run here.
export const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
export const sum = values => values.reduce((total, value) => total + value, 0);
export function percentile(values, p) {
  const sorted = values.filter(value => value !== null).slice().sort((a, b) => a - b);
  if (!sorted.length) throw Error('No observed value supports this fitted statistic.');
  const position = p * (sorted.length - 1),
    low = Math.floor(position),
    high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}
export function ruler(values, kind) {
  const observed = values.filter(value => value !== null);
  if (!observed.length) throw Error('An all-missing column has no supported fitted ruler.');
  let center, measured;
  if (kind === 'standard') {
    center = mean(observed);
    measured = Math.sqrt(mean(observed.map(value => (value - center) ** 2)));
  } else if (kind === 'robust') {
    center = percentile(observed, .5);
    measured = percentile(observed, .75) - percentile(observed, .25);
  } else if (kind === 'maxabs') {
    center = 0;
    measured = Math.max(...observed.map(Math.abs));
  } else {
    center = Math.min(...observed);
    measured = Math.max(...observed) - center;
  }
  return {
    center,
    scale: measured === 0 ? 1 : measured,
    measured,
    constant: measured === 0
  };
}
export const applyRuler = (state, value) => (value - state.center) / state.scale;
export const points = {
  Q: [40, 4000],
  A: [41, 4100],
  B: [43, 4001]
};
export function distance(from, to, divisors = [1, 100]) {
  const delta = from.map((value, i) => (to[i] - value) / divisors[i]);
  const contributions = delta.map(value => value ** 2);
  return {
    delta,
    contributions,
    squared: sum(contributions),
    length: Math.sqrt(sum(contributions))
  };
}
export function doubleDivisors(values) {
  const next = values.map(value => value * 2);
  if (!next.every(Number.isFinite) || next[0] < .1 || next[0] > 10 || next[1] < 1 || next[1] > 500) throw Error('Doubling would exceed the declared divisor domain; neither divisor was changed.');
  return next;
}
export function translateCases(data) {
  const next = Object.fromEntries(Object.entries(data).map(([id, row]) => [id, [row[0] + 1, row[1] + 10]]));
  if (Object.values(next).some(row => !row.every(Number.isFinite) || row[0] < 0 || row[0] > 100 || row[1] < 0 || row[1] > 10000)) throw Error('Translation would exceed the declared coordinate domain; no point was changed.');
  return next;
}
export const donorFixture = [[2, 12, null], [1, 10, 100], [3, null, 300], [null, 14, 500]];
export function donors(table = donorFixture, k = 2) {
  const query = table[0],
    target = 2;
  const scored = table.slice(1).map((row, i) => {
    const overlap = row.map((value, j) => value !== null && query[j] !== null ? j : -1).filter(j => j >= 0);
    const squares = overlap.map(j => (row[j] - query[j]) ** 2);
    const squared = overlap.length ? row.length / overlap.length * sum(squares) : null;
    return {
      id: `D${i + 1}`,
      row,
      overlap,
      squares,
      squared,
      length: squared === null ? null : Math.sqrt(squared),
      eligible: row[target] !== null
    };
  });
  const eligible = scored.filter(row => row.eligible && row.squared !== null).sort((a, b) => a.squared - b.squared || a.id.localeCompare(b.id));
  const chosen = eligible.slice(0, k);
  const observed = scored.filter(row => row.eligible).map(row => row.row[target]);
  if (!observed.length) throw Error('All donor target values are missing: no evidence for a fill.');
  return {
    scored,
    chosen,
    value: mean(chosen.length ? chosen.map(row => row.row[target]) : observed),
    fallback: !chosen.length
  };
}
export function category(query = 'a', minimum = 2, policy = 'infrequent') {
  const counts = {
    a: 4,
    b: 1
  };
  if (typeof query === 'string' && query.startsWith('@')) throw Error('Labels starting with @ are reserved internal markers.');
  const frequent = Object.keys(counts).filter(key => counts[key] >= minimum).sort();
  const hasRare = Object.keys(counts).some(key => counts[key] < minimum);
  const vocabulary = ['@missing', ...(hasRare ? ['@rare'] : []), ...frequent];
  let token = query === null ? '@missing' : frequent.includes(query) ? query : Object.hasOwn(counts, query) ? '@rare' : null;
  if (token === null && policy === 'error') throw Error('Unknown category under the declared error policy.');
  if (token === null && policy === 'infrequent' && hasRare) token = '@rare';
  return {
    vocabulary,
    token,
    counts,
    vector: vocabulary.map(value => Number(value === token)),
    hasRare
  };
}
export const smallFit = {
  medians: [20, 300, 7],
  means: [20, 300, 7],
  scales: [Math.sqrt(50), Math.sqrt(20000), 1],
  vocabulary: ['a', 'b', 'not_recorded']
};
export function prepare(row, label = 'a', state = smallFit) {
  const filled = row.map((value, i) => value === null ? state.medians[i] : value);
  const numeric = filled.map((value, i) => (value - state.means[i]) / state.scales[i]);
  const token = label === null ? 'not_recorded' : label;
  const encoded = state.vocabulary.map(value => Number(value === token));
  return {
    row,
    filled,
    numeric,
    encoded,
    mask: row.map(value => Number(value === null)),
    output: [...numeric, ...encoded]
  };
}
export function power(x, lambda, method = 'YJ') {
  if (method === 'BC') {
    if (x <= 0) throw Error('Box–Cox requires a strictly positive input.');
    return Math.abs(lambda) < 1e-8 ? Math.log(x) : Math.expm1(lambda * Math.log(x)) / lambda;
  }
  if (x >= 0) return Math.abs(lambda) < 1e-8 ? Math.log1p(x) : Math.expm1(lambda * Math.log1p(x)) / lambda;
  const exponent = 2 - lambda;
  return Math.abs(exponent) < 1e-8 ? -Math.log1p(-x) : -Math.expm1(exponent * Math.log1p(-x)) / exponent;
}
export function profile(values, lambda, method = 'BC') {
  const mapped = values.map(value => power(value, lambda, method));
  const variance = mean(mapped.map(value => (value - mean(mapped)) ** 2));
  if (!(variance > 0)) throw Error('Degenerate transformed variance has no finite profile likelihood.');
  const varianceTerm = -values.length / 2 * Math.log(variance);
  const jacobian = sum(values.map(value => method === 'BC' ? (lambda - 1) * Math.log(value) : (lambda - 1) * Math.sign(value) * Math.log1p(Math.abs(value))));
  return {
    mapped,
    variance,
    varianceTerm,
    jacobian,
    total: varianceTerm + jacobian
  };
}
// Acklam rational inverse-normal approximation, followed by the lesson's explicit endpoint policy.
export function normalQuantile(p) {
  if (!(p > 0 && p < 1)) throw Error('Normal quantile requires probability strictly inside (0,1).');
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-.00778489400243029, -.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [.00778469570904146, .32246712907004, 2.445134137143, 3.75440866190742];
  const evaluate = (coefficients, x) => coefficients.reduce((value, coefficient) => value * x + coefficient, 0);
  if (p < .02425 || p > .97575) {
    const q = Math.sqrt(-2 * Math.log(p < .5 ? p : 1 - p));
    const value = evaluate(c, q) / evaluate([...d, 1], q);
    return p < .5 ? value : -value;
  }
  const q = p - .5,
    r = q * q;
  return evaluate(a, r) * q / evaluate([...b, 1], r);
}
export function quantileMap(x, output = 'uniform') {
  const landmarks = [1, 2, 2, 4, 100],
    references = [0, .25, .5, .75, 1];
  let probability;
  if (x <= 1) probability = 0;else if (x >= 100) probability = 1;else if (x === 2) probability = .375;else {
    const upper = landmarks.findIndex(value => value > x),
      lower = upper - 1;
    probability = references[lower] + (references[upper] - references[lower]) * (x - landmarks[lower]) / (landmarks[upper] - landmarks[lower]);
  }
  const clipped = Math.min(1 - 1e-7, Math.max(1e-7, probability));
  return {
    landmarks,
    references,
    probability,
    value: output === 'normal' ? normalQuantile(clipped) : probability,
    saturated: x < 1 || x > 100
  };
}
export function splineRow(x, degree = 1) {
  const knots = degree === 1 ? [-1, 0, 1, 2, 3] : [-2, -1, 0, 1, 2, 3, 4];
  function basis(i, order, value) {
    if (order === 0) return Number(knots[i] <= value && value < knots[i + 1]);
    const left = knots[i + order] - knots[i],
      right = knots[i + order + 1] - knots[i + 1];
    return (left ? (value - knots[i]) / left * basis(i, order - 1, value) : 0) + (right ? (knots[i + order + 1] - value) / right * basis(i + 1, order - 1, value) : 0);
  }
  const at = x === 2 ? 2 - 1e-12 : x;
  return {
    knots,
    row: Array.from({
      length: knots.length - degree - 1
    }, (_, i) => basis(i, degree, at))
  };
}
export const targetFixture = {
  categories: ['A', 'A', 'B', 'B', 'C', 'C'],
  targets: [1, 1, 0, 0, 1, 0],
  folds: [0, 1, 0, 1, 0, 1]
};
export function crossFit(fixture = targetFixture, alpha = 2) {
  return fixture.categories.map((label, i) => {
    const donors = fixture.folds.map((fold, j) => fold !== fixture.folds[i] ? j : -1).filter(j => j >= 0);
    if (!donors.length) throw Error('An inspected fold has no permitted donor rows.');
    const prior = mean(donors.map(j => fixture.targets[j]));
    const matching = donors.filter(j => fixture.categories[j] === label);
    const total = sum(matching.map(j => fixture.targets[j]));
    return {
      donors,
      matching,
      prior,
      total,
      count: matching.length,
      value: matching.length + alpha === 0 ? prior : (total + alpha * prior) / (matching.length + alpha)
    };
  });
}
export const incomplete = [[1, 2], [2, 4], [3, null], [null, 8], [5, 10]];
export function conditionalTrace(input = incomplete, alpha = 1, initialOverrides = {}) {
  const medians = [0, 1].map(j => percentile(input.map(row => row[j]), .5));
  let current = input.map((row, i) => row.map((value, j) => value === null ? initialOverrides[`${i},${j}`] ?? medians[j] : value));
  const initial = current.map(row => row.slice()),
    trace = [];
  for (let turn = 0; turn < 6; turn++) {
    const target = turn % 2,
      other = 1 - target;
    const observed = input.map((row, i) => row[target] !== null ? i : -1).filter(i => i >= 0);
    const design = observed.map(i => current[i][other]),
      response = observed.map(i => input[i][target]);
    const xMean = mean(design),
      yMean = mean(response);
    const coefficient = sum(design.map((value, i) => (value - xMean) * (response[i] - yMean))) / (sum(design.map(value => (value - xMean) ** 2)) + alpha);
    const intercept = yMean - coefficient * xMean;
    current = current.map((row, i) => input[i][target] === null ? row.map((value, j) => j === target ? intercept + coefficient * row[other] : value) : row.slice());
    trace.push({
      turn: turn + 1,
      target,
      other,
      observed,
      design,
      response,
      coefficient,
      intercept,
      current
    });
  }
  return {
    medians,
    initial,
    trace,
    status: '3 sweeps · iteration cap (not convergence)'
  };
}
export function applyConditional(query, state) {
  let current = query.map((value, j) => value === null ? state.medians[j] : value);
  const rows = [current];
  for (const model of state.trace) {
    current = current.map((value, j) => j === model.target && query[j] === null ? model.intercept + model.coefficient * current[model.other] : value);
    rows.push(current);
  }
  return rows;
}
export function pool(estimates = [9, 10, 11], variances = [4, 4, 4]) {
  if (estimates.length < 2 || estimates.length !== variances.length || variances.some(value => value < 0)) throw Error('Pooling needs at least two aligned estimates and nonnegative variances.');
  const estimate = mean(estimates),
    within = mean(variances);
  const between = sum(estimates.map(value => (value - estimate) ** 2)) / (estimates.length - 1);
  const simulation = between / estimates.length,
    total = within + between + simulation;
  return {
    estimate,
    within,
    between,
    simulation,
    total,
    standardError: Math.sqrt(total)
  };
}
export const completionTables = [[8, 10, 13.844877, 12, 10.417592], [8, 10, 3.469308, 12, 3.517166], [8, 10, 9.252957, 12, 10.045356]];
export const completionQ = [10.852494, 7.397295, 9.859663];
export const completionU = [.966187, 2.940335, .423083];
export const sensitivity = delta => 8.686461347735442 + .4 * delta;
