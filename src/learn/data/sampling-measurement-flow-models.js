import { samplingPopulation, combinations, finiteMoments, finiteSampleState, inclusionDesignState, groupedMeasurementState, assignmentState, factorialState, boundedMissingMean } from './sampling-measurement-models.js';
export { samplingPopulation, finiteSampleState, inclusionDesignState, groupedMeasurementState, assignmentState, factorialState, boundedMissingMean };
function integer(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError(`${name} must be an integer from ${min} to ${max}.`);
}
function finite(value, name, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} must be finite from ${min} to ${max}.`);
}
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
export function targetWeights(a = 2, b = 6) {
  integer(a, 'First class size', 1, 8);
  integer(b, 'Second class size', 1, 8);
  return {
    sizes: [a, b],
    means: [4, 8],
    classMean: 6,
    studentMean: (4 * a + 8 * b) / (a + b),
    studentCount: a + b,
    total: 4 * a + 8 * b
  };
}
export function calibration(correction = 2) {
  finite(correction, 'Correction', 0, 4);
  const original = [11, 12, 13, 11, 12, 13];
  return {
    original,
    adjusted: original.map(v => v - correction),
    correction,
    reference: 10,
    mean: 12 - correction,
    gap: 2 - correction
  };
}
export function probabilityMass(values, probabilities = null) {
  const law = new Map();
  values.forEach((v, i) => {
    const key = Number(v.toFixed(10));
    law.set(key, (law.get(key) || 0) + (probabilities ? probabilities[i] : 1 / values.length));
  });
  return [...law].sort(([a], [b]) => a - b).map(([value, mass]) => ({
    value,
    mass
  }));
}
export function stratifiedState(mode = 'ordered', n1 = 2, n2 = 2) {
  if (!['ordered', 'mixed'].includes(mode)) throw new RangeError('Unknown partition.');
  integer(n1, 'First stratum size', 1, 4);
  integer(n2, 'Second stratum size', 1, 4);
  const groups = mode === 'ordered' ? [[0, 1, 2, 3], [4, 5, 6, 7]] : [[0, 2, 4, 6], [1, 3, 5, 7]];
  const first = combinations(groups[0], n1),
    second = combinations(groups[1], n2);
  const samples = first.flatMap(a => second.map(b => ({
    indices: [...a, ...b],
    mean: (mean(a.map(i => samplingPopulation[i])) + mean(b.map(i => samplingPopulation[i]))) / 2
  })));
  const components = groups.map((g, i) => {
    const m = mean(g.map(j => samplingPopulation[j])),
      s2 = g.reduce((s, j) => s + (samplingPopulation[j] - m) ** 2, 0) / 3,
      n = [n1, n2][i];
    return .25 * (1 - n / 4) * s2 / n;
  });
  return {
    groups,
    n1,
    n2,
    samples,
    components,
    ...finiteMoments(samples.map(s => s.mean)),
    srs: finiteSampleState(samplingPopulation, null, n1 + n2)
  };
}
export function systematicState(mode = 'alternating', start = 0) {
  if (!['alternating', 'grouped'].includes(mode)) throw new RangeError('Unknown order.');
  integer(start, 'Start', 0, 1);
  const population = mode === 'alternating' ? [0, 10, 0, 10, 0, 10, 0, 10] : [0, 0, 0, 0, 10, 10, 10, 10];
  const samples = [0, 1].map(k => ({
    indices: [k, k + 2, k + 4, k + 6],
    mean: mean([k, k + 2, k + 4, k + 6].map(i => population[i]))
  }));
  return {
    population,
    samples,
    start,
    ...finiteMoments(samples.map(s => s.mean)),
    srs: finiteSampleState(population, null, 4)
  };
}
export function jointInclusion() {
  const state = inclusionDesignState(),
    pi = state.inclusion;
  const pair = pi.map((_, i) => pi.map((__, j) => state.samples.reduce((s, r) => s + (r.indices.includes(i) && r.indices.includes(j) ? r.probability : 0), 0)));
  const terms = pi.map((_, i) => pi.map((__, j) => (pair[i][j] - pi[i] * pi[j]) / (pi[i] * pi[j]) * state.values[i] * state.values[j]));
  const known = terms.flat().reduce((s, v) => s + v, 0);
  const selected = state.samples.map(r => ({
    indices: r.indices,
    probability: r.probability,
    estimate: r.indices.reduce((s, i) => s + r.indices.reduce((t, j) => t + terms[i][j] / pair[i][j], 0), 0)
  }));
  return {
    pi,
    pair,
    terms,
    known,
    meanVariance: known / 16,
    selected,
    selectedTerms: [0, 1].flatMap(i => [0, 1].map(j => ({
      i,
      j,
      value: terms[i][j] / pair[i][j]
    })))
  };
}
export const pairedRows = [{
  id: 1,
  a: .7,
  b: 1.9
}, {
  id: 2,
  a: -1.6,
  b: .8
}, {
  id: 3,
  a: -.2,
  b: 1.1
}, {
  id: 4,
  a: -1.2,
  b: .1
}, {
  id: 5,
  a: -.1,
  b: -.1
}, {
  id: 6,
  a: 3.4,
  b: 4.4
}, {
  id: 7,
  a: 3.7,
  b: 5.5
}, {
  id: 8,
  a: .8,
  b: 1.6
}, {
  id: 9,
  a: 0,
  b: 4.6
}, {
  id: 10,
  a: 2,
  b: 3.4
}];
export function pairedState() {
  const differences = pairedRows.map(r => r.b - r.a),
    average = mean(differences),
    variance = differences.reduce((s, v) => s + (v - average) ** 2, 0) / 9;
  return {
    rows: pairedRows,
    differences,
    mean: average,
    standardError: Math.sqrt(variance / 10)
  };
}
export function neymanLedger(effect = 'constant') {
  const s = assignmentState('complete', effect);
  const sampleVariance = a => a.reduce((sum, v) => sum + (v - mean(a)) ** 2, 0) / 5;
  return {
    ...s,
    s0: sampleVariance(s.baseline),
    s1: sampleVariance(s.treated),
    st: sampleVariance(s.effects)
  };
}
export function budgetState(budget = 32, unitCost = 4) {
  integer(budget, 'Budget', 16, 64);
  integer(unitCost, 'Cost per new unit', 0, 8);
  const plans = [];
  for (let units = 1; units <= 16; units++) for (let repeats = 1; repeats <= 16; repeats++) {
    const cost = units * (unitCost + repeats);
    if (cost <= budget) plans.push({
      units,
      repeats,
      cost,
      unitComponent: 4 / units,
      readingComponent: 1 / (units * repeats),
      variance: 4 / units + 1 / (units * repeats)
    });
  }
  plans.sort((a, b) => (4 * a.repeats + 1) * (b.units * b.repeats) - (4 * b.repeats + 1) * (a.units * a.repeats) || a.cost - b.cost || a.units - b.units || a.repeats - b.repeats);
  return {
    budget,
    unitCost,
    plans,
    best: plans[0]
  };
}
export function missingState(first = 0, second = 10) {
  finite(first, 'First hypothetical score', 0, 10);
  finite(second, 'Second hypothetical score', 0, 10);
  const A = boundedMissingMean([8, 9, null, null]),
    B = boundedMissingMean([4, 5, 6, 7]);
  return {
    A,
    B,
    completion: [8, 9, first, second],
    contrast: (17 + first + second) / 4 - 5.5,
    lower: A.lower - B.upper,
    upper: A.upper - B.lower,
    observedOnly: 3
  };
}
export const precisionRows = Array.from({
  length: 8
}, (_, i) => ({
  n: i + 1,
  variance: 24 / (i + 1) - 3
}));
export const protocolClasses = [{
  id: 'C1',
  method: 'A',
  readings: [42, 44]
}, {
  id: 'C2',
  method: 'B',
  readings: [41, 43]
}, {
  id: 'C3',
  method: 'B',
  readings: [59, 61]
}, {
  id: 'C4',
  method: 'A',
  readings: [64, 66]
}, {
  id: 'C5',
  method: 'B',
  readings: [79, 81]
}, {
  id: 'C6',
  method: 'A',
  readings: [84, 86]
}];
export function protocolState() {
  const rows = protocolClasses.map(r => ({
      ...r,
      mean: mean(r.readings)
    })),
    contrasts = [0, 2, 4].map(i => rows[i].method === 'A' ? rows[i].mean - rows[i + 1].mean : rows[i + 1].mean - rows[i].mean);
  return {
    rows,
    contrasts,
    estimate: mean(contrasts)
  };
}
export function finiteProof() {
  const state = finiteSampleState(),
    residuals = samplingPopulation.map(v => v - state.target),
    squares = residuals.map(v => v * v),
    sumSquares = squares.reduce((s, v) => s + v, 0),
    pi = 2 / 8,
    cov = 1 / 28 - pi * pi;
  return {
    state,
    residuals,
    squares,
    sumSquares,
    inclusionCounts: samplingPopulation.map((_, i) => state.samples.filter(s => s.indices.includes(i)).length),
    pi,
    cov,
    diagonal: pi * (1 - pi) * sumSquares,
    cross: -cov * sumSquares
  };
}
export function replacementState() {
  const p = [.75, .25],
    values = [2, 8],
    inclusion = p.map(q => 1 - (1 - q) ** 2),
    histories = [[0, 0], [0, 1], [1, 0], [1, 1]].map(ids => ({
      ids,
      probability: p[ids[0]] * p[ids[1]],
      hh: ids.reduce((s, i) => s + values[i] / p[i], 0) / 2,
      ht: [...new Set(ids)].reduce((s, i) => s + values[i] / inclusion[i], 0)
    }));
  return {
    p,
    values,
    inclusion,
    histories
  };
}
export function sharedNoiseState() {
  const rows = [-2, 2].flatMap(s => [-1, 1].flatMap(a => [-1, 1].map(b => ({
    shared: s,
    A: 10 + s + a,
    B: 20 + s + b,
    average: 15 + s + (a + b) / 2,
    difference: 10 + b - a
  }))));
  return {
    rows,
    average: finiteMoments(rows.map(r => r.average)),
    difference: finiteMoments(rows.map(r => r.difference))
  };
}
