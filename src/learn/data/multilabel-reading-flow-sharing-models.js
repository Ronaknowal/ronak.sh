export const proximalHandInputs = [[1, 0], [1, 1], [0, 1]];
export const proximalHandTargets = [[1, 0], [1, 1], [0, 1]];

function objective(weights, alpha) {
  let squared = 0;
  for (let i = 0; i < 3; i++) for (let output = 0; output < 2; output++) {
    const prediction = proximalHandInputs[i].reduce((sum, value, feature) => sum + value * weights[feature][output], 0);
    squared += (prediction - proximalHandTargets[i][output]) ** 2;
  }
  return squared / 6 + alpha * weights.reduce((sum, row) => sum + Math.hypot(...row), 0);
}

export function generalRowProximalStep(weights, alpha, step = .5) {
  if (!Array.isArray(weights) || weights.length !== 2 || weights.some(row => !Array.isArray(row) || row.length !== 2 || row.some(value => !Number.isFinite(value))) || !Number.isFinite(alpha) || alpha < 0 || alpha > 1 || step !== .5) throw new Error('Use the declared finite two-row hand problem, α in0–1 and step .5.');
  const residual = proximalHandInputs.map((row, i) => [0, 1].map(output => row.reduce((sum, value, feature) => sum + value * weights[feature][output], 0) - proximalHandTargets[i][output]));
  const gradient = [0, 1].map(feature => [0, 1].map(output => proximalHandInputs.reduce((sum, row, i) => sum + row[feature] * residual[i][output], 0) / 3));
  const z = weights.map((row, feature) => row.map((value, output) => value - step * gradient[feature][output]));
  const norms = z.map(row => Math.hypot(...row));
  const factors = norms.map(norm => norm === 0 ? 0 : Math.max(0, 1 - step * alpha / norm));
  const successor = z.map((row, feature) => row.map(value => value * factors[feature]));
  const stationarity = Math.max(...successor.flatMap((row, feature) => row.map((value, output) => Math.abs(value - weights[feature][output]) / step)));
  return { weights, residual, gradient, z, norms, factors, successor, threshold: step * alpha, objective: objective(weights, alpha), nextObjective: objective(successor, alpha), stationarity };
}

export function generalRowProximalTrace(iterations = 0, alpha = .2) {
  if (!Number.isInteger(iterations) || iterations < 0 || iterations > 200) throw new Error('Choose a hand iteration count in0–200.');
  let weights = [[0, 0], [0, 0]];
  const history = [];
  for (let iteration = 0; iteration <= iterations; iteration++) {
    const state = generalRowProximalStep(weights, alpha);
    history.push({ iteration, objective: state.objective, stationarity: state.stationarity });
    if (iteration === iterations) return { ...state, history, iteration, alpha, step: .5, lipschitz: 1, status: state.stationarity <= 1e-8 ? 'stationary within1e−8' : iteration === 200 ? 'iteration cap reached; not stationary' : 'selected intermediate iterate; not stationary' };
    weights = state.successor;
  }
}
