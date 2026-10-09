// Constructed introductory graph, separate from the conserved fitted Karate models.
export const paperFeatures = Object.freeze([
  Object.freeze([1, 0]), Object.freeze([2, 1]), Object.freeze([4, -1]),
]);
export const paperEdges = Object.freeze([
  Object.freeze([0, 1]), Object.freeze([1, 0]),
  Object.freeze([1, 2]), Object.freeze([2, 1]),
]);

export function incomingSumRound(features, edges = paperEdges) {
  const next = features.map(row => [...row]);
  for (const [source, target] of edges) {
    for (let channel = 0; channel < features[source].length; channel += 1) {
      next[target][channel] += features[source][channel];
    }
  }
  return next;
}

export function paperRoundTrace(first = 1, last = 4, rounds = 2) {
  if (![first, last].every(value => Number.isFinite(value) && value >= -4 && value <= 6)) {
    throw new RangeError('Endpoint features must be finite values from −4 to 6.');
  }
  if (!Number.isInteger(rounds) || rounds < 0 || rounds > 2) {
    throw new RangeError('Use zero, one or two introductory rounds.');
  }
  const states = [[[first], [2], [last]]];
  for (let round = 0; round < rounds; round += 1) {
    states.push(incomingSumRound(states.at(-1)));
  }
  return states;
}

export function storedPaperGraph(order, first = 1) {
  if (order.length !== 3 || new Set(order).size !== 3 || order.some(id => ![0, 1, 2].includes(id))) {
    throw new RangeError('Storage order must contain each paper identity once.');
  }
  if (!Number.isFinite(first) || first < -4 || first > 6) {
    throw new RangeError('Paper 0 feature must be finite and between −4 and 6.');
  }
  const features = [[first], [2], [4]];
  const rows = order.map(id => [...features[id]]);
  const rowFor = id => order.indexOf(id);
  const edges = paperEdges.map(([source, target]) => [rowFor(source), rowFor(target)]);
  const adjacency = order.map(() => [0, 0, 0]);
  for (const [source, target] of edges) adjacency[target][source] = 1;
  const output = incomingSumRound(rows, edges);
  const byIdentity = [0, 1, 2].map(id => output[rowFor(id)][0]);
  // A deliberately faulty contrast: feature rows move but adjacency is left untouched.
  const faulty = incomingSumRound(rows, paperEdges);
  return { order: [...order], rows, edges, adjacency, output, byIdentity,
    sum: byIdentity.reduce((total, value) => total + value, 0),
    faultyByIdentity: [0, 1, 2].map(id => faulty[rowFor(id)][0]) };
}

export function synchronousMeanContrast(firstIndex = 0) {
  if (![0, 1].includes(firstIndex)) throw new RangeError('Choose paper 0 or paper 1 first.');
  const old = [1, 3];
  const correct = old.map(() => (old[0] + old[1]) / 2);
  const inPlace = [...old];
  for (const receiver of [firstIndex, 1 - firstIndex]) {
    inPlace[receiver] = (inPlace[0] + inPlace[1]) / 2;
  }
  return { old, correct, inPlace, order: [firstIndex, 1 - firstIndex] };
}

export const paperAdjacency = Object.freeze([
  Object.freeze([0, 1, 0]), Object.freeze([1, 0, 1]), Object.freeze([0, 1, 0]),
]);

// Small explanatory editors use dense matrices; the downloadable large-graph route
// uses sparse gather/scatter. A zero-degree row has a zero aggregate by policy.
export function normalizedGraph(adjacency = paperAdjacency, selfLoops = true) {
  const size = adjacency.length;
  if (!size || adjacency.some(row => row.length !== size || row.some(value => !Number.isFinite(value) || value < 0))) {
    throw new RangeError('Use a square finite nonnegative adjacency matrix.');
  }
  const closed = adjacency.map((row, receiver) => row.map((value, source) =>
    value + (selfLoops && receiver === source ? 1 : 0)));
  const degrees = closed.map(row => row.reduce((total, value) => total + value, 0));
  const operator = closed.map((row, receiver) => row.map((value, source) =>
    degrees[receiver] && degrees[source] ? value / Math.sqrt(degrees[receiver] * degrees[source]) : 0));
  return { closed, degrees, operator, rowSums: operator.map(row => row.reduce((sum, value) => sum + value, 0)) };
}

export function multiplyRows(operator, features) {
  return operator.map(row => Array.from({ length: features[0].length }, (_, channel) =>
    row.reduce((sum, value, source) => sum + value * features[source][channel], 0)));
}

export function paperGcnTrace(last = 4, receiver = 1) {
  if (!Number.isFinite(last) || last < -4 || last > 6 || ![0, 1, 2].includes(receiver)) {
    throw new RangeError('Use the taught feature range and a paper ID 0, 1 or 2.');
  }
  const graph = normalizedGraph();
  const features = [1, 2, last];
  const products = graph.operator[receiver].map((coefficient, source) => coefficient * features[source]);
  const outputs = multiplyRows(graph.operator, features.map(value => [value])).map(row => row[0]);
  return { ...graph, features, receiver, products, outputs, aggregate: outputs[receiver] };
}

export function paperChannelTrace(entry = .5) {
  if (!Number.isFinite(entry) || entry < -2 || entry > 2) throw new RangeError('Shared entry must be in [−2, 2].');
  const weights = [[1, entry], [-1, 2]];
  const { operator } = normalizedGraph();
  const project = rows => rows.map(row => weights.map(output => output.reduce((sum, weight, input) => sum + weight * row[input], 0)));
  const projected = project(paperFeatures);
  const mixed = multiplyRows(operator, projected);
  const mixedFirst = multiplyRows(operator, paperFeatures);
  const otherOrder = project(mixedFirst);
  return { weights, projected, mixed, mixedFirst, otherOrder, activated: mixed.map(row => row.map(value => Math.max(0, value))) };
}

export function paperBiasTrace(bias = 1) {
  if (!Number.isFinite(bias) || bias < -2 || bias > 2) throw new RangeError('Bias must be in [−2, 2].');
  const trace = paperGcnTrace();
  const beforeInput = trace.features.map(value => value + bias);
  const before = multiplyRows(trace.operator, beforeInput.map(value => [value])).map(row => row[0]);
  const after = trace.outputs.map(value => value + bias);
  return { ...trace, bias, beforeInput, before, after, differences: before.map((value, id) => value - after[id]) };
}

export function scalarGraphUpdate(weight = .5, rate = .1, aggregate = paperGcnTrace(4, 0).aggregate, target = 1) {
  if (![weight, rate, aggregate, target].every(Number.isFinite) || rate < 0) {
    throw new RangeError('Scalar update requires finite inputs and a nonnegative rate.');
  }
  const prediction = aggregate * weight;
  const residual = prediction - target;
  const derivative = aggregate * residual;
  const nextWeight = weight - rate * derivative;
  const nextPrediction = aggregate * nextWeight;
  return { aggregate, weight, rate, target, prediction, residual, derivative,
    nextWeight, nextPrediction, loss: .5 * residual ** 2, nextLoss: .5 * (nextPrediction - target) ** 2,
    stableRateUpperBound: aggregate === 0 ? null : 2 / aggregate ** 2 };
}
