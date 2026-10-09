// Constructed examples for the MLA reading flow. These are not model weights.
import { latentDefaults, matvec, transpose, multiply, rotatePair } from './latent-attention-models.js';
import { dot, softmax } from './grouped-query-models.js';

export const latentOpeningInputs = [[1, 0, 2], [0, 1, -1], [1, 1, .5]];
export const latentOpeningDownMap = [[1, 0, 0], [0, 1, 0]];
export function latentManualCase() {
  return {
    latent: [[1, 0], [0, 1], [1, 1]],
    queries: [[1, 0], [1, 1]],
    keyUp: [[[1, 0], [0, 2]], [[1, 1], [1, -1]]],
    valueUp: [[[1, 0], [0, 1]], [[2, 0], [1, -1]]],
    outputMap: [[1, 0, .5, 0], [0, 1, 0, .5]],
    queryRotary: [[1, 0], [0, 1]],
    keyRotary: [[1, 0], [1, 0], [1, 0]],
    positions: [0, 1, 2], queryPosition: 2, frequency: Math.PI / 2,
  };
}
export function latentTransferCase() {
  return { ...latentDefaults(), outputMap: [[1, 0, .5, 0], [0, 1, 0, .5]] };
}

// A tolerance identifies an inverse unresolved at this floating precision, not
// an exact mathematical singularity. The displayed determinant keeps that distinction.
export function latentBasisStatus(matrix) {
  const scale = Math.max(...matrix.flat().map(Math.abs));
  if (!Number.isFinite(scale)) return { determinant: NaN, inverse: null, condition: Infinity, status: 'non-finite matrix' };
  if (!scale) return { determinant: 0, scaledDeterminant: 0, tolerance: 0, inverse: null, condition: Infinity, status: 'singular' };
  // Scaling keeps a uniformly small, well-conditioned basis from being rejected
  // merely because its unscaled determinant underflows.
  const [[a, b], [c, d]] = matrix.map(row => row.map(value => value / scale));
  const scaledDeterminant = a * d - b * c, determinant = scaledDeterminant * scale * scale;
  const norm = Math.max(Math.abs(a) + Math.abs(b), Math.abs(c) + Math.abs(d));
  const tolerance = 32 * Number.EPSILON * norm * norm;
  const diagnostics = { determinant, scaledDeterminant, scale, tolerance };
  if (Math.abs(scaledDeterminant) <= tolerance) return { ...diagnostics, inverse: null, condition: Infinity,
    status: scaledDeterminant === 0 ? 'zero determinant at this precision' : 'numerically unresolved inverse' };
  const scaledInverse = [[d / scaledDeterminant, -b / scaledDeterminant], [-c / scaledDeterminant, a / scaledDeterminant]];
  const inverse = scaledInverse.map(row => row.map(value => value / scale));
  if (inverse.flat().some(value => !Number.isFinite(value))) return { ...diagnostics, inverse: null, condition: Infinity, status: 'inverse exceeds floating range' };
  const inverseNorm = Math.max(...scaledInverse.map(row => row.reduce((sum, value) => sum + Math.abs(value), 0)));
  const condition = norm * inverseNorm;
  return { ...diagnostics, inverse, condition, status: condition > 1e8 ? 'ill-conditioned' : 'invertible' };
}

export function latentCaseRead(state, { positioned = true, basis = null, nonlinear = false } = {}) {
  const basisStatus = basis ? latentBasisStatus(basis) : null;
  if (basisStatus && !basisStatus.inverse) return { defined: false, reason: basisStatus.status, basisStatus, heads: null };
  const legal = state.positions.map(id => !positioned || id <= state.queryPosition);
  if (!legal.some(Boolean)) return { defined: false, reason: 'No legal record: a normalized read is undefined.', legal, basisStatus, heads: null };
  const latent = basis ? state.latent.map(row => matvec(basis, row)) : state.latent;
  const keyUp = basis ? state.keyUp.map(map => multiply(map, basisStatus.inverse)) : state.keyUp;
  const valueUp = basis ? state.valueUp.map(map => multiply(map, basisStatus.inverse)) : state.valueUp;
  const scale = 1 / Math.sqrt(state.queries[0].length + (positioned ? state.queryRotary[0].length : 0));
  const heads = state.queries.map((query, head) => {
    const keyMap = keyUp[head], valueMap = valueUp[head];
    const keys = latent.map(row => matvec(keyMap, row));
    const linearValues = latent.map(row => matvec(valueMap, row));
    const values = nonlinear ? linearValues.map(row => row.map(value => Math.max(0, value))) : linearValues;
    const effective = matvec(transpose(keyMap), query);
    const contentProducts = keys.map(key => key.map((value, coordinate) => query[coordinate] * value));
    const content = contentProducts.map(row => row.reduce((sum, value) => sum + value, 0));
    const absorbedContent = latent.map(row => dot(effective, row));
    const queryRotary = positioned ? rotatePair(state.queryRotary[head], state.queryPosition * state.frequency) : [0, 0];
    const keyRotary = state.keyRotary.map((row, index) => positioned ? rotatePair(row, state.positions[index] * state.frequency) : [0, 0]);
    const rotaryProducts = keyRotary.map(row => row.map((value, coordinate) => queryRotary[coordinate] * value));
    const rotary = rotaryProducts.map(row => row.reduce((sum, value) => sum + value, 0));
    const logits = content.map((value, index) => (value + rotary[index]) * scale);
    const weights = softmax(logits, legal);
    const shift = Math.max(...logits.filter((_, index) => legal[index]));
    const shifted = logits.map((value, index) => legal[index] ? value - shift : null);
    const exponentials = shifted.map(value => value === null ? 0 : Math.exp(value));
    const mass = exponentials.reduce((sum, value) => sum + value, 0);
    const latentContributions = latent.map((row, index) => row.map(value => weights[index] * value));
    const valueContributions = values.map((row, index) => row.map(value => weights[index] * value));
    const mixture = latent[0].map((_, coordinate) => latentContributions.reduce((sum, row) => sum + row[coordinate], 0));
    const expandedOutput = values[0].map((_, coordinate) => valueContributions.reduce((sum, row) => sum + row[coordinate], 0));
    const linearOutput = matvec(valueMap, mixture);
    const absorbedOutput = nonlinear ? linearOutput.map(value => Math.max(0, value)) : linearOutput;
    return { query, keyMap, valueMap, keys, values, linearValues, effective, contentProducts, content, absorbedContent,
      queryRotary, keyRotary, rotaryProducts, rotary, logits, shifted, exponentials, mass, weights,
      latentContributions, valueContributions, mixture, expandedOutput, absorbedOutput };
  });
  const expandedJoined = heads.flatMap(head => head.expandedOutput), absorbedJoined = heads.flatMap(head => head.absorbedOutput);
  return { defined: true, positioned, nonlinear, basisStatus, legal, scale, latent, keyUp, valueUp, heads,
    expandedJoined, absorbedJoined, expandedOutput: matvec(state.outputMap, expandedJoined), absorbedOutput: matvec(state.outputMap, absorbedJoined) };
}

export function latentBlockMerge(logits, records, legal, split) {
  const makeBlock = (start, end) => {
    const indices = Array.from({ length: end - start }, (_, i) => start + i).filter(index => legal[index]);
    if (!indices.length) return { indices, maximum: -Infinity, mass: 0, numerator: records[0].map(() => 0) };
    const maximum = Math.max(...indices.map(index => logits[index]));
    const exponentials = indices.map(index => Math.exp(logits[index] - maximum));
    return { indices, maximum, exponentials, mass: exponentials.reduce((a, b) => a + b, 0),
      numerator: records[0].map((_, d) => indices.reduce((sum, index, i) => sum + exponentials[i] * records[index][d], 0)) };
  };
  const blocks = [makeBlock(0, split), makeBlock(split, records.length)];
  if (!blocks.some(block => block.mass > 0)) return { defined: false, blocks };
  const maximum = Math.max(...blocks.map(block => block.maximum));
  const factors = blocks.map(block => block.mass ? Math.exp(block.maximum - maximum) : 0);
  const mass = blocks.reduce((sum, block, index) => sum + factors[index] * block.mass, 0);
  const numerator = records[0].map((_, d) => blocks.reduce((sum, block, index) => sum + factors[index] * block.numerator[d], 0));
  return { defined: true, blocks, maximum, factors, mass, numerator, output: numerator.map(value => value / mass) };
}

// Original UCI Libras row 77: observations can be drawn before fetching weights.
export const latentMovementPoints = Object.freeze([
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32407]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.3287]),
  Object.freeze([0.64217,0.3287]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.32639]),
  Object.freeze([0.64217,0.3287]),
  Object.freeze([0.64217,0.33102]),
  Object.freeze([0.64217,0.3287]),
  Object.freeze([0.64217,0.32407]),
  Object.freeze([0.64023,0.32176]),
  Object.freeze([0.6383,0.31713]),
  Object.freeze([0.6383,0.31019]),
  Object.freeze([0.63443,0.30324]),
  Object.freeze([0.63056,0.29167]),
  Object.freeze([0.62282,0.28009]),
  Object.freeze([0.61509,0.26852]),
  Object.freeze([0.60542,0.25926]),
  Object.freeze([0.59381,0.25]),
  Object.freeze([0.58414,0.24306]),
  Object.freeze([0.56867,0.23843]),
  Object.freeze([0.55706,0.23148]),
  Object.freeze([0.54159,0.23148]),
  Object.freeze([0.52805,0.23611]),
  Object.freeze([0.51257,0.24074]),
  Object.freeze([0.4971,0.25]),
  Object.freeze([0.47969,0.26157]),
  Object.freeze([0.46422,0.27546]),
  Object.freeze([0.44874,0.29167]),
  Object.freeze([0.43133,0.31019]),
  Object.freeze([0.41586,0.3287]),
]);
