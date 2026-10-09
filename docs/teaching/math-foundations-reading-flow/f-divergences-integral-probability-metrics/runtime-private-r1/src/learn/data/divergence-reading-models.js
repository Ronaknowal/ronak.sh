import {
  divergenceState,
  normalizeDivergenceWeights,
  observableState,
  kernelWitnessState,
  movingAtomState,
  variationalDivergenceState,
} from './divergence-ipm-models.js';
import { IRIS } from './divergences-iris-data.js';

export { divergenceState, movingAtomState, variationalDivergenceState };
export const P = [.7, .2, .1, 0];
export const Q = [.4, .5, .1, 0];
export const POSITIONS = [-3, -1, 1, 3];
export const POOL = [-2, -1.5, -1, -.5, .5, 1, 1.5, 2];

export function numeric(text, lower, upper, label = 'Value') {
  if (String(text).trim() === '') throw new Error(`${label} needs a number.`);
  const value = Number(text);
  if (!Number.isFinite(value) || value < lower || value > upper) {
    throw new Error(`${label} must be finite, from ${lower} to ${upper}.`);
  }
  return value;
}

export function weight(text) {
  const value = numeric(text, 0, 100, 'Weight');
  if (value > 0 && value < 1e-8) throw new Error('A positive weight must be at least 0.00000001.');
  return value;
}

export function samples(text) {
  const pieces = String(text).trim().split(/[\s,]+/);
  if (pieces.length < 2 || pieces.length > 6) throw new Error('Enter 2–6 observations.');
  return pieces.map(value => numeric(value, -3, 3, 'Observation'));
}

export function validWeights(values) {
  normalizeDivergenceWeights(values);
  return values;
}

export function generator(t, kind) {
  if (t < 0) return NaN;
  if (kind === 'kl') return t === 0 ? 1 : t * Math.log(t) - t + 1;
  if (kind === 'reverse') return t === 0 ? Infinity : -Math.log(t) + t - 1;
  if (kind === 'js') return t === 0 ? Math.LN2 / 2 : (t * Math.log(2 * t / (1 + t)) + Math.log(2 / (1 + t))) / 2;
  if (kind === 'hellinger') return (Math.sqrt(t) - 1) ** 2 / 2;
  if (kind === 'tv') return Math.abs(t - 1) / 2;
  if (kind === 'chi') return (t - 1) ** 2;
  throw new Error('Unknown generator.');
}

export function observers(state) {
  const optimum = observableState(state.p, state.q, POSITIONS, 'lipschitz');
  const event = state.mask.map(Number);
  const linear = POSITIONS.map(x => state.slope * x);
  const lipschitz = [0];
  for (let i = 0; i < 3; i += 1) {
    lipschitz.push(lipschitz[i] + state.slopes[i] * (POSITIONS[i + 1] - POSITIONS[i]));
  }
  const describe = scores => ({
    scores,
    terms: scores.map((g, i) => g * optimum.difference[i]),
    attained: scores.reduce((sum, g, i) => sum + g * optimum.difference[i], 0),
  });
  return { ...optimum, event: describe(event), linear: describe(linear), lipschitz: describe(lipschitz) };
}

export function kernel(x, y, kind = 'rbf', sigma = 1) {
  if (kind === 'linear') return x * y;
  if (kind === 'quadratic') return x * y + x * x * y * y;
  return Math.exp(-(((x - y) / sigma) ** 2) / 2);
}

export function kernelReading(state) {
  numeric(state.query, -3, 3, 'Witness query');
  const s = kernelWitnessState(state.x, state.y, state.sigma, state.kind);
  const queryX = s.x.map(x => kernel(x, state.query, state.kind, state.sigma));
  const queryY = s.y.map(y => kernel(y, state.query, state.kind, state.sigma));
  const queryMeanX = queryX.reduce((a, b) => a + b, 0) / queryX.length;
  const queryMeanY = queryY.reduce((a, b) => a + b, 0) / queryY.length;
  const observations = [
    ...s.x.map((x, i) => ({ id: `X${i}`, value: x, role: 'P' })),
    ...s.y.map((y, i) => ({ id: `Y${i}`, value: y, role: 'Q' })),
  ];
  const gram = observations.map(a => observations.map(b => kernel(a.value, b.value, state.kind, state.sigma)));
  const locate = id => {
    const found = observations.findIndex(row => row.id === id);
    if (found >= 0) return found;
    return id.startsWith('Y') ? observations.length - 1 : s.x.length - 1;
  };
  const a = locate(state.pair[0]);
  const b = locate(state.pair[1]);
  return {
    ...s, observations, gram,
    pair: [a, b], selected: [observations[a], observations[b]],
    pairValue: gram[a][b], distance: Math.abs(observations[a].value - observations[b].value),
    queryX, queryY, queryMeanX, queryMeanY, queryValue: queryMeanX - queryMeanY,
    query: state.query,
  };
}

function chooseFour() {
  const rows = [];
  for (let a = 0; a < 5; a += 1) {
    for (let b = a + 1; b < 6; b += 1) {
      for (let c = b + 1; c < 7; c += 1) {
        for (let d = c + 1; d < 8; d += 1) rows.push([a, b, c, d]);
      }
    }
  }
  return rows;
}
const ALLOCATIONS = chooseFour();

export function permutationReading(pool = POOL, sigma = 1, mode = 'fixed') {
  if (pool.length !== 8) throw new Error('The pool requires eight indexed observations.');
  pool.forEach(v => numeric(v, -3, 3, 'Pool observation'));
  if (![.3, 1, 3].includes(sigma) || !['fixed', 'selection'].includes(mode)) throw new Error('Choose a supported complete testing rule.');
  const bandwidths = mode === 'selection' ? [.3, 1, 3] : [sigma];
  const matrices = bandwidths.map(width => pool.map(x => pool.map(y => kernel(x, y, 'rbf', width))));
  const rows = ALLOCATIONS.map((indices, index) => {
    const complement = pool.map((_, i) => i).filter(i => !indices.includes(i));
    const scores = matrices.map(gram => {
      const sum = (a, b) => a.reduce((outer, i) => outer + b.reduce((inner, j) => inner + gram[i][j], 0), 0);
      const value = (sum(indices, indices) + sum(complement, complement) - 2 * sum(indices, complement)) / 16;
      if (value < -1e-12) throw new Error('Unexpected negative empirical norm.');
      return Math.max(0, value);
    });
    const statistic = Math.max(...scores);
    return { index, indices, complement, scores, statistic, winningBandwidth: bandwidths[scores.indexOf(statistic)] };
  });
  const observed = rows[0].statistic;
  const tailCount = rows.filter(row => row.statistic >= observed - 1e-12).length;
  return { pool, rows, bandwidths, observed, tailCount, pValue: tailCount / 70 };
}

export function irisReading({ features = 'sepal', sigma = 1, unit = 'cm', same = false, rowP = 0, rowQ = 0 }) {
  numeric(sigma, .1, 3, 'Physical bandwidth in cm');
  if (!['sepal', 'petal'].includes(features) || !['cm', 'mm'].includes(unit)) throw new Error('Choose the stated coordinates and units.');
  const offset = features === 'sepal' ? 0 : 2;
  const groups = [IRIS.slice(0, 50), IRIS.slice(same ? 0 : 50, same ? 50 : 100)];
  const factor = unit === 'mm' ? 10 : 1;
  const points = groups.map((rows, group) => rows.map(row => ({
    id: row.id, role: group ? 'Q' : 'P', species: row.species,
    physical: row.values.slice(offset, offset + 2),
    display: row.values.slice(offset, offset + 2).map(x => x * factor),
  })));
  const similarity = (a, b) => Math.exp(-a.physical.reduce((sum, x, i) => sum + (x - b.physical[i]) ** 2, 0) / (2 * sigma ** 2));
  const pairMean = (a, b) => a.reduce((sum, x) => sum + b.reduce((inner, y) => inner + similarity(x, y), 0), 0) / (a.length * b.length);
  const xx = pairMean(points[0], points[0]);
  const yy = pairMean(points[1], points[1]);
  const xy = pairMean(points[0], points[1]);
  const raw = xx + yy - 2 * xy;
  if (raw < -1e-12) throw new Error('Unexpected negative empirical norm.');
  const selected = [points[0][rowP], points[1][rowQ]];
  if (selected.some(p => !p)) throw new Error('Choose an actual row from each sample.');
  const distance = Math.hypot(...selected[0].display.map((x, i) => x - selected[1].display[i]));
  return { points, selected, xx, yy, xy, biasedSquared: Math.max(0, raw), distance,
    similarity: similarity(...selected), displayedSigma: sigma * factor, factor, unit, features, sigma, same };
}
