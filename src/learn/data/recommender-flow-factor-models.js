import { sum, dot } from './recommender-flow-evidence-models.js';

export const factorDefaults = () => ({ mu: 3, target: 5, eta: .05, lambda: .1, steps: 1, dimension: 2,
  P: [[.4, -.2], [.2, .1], [.3, .2], [-.1, .4], [.1, -.3]],
  Q: [[.7, .1], [.2, -.3], [.5, .3], [-.1, .4], [.3, -.2], [.2, .5], [.1, .1]],
  userBias: [.1, 0, 0, 0, 0], itemBias: [0, 0, -.1, 0, 0, 0, 0],
  angle: 0, scale: 2, completion: .5, noise: 1, prior: 10, convention: 'entity', coordinate: 0,
  blockP: [1, 0], blockQ: [[1, 0], [1, 1]], blockRatings: [4, 2], blockLambda: 1, bowlP: 0 });

export function resizeFactorRows(rows, count, dimension) {
  return Array.from({ length: count }, (_, row) => Array.from({ length: dimension }, (_, coordinate) => rows[row]?.[coordinate] ?? 0));
}

export function factorScore({ mu, bu, bi, p, q }) {
  const products = p.map((value, coordinate) => value * q[coordinate]);
  return { products, factor: sum(products), score: mu + bu + bi + sum(products) };
}

export function factorObjective(state, lambda) {
  const score = factorScore(state).score;
  const error = state.target - score;
  const norm = dot(state.p, state.p) + dot(state.q, state.q) + state.bu ** 2 + state.bi ** 2;
  return { score, error, norm, residual: .5 * error ** 2, penalty: .5 * lambda * norm, loss: .5 * error ** 2 + .5 * lambda * norm };
}

export function factorStep(state, eta, lambda, inplace = false) {
  const objective = factorObjective(state, lambda);
  const gp = state.p.map((value, coordinate) => -objective.error * state.q[coordinate] + lambda * value);
  const p = state.p.map((value, coordinate) => value - eta * gp[coordinate]);
  const gq = state.q.map((value, coordinate) => -objective.error * (inplace ? p : state.p)[coordinate] + lambda * value);
  const gbu = -objective.error + lambda * state.bu;
  const gbi = -objective.error + lambda * state.bi;
  const next = { ...state, p, q: state.q.map((value, coordinate) => value - eta * gq[coordinate]),
    bu: state.bu - eta * gbu, bi: state.bi - eta * gbi };
  const valid = [...next.p, ...next.q, next.bu, next.bi].every(value => Number.isFinite(value) && Math.abs(value) <= 1e4);
  return { objective, gradient: { p: gp, q: gq, bu: gbu, bi: gbi }, next: valid ? next : null,
    unavailable: valid ? null : 'The proposed parameter leaves the finite ±10000 context; no parameter was clipped.' };
}

export function factorTrace(state, eta, lambda, steps) {
  const states = [{ step: 0, state, ...factorObjective(state, lambda) }];
  let unavailable = null;
  for (let step = 1; step <= steps; step += 1) {
    const update = factorStep(states.at(-1).state, eta, lambda);
    if (!update.next) { unavailable = { step, message: update.unavailable }; break; }
    states.push({ step, state: update.next, ...factorObjective(update.next, lambda) });
  }
  return { states, unavailable };
}

export function rotateFactors(p, q, degrees) {
  const angle = degrees * Math.PI / 180;
  const rotate = vector => {
    const next = [...vector];
    next[0] = Math.cos(angle) * vector[0] - Math.sin(angle) * (vector[1] ?? 0);
    if (vector.length > 1) next[1] = Math.sin(angle) * vector[0] + Math.cos(angle) * vector[1];
    return next;
  };
  if (p.length < 2) return { available: false, reason: 'A two-coordinate rotation requires dimension at least 2.' };
  return { available: true, p: rotate(p), q: rotate(q), originalDot: dot(p, q), newDot: dot(rotate(p), rotate(q)),
    originalNorm: dot(p, p) + dot(q, q), newNorm: dot(rotate(p), rotate(p)) + dot(rotate(q), rotate(q)) };
}

export function rescaleFactors(p, q, scale) {
  if (scale === 0) return { available: false, reason: 'A is singular: its inverse action is unavailable.' };
  const left = p.map((value, coordinate) => coordinate === 0 ? value * scale : value);
  const right = q.map((value, coordinate) => coordinate === 0 ? value / scale : value);
  if (![...left, ...right].every(Number.isFinite)) return { available: false, reason: 'The inverse action is not finite in this representation.' };
  return { available: true, p: left, q: right, originalDot: dot(p, q), newDot: dot(left, right),
    originalNorm: dot(p, p) + dot(q, q), newNorm: dot(left, left) + dot(right, right) };
}

export const fixedBowl = p => ({ terms: [(4 - p) ** 2, (2 - 2 * p) ** 2, p ** 2], loss: 20 - 16 * p + 6 * p ** 2, derivative: -16 + 12 * p });

export function coordinateMinimum(p, Q, ratings, coordinate, lambda) {
  const terms = Q.map((q, item) => {
    const other = sum(q.map((value, index) => index === coordinate ? 0 : p[index] * value));
    const residual = ratings[item] - other;
    return { item, q: q[coordinate], other, residual, product: q[coordinate] * residual, square: q[coordinate] ** 2 };
  });
  const numerator = sum(terms.map(term => term.product));
  const denominator = sum(terms.map(term => term.square)) + lambda;
  return { terms, numerator, denominator, value: denominator === 0 ? null : numerator / denominator };
}

// Cholesky uses the declared scale of the actual matrix; no hidden ridge or inverse.
export function positiveDefiniteSolve(A, b) {
  const dimension = b.length;
  const L = Array.from({ length: dimension }, () => Array(dimension).fill(0));
  const scale = Math.max(1, ...A.flat().map(Math.abs));
  const tolerance = Number.EPSILON * scale * dimension * 32;
  for (let row = 0; row < dimension; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      const remainder = A[row][column] - sum(Array.from({ length: column }, (_, k) => L[row][k] * L[column][k]));
      if (row === column && (!Number.isFinite(remainder) || remainder <= tolerance)) {
        return { available: false, tolerance, reason: 'A unique positive-curvature solve is numerically unavailable at the declared matrix scale.' };
      }
      L[row][column] = row === column ? Math.sqrt(remainder) : remainder / L[column][column];
    }
  }
  const y = [];
  for (let row = 0; row < dimension; row += 1) y[row] = (b[row] - sum(y.map((value, k) => L[row][k] * value))) / L[row][row];
  const p = Array(dimension).fill(0);
  for (let row = dimension - 1; row >= 0; row -= 1) p[row] = (y[row] - sum(p.map((value, k) => k > row ? L[k][row] * value : 0))) / L[row][row];
  if (!p.every(Number.isFinite)) return { available: false, tolerance, reason: 'The solved parameters are not finite.' };
  return { available: true, L, y, p, residual: A.map((row, coordinate) => dot(row, p) - b[coordinate]), tolerance };
}

export function observedBlock(Q, ratings, lambda, convention = 'entity') {
  const dimension = Q[0]?.length ?? 2;
  const selected = ratings.flatMap((rating, item) => rating === null ? [] : [{ rating, item, q: Q[item] }]);
  const penalty = convention === 'record' ? lambda * selected.length : lambda;
  const contributions = selected.map(entry => ({ ...entry,
    outer: entry.q.map(left => entry.q.map(right => left * right)), vector: entry.q.map(value => value * entry.rating) }));
  const A = Array.from({ length: dimension }, (_, row) => Array.from({ length: dimension }, (_, column) =>
    sum(contributions.map(entry => entry.outer[row][column])) + (row === column ? penalty : 0)));
  const b = Array.from({ length: dimension }, (_, coordinate) => sum(contributions.map(entry => entry.vector[coordinate])));
  return { contributions, penalty, A, b, ...positiveDefiniteSolve(A, b) };
}
