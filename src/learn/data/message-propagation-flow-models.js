// Scoped DL29 section-seven arithmetic. Receiver rows, sender columns.
// Small eigensystems are diagnostics; propagation/filter execution uses node sums.
import { matvec, dot, sum, components, pathAdjacency } from './message-passing-models.js';
export { aggregationNumber as propagationNumber } from './message-aggregation-flow-models.js';
export const copyRows = rows => rows.map(row => [...row]);
export const originalPath = () => ({
  adjacency: copyRows(pathAdjacency),
  features: [1, 2, 4],
  loops: true
});
export function propagationOperators(adjacency, loops = true) {
  const closed = adjacency.map((row, i) => row.map((weight, j) => weight + Number(loops && i === j))),
    degree = closed.map(sum);
  const inverse = degree.map(value => value > 0 ? 1 / Math.sqrt(value) : 0);
  // Multiply factors separately: d[i]*d[j] can underflow for valid tiny weights.
  const symmetric = closed.map((row, i) => row.map((weight, j) => weight * inverse[i] * inverse[j]));
  const mean = closed.map((row, i) => row.map(weight => degree[i] > 0 ? weight / degree[i] : 0));
  return {
    closed,
    degree,
    symmetric,
    mean
  };
}
const operators = propagationOperators;
export function propagationFixture(kind = 'path') {
  if (kind === 'periodic') return {
    adjacency: [[0, 1], [1, 0]],
    features: [1, 4],
    loops: false
  };
  if (kind === 'disconnected') return {
    adjacency: [[0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]],
    features: [1, 3, 4, 8],
    loops: true
  };
  return originalPath();
}
const identity = size => Array.from({
  length: size
}, (_, i) => Array.from({
  length: size
}, (_, j) => Number(i === j)));
export const mixNodeColumns = (matrix, table) => matrix.map(row => table[0].map((_, c) => sum(row.map((weight, node) => weight * table[node][c]))));
export const rightChannelMap = (table, matrix) => table.map(row => matrix[0].map((_, c) => sum(row.map((value, j) => value * matrix[j][c]))));
export const gramMatrix = table => table[0].map((_, a) => table[0].map((__, b) => sum(table.map(row => row[a] * row[b]))));
export function symmetricModes(matrix) {
  const size = matrix.length,
    current = copyRows(matrix),
    basis = identity(size);
  const tolerance = 2e-15 * Math.max(1, ...matrix.flat().map(Math.abs));
  for (let iteration = 0; iteration < 160; iteration++) {
    let p = 0,
      q = 1,
      largest = 0;
    for (let i = 0; i < size; i++) for (let j = i + 1; j < size; j++) if (Math.abs(current[i][j]) > largest) {
      largest = Math.abs(current[i][j]);
      p = i;
      q = j;
    }
    if (largest <= tolerance) break;
    const angle = .5 * Math.atan2(2 * current[p][q], current[q][q] - current[p][p]),
      c = Math.cos(angle),
      s = Math.sin(angle);
    const a = current[p][p],
      b = current[q][q],
      cross = current[p][q];
    for (let k = 0; k < size; k++) if (k !== p && k !== q) {
      const first = current[k][p],
        second = current[k][q];
      current[k][p] = current[p][k] = c * first - s * second;
      current[k][q] = current[q][k] = s * first + c * second;
    }
    current[p][p] = c * c * a - 2 * c * s * cross + s * s * b;
    current[q][q] = s * s * a + 2 * c * s * cross + c * c * b;
    current[p][q] = current[q][p] = 0;
    for (let k = 0; k < size; k++) {
      const first = basis[k][p],
        second = basis[k][q];
      basis[k][p] = c * first - s * second;
      basis[k][q] = s * first + c * second;
    }
  }
  return Array.from({
    length: size
  }, (_, column) => {
    const vector = basis.map(row => row[column]);
    const largest = Math.max(...vector.map(Math.abs)),
      pivot = vector.findIndex(value => Math.abs(value) >= largest - 1e-12);
    const sign = vector[pivot] < 0 ? -1 : 1;
    return {
      gain: current[column][column],
      vector: vector.map(value => value * sign),
      pivot
    };
  }).sort((a, b) => b.gain - a.gain).map((mode, index, all) => ({
    ...mode,
    index,
    repeated: all.some((other, j) => j !== index && Math.abs(mode.gain - other.gain) < 1e-10)
  }));
}
export function propagationTrace(adjacency, features, loops = true, count = 40) {
  const op = operators(adjacency, loops),
    history = [[...features]],
    convertedInitial = features.map((value, node) => op.degree[node] > 0 ? value / Math.sqrt(op.degree[node]) : null);
  for (let round = 0; round < count; round++) history.push(matvec(op.symmetric, history.at(-1)));
  const divided = history.map(row => row.map((value, node) => op.degree[node] > 0 ? value / Math.sqrt(op.degree[node]) : null));
  let limit = null,
    dividedLimit = null;
  const groups = components(adjacency);
  if (loops) {
    limit = features.map(() => 0);
    dividedLimit = features.map(() => null);
    for (const group of groups) {
      const degreeSum = sum(group.map(node => op.degree[node])),
        projection = sum(group.map(node => Math.sqrt(op.degree[node]) * features[node]));
      for (const node of group) {
        limit[node] = Math.sqrt(op.degree[node]) * projection / degreeSum;
        dividedLimit[node] = projection / degreeSum;
      }
    }
  }
  const modes = symmetricModes(op.symmetric).map(mode => ({
    ...mode,
    coefficient: dot(mode.vector, features)
  }));
  return {
    ...op,
    features: [...features],
    history,
    divided,
    convertedInitial,
    limit,
    dividedLimit,
    groups,
    modes
  };
}
export function polynomialTrace(adjacency, features, degree = 2, loops = true) {
  const matrix = operators(adjacency, loops).symmetric,
    powers = [[...features]],
    terms = [],
    output = features.map(() => 0);
  for (let k = 0; k <= degree; k++) {
    if (k) powers.push(matvec(matrix, powers.at(-1)));
    const coefficient = 2 ** -k,
      values = powers[k].map(value => coefficient * value);
    terms.push({
      power: k,
      coefficient,
      values
    });
    for (let node = 0; node < output.length; node++) output[node] += values[node];
  }
  return {
    matrix,
    powers,
    terms,
    output,
    degree,
    count: degree + 1
  };
}
export function chebyshevTrace() {
  const {
      adjacency,
      features
    } = originalPath(),
    matrix = operators(adjacency).symmetric;
  const z0 = features,
    z1 = matvec(matrix, features).map(value => -value),
    z2 = matvec(matrix, z1).map((value, node) => -2 * value - z0[node]);
  const coefficients = [1.125, -.5, .125],
    basis = [z0, z1, z2];
  return {
    basis,
    coefficients,
    terms: basis.map((row, k) => row.map(value => coefficients[k] * value)),
    output: features.map((_, node) => sum(basis.map((row, k) => row[node] * coefficients[k])))
  };
}
export function renormalizationTrace() {
  const {
      adjacency,
      features
    } = originalPath(),
    open = operators(adjacency, false),
    closed = operators(adjacency, true);
  const neighbor = matvec(open.symmetric, features);
  return {
    features,
    open,
    closed,
    neighbor,
    ownPlusOpen: neighbor.map((value, node) => value + features[node]),
    closedOutput: matvec(closed.symmetric, features)
  };
}
export function bottleneckTrace(delta = 1) {
  const adjacency = Array.from({
    length: 7
  }, () => Array(7).fill(0));
  for (const [a, b] of [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]) adjacency[a][b] = adjacency[b][a] = 1;
  const features = [0, 0, 0, delta, 0, 0, 0],
    op = operators(adjacency),
    first = matvec(op.symmetric, features),
    second = matvec(op.symmetric, first);
  const routes = [3, 4, 5, 6].map(leaf => {
    const parent = leaf < 5 ? 1 : 2,
      firstFactor = op.symmetric[parent][leaf],
      secondFactor = op.symmetric[0][parent];
    return {
      leaf,
      parent,
      value: features[leaf],
      firstFactor,
      secondFactor,
      intermediate: features[leaf] * firstFactor,
      sensitivity: firstFactor * secondFactor,
      contribution: features[leaf] * firstFactor * secondFactor
    };
  });
  return {
    adjacency,
    features,
    degree: op.degree,
    first,
    second,
    routes,
    root: second[0]
  };
}
export function residualTrace(alpha = .2) {
  const {
      adjacency,
      features
    } = originalPath(),
    matrix = operators(adjacency).symmetric,
    states = [[...features]],
    stages = [];
  for (let round = 0; round < 2; round++) {
    const old = states.at(-1),
      mixed = matvec(matrix, old),
      currentTerm = mixed.map(value => (1 - alpha) * value),
      originalTerm = features.map(value => alpha * value),
      next = currentTerm.map((value, node) => value + originalTerm[node]);
    stages.push({
      old,
      mixed,
      currentTerm,
      originalTerm,
      next
    });
    states.push(next);
  }
  const plain = propagationTrace(adjacency, features, true, 2).history;
  return {
    features,
    alpha,
    states,
    stages,
    plain,
    ordinary: features.map((value, node) => value + plain[1][node]),
    jk: features.map((_, node) => plain.map(row => row[node]))
  };
}
export function fixedPatternColumns() {
  return [0, 1, 2].map(node => [Math.sqrt([2, 3, 2][node] / 7), [1, 0, -1][node] / Math.sqrt(2)]);
}
export function compensationTrace(gain = 2) {
  const input = fixedPatternColumns(),
    matrix = operators(pathAdjacency).symmetric,
    mixed = mixNodeColumns(matrix, input),
    channelMap = [[1, 0], [0, gain]],
    output = rightChannelMap(mixed, channelMap);
  return {
    input,
    mixed,
    channelMap,
    output,
    gain
  };
}
export function sizeVariationTrace(table) {
  const size = sum(table.flat().map(value => value * value)),
    mixed = mixNodeColumns(operators(pathAdjacency).symmetric, table),
    variation = sum(table.flatMap((row, node) => row.map((value, channel) => value * (value - mixed[node][channel]))));
  const gram = gramMatrix(table),
    values = symmetricModes(gram).map(mode => Math.sqrt(Math.max(0, mode.gain)));
  return {
    size,
    variation,
    relative: size > 0 ? variation / size : null,
    singular: values,
    rank: values.filter(value => value > 1e-12).length,
    tolerance: 1e-12
  };
}
export function scaleTrace(depth = 0) {
  const input = fixedPatternColumns(),
    output = input.map(row => [row[0] * 2 ** depth, row[1]]);
  return {
    input,
    output,
    depth,
    ...sizeVariationTrace(output)
  };
}
export function whiteningTrace(ridge = 0) {
  const input = fixedPatternColumns(),
    mixed = compensationTrace(1).mixed,
    gram = gramMatrix(mixed),
    inverse = [1 / Math.sqrt(1 + ridge), 1 / Math.sqrt(.25 + ridge)],
    channelMap = [[inverse[0], 0], [0, inverse[1]]],
    output = rightChannelMap(mixed, channelMap),
    outputGram = gramMatrix(output);
  const complete = Array.from({
      length: 3
    }, () => [1 / 3, 1 / 3, 1 / 3]),
    lost = mixNodeColumns(complete, input).map(row => [row[0], 0]),
    lostGram = gramMatrix(lost),
    retainedInverse = 1 / Math.sqrt(lostGram[0][0]),
    lostMap = [[retainedInverse, 0], [0, 0]],
    lostOutput = rightChannelMap(lost, lostMap);
  return {
    input,
    mixed,
    gram,
    eigenvalues: [1, .25],
    eigenbasis: [[1, 0], [0, 1]],
    ridge,
    inverse,
    channelMap,
    output,
    outputGram,
    lost,
    lostGram,
    lostMap,
    lostOutput,
    lostOutputGram: gramMatrix(lostOutput),
    tolerance: 1e-12
  };
}
export function routedTrace(epsilon = .001) {
  const initial = [2, 0, 0, 7],
    edges = [[0, 1], [1, 2], [3, 1]],
    apply = (row, gates) => {
      const next = [0, 0, 0, 0];
      for (const [source, target] of edges) next[target] += row[source] * gates[source];
      return next;
    };
  const firstGates = [1 - epsilon, epsilon, epsilon, epsilon],
    secondGates = [epsilon, 1 - epsilon, epsilon, epsilon],
    first = apply(initial, firstGates),
    second = apply(first, secondGates),
    unrestrictedFirst = apply(initial, [1, 1, 1, 1]),
    unrestrictedSecond = apply(unrestrictedFirst, [1, 1, 1, 1]);
  return {
    initial,
    edges,
    firstGates,
    secondGates,
    first,
    second,
    history: [initial, first, second],
    usefulFirst: 2 * (1 - epsilon),
    distractionFirst: 7 * epsilon,
    usefulTarget: 2 * (1 - epsilon) ** 2,
    distractionTarget: 7 * epsilon * (1 - epsilon),
    target: second[2],
    unrestrictedFirst,
    unrestrictedSecond,
    epsilon
  };
}
export function depthReadoutTrace(epsilon = .001, finalWeight = .5) {
  const route = routedTrace(epsilon),
    weights = [(1 - finalWeight) / 2, (1 - finalWeight) / 2, finalWeight],
    terms = route.history.map((row, depth) => row.map(value => value * weights[depth])),
    output = route.initial.map((_, node) => sum(terms.map(row => row[node])));
  return {
    ...route,
    weights,
    terms,
    output
  };
}
