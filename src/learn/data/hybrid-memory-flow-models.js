import {
  hybridMemoryRead, hybridCacheBytes, hybridRoute, hybridStrokeStream,
  hybridAttentionOperations, hybridExpertParameters, jambaOriginalBudget,
} from './hybrid-jamba-models.js';
import { dense, softmax, maxDifference } from './sequence-tensor-operations.js';

export const hybridFlowInitialRecords = [
  { key: 'A', value: 2 }, { key: 'B', value: 7 }, { key: 'C', value: 4 },
];

const finite = value => typeof value === 'number' && Number.isFinite(value);
const sum = values => values.reduce((total, value) => total + value, 0);
export const hybridFlowSilu = value => value / (1 + Math.exp(-value));
export const hybridFlowSoftplus = value => Math.max(value, 0) + Math.log1p(Math.exp(-Math.abs(value)));
export function hybridFlowRms(values, gain = values.map(() => 1)) {
  const scale = 1 / Math.sqrt(sum(values.map(value => value * value)) / values.length + 1e-6);
  return { scale, values: values.map((value, index) => value * scale * gain[index]) };
}

export function hybridFlowMemory(records, query, decay, scoreGap) {
  if (!Array.isArray(records) || records.length < 1 || records.length > 8 ||
      records.some(row => !['A', 'B', 'C', 'D'].includes(row.key) || !finite(row.value) || Math.abs(row.value) > 10) ||
      !finite(decay) || decay < 0 || decay > 1 || !finite(scoreGap) || Math.abs(scoreGap) > 6) {
    throw new Error('Use one to eight keyed finite values, decay 0–1 and score gap −6–6.');
  }
  const result = hybridMemoryRead(records.map(row => row.value), records.map(row => row.key), query, decay, scoreGap);
  return {
    ...result,
    scores: records.map(row => row.key === query ? scoreGap : 0),
    masses: records.map(row => Math.exp(row.key === query ? scoreGap : 0)),
    addressedTerms: result.weights.map((weight, index) => weight * records[index].value),
    summaryTerms: result.recurrenceWeights.map((weight, index) => weight * records[index].value),
  };
}

export const hybridTinyParameters = {
  inputWeight: [[1, 0], [0, 1], [.5, 0], [0, -1]], inputBias: [0, 0, 0, 0],
  convolutionWeight: [[.25, .5, 1], [.5, -.25, 1]], convolutionBias: [0, 0],
  deltaWeight: [[.1, 0], [0, .2]], deltaBias: [-1, -.5],
  writeWeight: [[.5, 0], [0, 1]], readWeight: [[1, 0], [0, -.5]],
  writeGain: [1, 1], readGain: [1, 1],
  logRates: [[0, Math.log(2)], [0, Math.log(2)]], skip: [1, 1],
  outputWeight: [[1, 0], [0, 1]], outputBias: [0, 0],
};

// A constructed complete two-channel cutaway. The enclosing block's normalization
// is outside this mixer input, and these coefficients are not released/model fits.
export function hybridTinySelectiveStep({
  input = [2, -1], previousState = [[1, 2], [-1, .5]],
  previousHistory = [[1, 0], [-1, 0]], parameters = hybridTinyParameters,
} = {}) {
  const both = dense(input, parameters.inputWeight, parameters.inputBias);
  const projected = both.slice(0, 2), gate = both.slice(2);
  const window = previousHistory.map((row, channel) => [...row, projected[channel]]);
  const convolution = window.map((row, channel) => sum(row.map((value, index) => value * parameters.convolutionWeight[channel][index])) + parameters.convolutionBias[channel]);
  const transformed = convolution.map(hybridFlowSilu);
  const deltaPre = dense(transformed, parameters.deltaWeight, parameters.deltaBias);
  const delta = deltaPre.map(hybridFlowSoftplus);
  const writePre = dense(transformed, parameters.writeWeight);
  const readPre = dense(transformed, parameters.readWeight);
  const writeNorm = hybridFlowRms(writePre, parameters.writeGain);
  const readNorm = hybridFlowRms(readPre, parameters.readGain);
  const decay = parameters.logRates.map((row, channel) => row.map(rate => Math.exp(-delta[channel] * Math.exp(rate))));
  const retained = previousState.map((row, channel) => row.map((value, state) => value * decay[channel][state]));
  const written = delta.map((step, channel) => writeNorm.values.map(value => step * value * transformed[channel]));
  const state = retained.map((row, channel) => row.map((value, coordinate) => value + written[channel][coordinate]));
  const contraction = state.map(row => sum(row.map((value, index) => value * readNorm.values[index])));
  const value = contraction.map((result, channel) => result + parameters.skip[channel] * transformed[channel]);
  const gateActivated = gate.map(hybridFlowSilu);
  const gated = value.map((result, channel) => result * gateActivated[channel]);
  const output = dense(gated, parameters.outputWeight, parameters.outputBias);
  return { input, parameters, projected, gate, window, convolution, transformed, deltaPre, delta,
    writePre, readPre, writeNorm, readNorm, decay, retained, written, state, contraction,
    value, gateActivated, gated, output, history: window.map(row => row.slice(1)) };
}

export function hybridFlowDiscretization(rate, interval, forcing, initial) {
  const exponent = rate * interval;
  const decay = Math.exp(exponent);
  const exactCoefficient = rate === 0 ? interval : Math.expm1(exponent) / rate;
  return { decay, approximateWrite: interval * forcing, exactWrite: exactCoefficient * forcing,
    approximateState: decay * initial + interval * forcing,
    exactState: decay * initial + exactCoefficient * forcing };
}

export function hybridFlowCompose(left, right) {
  return { a: right.a * left.a, b: right.a * left.b + right.b };
}

export function hybridFlowBudget(settings) {
  const config = { ...jambaOriginalBudget, ...settings };
  for (const key of ['batch', 'layers', 'attentionLayers', 'width', 'kvHeads', 'headWidth',
    'stateSize', 'expand', 'convWidth', 'kvBytes', 'stateBytes', 'convBytes', 'length']) {
    if (!Number.isSafeInteger(config[key]) || config[key] < 0) throw new Error(`Invalid cache dimension: ${key}`);
  }
  if (config.attentionLayers > config.layers || config.batch < 1 || config.width < 1 ||
      config.kvHeads < 1 || config.headWidth < 1 || config.expand < 1 || config.stateSize < 1 ||
      config.kvBytes < 1 || config.stateBytes < 1 || config.convBytes < 1 ||
      (config.window !== null && (!Number.isSafeInteger(config.window) || config.window < 1))) {
    throw new Error('Use positive dimensions/dtypes and no more attention layers than total layers.');
  }
  const bytes = hybridCacheBytes(config);
  const operations = hybridAttentionOperations(config);
  return { config, ...bytes, operations, kvPerLayerPerToken: 2n * BigInt(config.batch) * BigInt(config.kvHeads) * BigInt(config.headWidth) * BigInt(config.kvBytes) };
}

export function hybridFlowRouter(scores, values, selectedCount) {
  if (scores.length !== 4 || scores.some(value => !finite(value) || Math.abs(value) > 8) ||
      values.length !== 4 || values.some(row => row.length !== 2 || row.some(value => !finite(value) || Math.abs(value) > 10)) ||
      !Number.isInteger(selectedCount) || selectedCount < 1 || selectedCount > 4) {
    throw new Error('Use four finite scores/vectors and one to four selected experts.');
  }
  return { retained: hybridRoute(scores, values, selectedCount),
    renormalized: hybridRoute(scores, values, selectedCount, true),
    parameterCounts: hybridExpertParameters() };
}

function arrayShape(value, dimensions) {
  if (!dimensions.length) return finite(value);
  return Array.isArray(value) && value.length === dimensions[0] && value.every(row => arrayShape(row, dimensions.slice(1)));
}

// Validate an on-demand exported model before any inference; no library checkpoint
// or large scientific result packet is fetched by these lesson-owned views.
export function validateHybridFlowSnapshot(snapshot, requestedKey) {
  const patterns = { 'MMM-37': 'MMM', 'AAA-37': 'AAA', 'MAM-37': 'MAM', 'AMM-37': 'AMM', 'MAM-73': 'MAM' };
  if (!snapshot || !patterns[requestedKey] || snapshot.key !== requestedKey || snapshot.pattern !== patterns[requestedKey]) {
    throw new Error('The selected model asset has a different identity or architecture.');
  }
  const shapes = { 'embed.weight': [16, 4], 'embed.bias': [16], 'norm.weight': [16], 'classifier.weight': [10, 16], 'classifier.bias': [10] };
  for (let index = 0; index < 3; index++) {
    const prefix = `layers.${index}`;
    for (const [name, shape] of Object.entries({ 'norm1.weight': [16], 'norm2.weight': [16], 'gate_up.weight': [64, 16], 'gate_up.bias': [64], 'down.weight': [16, 32], 'down.bias': [16], 'mixer.output.weight': [16, 16], 'mixer.output.bias': [16] })) shapes[`${prefix}.${name}`] = shape;
    const specific = snapshot.pattern[index] === 'M' ? {
      'log_rates': [16, 4], 'skip': [16], 'input.weight': [32, 16], 'input.bias': [32],
      'convolution.weight': [16, 1, 3], 'convolution.bias': [16], 'delta.weight': [16, 16], 'delta.bias': [16],
      'write.weight': [4, 16], 'read.weight': [4, 16], 'write_norm.weight': [4], 'read_norm.weight': [4],
    } : { 'qkv.weight': [48, 16], 'qkv.bias': [48] };
    for (const [name, shape] of Object.entries(specific)) shapes[`${prefix}.mixer.${name}`] = shape;
  }
  const keys = Object.keys(snapshot.state ?? {});
  if (keys.length !== Object.keys(shapes).length || Object.entries(shapes).some(([name, shape]) => !arrayShape(snapshot.state?.[name], shape))) {
    throw new Error('The selected model asset contains incomplete, non-finite or incorrectly shaped tensors.');
  }
  const count = Object.values(snapshot.state).reduce((total, tensor) => total + tensor.flat(Infinity).length, 0);
  if (snapshot.parameters !== count || !Number.isInteger(snapshot.selectedEpoch) || snapshot.selectedEpoch < 1 || snapshot.selectedEpoch > 80 || snapshot.seed !== Number(requestedKey.split('-')[1])) {
    throw new Error('The selected model asset metadata does not match its tensors.');
  }
  return snapshot;
}

function requireStroke(coordinates) {
  if (!arrayShape(coordinates, [8, 2]) || coordinates.flat().some(value => value < 0 || value > 100)) throw new Error('Keep eight finite pen coordinates in the 0–100 range.');
}

export function hybridFlowStroke(snapshot, coordinates) {
  requireStroke(coordinates);
  const result = hybridStrokeStream(snapshot, coordinates);
  for (const frame of result.frames) {
    for (let index = 0; index < frame.layers.length; index++) {
      const layer = frame.layers[index], prefix = `layers.${index}`, weights = snapshot.state;
      const normalizedFfn = hybridFlowRms(layer.intermediate, weights[`${prefix}.norm2.weight`]);
      const gateUp = dense(normalizedFfn.values, weights[`${prefix}.gate_up.weight`], weights[`${prefix}.gate_up.bias`]);
      const gate = gateUp.slice(0, 32), up = gateUp.slice(32);
      Object.assign(layer, { normalizedFfn: normalizedFfn.values, ffnGate: gate, ffnUp: up,
        ffnHidden: gate.map((value, coordinate) => hybridFlowSilu(value) * up[coordinate]) });
    }
  }
  return result;
}

// Every intervention applies independently to a clone of this request's prefix.
// Empty-prefix and empty-suffix boundaries preserve already-produced logits.
export function hybridFlowContinuation(snapshot, coordinates, boundary, faults = {}, donorCoordinates = null) {
  requireStroke(coordinates);
  if (!Number.isInteger(boundary) || boundary < 0 || boundary > 8) throw new Error('The boundary must be 0–8 points.');
  if (donorCoordinates) requireStroke(donorCoordinates);
  if (faults.donor && !donorCoordinates) throw new Error('A donor-cache intervention needs a separately identified donor stroke.');
  const full = hybridFlowStroke(snapshot, coordinates);
  const prefix = hybridStrokeStream(snapshot, coordinates.slice(0, boundary));
  let cache = structuredClone(prefix.cache);
  if (faults.donor && donorCoordinates) cache = hybridStrokeStream(snapshot, donorCoordinates.slice(0, boundary)).cache;
  cache = structuredClone(cache);
  for (let layer = 0; layer < snapshot.pattern.length; layer++) {
    if (!cache[layer]) continue;
    if (snapshot.pattern[layer] === 'M') {
      if (faults.recurrent) cache[layer] = null;
      else if (faults.history) cache[layer].history = cache[layer].history.map(row => row.map(() => 0));
    } else if (faults.kv) cache[layer] = null;
  }
  const suffix = hybridStrokeStream(snapshot, coordinates.slice(boundary), { cache, offset: faults.position ? 0 : boundary });
  const logits = [...prefix.logits, ...suffix.logits];
  const probabilities = softmax(logits.at(-1));
  return { full, prefixCache: prefix.cache, damagedCache: cache, finalCache: suffix.cache, logits, probabilities,
    difference: maxDifference(full.logits, logits),
    positionDifferences: logits.map((row, position) => maxDifference(row, full.logits[position])),
    prediction: probabilities.indexOf(Math.max(...probabilities)),
    fullPrediction: full.probabilities.indexOf(Math.max(...full.probabilities)) };
}

export function hybridFlowDeltaContrast({ matrix = [[1, 2], [3, 4]], key = [Math.SQRT1_2, Math.SQRT1_2], message = [2, -1], gate = [.25, .75], strength = .5 } = {}) {
  const read = state => state[0].map((_, value) => sum(key.map((weight, feature) => weight * state[feature][value])));
  const correct = state => {
    const prediction = read(state);
    return state.map((row, feature) => row.map((value, coordinate) => value + strength * key[feature] * (message[coordinate] - prediction[coordinate])));
  };
  const forget = state => state.map((row, feature) => row.map(value => gate[feature] * value));
  const forgetThenCorrect = correct(forget(matrix));
  // Keep the new outer write identical on both paths. Only the order of the
  // old-state diagonal gate and rank-one correction is changed.
  const previousRead = read(matrix);
  const correctionOnly = matrix.map((row, feature) => row.map((value, coordinate) => value - strength * key[feature] * previousRead[coordinate]));
  const correctThenForget = forget(correctionOnly).map((row, feature) => row.map((value, coordinate) => value + strength * key[feature] * message[coordinate]));
  return { matrix, key, message, gate, strength, forgetThenCorrect, correctThenForget,
    reads: [read(forgetThenCorrect), read(correctThenForget)], difference: maxDifference(forgetThenCorrect, correctThenForget) };
}
