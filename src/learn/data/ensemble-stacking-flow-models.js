import { bootstrapRows, oofOwnershipState } from './ensemble-methods-models.js';

export const initialCombinerMatrix = Object.freeze([[1, 2, 4], [3, 2, 1], [2, 5, 0]].map(row => Object.freeze(row)));
export const initialCombinerTargets = Object.freeze([2, 1, 3]);

export function stackingOwnershipState(mode, completed, query, inspectedRow = 0) {
  if (!Number.isInteger(inspectedRow) || inspectedRow < 0 || inspectedRow > 5) throw new RangeError('Inspect row A–F.');
  const full = oofOwnershipState(mode, 3, query);
  const trace = oofOwnershipState('honest', completed, query);
  const honest = oofOwnershipState('honest', 3, query);
  return { full, trace, honest, inspectedRow, rows: bootstrapRows,
    active: trace.stages[Math.max(0, completed - 1)] };
}

export function parseCombinerMatrix(text) {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim());
  if (!lines.length || lines.length > 20) throw new RangeError('Use 1–20 rows, each forecasts => target.');
  const pattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
  const matrix = [], targets = [];
  for (const line of lines) {
    const halves = line.split('=>');
    if (halves.length !== 2) throw new RangeError('Each row needs comma-separated forecasts => one target.');
    const values = halves[0].split(',').map(value => value.trim());
    const target = halves[1].trim();
    if (values.length < 2 || values.length > 5 || [...values, target].some(value => !pattern.test(value) || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 1e6)) {
      throw new RangeError('Use 2–5 member columns and finite forecasts/targets within ±1e6.');
    }
    if (matrix.length && values.length !== matrix[0].length) throw new RangeError('Every row must have the same member columns.');
    matrix.push(values.map(Number)); targets.push(Number(target));
  }
  return { matrix, targets };
}

export function serializeCombinerMatrix(matrix, targets) {
  return matrix.map((row, index) => `${row.join(', ')} => ${targets[index]}`).join('\n');
}

function validateProblem(matrix, targets, strength, constraint) {
  if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > 20 || !Array.isArray(matrix[0]) || matrix[0].length < 2 || matrix[0].length > 5 || !Array.isArray(targets) || targets.length !== matrix.length) throw new RangeError('Use 1–20 rows and 2–5 members with a target per row.');
  for (let i = 0; i < matrix.length; i += 1) {
    if (!Object.hasOwn(matrix, i) || !Array.isArray(matrix[i]) || matrix[i].length !== matrix[0].length || !Object.hasOwn(targets, i)) throw new RangeError('Keep dense rectangular rows/targets.');
    for (let j = 0; j < matrix[0].length; j += 1) if (!Object.hasOwn(matrix[i], j) || !Number.isFinite(matrix[i][j]) || Math.abs(matrix[i][j]) > 1e6) throw new RangeError('Forecasts must be finite and within ±1e6.');
    if (!Number.isFinite(targets[i]) || Math.abs(targets[i]) > 1e6) throw new RangeError('Targets must be finite and within ±1e6.');
  }
  if (!Number.isFinite(strength) || strength < 0 || strength > 10 || !['simplex', 'nonnegative', 'unrestricted'].includes(constraint)) throw new RangeError('Use ridge 0–10 and a named coefficient constraint.');
}

export function scaledDot(values, weights) {
  const scale = Math.max(...values.map(Math.abs));
  if (scale === 0) return 0;
  return values.reduce((sum, value, index) => sum + value / scale * weights[index], 0) * scale;
}

function simplex(vector) {
  const maximum = Math.max(...vector);
  const centered = vector.map(value => value - maximum);
  if (centered.some(value => !Number.isFinite(value))) throw new RangeError('Projection exceeds finite arithmetic.');
  const ordered = [...centered].sort((a, b) => b - a);
  let sum = 0, threshold = 0;
  ordered.forEach((value, index) => { sum += value; const candidate = (sum - 1) / (index + 1); if (value > candidate) threshold = candidate; });
  return centered.map(value => Math.max(value - threshold, 0));
}

function largestEigenvalue(matrix) {
  const a = matrix.map(row => [...row]);
  const count = a.length;
  for (let sweep = 0; sweep < 100; sweep += 1) {
    let p = 0, q = 1;
    for (let i = 0; i < count; i += 1) for (let j = i + 1; j < count; j += 1) if (Math.abs(a[i][j]) > Math.abs(a[p][q])) { p = i; q = j; }
    const scale = Math.max(...a.map((row, index) => Math.abs(row[index])));
    if (a[p][q] === 0 || Math.abs(a[p][q]) <= Number.EPSILON * 8 * scale) break;
    const tau = (a[q][q] - a[p][p]) / (2 * a[p][q]);
    const t = tau === 0 ? 1 : Math.sign(tau) / (Math.abs(tau) + Math.hypot(1, tau));
    const c = 1 / Math.hypot(1, t), s = t * c;
    const ap = a[p][p], aq = a[q][q], off = a[p][q];
    a[p][p] = ap - t * off; a[q][q] = aq + t * off;
    a[p][q] = 0; a[q][p] = 0;
    for (let k = 0; k < count; k += 1) if (k !== p && k !== q) {
      const kp = a[k][p], kq = a[k][q];
      a[k][p] = a[p][k] = c * kp - s * kq;
      a[k][q] = a[q][k] = s * kp + c * kq;
    }
  }
  return Math.max(0, ...a.map((row, index) => row[index]));
}

function numericalRank(matrix) {
  if (!matrix.length || !matrix[0].length) return 0;
  const scale = Math.max(...matrix.flat().map(Math.abs));
  if (!scale) return 0;
  const a = matrix.map(row => row.map(value => value / scale));
  let rank = 0;
  const tolerance = Number.EPSILON * Math.max(matrix.length, matrix[0].length) * 32;
  for (let column = 0; column < matrix[0].length && rank < matrix.length; column += 1) {
    let pivot = rank;
    for (let row = rank + 1; row < matrix.length; row += 1) if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
    if (Math.abs(a[pivot][column]) <= tolerance) continue;
    [a[pivot], a[rank]] = [a[rank], a[pivot]];
    for (let row = rank + 1; row < matrix.length; row += 1) {
      const factor = a[row][column] / a[rank][column];
      for (let j = column; j < matrix[0].length; j += 1) a[row][j] -= factor * a[rank][j];
    }
    rank += 1;
  }
  return rank;
}

function gradientTrace(matrix, targets, strength, weights) {
  const rows = matrix.map((forecasts, index) => {
    const prediction = scaledDot(forecasts, weights);
    return { id: String.fromCharCode(65 + index), forecasts, target: targets[index],
      products: forecasts.map((value, member) => value * weights[member]), prediction, residual: prediction - targets[index] };
  });
  const gradient = weights.map((weight, member) => rows.reduce((sum, row) => sum + row.forecasts[member] * row.residual / rows.length, 0) + strength * weight);
  const residualScale = Math.max(...rows.map(row => Math.abs(row.residual)));
  const scaledResidualSquares = residualScale ? rows.reduce((sum, row) => sum + (row.residual / residualScale) ** 2, 0) / (2 * rows.length) : 0;
  const penalty = strength * weights.reduce((sum, value) => sum + value ** 2, 0) / 2;
  return { rows, gradient, residualScale, scaledResidualSquares, penalty,
    objective: residualScale ** 2 * scaledResidualSquares + penalty };
}

export function fitEditedCombiner(matrix, targets, strength = .2, constraint = 'simplex', maxSteps = 100000) {
  validateProblem(matrix, targets, strength, constraint);
  if (!Number.isInteger(maxSteps) || maxSteps < 0 || maxSteps > 100000) throw new RangeError('Step limit must be 0–100000.');
  const count = matrix[0].length;
  const hessian = Array.from({ length: count }, (_, i) => Array.from({ length: count }, (_, j) => matrix.reduce((sum, row) => sum + row[i] * row[j] / matrix.length, 0) + (i === j ? strength : 0)));
  const directions = constraint === 'simplex' ? matrix.map(row => row.slice(0, -1).map(value => value - row.at(-1))) : matrix;
  const rank = numericalRank(directions);
  const uniqueness = strength > 0 ? 'Strictly convex from positive ridge' : rank === directions[0].length ? 'Numerically full rank on feasible affine space' : 'Not guaranteed: null directions; active constraints may still identify weights';
  const lipschitz = largestEigenvalue(hessian);
  const step = lipschitz > 0 ? 1 / lipschitz : 1;
  let weights = Array(count).fill(constraint === 'simplex' ? 1 / count : 0);
  const base = { matrix, targets, strength, constraint, hessian, lipschitz, step, rank, uniqueness, maxSteps };
  const failure = (status, message, iteration, trace, mapping = null, stationarity = null) => ({ ...base, ...trace, weights, status, message, iteration, mapping, stationarity, feasibility: null });
  const squaredUnderflow = matrix.some((row, memberRow) => row.some((value, member) => value !== 0 && hessian[member][member] === 0)) && strength === 0;
  if (!Number.isFinite(step) || squaredUnderflow) return failure('numerical-resolution', 'Entered matrix retained, but nonzero curvature or its reciprocal is beyond this finite arithmetic. No fitted result is certified.', 0, gradientTrace(matrix, targets, strength, weights));
  for (let iteration = 0; iteration <= maxSteps; iteration += 1) {
    const trace = gradientTrace(matrix, targets, strength, weights);
    if (![...trace.gradient, ...weights, trace.objective].every(Number.isFinite)) return failure('numerical-resolution', 'The valid entered problem exceeds finite intermediate arithmetic; retain unavailable fitted result.', iteration, trace);
    const candidate = weights.map((value, index) => value - step * trace.gradient[index]);
    if (!candidate.every(Number.isFinite)) return failure('numerical-resolution', 'The next coefficient step exceeds finite arithmetic.', iteration, trace);
    let next;
    try { next = constraint === 'simplex' ? simplex(candidate) : constraint === 'nonnegative' ? candidate.map(value => Math.max(0, value)) : candidate; }
    catch (error) { return failure('numerical-resolution', error.message, iteration, trace); }
    const mapping = Math.max(...weights.map((value, index) => Math.abs((value - next[index]) / step)));
    const common = constraint === 'simplex' ? trace.gradient.reduce((sum, value, index) => sum + value * weights[index], 0) : 0;
    const stationarity = Math.max(...weights.map((value, index) => constraint === 'unrestricted' || value > 0 ? Math.abs(trace.gradient[index] - common) : Math.max(0, common - trace.gradient[index])));
    let feasibility = constraint === 'unrestricted' ? 0 : Math.max(0, -Math.min(...weights));
    if (constraint === 'simplex') feasibility = Math.max(feasibility, Math.abs(weights.reduce((a, b) => a + b, 0) - 1));
    if (mapping <= 1e-10 && stationarity <= 1e-10 && feasibility <= 1e-10) return { ...base, ...trace, weights, status: 'converged', message: 'Projected mapping, direct stationarity and feasibility meet 1e−10.', iteration, mapping, stationarity, feasibility };
    if (mapping === 0 && stationarity > 1e-10) return failure('numerical-resolution', 'Rounded coefficient step is stationary, but the direct gradient condition fails; no converged fit is claimed.', iteration, trace, mapping, stationarity);
    if (iteration === maxSteps) return failure('iteration-limit', `No convergence within ${maxSteps} steps; current coefficients are an iterate, not a saved fitted rule.`, iteration, trace, mapping, stationarity);
    weights = next;
  }
}
