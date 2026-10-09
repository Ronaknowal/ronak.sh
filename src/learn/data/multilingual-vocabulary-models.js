import { trainBpe, encodeBpe } from "./subword-tokenization-models.js";

export const vocabularyLexicons = [
  { id: "en", name: "English strings", words: { cat: 8, cats: 2 } },
  { id: "hi", name: "Hindi strings", words: { "घर": 8, "घरों": 2 } },
  { id: "zh", name: "Chinese strings", words: { "猫": 8, "猫咪": 2 } },
];

export function samplingShares(masses, alpha) {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1 ||
      masses.some(value => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("Use finite nonnegative masses and alpha from zero to one");
  }
  const logs = masses.map(value => value > 0 ? alpha * Math.log(value) : -Infinity);
  const maximum = Math.max(...logs);
  if (maximum === -Infinity) return null;
  const weights = logs.map(value => Math.exp(value - maximum));
  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map(value => value / total);
}

export function mixtureExperiment(masses, alpha, merges) {
  const shares = samplingShares(masses, alpha);
  if (!Number.isInteger(merges) || merges < 0 || merges > 16) throw new RangeError("Use 0–16 merges");
  if (!shares) return null;
  const weighted = {};
  vocabularyLexicons.forEach((lexicon, index) => {
    if (!shares[index]) return;
    const count = Object.values(lexicon.words).reduce((a, b) => a + b, 0);
    Object.entries(lexicon.words).forEach(([word, weight]) => {
      weighted[word] = (weighted[word] || 0) + shares[index] * weight / count;
    });
  });
  const model = trainBpe(weighted, merges);
  const alphabet = new Set(Object.keys(weighted).flatMap(word => Array.from(word)));
  const rows = vocabularyLexicons.map((lexicon, index) => ({
    ...lexicon,
    share: shares[index],
    pieces: Object.keys(lexicon.words).map(word => ({
      word,
      tokens: Array.from(word).every(character => alphabet.has(character)) ? encodeBpe(word, model.merges) : null,
    })),
  }));
  return { shares, weighted, model, rows };
}

export function vocabularyBudget({ vocabulary, width, tied, baselineTokens, candidateTokens }) {
  if (![vocabulary, width, baselineTokens, candidateTokens].every(value => Number.isInteger(value) && value > 0)) {
    throw new RangeError("Dimensions and token counts must be positive integers");
  }
  const parametersPerTable = vocabulary * width;
  const parameters = parametersPerTable * (tied ? 1 : 2);
  return {
    parametersPerTable, parameters, mebibytes: parameters * 2 / 2 ** 20,
    headMacs: candidateTokens * width * vocabulary,
    baselineHeadMacs: baselineTokens * width * 32000,
    headRatio: candidateTokens * vocabulary / (baselineTokens * 32000),
    attentionPairRatio: (candidateTokens / baselineTokens) ** 2,
  };
}

export const multilingualResults = [
  { alpha: 1, vocabulary: 1600, counts: [1730, 2387, 1446] },
  { alpha: 0.5, vocabulary: 1600, counts: [1781, 2195, 1446] },
  { alpha: 1, vocabulary: 2400, counts: [1399, 1895, 1436] },
  { alpha: 0.5, vocabulary: 2400, counts: [1440, 1708, 1423] },
];
