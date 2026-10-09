// Browser-owned finite mechanisms. Preserved Python mains and fits never execute here.
export const ids = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const uPoints = [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]];
export const initialY = [-1.5, -0.5, 0.5, 1.5];
// Exact saved gaussian_rows stream, not a fresh affinity search.
export const conditional = [[0, .6558872697854092, .33289945467725446, .011213275537336309], [.6041177401751883, 0, .3919950082893136, .003887251535498156], [.22268886762085754, .7355032697248046, 0, .04180786265433779], [.06655801696317193, .17369191820343724, .7597500648333908, 0]];
export const fixedP = conditional.map((row, i) => row.map((v, j) => (v + conditional[j][i]) / 8));
export const sum = values => values.reduce((a, b) => a + b, 0);
export const squaredDistance = (a, b) => sum(a.map((v, i) => (v - b[i]) ** 2));
export function radiusGraph(points = uPoints, radius = 1) {
  const graph = points.map((a, i) => points.map((b, j) => i === j ? 0 : Math.hypot(...a.map((v, k) => v - b[k]))));
  const edges = [];
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    if (graph[i][j] <= radius + 1e-12) edges.push([i, j, graph[i][j]]);
    else graph[i][j] = graph[j][i] = Infinity;
  }
  return { points, graph, edges };
}
export function shortestPath(graph, start = 0, end = 6) {
  const distance = graph.map(() => Infinity), previous = graph.map(() => null), settled = new Set(), trace = [];
  distance[start] = 0;
  while (settled.size < graph.length) {
    const i = distance.map((d, index) => [d, index]).filter(([, index]) => !settled.has(index)).sort((a, b) => a[0] - b[0] || a[1] - b[1])[0]?.[1];
    if (i === undefined || !Number.isFinite(distance[i])) break;
    settled.add(i);
    for (let j = 0; j < graph.length; j++) if (!settled.has(j) && distance[i] + graph[i][j] < distance[j]) {
      distance[j] = distance[i] + graph[i][j]; previous[j] = i;
    }
    trace.push({ vertex: i, distance: [...distance], previous: [...previous], settled: [...settled] });
  }
  let path = [];
  if (Number.isFinite(distance[end])) {
    for (let i = end; i !== null; i = previous[i]) path.unshift(i);
  }
  const remaining = new Set(graph.map((_, i) => i)), components = [];
  while (remaining.size) {
    const queue = [remaining.values().next().value], component = [];
    remaining.delete(queue[0]);
    while (queue.length) {
      const i = queue.shift(); component.push(i);
      for (const j of remaining) if (Number.isFinite(graph[i][j])) { remaining.delete(j); queue.push(j); }
    }
    components.push(component);
  }
  return { path, length: distance[end], distance, previous, trace, components };
}
export function gaussianRow(distances = [1, 2, 3], sigma = 1) {
  if (!(sigma > 0) || !Number.isFinite(sigma) || !distances.every(v => Number.isFinite(v) && v >= 0)) throw new Error('Finite nonnegative distances and positive width required.');
  const squares = distances.map(d => d * d), baseline = Math.min(...squares);
  const raw = squares.map(d => Math.exp(-d / (2 * sigma * sigma)));
  const shifted = squares.map(d => Math.exp(-(d - baseline) / (2 * sigma * sigma)));
  const probabilities = shifted.map(v => v / sum(shifted));
  const contributions = probabilities.map(p => p > 0 ? -p * Math.log2(p) : 0);
  const logWeights = squares.map(d => -d / (2 * sigma * sigma));
  const logShift = -baseline / (2 * sigma * sigma);
  const shiftedLogs = squares.map(d => -(d - baseline) / (2 * sigma * sigma));
  return { raw, logWeights, logShift, shiftedLogs, shifted, rawSum: sum(raw), shiftedSum: sum(shifted), probabilities, contributions, entropy: sum(contributions), perplexity: 2 ** sum(contributions) };
}
// New drawing arithmetic only: the recorded optimizer and scientific streams stay unchanged.
export function orderedDerivativeObjects(y = initialY, p = fixedP) {
  const state = studentState(y, p);
  const ordered = y.flatMap((a, i) => y.flatMap((b, j) => {
    if (i === j) return [];
    const delta = a - b, squaredDerivative = i === 0 ? 2 * delta : j === 0 ? -2 * delta : 0;
    const t = state.kernel[i][j], kernelDerivative = -t * t * squaredDerivative;
    return [{ i, j, p: p[i][j], delta, squared: delta * delta, squaredDerivative, t, kernelDerivative, attractive: -p[i][j] * kernelDerivative / t }];
  }));
  const zDerivative = sum(ordered.map(pair => pair.kernelDerivative));
  return { state, ordered, zDerivative, repulsive: zDerivative / state.z, attractive: sum(ordered.map(pair => pair.attractive)) };
}
export function gridConvolutionObjects() {
  const source = [[4, 4], [5, 4], [4, 5], [5, 5]], charge = [4.2, 4.6];
  const query = [1.2, 1.3], nodes = [[1, 1], [2, 1], [1, 2], [2, 2]];
  const bilinear = ([x, y], [a, b]) => [(1 - (x - a)) * (1 - (y - b)), (x - a) * (1 - (y - b)), (1 - (x - a)) * (y - b), (x - a) * (y - b)];
  const weights = bilinear(charge, source[0]), interpolation = bilinear(query, nodes[0]);
  // Translation-invariant force-related kernel F(r)=r/(1+||r||²)².
  // This is a finite constructed grid sum, not an executed FFT or a fitted t-SNE force.
  const kernels = nodes.map(point => source.map(other => {
    const r = point.map((v, i) => v - other[i]);
    const denominator = (1 + sum(r.map(v => v * v))) ** 2;
    return r.map(v => v / denominator);
  }));
  const fields = kernels.map(row => [0, 1].map(axis => sum(row.map((v, j) => weights[j] * v[axis]))));
  const returned = [0, 1].map(axis => sum(fields.map((v, i) => interpolation[i] * v[axis])));
  return { source, charge, weights, query, nodes, interpolation, kernels, fields, returned };
}
export function studentState(y, p = y.length === 4 ? fixedP : y.map(() => y.map(() => 0))) {
  const kernel = y.map((a, i) => y.map((b, j) => i === j ? 0 : 1 / (1 + (a - b) ** 2)));
  const z = sum(kernel.flat()), q = kernel.map(row => row.map(t => t / z));
  const cost = sum(p.flatMap((row, i) => row.map((v, j) => v > 0 ? v * Math.log(v / q[i][j]) : 0)));
  const contributions = y.map((a, i) => y.map((b, j) => -4 * (p[i][j] - q[i][j]) * kernel[i][j] * (a - b)));
  return { kernel, z, q, cost, contributions, displacement: contributions.map(sum) };
}
export function tsneStep(y, rate, bound) {
  if (rate === 0) return { y: [...y], bound, shift: 0, nullStep: true, before: [...y] };
  const state = studentState(y), candidate = y.map((v, i) => v + rate * state.displacement[i]);
  const shift = sum(candidate) / candidate.length, centered = candidate.map(v => v - shift);
  if (![...centered, studentState(centered).cost].every(Number.isFinite)) throw new Error('Computation failed: the last finite coordinates remain visible.');
  return { y: centered, before: [...y], shift, bound: Math.max(bound, Math.ceil(Math.max(...centered.map(Math.abs)))), nullStep: false };
}
export function pairCost(radius, weight = .625) {
  const membership = 1 / (1 + radius * radius);
  const attraction = -weight * Math.log(membership), repulsion = -(1 - weight) * Math.log(1 - membership);
  return { membership, attraction, repulsion, total: attraction + repulsion, optimum: Math.sqrt((1 - weight) / weight) };
}
export function sampledEvent(initial, head, tail, negatives, rate) {
  const y = initial.map(row => [...row]), snapshots = [];
  const clip = value => Math.max(-4, Math.min(4, value));
  let delta = y[head].map((v, j) => v - y[tail][j]), distance = sum(delta.map(v => v * v));
  const attraction = delta.map(v => clip(-2 * v / (1 + distance)));
  y[head] = y[head].map((v, j) => v + rate * attraction[j]);
  y[tail] = y[tail].map((v, j) => v - rate * attraction[j]);
  snapshots.push({ operation: 'positive:both endpoints', y: y.map(row => [...row]) });
  for (const other of negatives) {
    if (other === head) { snapshots.push({ operation: `negative${other}:skip self`, y: y.map(row => [...row]) }); continue; }
    delta = y[head].map((v, j) => v - y[other][j]); distance = sum(delta.map(v => v * v));
    if (distance > 0) y[head] = y[head].map((v, j) => v + rate * clip(2 * delta[j] / ((.001 + distance) * (1 + distance))));
    snapshots.push({ operation: `negative${other}:head only`, y: y.map(row => [...row]) });
  }
  return { y, snapshots };
}
export function neighbors(rows, sourceIds, query, k) {
  return rows.map((row, i) => ({ i, id: sourceIds[i], distance: squaredDistance(rows[query], row) }))
    .filter(row => row.i !== query).sort((a, b) => a.distance - b.distance || a.id - b.id).slice(0, k);
}
export function auditQuery(data, coordinates, sourceId, k) {
  const query = data.findIndex(row => row[0] === sourceId);
  if (query < 0) throw new Error('Choose an existing source ID; the last valid query is retained.');
  const sourceIds = data.map(row => row[0]), input = neighbors(data.map(row => row.slice(2).map(v => v / 16)), sourceIds, query, k), mapped = neighbors(coordinates, sourceIds, query, k);
  const inputIds = new Set(input.map(row => row.id)), mapIds = new Set(mapped.map(row => row.id));
  const common = input.filter(row => mapIds.has(row.id)).map(row => row.id);
  return { query, input, mapped, common, missing: input.filter(row => !mapIds.has(row.id)).map(row => row.id), introduced: mapped.filter(row => !inputIds.has(row.id)).map(row => row.id), retention: common.length / k };
}
