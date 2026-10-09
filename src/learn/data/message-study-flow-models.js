import { graphFromEdges, inferGraph, operators } from './message-passing-models.js';

export function observedNeighborhood(graph, selected) {
  const adjacency = graphFromEdges(graph.nodes.length, graph.edges);
  if (!Number.isInteger(selected) || selected < 0 || selected >= graph.nodes.length) {
    throw new RangeError('Choose an observed semantic node ID.');
  }
  const neighbors = adjacency[selected].flatMap((present, id) => present ? [id] : []);
  const connectedPairs = neighbors.flatMap((left, index) => neighbors.slice(index + 1)
    .filter(right => adjacency[left][right]).map(right => [left, right]));
  const degree = neighbors.length;
  const possiblePairs = degree * (degree - 1) / 2;
  const clustering = possiblePairs ? connectedPairs.length / possiblePairs : 0;
  return { adjacency, selected, neighbors, connectedPairs, degree, possiblePairs,
    clustering, features: [1, degree / (graph.nodes.length - 1), clustering] };
}

export function validateSavedGraphModel(model, family = model?.model) {
  if (!['mlp', 'gcn', 'sage', 'gat'].includes(family) || model?.model !== family || model?.seed !== 11) {
    throw new Error('Expected the selected saved family at seed11.');
  }
  const requireVector = (name, count) => {
    const values = model.state?.[name];
    if (!Array.isArray(values) || values.length !== count || !values.every(Number.isFinite)) {
      throw new Error(`Invalid saved ${name}.`);
    }
  };
  const requireMatrix = (name, rows, columns) => {
    const values = model.state?.[name];
    if (!Array.isArray(values) || values.length !== rows || values.some(row =>
      !Array.isArray(row) || row.length !== columns || !row.every(Number.isFinite))) {
      throw new Error(`Invalid saved ${name}.`);
    }
  };
  for (const [prefix, inputWidth, outputWidth] of [['first.', 3, 16], ['last.', 16, 2]]) {
    requireMatrix(prefix + 'linear.weight', outputWidth, inputWidth);
    requireVector(prefix + 'bias', outputWidth);
    if (family === 'sage') requireMatrix(prefix + 'self_linear.weight', outputWidth, inputWidth);
    if (family === 'gat') {
      requireVector(prefix + 'sender_score', outputWidth);
      requireVector(prefix + 'receiver_score', outputWidth);
    }
  }
  return model;
}

export function savedStudyTrace(graph, roles, model, selected = 2, coordinate = 0) {
  validateSavedGraphModel(model);
  const features = graph.nodes.map(node => [1, node.degree / 33, node.clustering]);
  const adjacency = graphFromEdges(graph.nodes.length, graph.edges);
  const result = inferGraph(features, adjacency, model);
  const coefficients = result.first.coefficients?.[selected];
  const incoming = coefficients ? coefficients.flatMap((coefficient, source) => coefficient ? [{
    source, coefficient, projected: result.first.projected[source][coordinate],
    product: coefficient * result.first.projected[source][coordinate],
  }] : []) : [];
  const bias = model.state['first.bias'][coordinate];
  const own = model.model === 'sage'
    ? model.state['first.self_linear.weight'][coordinate].reduce((sum, weight, channel) => sum + weight * features[selected][channel], 0)
    : model.model === 'mlp' ? result.first.projected[selected][coordinate] : 0;
  const fitRows = roles.fit.map(id => {
    const logits = result.logits[id];
    const maximum = Math.max(...logits);
    const logNormalizer = maximum + Math.log(logits.reduce((sum, value) => sum + Math.exp(value - maximum), 0));
    return { id, target: graph.nodes[id].club, logits, loss: logNormalizer - logits[graph.nodes[id].club] };
  });
  return { features, adjacency, result, selected, coordinate, incoming, bias, own,
    preactivation: result.first.output[selected][coordinate], activation: result.hidden[selected][coordinate],
    fitRows, fitLoss: fitRows.reduce((sum, row) => sum + row.loss, 0) / fitRows.length,
    closedDegrees: operators(adjacency).degree };
}
