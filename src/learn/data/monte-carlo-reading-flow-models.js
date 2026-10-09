import { harmonicEnergy, leapfrog, nutsExpansion, seededRandom } from './monte-carlo-mcmc-models.js';

// Drawing adapters preserve the original numerical owners. This trajectory
// deliberately retains every requested step, including large unstable states.
export function completeHarmonicPath(step = .2, steps = 16) {
  if (!Number.isFinite(step) || step < 0 || step > 2.5) throw new RangeError('Step size must lie in [0, 2.5].');
  if (!Number.isInteger(steps) || steps < 1 || steps > 32) throw new RangeError('Use 1 through 32 steps.');
  const energy = harmonicEnergy(1, .7);
  const rows = [{ index: 0, position: 1, momentum: .7, energy, energyError: 0 }];
  for (let index = 1; index <= steps; index += 1) {
    const previous = rows.at(-1);
    const next = leapfrog(previous.position, previous.momentum, step);
    const nextEnergy = harmonicEnergy(next.position, next.momentum);
    rows.push({ index, ...next, energy: nextEnergy, energyError: nextEnergy - energy });
  }
  return { rows, initialEnergy: energy, acceptance: Math.exp(Math.min(0, -rows.at(-1).energyError)) };
}

// Instrument the same recursive Algorithm 2 calls, without changing a random
// draw or eligibility rule. A node exists only when that call actually happens.
export function nutsConstruction({ seed = 7, position = 1, momentum = .7, step = .25, maxDepth = 5 } = {}) {
  const reference = nutsExpansion({ seed, position, momentum, step, maxDepth });
  const random = seededRandom(seed);
  const initial = { id: 's0', position, momentum, time: 0 };
  const logSlice = -harmonicEnergy(position, momentum) + Math.log(random.uniform());
  const nodes = [];
  const explored = [];
  const snapshots = [];
  const notTurning = (left, right) => (right.position - left.position) * left.momentum >= 0 && (right.position - left.position) * right.momentum >= 0;
  let divergent = false;
  function build(start, direction, depth, parent, round) {
    const node = { id: `n${nodes.length}`, parent, depth, round, direction, children: [] };
    nodes.push(node);
    if (depth === 0) {
      const next = leapfrog(start.position, start.momentum, direction * step);
      const state = { id: `s${explored.length + 1}`, position: next.position, momentum: next.momentum, time: start.time + direction };
      const joint = -harmonicEnergy(state.position, state.momentum);
      const validEnergy = Number.isFinite(joint) && joint > logSlice - 1000;
      const onSlice = validEnergy && logSlice <= joint;
      if (!validEnergy) divergent = true;
      explored.push({ ...state, onSlice, validEnergy, node: node.id, round });
      Object.assign(node, { state: state.id, keepBuilding: validEnergy, candidates: onSlice ? [state.id] : [] });
      return { left: state, right: state, candidates: onSlice ? [state] : [], keepBuilding: validEnergy, node: node.id };
    }
    const first = build(start, direction, depth - 1, node.id, round);
    node.children.push(first.node);
    if (!first.keepBuilding) {
      Object.assign(node, { keepBuilding: false, candidates: first.candidates.map(state => state.id) });
      return { ...first, node: node.id };
    }
    const second = build(direction < 0 ? first.left : first.right, direction, depth - 1, node.id, round);
    node.children.push(second.node);
    const left = direction < 0 ? second.left : first.left;
    const right = direction < 0 ? first.right : second.right;
    const candidates = first.candidates.concat(second.candidates);
    const keepBuilding = second.keepBuilding && notTurning(left, right);
    Object.assign(node, { keepBuilding, candidates: candidates.map(state => state.id), left: left.id, right: right.id });
    return { left, right, candidates, keepBuilding, node: node.id };
  }
  let left = initial;
  let right = initial;
  let candidates = [initial];
  let keepBuilding = true;
  snapshots.push({ depth: 0, left, right, explored: [], candidates: candidates.slice(), nodeIds: [], stopReason: 'Initial leaf', newStates: 0 });
  for (let depth = 0; depth < maxDepth && keepBuilding; depth += 1) {
    const direction = random.uniform() < .5 ? -1 : 1;
    const before = explored.length;
    const subtree = build(direction < 0 ? left : right, direction, depth, null, depth + 1);
    if (direction < 0) left = subtree.left; else right = subtree.right;
    if (subtree.keepBuilding) candidates = candidates.concat(subtree.candidates);
    const turns = !notTurning(left, right);
    keepBuilding = subtree.keepBuilding && !turns;
    snapshots.push({ depth: depth + 1, direction, left, right, explored: explored.slice(), candidates: candidates.slice(), nodeIds: nodes.map(node => node.id), root: subtree.node, newStates: explored.length - before, subtreeAccepted: subtree.keepBuilding, stopReason: divergent ? 'Energy guard' : !subtree.keepBuilding ? 'Internal subtree turn' : turns ? 'Whole-tree turn' : depth + 1 === maxDepth ? 'Depth cap' : 'Keep doubling' });
  }
  const selected = candidates[Math.floor(random.uniform() * candidates.length)];
  const coordinates = state => [state.position, state.momentum, state.time];
  const stripped = snapshots.slice(1).map(snapshot => ({ ...snapshot, left: coordinates(snapshot.left), right: coordinates(snapshot.right), explored: snapshot.explored.map(state => [ ...coordinates(state), state.onSlice, state.validEnergy ]), candidates: snapshot.candidates.map(coordinates) }));
  for (let index = 0; index < reference.snapshots.length; index += 1) {
    const actual = stripped[index];
    const expected = reference.snapshots[index];
    if (!actual || JSON.stringify(actual.left) !== JSON.stringify(coordinates(expected.left)) || JSON.stringify(actual.right) !== JSON.stringify(coordinates(expected.right)) || JSON.stringify(actual.explored) !== JSON.stringify(expected.explored.map(state => [ ...coordinates(state), state.onSlice, state.validEnergy ])) || JSON.stringify(actual.candidates) !== JSON.stringify(expected.candidates.map(coordinates)) || actual.stopReason !== expected.stopReason) throw new Error('Instrumented tree differs from the preserved Algorithm 2.');
  }
  if (snapshots.length !== reference.snapshots.length + 1 || JSON.stringify(coordinates(selected)) !== JSON.stringify(coordinates(reference.selected)) || logSlice !== reference.logSlice) throw new Error('Tree stream or selected state differs from Algorithm 2.');
  return { initial, logSlice, nodes, snapshots, selected };
}

export const sleepPairs = Object.freeze([
  [.7, 1.9], [-1.6, .8], [-.2, 1.1], [-1.2, .1], [-.1, -.1],
  [3.4, 4.4], [3.7, 5.5], [.8, 1.6], [0, 4.6], [2, 3.4],
].map((values, index) => Object.freeze({ id: index + 1, first: values[0], second: values[1], difference: values[1] - values[0] })));
export const sleepPosterior = Object.freeze({ n: 10, mean: 1.58, sse: 13.616, kappa: 11, mu: 15.8 / 11, alpha: 7, beta: 2 + 13.616 / 2 + 10 * 1.58 ** 2 / 22 });
export function sleepPotential(mu, tau) {
  const { n } = sleepPosterior;
  const a = 2 + sleepPairs.reduce((sum, pair) => sum + (pair.difference - mu) ** 2 / 2, 0) + mu ** 2 / 2;
  const inverseVariance = Math.exp(-2 * tau);
  return { energy: (n + 5) * tau + a * inverseVariance, gradient: [(11 * mu - 15.8) * inverseVariance, n + 5 - 2 * a * inverseVariance] };
}
export function sleepPhasePath({ mu = 1, tau = .2, momentum = [.4, -.3], step = .08, steps = 16 } = {}) {
  let q = [mu, tau];
  let p = momentum.slice();
  const rows = [{ index: 0, q: q.slice(), p: p.slice(), ...sleepPotential(...q) }];
  for (let index = 1; index <= steps; index += 1) {
    const first = sleepPotential(...q).gradient;
    p = p.map((value, dimension) => value - step * first[dimension] / 2);
    q = q.map((value, dimension) => value + step * p[dimension]);
    const next = sleepPotential(...q);
    p = p.map((value, dimension) => value - step * next.gradient[dimension] / 2);
    rows.push({ index, q: q.slice(), p: p.slice(), ...next });
  }
  return rows;
}

export function funnelPotential(v, x) {
  const narrowTerm = x * x * Math.exp(-v) / 2;
  return { energy: v * v / 18 + v / 2 + narrowTerm, gradient: [v / 9 + .5 - narrowTerm, x * Math.exp(-v)] };
}
export function funnelPath() {
  let q = [-2, .3];
  let p = [.5, .5];
  const rows = [{ index: 0, q: q.slice(), z: q[1] * Math.exp(-q[0] / 2) }];
  for (let index = 1; index <= 12; index += 1) {
    p = p.map((value, dimension) => value - .1 * funnelPotential(...q).gradient[dimension] / 2);
    q = q.map((value, dimension) => value + .1 * p[dimension]);
    p = p.map((value, dimension) => value - .1 * funnelPotential(...q).gradient[dimension] / 2);
    rows.push({ index, q: q.slice(), z: q[1] * Math.exp(-q[0] / 2) });
  }
  return rows;
}

export function observedGibbsSweep(seed = 714) {
  const random = seededRandom(seed);
  const variance = Math.exp(.4);
  const mu = sleepPosterior.mu + Math.sqrt(variance / sleepPosterior.kappa) * random.normal();
  // Marsaglia–Tsang Gamma(shape, rate=1), shape=7.5 > 1.
  const shape = sleepPosterior.alpha + .5;
  const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
  let gamma;
  for (;;) {
    const normal = random.normal();
    const base = 1 + c * normal;
    if (base <= 0) continue;
    const cube = base ** 3;
    const uniform = random.uniform();
    if (uniform < 1 - .0331 * normal ** 4 || Math.log(uniform) < normal * normal / 2 + d * (1 - cube + Math.log(cube))) {
      gamma = d * cube;
      break;
    }
  }
  const scale = sleepPosterior.beta + .5 * sleepPosterior.kappa * (mu - sleepPosterior.mu) ** 2;
  const nextVariance = scale / gamma;
  return { seed, shape, scale, states: [{ mu: 1, variance }, { mu, variance }, { mu, variance: nextVariance }] };
}

export const diagnosticBase = Object.freeze([-3, -2, -1, -.5, .5, 1, 2, 3]);
export function diagnosticFixture(kind = 'agreement') {
  if (!['agreement', 'spread', 'drift', 'constant'].includes(kind)) throw new RangeError('Unknown diagnostic construction.');
  if (kind === 'constant') return Array.from({ length: 4 }, () => Array(32).fill(1));
  const chains = [0, 2, 4, 6].map((offset, chain) => Array.from({ length: 32 }, (_, index) => diagnosticBase[(index - offset + 8) % 8] * (kind === 'spread' ? [ .5, .5, 2, 2 ][chain] : 1)));
  if (kind === 'drift') return chains.map(chain => chain.slice().sort((a, b) => a - b));
  return chains;
}
export function tiedRanks(values) {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const ranks = Array(values.length);
  for (let start = 0; start < order.length;) {
    let end = start + 1;
    while (end < order.length && order[end].value === order[start].value) end += 1;
    const rank = (start + 1 + end) / 2;
    for (let index = start; index < end; index += 1) ranks[order[index].index] = rank;
    start = end;
  }
  return ranks;
}

// Acklam's rational inverse-normal approximation (absolute error around 1e-9
// for the central ranks used here); diagnostics are checked against saved
// independent NormalDist/arviz_stats fixture results rather than rounded plots.
export function normalScore(probability) {
  if (!(probability > 0 && probability < 1)) throw new RangeError('Use an interior normal probability.');
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-.007784894002430293, -.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [.007784695709041462, .3224671290700398, 2.445134137142996, 3.754408661907416];
  const polynomial = (coefficients, value) => coefficients.reduce((total, coefficient) => total * value + coefficient, 0);
  if (probability < .02425 || probability > .97575) {
    const q = Math.sqrt(-2 * Math.log(probability < .02425 ? probability : 1 - probability));
    const value = polynomial(c, q) / (polynomial(d, q) * q + 1);
    return probability < .02425 ? value : -value;
  }
  const q = probability - .5, r = q * q;
  return polynomial(a, r) * q / (polynomial(b, r) * r + 1);
}
export function diagnosticDetails(kind = 'agreement') {
  const chains = diagnosticFixture(kind);
  const split = [...chains.map(chain => chain.slice(0, 16)), ...chains.map(chain => chain.slice(16))];
  const values = split.flat();
  const sorted = values.slice().sort((a, b) => a - b);
  const median = (sorted[63] + sorted[64]) / 2;
  const ranks = tiedRanks(values);
  const folded = values.map(value => Math.abs(value - median));
  const foldRanks = tiedRanks(folded);
  const z = ranks.map(rank => normalScore((rank - 3 / 8) / (values.length + 1 / 4)));
  const foldedZ = foldRanks.map(rank => normalScore((rank - 3 / 8) / (values.length + 1 / 4)));
  const mean = array => array.reduce((total, value) => total + value, 0) / array.length;
  const variance = array => array.reduce((total, value) => total + (value - mean(array)) ** 2, 0) / (array.length - 1);
  const rhat = flat => {
    const halves = Array.from({ length: 8 }, (_, index) => flat.slice(index * 16, (index + 1) * 16));
    const w = mean(halves.map(variance));
    const b = 16 * variance(halves.map(mean));
    return w === 0 ? null : Math.sqrt((15 * w / 16 + b / 16) / w);
  };
  const rankRhat = rhat(z), foldedRhat = rhat(foldedZ);
  return { chains, split, values, median, ranks, folded, foldRanks, z, foldedZ, rankRhat, foldedRhat, maximum: rankRhat === null || foldedRhat === null ? null : Math.max(rankRhat, foldedRhat) };
}
