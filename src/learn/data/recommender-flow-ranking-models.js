import { dot, sum } from './recommender-flow-evidence-models.js';

export const bprDefaults = () => ({ dimension: 2, p: [1, .5], positive: [.5, 1], negative: [1, 0], eta: .1, lambda: .1 });

export function stablePairSignal(gap) {
  if (gap >= 0) { const small = Math.exp(-gap); return small / (1 + small); }
  return 1 / (1 + Math.exp(gap));
}

export function pairObjective(p, positive, negative, lambda) {
  const positiveDot = dot(p, positive), negativeDot = dot(p, negative), gap = positiveDot - negativeDot;
  const likelihood = Math.max(0, -gap) + Math.log1p(Math.exp(-Math.abs(gap)));
  const norm = dot(p, p) + dot(positive, positive) + dot(negative, negative);
  return { positiveDot, negativeDot, gap, signal: stablePairSignal(gap), likelihood, norm, penalty: lambda * norm / 2, loss: likelihood + lambda * norm / 2 };
}

export function pairUpdate(state, useUpdatedUser = false) {
  const old = pairObjective(state.p, state.positive, state.negative, state.lambda);
  const gp = state.p.map((value, k) => -old.signal * (state.positive[k] - state.negative[k]) + state.lambda * value);
  const p = state.p.map((value, k) => value - state.eta * gp[k]);
  const userForItems = useUpdatedUser ? p : state.p;
  const gi = state.positive.map((value, k) => -old.signal * userForItems[k] + state.lambda * value);
  const gj = state.negative.map((value, k) => old.signal * userForItems[k] + state.lambda * value);
  const positive = state.positive.map((value, k) => value - state.eta * gi[k]);
  const negative = state.negative.map((value, k) => value - state.eta * gj[k]);
  const available = [...p, ...positive, ...negative].every(value => Number.isFinite(value) && Math.abs(value) <= 1e4);
  return { available, old, gp, gi, gj, next: available ? { p, positive, negative } : null,
    after: available ? pairObjective(p, positive, negative, state.lambda) : null,
    reason: available ? null : 'Proposed factors leave the finite ±10000 context; the old buffers remain.' };
}

export const bprDatasetDefaults = () => ({ R: [[1, 0, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]], positive_occurrences: null, eligible_items: [1, 1, 1, 1] });

export function validatePairDataset(value) {
  const { R, positive_occurrences = null, eligible_items } = value;
  if (!Array.isArray(R) || R.length < 1 || R.length > 20 || !Array.isArray(R[0]) || R[0].length < 1 || R[0].length > 30 ||
    R.some(row => !Array.isArray(row) || row.length !== R[0].length || row.some(cell => cell !== 0 && cell !== 1))) {
    throw new Error('Use a binary R with 1–20 users and 1–30 equally sized item columns.');
  }
  const eligible = eligible_items ?? Array(R[0].length).fill(1);
  const perUser = Array.isArray(eligible?.[0]);
  if (!Array.isArray(eligible) || (perUser ? eligible.length !== R.length || eligible.some(row => !Array.isArray(row) || row.length !== R[0].length || row.some(cell => cell !== 0 && cell !== 1))
    : eligible.length !== R[0].length || eligible.some(cell => cell !== 0 && cell !== 1))) {
    throw new Error('Eligibility is a binary item vector or full user×item mask.');
  }
  if (positive_occurrences !== null) {
    if (!Array.isArray(positive_occurrences)) throw new Error('Use null for unique pairs, or explicit occurrence objects.');
    const ids = new Set();
    for (const record of positive_occurrences) {
      if (!record || typeof record.id !== 'string' || !record.id || ids.has(record.id) || !Number.isInteger(record.user) || !Number.isInteger(record.item) ||
        record.user < 0 || record.user >= R.length || record.item < 0 || record.item >= R[0].length || R[record.user][record.item] !== 1) {
        throw new Error('Each occurrence needs a unique ID and an actual positive user/item pair.');
      }
      ids.add(record.id);
    }
  }
  return { R: R.map(row => [...row]), positive_occurrences: positive_occurrences?.map(record => ({ ...record })) ?? null,
    eligible_items: perUser ? eligible.map(row => [...row]) : [...eligible] };
}

export function pairPopulation(dataset) {
  const { R, positive_occurrences, eligible_items } = validatePairDataset(dataset);
  const eligible = Array.isArray(eligible_items[0]) ? eligible_items : R.map(() => eligible_items);
  const occurrences = positive_occurrences ?? R.flatMap((row, user) => row.flatMap((value, item) => value ? [{ id: `positive-${user}-${item}`, user, item }] : []));
  const routes = [], skipped = [];
  for (const occurrence of occurrences) {
    if (!eligible[occurrence.user][occurrence.item]) { skipped.push({ ...occurrence, reason: 'Positive outside eligibility' }); continue; }
    const negatives = R[occurrence.user].flatMap((value, item) => !value && eligible[occurrence.user][item] ? [item] : []);
    if (!negatives.length) skipped.push({ ...occurrence, reason: 'No eligible unobserved negative' });
    for (const negative of negatives) routes.push({ id: `${occurrence.id}→I${negative}`, occurrence: occurrence.id, user: occurrence.user, positive: occurrence.item, negative });
  }
  const counts = R.map((_, user) => routes.filter(route => route.user === user).length);
  const users = counts.flatMap((count, user) => count ? [user] : []);
  const frequencies = R[0].map((_, item) => sum(R.map(row => row[item])));
  return { R, eligible, occurrences, routes, skipped, counts, users, frequencies, positiveCells: sum(frequencies) };
}

export function pairDistribution(population, convention) {
  if (!population.routes.length) return { available: false, reason: 'No admissible positive-occurrence/negative comparison exists.', weights: [], userMass: population.R.map(() => 0) };
  const weights = population.routes.map(route => convention === 'uniform-user' ? 1 / (population.users.length * population.counts[route.user]) : 1 / population.routes.length);
  return { available: true, weights, userMass: population.R.map((_, user) => sum(weights.filter((_, index) => population.routes[index].user === user))) };
}

export function browserPairRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let word = Math.imul(state ^ state >>> 15, state | 1);
    word ^= word + Math.imul(word ^ word >>> 7, word | 61);
    return ((word ^ word >>> 14) >>> 0) / 4294967296;
  };
}

function normalCoordinate(random) {
  return .1 * Math.sqrt(-2 * Math.log(Math.max(Number.MIN_VALUE, 1 - random()))) * Math.cos(2 * Math.PI * random());
}

export function populationPairObjective(P, Q, population, distribution, lambda) {
  if (!distribution.available) return null;
  return sum(population.routes.map((route, index) => distribution.weights[index] * pairObjective(P[route.user], Q[route.positive], Q[route.negative], lambda).loss));
}

export function browserPairTraining(dataset, dimension, seed, convention, eta, lambda, steps) {
  const population = pairPopulation(dataset), distribution = pairDistribution(population, convention);
  if (!distribution.available) return { available: false, population, distribution, states: [], samples: [], reason: distribution.reason };
  const random = browserPairRandom(seed);
  let P = population.R.map(() => Array.from({ length: dimension }, () => normalCoordinate(random)));
  let Q = population.R[0].map(() => Array.from({ length: dimension }, () => normalCoordinate(random)));
  const initialP = P.map(row => [...row]), initialQ = Q.map(row => [...row]);
  const states = [{ step: 0, loss: populationPairObjective(P, Q, population, distribution, lambda) }], samples = [], sampleCounts = population.routes.map(() => 0);
  let unavailable = null;
  for (let step = 1; step <= steps; step++) {
    const draw = random(); let accumulated = 0, index = distribution.weights.length - 1;
    for (let k = 0; k < distribution.weights.length; k++) { accumulated += distribution.weights[k]; if (draw < accumulated) { index = k; break; } }
    const route = population.routes[index], update = pairUpdate({ p: P[route.user], positive: Q[route.positive], negative: Q[route.negative], eta, lambda });
    if (!update.available) { unavailable = { step, route, reason: update.reason }; break; }
    const before = { p: [...P[route.user]], positive: [...Q[route.positive]], negative: [...Q[route.negative]] };
    P = P.map(row => [...row]); Q = Q.map(row => [...row]);
    P[route.user] = update.next.p; Q[route.positive] = update.next.positive; Q[route.negative] = update.next.negative;
    samples.push({ step, index, ...route, probability: distribution.weights[index], oldGap: update.old.gap, newGap: update.after.gap,
      before, after: update.next, gradients: { p: update.gp, positive: update.gi, negative: update.gj } }); sampleCounts[index]++;
    states.push({ step, loss: populationPairObjective(P, Q, population, distribution, lambda) });
  }
  return { available: true, P, Q, initialP, initialQ, population, distribution, states, samples, sampleCounts, unavailable,
    seed, generator: 'Browser Mulberry32 uniforms and Box–Muller normal SD .1; separate from the recorded NumPy fit.' };
}

export function packagePairDraws(population, occurrence) {
  if (!occurrence || !population.positiveCells) return [];
  return population.frequencies.map((frequency, item) => ({ item, frequency, probability: frequency / population.positiveCells,
    seen: Boolean(population.R[occurrence.user][item]), supported: frequency > 0 }));
}

export const slateDefaults = () => ({ order: [2, 0, 4, 1, 3], eligible: [0, 1, 2, 3, 4], candidates: [0, 1, 2, 3, 4], grades: [1, 1, 0, 0, 0], cutoff: 3 });

export function validateItemIDs(ids, count, label = 'Item IDs') {
  if (!Array.isArray(ids) || ids.some(id => !Number.isInteger(id) || id < 0 || id >= count) || new Set(ids).size !== ids.length) throw new Error(`${label}: use unique integer IDs from 0 to ${count - 1}; an empty list is allowed.`);
  return [...ids];
}

export function slateCalculation(state) {
  const eligible = new Set(state.eligible), candidates = new Set(state.candidates);
  const filtered = state.order.filter(item => eligible.has(item) && candidates.has(item));
  const selected = filtered.slice(0, state.cutoff), relevant = state.eligible.filter(item => state.grades[item] > 0);
  let hits = 0, apSum = 0, first = null, dcg = 0;
  const operands = selected.map((item, index) => {
    const rank = index + 1, grade = state.grades[item], hit = grade > 0, gain = 2 ** grade - 1, divisor = Math.log2(rank + 1);
    if (hit) { hits++; apSum += hits / rank; first ??= rank; }
    dcg += gain / divisor;
    return { item, rank, grade, hit, cumulativeHits: hits, precisionAtHit: hit ? hits / rank : 0, gain, divisor, discounted: gain / divisor };
  });
  const idealItems = [...state.eligible].sort((left, right) => state.grades[right] - state.grades[left] || left - right).slice(0, state.cutoff);
  const idealOperands = idealItems.map((item, index) => ({ item, rank: index + 1, grade: state.grades[item], gain: 2 ** state.grades[item] - 1, divisor: Math.log2(index + 2), value: (2 ** state.grades[item] - 1) / Math.log2(index + 2) }));
  const ideal = sum(idealOperands.map(row => row.value)), retrievedRelevant = relevant.filter(item => candidates.has(item));
  return { filtered, selected, relevant, hits, operands, idealItems, idealOperands, ideal, dcg, apSum, first, retrievedRelevant,
    precision: hits / state.cutoff, fill: selected.length / state.cutoff,
    recall: relevant.length ? hits / relevant.length : null,
    reciprocal: relevant.length ? (first ? 1 / first : 0) : null,
    averagePrecision: relevant.length ? apSum / Math.min(state.cutoff, relevant.length) : null,
    ndcg: ideal ? dcg / ideal : null,
    ceiling: relevant.length ? Math.min(state.cutoff, retrievedRelevant.length) / relevant.length : null };
}

export const pairedRequests = [{ id: 'U0', baseline: .4, method: .6 }, { id: 'U1', baseline: .4, method: .3 },
  { id: 'U2', baseline: .4, method: .7 }, { id: 'U3', baseline: .4, method: .4 }, { id: 'U4', baseline: .4, method: null }];

export function resampledPairs(ids) {
  const rows = ids.map(index => ({ index, ...pairedRequests[index], difference: pairedRequests[index].method === null ? null : pairedRequests[index].method - pairedRequests[index].baseline }));
  const valid = rows.filter(row => row.difference !== null);
  return { rows, valid, omitted: rows.length - valid.length, mean: valid.length ? sum(valid.map(row => row.difference)) / valid.length : null };
}
