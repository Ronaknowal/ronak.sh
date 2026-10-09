import {
  projectSimplexPair,
  coupledProjectionState,
  constraintPenaltyState,
  consensusAdmmState,
  deploymentCandidates,
  dominatesMetrics,
  paretoIndices,
  continuousTradeoffState,
  modifiedConstraintCost,
  originalConstraintCost,
} from './constrained-multiobjective-models.js';
import observations from './constrained-observed-catalogue.json';

// These established pure owners retain their original successful numerical evidence.
export {
  coupledProjectionState, constraintPenaltyState, consensusAdmmState,
  deploymentCandidates, dominatesMetrics, paretoIndices, continuousTradeoffState,
  modifiedConstraintCost, originalConstraintCost,
};
export const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
export const add = (a, b) => a.map((value, i) => value + b[i]);
export const subtract = (a, b) => a.map((value, i) => value - b[i]);
export const multiply = (a, scalar) => a.map(value => value * scalar);
export const norm = a => Math.hypot(...a);
export const quadraticCost = ([a, b]) => ((a - 2) ** 2 + 4 * (b - .5) ** 2) / 2;
export const quadraticGradient = ([a, b]) => [a - 2, 4 * (b - .5)];

export function projectedTrace(eta = .2) {
  if (!Number.isFinite(eta) || eta < .05 || eta > 1) throw new RangeError('Step size must be between .05 and 1.');
  let current = [.5, .5];
  const frames = [];
  for (let k = 0; k <= 20; k += 1) {
    const gradient = quadraticGradient(current);
    const trial = subtract(current, multiply(gradient, eta));
    const next = projectSimplexPair(trial, 1);
    const mapping = multiply(subtract(current, next), 1 / eta);
    const recurrence = Math.max(0, Math.min(1, (1 - 2.5 * eta) * current[0] + 2 * eta));
    if (Math.abs(next[0] - recurrence) > 1e-12) throw new Error('Projection and scalar recurrence disagree.');
    frames.push({k, current, gradient, trial, next, mapping, mappingNorm: norm(mapping), cost: quadraticCost(current)});
    current = next;
  }
  return frames;
}

export function commonDirection(g1 = [2, 0], g2 = [0, 2]) {
  for (const vector of [g1, g2]) {
    if (vector.length !== 2 || vector.some(x => !Number.isFinite(x) || Math.abs(x) > 3)) {
      throw new RangeError('Each gradient needs two finite coordinates between −3 and 3.');
    }
  }
  const edge = subtract(g1, g2);
  const denominator = dot(edge, edge);
  const alpha = denominator === 0 ? .5 : Math.max(0, Math.min(1, -dot(g2, edge) / denominator));
  const closest = add(g2, multiply(edge, alpha));
  const direction = multiply(closest, -1);
  return {g1, g2, alpha, closest, direction, rates: [dot(g1, direction), dot(g2, direction)], norm: norm(closest), coincident: denominator === 0};
}

export function feasibleCatalogue(latency = 25, memory = 400) {
  if (!Number.isInteger(latency) || latency < 0 || latency > 80 || !Number.isInteger(memory) || memory < 0 || memory > 400) {
    throw new RangeError('Use integer limits: 0–80 ms and 0–400 MB.');
  }
  const rows = deploymentCandidates.map(row => ({...row, reasons: [row.latencyMs > latency && 'latency', row.memoryMb > memory && 'memory'].filter(Boolean)}));
  const feasible = rows.filter(row => row.reasons.length === 0);
  const frontier = paretoIndices(feasible.map(row => [row.latencyMs, row.error])).map(index => feasible[index].id);
  return {rows, feasible, frontier};
}

export const observedCohort = observations.cohort;
export const observedFinite = observedCohort.filter(row => row.horsepower !== null);
const observedStates = new Map(observations.states.map(state => [`${state.cylinder_limit}/${state.minimum_mpg}`, state]));
export function observedState(cylinders = 4, mpg = 30) {
  const state = observedStates.get(`${cylinders}/${mpg}`);
  if (!state || !Number.isInteger(mpg)) throw new RangeError('Use a listed cylinder limit and an integer mpg floor from 0 to 50.');
  return state;
}

export function paddedBounds(points, include = [0, 1]) {
  const values = [...points.flat(), ...include];
  const low = Math.min(...values), high = Math.max(...values);
  const padding = Math.max(.2, (high - low) * .18);
  return [low - padding, high + padding];
}

export function smoothMax(x, mu) {
  const largest = Math.abs(x);
  return largest + mu * Math.log(Math.exp((-x - largest) / mu) + Math.exp((x - largest) / mu));
}
