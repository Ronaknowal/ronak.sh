import {
  dot,
  imagePatches,
  softmax,
} from './vision-transformer-models.js';

// The retained digit model has two blocks, four heads and width 32. This trace
// exposes its actual intermediate arrays without altering its protected weights.
// Maps follow PyTorch's output-by-input convention; rows hold token features.
const sum = values => values.reduce((total, value) => total + value, 0);
const add = (left, right) => left.map((value, index) => value + right[index]);
const identityOrder = () => Array.from({ length: 16 }, (_, index) => index);

function affineRows(rows, weights, biases) {
  return rows.map(row => weights.map((weight, output) => (
    dot(weight, row) + (biases?.[output] ?? 0)
  )));
}

function normalizationTrace(rows, gains, offsets) {
  const means = rows.map(row => sum(row) / row.length);
  const centered = rows.map((row, index) => row.map(value => value - means[index]));
  const variances = centered.map(row => sum(row.map(value => value * value)) / row.length);
  const divisors = variances.map(variance => Math.sqrt(variance + 1e-5));
  const standardized = centered.map((row, index) => row.map(value => value / divisors[index]));
  const output = standardized.map(row => row.map((value, feature) => (
    value * gains[feature] + offsets[feature]
  )));
  return { input: rows, means, centered, variances, divisors, standardized, gains, offsets, output };
}

function errorFunction(value) {
  // Same convergent double-precision expansion as the preserved browser model.
  // Its positive series avoids alternating cancellation on these fitted inputs.
  const magnitude = Math.abs(value);
  if (magnitude > 8) return Math.sign(value);
  let term = magnitude;
  let total = magnitude;
  for (let iteration = 1; iteration < 400; iteration += 1) {
    term *= 2 * magnitude * magnitude / (2 * iteration + 1);
    total += term;
    if (term <= total * 2e-16) break;
  }
  return Math.sign(value) * Math.min(1, 2 / Math.sqrt(Math.PI) * Math.exp(-magnitude * magnitude) * total);
}

function validateImageCase(image, order) {
  if (image.length !== 8 || image.some(row => (
    row.length !== 8 || row.some(value => !Number.isFinite(value))
  ))) throw new Error('The digit trace needs eight rows of eight finite pixel values.');
  if (order.length !== 16 || new Set(order).size !== 16 || order.some(index => (
    !Number.isInteger(index) || index < 0 || index >= 16
  ))) throw new Error('Patch order must contain each original patch index exactly once.');
}

export function traceVisionEncoder(state, image, {
  order = identityOrder(),
  movePositions = false,
  pca = null,
} = {}) {
  validateImageCase(image, order);
  const raw = imagePatches(image).map(patch => patch.pixels);
  const patchWeights = state['patch.weight'].map(row => row.flat(Infinity));
  const patchBiases = state['patch.bias'];
  const projected = affineRows(raw, patchWeights, patchBiases);
  const positionIndices = order.map((source, slot) => movePositions ? source : slot);
  const positionedPatches = order.map((source, slot) => (
    add(projected[source], state.patch_position[0][positionIndices[slot]])
  ));
  const assembly = [
    add(state.cls[0][0], state.cls_position[0][0]),
    ...positionedPatches,
  ];
  let tokens = assembly;
  const blocks = [];

  for (let blockIndex = 0; blockIndex < 2; blockIndex += 1) {
    const prefix = `blocks.${blockIndex}`;
    const input = tokens;
    const firstNorm = normalizationTrace(input, state[`${prefix}.norm1.weight`], state[`${prefix}.norm1.bias`]);
    const qkvWeights = state[`${prefix}.qkv.weight`];
    const qkvBiases = state[`${prefix}.qkv.bias`];
    const projectedQkv = affineRows(firstNorm.output, qkvWeights, qkvBiases);
    const heads = Array.from({ length: 4 }, (_, headIndex) => {
      const headStart = headIndex * 8;
      const query = projectedQkv.map(row => row.slice(headStart, headStart + 8));
      const key = projectedQkv.map(row => row.slice(32 + headStart, 40 + headStart));
      const value = projectedQkv.map(row => row.slice(64 + headStart, 72 + headStart));
      const rawScores = query.map(row => key.map(source => dot(row, source)));
      const scores = rawScores.map(row => row.map(score => score / Math.sqrt(8)));
      const weights = scores.map(softmax);
      const output = weights.map(row => Array.from({ length: 8 }, (_, coordinate) => (
        sum(row.map((weight, source) => weight * value[source][coordinate]))
      )));
      return { headIndex, query, key, value, rawScores, scores, weights, output };
    });
    const concatenated = input.map((_, receiver) => heads.flatMap(head => head.output[receiver]));
    const outputWeights = state[`${prefix}.output.weight`];
    const outputBiases = state[`${prefix}.output.bias`];
    const attentionWrite = affineRows(concatenated, outputWeights, outputBiases);
    const residual = input.map((row, receiver) => add(row, attentionWrite[receiver]));
    const secondNorm = normalizationTrace(residual, state[`${prefix}.norm2.weight`], state[`${prefix}.norm2.bias`]);
    const upWeights = state[`${prefix}.ffn.0.weight`];
    const upBiases = state[`${prefix}.ffn.0.bias`];
    const hiddenPre = affineRows(secondNorm.output, upWeights, upBiases);
    const hidden = hiddenPre.map(row => row.map(value => (
      0.5 * value * (1 + errorFunction(value / Math.sqrt(2)))
    )));
    const downWeights = state[`${prefix}.ffn.2.weight`];
    const downBiases = state[`${prefix}.ffn.2.bias`];
    const feedForwardWrite = affineRows(hidden, downWeights, downBiases);
    tokens = residual.map((row, receiver) => add(row, feedForwardWrite[receiver]));
    blocks.push({
      blockIndex, input, firstNorm, qkvWeights, qkvBiases, projectedQkv, heads,
      concatenated, outputWeights, outputBiases, attentionWrite, residual,
      secondNorm, upWeights, upBiases, hiddenPre, hidden, downWeights, downBiases,
      feedForwardWrite, output: tokens,
    });
  }

  const finalNorm = normalizationTrace(tokens, state['norm.weight'], state['norm.bias']);
  const features = finalNorm.output;
  const headWeights = state['head.weight'];
  const headBiases = state['head.bias'];
  const logits = affineRows([features[0]], headWeights, headBiases)[0];
  const probabilities = softmax(logits);
  const patchPCA = pca ? features.slice(1).map(row => [0, 1, 2].map(axis => (
    sum(row.map((value, feature) => (
      (value - pca.training_mean[feature]) * pca.basis[feature][axis]
    )))
  ))) : null;
  return {
    raw, patchWeights, patchBiases, projected, order, positionIndices, assembly,
    blocks, finalNorm, features, headWeights, headBiases, logits, probabilities,
    predicted: probabilities.indexOf(Math.max(...probabilities)), patchPCA,
    attention: blocks.map(block => block.heads.map(head => head.weights)),
  };
}

export function inspectVisionHead(trace, blockIndex, headIndex, receiver) {
  const head = trace.blocks[blockIndex].heads[headIndex];
  const query = head.query[receiver];
  const scores = head.scores[receiver];
  const maximum = Math.max(...scores);
  const mass = scores.map(score => Math.exp(score - maximum));
  const denominator = sum(mass);
  const shares = head.weights[receiver];
  const products = head.key.map(key => key.map((value, coordinate) => value * query[coordinate]));
  const contributions = head.value.map((value, source) => value.map(coordinate => coordinate * shares[source]));
  return {
    blockIndex, headIndex, receiver, query, keys: head.key, values: head.value,
    products, rawScores: head.rawScores[receiver], scores, maximum, mass, denominator,
    shares, contributions, output: head.output[receiver],
  };
}

export function balancedPrototypeTrace(positiveMass, iterations = 3) {
  const samples = positiveMass.length;
  const prototypes = positiveMass[0]?.length;
  if (!samples || !prototypes || !Number.isInteger(iterations) || iterations < 1 || positiveMass.some(row => (
    row.length !== prototypes || row.some(value => !Number.isFinite(value) || value <= 0)
  ))) throw new Error('Balancing needs a rectangular strictly positive mass matrix and positive iteration count.');
  const originalTotal = sum(positiveMass.flat());
  const requirePositiveMass = (values, stage) => {
    if (values.some(value => !Number.isFinite(value) || value <= 0)) {
      throw new Error(`Unrepresentable positive mass during ${stage}; balancing cannot erase required support.`);
    }
  };
  requirePositiveMass([originalTotal], 'initial total');
  let mass = positiveMass.map(row => row.map(value => value / originalTotal));
  requirePositiveMass(mass.flat(), 'common normalization');
  const describe = (stage, values) => ({
    stage, values, sampleMass: values.map(sum),
    prototypeMass: Array.from({ length: prototypes }, (_, coordinate) => sum(values.map(row => row[coordinate]))),
  });
  const steps = [describe('Initial common normalization', mass)];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const columnMass = Array.from({ length: prototypes }, (_, coordinate) => sum(mass.map(row => row[coordinate])));
    requirePositiveMass(columnMass, `prototype reduction ${iteration + 1}`);
    mass = mass.map(row => row.map((value, coordinate) => value / columnMass[coordinate] / prototypes));
    requirePositiveMass(mass.flat(), `prototype division ${iteration + 1}`);
    steps.push(describe(`Prototype pass ${iteration + 1}`, mass));
    const rowMass = mass.map(sum);
    requirePositiveMass(rowMass, `sample reduction ${iteration + 1}`);
    mass = mass.map((row, sample) => row.map(value => value / rowMass[sample] / samples));
    requirePositiveMass(mass.flat(), `sample division ${iteration + 1}`);
    steps.push(describe(`Sample pass ${iteration + 1}`, mass));
  }
  const target = mass.map(row => row.map(value => value * samples));
  requirePositiveMass(target.flat(), 'per-sample target');
  return { steps, target, final: describe('Per-sample target', target) };
}

export function unitFeatureGramTrace(studentRows, teacherRows) {
  if (!studentRows.length || teacherRows.length !== studentRows.length) {
    throw new Error('Student and teacher must contain the same aligned patch count.');
  }
  const width = studentRows[0].length;
  if (!width) throw new Error('A feature direction needs at least one coordinate.');
  const normalize = rows => rows.map(row => {
    if (row.length !== width || row.some(value => !Number.isFinite(value))) {
      throw new Error('Feature rows must have the same finite coordinate width.');
    }
    const length = Math.hypot(...row);
    if (!(length > 0) || !Number.isFinite(length)) {
      throw new Error('A feature needs a nonzero finite length to define its cosine direction.');
    }
    return { raw: row, length, unit: row.map(value => value / length) };
  });
  const student = normalize(studentRows);
  const teacher = normalize(teacherRows);
  const studentGram = student.map(left => student.map(right => dot(left.unit, right.unit)));
  const teacherGram = teacher.map(left => teacher.map(right => dot(left.unit, right.unit)));
  const difference = studentGram.map((row, patch) => row.map((value, source) => value - teacherGram[patch][source]));
  const squared = difference.map(row => row.map(value => value * value));
  const patchCount = student.length;
  const sumLoss = sum(squared.flat());
  const unitGradient = student.map((_, patch) => Array.from({ length: width }, (_, coordinate) => (
    4 / patchCount ** 2 * sum(student.map((feature, source) => difference[patch][source] * feature.unit[coordinate]))
  )));
  const rawGradient = student.map((feature, patch) => {
    const radialCredit = dot(feature.unit, unitGradient[patch]);
    return unitGradient[patch].map((credit, coordinate) => (
      (credit - feature.unit[coordinate] * radialCredit) / feature.length
    ));
  });
  return { student, teacher, studentGram, teacherGram, difference, squared,
    sumLoss, meanLoss: sumLoss / patchCount ** 2, unitGradient, rawGradient };
}
