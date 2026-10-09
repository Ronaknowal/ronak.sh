import {
  SYMBOLS, SOURCE_WEIGHTS, CODEBOOKS, normalizeWeights, informationState,
  binaryEntropyState, prefixCodeState, maxEntropyState,
} from './entropy-information-models.js';

export { SYMBOLS, SOURCE_WEIGHTS, CODEBOOKS, normalizeWeights, informationState, binaryEntropyState, maxEntropyState };
export const SOURCE = [0.5, 0.25, 0.125, 0.125];
export const MODEL = [0.125, 0.125, 0.25, 0.5];

export function numericDraft(text, minimum, maximum, name = 'Value') {
  const token = String(text).trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)) {
    throw new Error(`${name}: enter a complete finite number.`);
  }
  const value = Number(token);
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${name}: use ${minimum} to ${maximum}.`);
  }
  if (value === 0 && /[1-9]/.test(token.split(/[eE]/)[0])) {
    throw new Error(`${name}: this nonzero entry is too small to represent; use a larger value or an intentional zero.`);
  }
  return value;
}

export function probabilityDraft(text, length = 3) {
  const tokens = text.trim().split(/[\s,]+/);
  if (tokens.length !== length) throw new Error(`Enter ${length} probabilities in class order.`);
  const values = tokens.map((token, index) => numericDraft(token, 0, 1, `Class ${index}`));
  if (Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) > 1e-12) {
    throw new Error('Target probabilities must sum to one; this editor does not normalize weights.');
  }
  return values;
}

export function prefixTrace(message, codebook = 'matched', consumed = 0) {
  if (!/^[ABCD]{0,16}$/.test(message)) throw new Error('Use at most 16 uppercase A, B, C or D symbols; empty text is allowed.');
  if (!Object.hasOwn(CODEBOOKS, codebook)) throw new Error('Choose a listed codebook.');
  const words = CODEBOOKS[codebook].words;
  const chunks = [...message].map(symbol => words[SYMBOLS.indexOf(symbol)]);
  const bits = chunks.join('');
  const step = Math.max(0, Math.min(bits.length, Math.trunc(consumed)));
  const result = message ? prefixCodeState(message, codebook, step) : {
    message, words, chunks, bits, consumed: 0, decoded: '', buffer: '',
    expectedLength: SOURCE.reduce((sum, mass, index) => sum + mass * words[index].length, 0),
    messageAverage: null, kraft: words.reduce((sum, word) => sum + 2 ** -word.length, 0),
  };
  const trace = [];
  let prefix = '', output = '';
  for (let index = 0; index < bits.length; index += 1) {
    const before = prefix;
    prefix += bits[index];
    const leaf = words.indexOf(prefix);
    const path = prefix;
    if (leaf >= 0) { output += SYMBOLS[leaf]; prefix = ''; }
    trace.push({ index, bit: bits[index], before, path, leaf, output, remainingPrefix: prefix });
  }
  return { ...result, trace, completeOutput: message, fixedLength: 2 * message.length };
}

export function supportState(sourceB = 0.5, modelB = 0, alpha = 0) {
  const p = [1 - sourceB, sourceB, 0, 0];
  const originalWeights = [1, modelB, 0, 0];
  const changedWeights = originalWeights.map(weight => weight + alpha);
  return { original: informationState(p, originalWeights), changed: informationState(p, changedWeights), alpha, sourceB, modelB };
}

export function conditionalState({ context = 0.5, noise = 0.1, trust = 0.8, mode = 'symmetric' } = {}) {
  const masses = [1 - context, context];
  const trueRows = mode === 'unequal' ? [[0.9, 0.1], [0.5, 0.5]] : [[1 - noise, noise], [noise, 1 - noise]];
  const modelRows = mode === 'unequal' ? trueRows : [[trust, 1 - trust], [1 - trust, trust]];
  const rows = trueRows.map((probabilities, index) => {
    const costs = informationState(probabilities, modelRows[index]);
    return {
      index, mass: masses[index], probabilities, model: modelRows[index],
      joint: probabilities.map(value => value * masses[index]),
      available: masses[index] > 0, ...costs,
      weightedEntropy: masses[index] === 0 ? 0 : masses[index] * costs.entropy,
      weightedCost: masses[index] === 0 ? 0 : masses[index] * costs.crossEntropy,
    };
  });
  const sum = field => rows.reduce((total, row) => total + row[field], 0);
  const marginal = [0, 1].map(y => rows.reduce((total, row) => total + row.joint[y], 0));
  return {
    rows, context, noise, trust, mode, marginal,
    entropy: sum('weightedEntropy'), crossEntropy: sum('weightedCost'),
    excess: rows.reduce((total, row) => total + (row.mass === 0 ? 0 : row.mass * row.kl), 0),
    incorrectUniform: rows.reduce((total, row) => total + row.crossEntropy / 2, 0),
    marginalEntropy: informationState(marginal).entropy,
  };
}

export function logitCalculation(logits = [1000, 998, 996], target = 2, soft = null, shift = 0) {
  if (logits.length !== 3 || logits.some(value => !Number.isFinite(value) || Math.abs(value) > 10000)) {
    throw new Error('Use three finite logits between −10000 and 10000.');
  }
  const scores = logits.map(value => value + shift);
  const maximum = Math.max(...scores);
  const shifted = scores.map(value => value - maximum);
  const exponentials = shifted.map(Math.exp);
  const sum = exponentials.reduce((total, value) => total + value, 0);
  const logSum = Math.log(sum);
  const weights = soft ?? scores.map((_, index) => Number(index === target));
  const rows = scores.map((score, index) => ({
    index, score, shifted: shifted[index], exponential: exponentials[index],
    probability: exponentials[index] / sum, logProbability: shifted[index] - logSum,
    targetWeight: weights[index], contribution: weights[index] * (logSum - shifted[index]),
  }));
  return { rows, maximum, sum, logSum, target, soft, shift, loss: rows.reduce((total, row) => total + row.contribution, 0) };
}

export function uniformCoordinates(width = 0.25, scale = 100, bins = 4) {
  if (!Number.isFinite(width) || width < 0.125 || width > 4) throw new Error('Use width from .125 to 4 metres.');
  if (![1, 100].includes(scale)) throw new Error('Choose metres or centimetres.');
  if (!Number.isInteger(bins) || bins < 2 || bins > 32) throw new Error('Use an integer bin count from 2 to 32.');
  const at = factor => ({ width: width * factor, density: 1 / (width * factor), entropy: Math.log2(width * factor), binWidth: width * factor / bins, event: [width * factor / 4, width * factor * 3 / 4], probability: 0.5 });
  return { width, scale, bins, original: at(1), transformed: at(scale), binMass: 1 / bins, binEntropy: Math.log2(bins) };
}

// Exact count/output projection from the retained observed-data execution.
// These tables are not new field observations or a rerun of the scientific main.
export const PENGUINS = {
  species: ['Adelie', 'Chinstrap', 'Gentoo'],
  islands: ['Biscoe', 'Dream', 'Torgersen'],
  train: [[28, 0, 80], [36, 44, 0], [36, 0, 0]],
  test: [[16, 0, 44], [20, 24, 0], [16, 0, 0]],
  trainTotal: 224, testTotal: 120,
  global: { probabilities: [101 / 227, 45 / 227, 81 / 227], crossEntropy: 1.518341224, accuracy: 0.433333333, perplexity: 2.864614937 },
  conditional: [
    { probabilities: [29 / 111, 1 / 111, 81 / 111], count: 60, entropy: 0.836640742, crossEntropy: 0.849730932, kl: 0.01309019 },
    { probabilities: [37 / 83, 45 / 83, 1 / 83], count: 44, entropy: 0.994030211, crossEntropy: 1.011549849, kl: 0.017519637 },
    { probabilities: [37 / 39, 1 / 39, 1 / 39], count: 16, entropy: 0, crossEntropy: 0.075948853, kl: 0.075948853 },
  ],
  total: { entropy: 0.782798115, crossEntropy: 0.805893591, kl: 0.023095476, accuracy: 0.7, perplexity: 1.748228292 },
};
