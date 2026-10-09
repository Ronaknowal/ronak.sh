import examples from './message-passing-examples.json';
import { dot, sum, graphFromEdges, inferGraph, operators, permuteGraph } from './message-passing-models.js';
import { validateSavedGraphModel } from './message-study-flow-models.js';

export const inspectorFamilies = ['mlp', 'gcn', 'sage', 'gat'];
export const inspectorFamilyNames = { mlp: 'Structural MLP', gcn: 'GCN', sage: 'Mean-SAGE', gat: 'GAT' };
export const inspectorFeatures = examples.graph.nodes.map(node => [1, node.degree / 33, node.clustering]);
export const inspectorAdjacency = graphFromEdges(34, examples.graph.edges);
export const inspectorLabels = examples.graph.nodes.map(node => node.club);
export const inspectorEdges = examples.graph.edges.map(([left, right]) => [left, right]);
export const inspectorFeatureNames = ['Constant', 'Original degree / 33', 'Original clustering'];
const cloneRows = rows => rows.map(row => [...row]);
const requireIndex = (value, size, name) => {
  if (!Number.isInteger(value) || value < 0 || value >= size) throw new RangeError(`Choose a valid ${name}.`);
};

export function initialInspectorInputs() {
  return { features: cloneRows(inspectorFeatures), adjacency: cloneRows(inspectorAdjacency), receiver: 2,
    hiddenChannel: 0, featureNode: 2, featureCoordinate: 1, edgeIndex: 1, reversed: false, revision: 0 };
}

export function updateInspectorInputs(previous, action) {
  let changes;
  const indices = { receiver: [34, 'receiver'], hiddenChannel: [16, 'hidden channel'], featureNode: [34, 'feature member'],
    featureCoordinate: [3, 'feature coordinate'], edgeIndex: [78, 'observed relationship'] };
  if (indices[action.type]) {
    requireIndex(action.value, ...indices[action.type]);
    changes = { [action.type]: action.value };
  } else if (action.type === 'feature') {
    if (!Number.isFinite(action.value) || action.value < -2 || action.value > 2) throw new RangeError('Diagnostic features range from −2 to 2.');
    changes = { features: previous.features.map((row, id) => id === previous.featureNode
      ? row.map((value, channel) => channel === previous.featureCoordinate ? action.value : value) : row) };
  } else if (action.type === 'edge') {
    if (typeof action.value !== 'boolean') throw new TypeError('Use a keep/remove relationship choice.');
    const [left, right] = inspectorEdges[previous.edgeIndex];
    changes = { adjacency: previous.adjacency.map((row, receiver) => row.map((value, sender) =>
      (receiver === left && sender === right) || (receiver === right && sender === left) ? Number(action.value) : value)) };
  } else if (action.type === 'remove-edges') changes = { adjacency: previous.adjacency.map(row => row.map(() => 0)) };
  else if (action.type === 'restore-edges') changes = { adjacency: cloneRows(inspectorAdjacency) };
  else if (action.type === 'restore-features') changes = { features: cloneRows(inspectorFeatures) };
  else if (action.type === 'reversed') {
    if (typeof action.value !== 'boolean') throw new TypeError('Storage reversal must be a boolean.');
    changes = { reversed: action.value };
  } else if (action.type === 'reset-all') changes = initialInspectorInputs();
  else throw new Error('Unknown saved-input action.');
  return { ...previous, ...changes, revision: previous.revision + 1 };
}

export function inspectorInputSummary(inputs) {
  const featureEdits = inputs.features.flatMap((row, id) => row.flatMap((value, channel) =>
    value !== inspectorFeatures[id][channel] ? [{ id, channel, original: inspectorFeatures[id][channel], current: value }] : []));
  const removedEdges = inspectorEdges.filter(([left, right]) => !inputs.adjacency[left][right]);
  return { featureEdits, removedEdges, original: !featureEdits.length && !removedEdges.length };
}

export function inspectorOrder(reversed = false) {
  return Array.from({ length: 34 }, (_, row) => reversed ? 33 - row : row);
}

// A named comparison needs its own forward calculation. Compute these once per
// features/adjacency/model snapshot, not once for every diagram or readout.
export function inspectorForwardPair(features, adjacency, model) {
  validateSavedGraphModel(model);
  const canonical = inferGraph(features, adjacency, model);
  const order = inspectorOrder(true), reversedInput = permuteGraph(features, adjacency, order);
  const reversed = inferGraph(reversedInput.features, reversedInput.adjacency, model);
  const maximumLogitDifference = Math.max(...canonical.logits.flatMap((row, id) => row.map((value, c) => Math.abs(value - reversed.logits[33 - id][c]))));
  const maximumProbabilityDifference = Math.max(...canonical.probabilities.flatMap((row, id) => row.map((value, c) => Math.abs(value - reversed.probabilities[33 - id][c]))));
  return { canonical, reversed, maximumLogitDifference, maximumProbabilityDifference };
}

function layerReceiverTrace(features, adjacency, model, layer, prefix, order, receiver, outputCoordinate) {
  const row = order.indexOf(receiver), kind = model.model, op = operators(adjacency);
  const support = kind === 'mlp' ? adjacency.map(values => values.map(() => false))
    : kind === 'sage' ? adjacency.map(values => values.map(Boolean)) : op.allowed;
  const state = model.state, weights = state[`${prefix}linear.weight`][outputCoordinate];
  const receiverScore = kind === 'gat' ? dot(layer.projected[row], state[`${prefix}receiver_score`]) : null;
  const scores = kind === 'gat' ? layer.projected.map(projected => {
    const senderScore = dot(projected, state[`${prefix}sender_score`]), raw = senderScore + receiverScore;
    return { senderScore, receiverScore, raw, score: raw < 0 ? .2 * raw : raw };
  }) : null;
  const maximum = scores ? Math.max(...scores.filter((_, sender) => support[row][sender]).map(value => value.score)) : null;
  const denominator = scores ? sum(scores.flatMap((value, sender) => support[row][sender] ? [Math.exp(value.score - maximum)] : [])) : null;
  const incoming = support[row].flatMap((allowed, senderRow) => {
    if (!allowed) return [];
    const coefficient = layer.coefficients[row][senderRow], projected = layer.projected[senderRow][outputCoordinate];
    return [{ sender: order[senderRow], senderRow, receiver, receiverRow: row, coefficient, projected, product: coefficient * projected,
      input: [...features[senderRow]], weights: [...weights], projectionProducts: features[senderRow].map((value, index) => value * weights[index]),
      closedSenderDegree: op.degree[senderRow], closedReceiverDegree: op.degree[row], openReceiverDegree: sum(adjacency[row]),
      ...(scores ? { ...scores[senderRow], maximum, shifted: scores[senderRow].score - maximum,
        mass: Math.exp(scores[senderRow].score - maximum), denominator } : {}) }];
  });
  const ownWeights = kind === 'sage' ? state[`${prefix}self_linear.weight`][outputCoordinate] : kind === 'mlp' ? weights : null;
  const own = ownWeights ? dot(features[row], ownWeights) : 0;
  const bias = state[`${prefix}bias`][outputCoordinate], neighborSum = sum(incoming.map(value => value.product));
  return { row, receiver, input: [...features[row]], weights: [...weights], incoming, neighborSum, own, ownWeights: ownWeights ? [...ownWeights] : null,
    bias, preactivation: layer.output[row][outputCoordinate], projectedOwn: layer.projected[row][outputCoordinate],
    receiverScore, maximum, denominator, coefficientSum: sum(incoming.map(value => value.coefficient)),
    reconstructed: neighborSum + own + bias };
}

export function inspectorReceiverTrace(inputs, model, forwards) {
  const order = inspectorOrder(inputs.reversed), row = order.indexOf(inputs.receiver);
  const mapped = permuteGraph(inputs.features, inputs.adjacency, order), result = inputs.reversed ? forwards.reversed : forwards.canonical;
  const first = layerReceiverTrace(mapped.features, mapped.adjacency, model, result.first, 'first.', order, inputs.receiver, inputs.hiddenChannel);
  const last = [0, 1].map(c => layerReceiverTrace(result.hidden, mapped.adjacency, model, result.last, 'last.', order, inputs.receiver, c));
  const logits = [...result.logits[row]], maximum = Math.max(...logits), masses = logits.map(value => Math.exp(value - maximum)), normalizer = sum(masses);
  return { order, row, mapped, result, first, last, logits, probabilities: [...result.probabilities[row]],
    activation: result.hidden[row][inputs.hiddenChannel], maximum, masses, normalizer,
    predicted: result.probabilities[row][1] > result.probabilities[row][0] ? 1 : 0 };
}

// Keep only the four teaching snapshots. Every round reads the complete old
// matrix, then clamps fitting rows; no withheld label initializes a score.
export function inspectorLabelTrace(adjacency, labels = inspectorLabels, fit = examples.roles.fit, rounds = 200) {
  const known = new Set(fit), transition = operators(adjacency).mean;
  const clamped = labels.map((label, id) => [0, 1].map(c => Number(known.has(id) && label === c)));
  let scores = cloneRows(clamped);
  const snapshots = [{ round: 0, scores: cloneRows(scores) }];
  for (let round = 1; round <= rounds; round++) {
    const averaged = transition.map(row => [0, 1].map(c => sum(row.map((coefficient, source) => coefficient * scores[source][c]))));
    scores = averaged.map((row, id) => known.has(id) ? [...clamped[id]] : row);
    if (round === 1 || round === rounds - 1 || round === rounds) snapshots.push({ round, scores: cloneRows(scores), averaged: cloneRows(averaged) });
  }
  return { transition, scores, snapshots, clamped, fit: [...fit], rounds };
}

export function pinInspectorSnapshot(family, model, inputs, trace) {
  if (model.model !== family) throw new Error('Pin only the current loaded model family.');
  // A real copy: neither later edits nor another family can rewrite the pin.
  return structuredClone({ family, seed: model.seed, model, inputs, receiver: inputs.receiver,
    order: trace.order, row: trace.row, hiddenChannel: inputs.hiddenChannel, first: trace.first,
    hidden: trace.result.hidden[trace.row], last: trace.last, logits: trace.logits, probabilities: trace.probabilities });
}
