// Constructed sparse operator views. Routes are [sender, receiver]; matrices use
// receiving rows and sending columns. Input routes are unique, unweighted, and
// contain no self loops. Each branch declares its own loop/bias/reduction policy.
export function sparseRouteTrace(features, openRoutes) {
  const count = features.length;
  if (!count || !features.every(Number.isFinite)) throw new Error('Finite scalar node features required.');
  const seen = new Set();
  for (const route of openRoutes) {
    if (!Array.isArray(route) || route.length !== 2 || route.some(id => !Number.isInteger(id) || id < 0 || id >= count) || route[0] === route[1]) {
      throw new Error('Use unique non-self sender/receiver routes.');
    }
    const key = route.join(':');
    if (seen.has(key)) throw new Error('Duplicate routes need a different declared operator.');
    seen.add(key);
  }
  const closed = [...openRoutes.map(route => [...route]), ...features.map((_, id) => [id, id])];
  const degree = features.map(() => 0);
  closed.forEach(([, receiver]) => degree[receiver]++);
  const matrix = features.map(() => features.map(() => 0));
  const gcnRoutes = closed.map(([sender, receiver]) => {
    const coefficient = 1 / Math.sqrt(degree[receiver]) / Math.sqrt(degree[sender]);
    matrix[receiver][sender] = coefficient;
    return { sender, receiver, coefficient, projection: features[sender], product: coefficient * features[sender] };
  });
  const sparseOutput = features.map(() => 0);
  gcnRoutes.forEach(route => sparseOutput[route.receiver] += route.product);
  const denseOutput = matrix.map(row => row.reduce((sum, coefficient, sender) => sum + coefficient * features[sender], 0));
  const sage = features.map((own, receiver) => {
    const senders = openRoutes.filter(([, target]) => target === receiver).map(([sender]) => sender);
    const sum = senders.reduce((total, sender) => total + features[sender], 0);
    const mean = senders.length ? sum / senders.length : 0;
    // Controlled scalar map: neighbor weight1, own weight2, neighbor-map bias1.
    return { receiver, senders, sum, count: senders.length, mean, neighborTerm: mean + 1, ownTerm: 2 * own, bias: 1, output: mean + 1 + 2 * own };
  });
  const gat = features.map((_, receiver) => {
    const routes = closed.filter(([, target]) => target === receiver).map(([sender]) => {
      const raw = features[receiver] + features[sender];
      return { sender, receiver, projection: features[sender], raw, score: raw >= 0 ? raw : .2 * raw };
    });
    const maximum = Math.max(...routes.map(route => route.score));
    const masses = routes.map(route => Math.exp(route.score - maximum));
    const denominator = masses.reduce((sum, mass) => sum + mass, 0);
    return { receiver, maximum, denominator, routes: routes.map((route, index) => ({ ...route, shifted: route.score - maximum,
      mass: masses[index], coefficient: masses[index] / denominator, product: masses[index] / denominator * route.projection })),
    output: routes.reduce((sum, route, index) => sum + masses[index] / denominator * route.projection, 0) };
  });
  // Intentionally incorrect comparison: one stable denominator for every edge.
  const all = gat.flatMap(segment => segment.routes), globalMaximum = Math.max(...all.map(route => route.score));
  const globalDenominator = all.reduce((sum, route) => sum + Math.exp(route.score - globalMaximum), 0);
  const wrongGlobal = features.map(() => 0), wrongMass = features.map(() => 0);
  all.forEach(route => {
    const coefficient = Math.exp(route.score - globalMaximum) / globalDenominator;
    wrongGlobal[route.receiver] += coefficient * route.projection;
    wrongMass[route.receiver] += coefficient;
  });
  return { features: [...features], openRoutes: openRoutes.map(route => [...route]), closed, degree, matrix,
    gcnRoutes, sparseOutput, denseOutput, sage, gat, wrongGlobal, wrongMass };
}

export function sparsePathComparison(rightEdge = true, endpointValue = 4) {
  const features = [1, 2, endpointValue], original = [[0, 1], [1, 0], [1, 2], [2, 1]];
  const current = sparseRouteTrace(features, rightEdge ? original : original.slice(0, 2));
  const cached = sparseRouteTrace(features, original);
  return { ...current, rightEdge, cachedMatrix: cached.matrix, cachedOutput: cached.denseOutput,
    cacheCurrent: rightEdge, maximumDenseSparseDifference: Math.max(...current.denseOutput.map((v, id) => Math.abs(v - current.sparseOutput[id]))) };
}

export const directedSparseSupports = {
  original: [[0, 1], [1, 0], [1, 2], [2, 1]],
  removed: [[0, 1], [1, 0]],
  added: [[0, 1], [1, 0], [3, 1]],
};
export const directedSparseFeatures = [[1, 2], [-1, .3], [.4, -2], [3, .1]];

export function directedSparseTrace(support) {
  // Scalar normalization depends on topology, not on the feature coordinate.
  const trace = sparseRouteTrace(directedSparseFeatures.map(row => row[0]), directedSparseSupports[support]);
  const output = trace.matrix.map(row => [0, 1].map(channel => row.reduce((sum, weight, sender) => sum + weight * directedSparseFeatures[sender][channel], 0)));
  return { ...trace, vectorFeatures: directedSparseFeatures, output };
}
