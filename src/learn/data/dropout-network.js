// A 2-input, 2-hidden-unit ReLU network whose hidden layer reproduces §1's h = [1, 2].
// Dropout masks the hidden outputs; the first layer and output weights are fixed teaching values.
export const dropoutNetwork = {
  firstWeights: [[1, 0], [1, 1]],
  firstBias: [0, 0],
  outputWeights: [1, -0.5],
  outputBias: 0,
  target: 1,
};

// Multiplier applied to a hidden output: inverted dropout in training, identity in evaluation.
export function maskFactor(bit, probability, training) {
  if (!training || probability === 0) return 1;
  if (probability === 1) return 0;
  return bit / (1 - probability);
}

export function networkPass({ inputs, mask, probability, training, network = dropoutNetwork }) {
  const { firstWeights, firstBias, outputWeights, outputBias, target } = network;
  const scores = firstWeights.map((row, i) => row[0] * inputs[0] + row[1] * inputs[1] + firstBias[i]);
  const hidden = scores.map(score => Math.max(0, score));
  const factors = mask.map(bit => maskFactor(bit, probability, training));
  const passed = hidden.map((value, i) => value * factors[i]);
  const output = passed.reduce((sum, value, i) => sum + value * outputWeights[i], outputBias);
  const error = output - target;
  // Backward pass with the same mask: dL/dŷ = ŷ − y for L = ½(ŷ − y)².
  const outputWeightGradient = passed.map(value => error * value);
  const passedGradient = outputWeights.map(weight => error * weight);
  const hiddenGradient = passedGradient.map((value, i) => value * factors[i]);
  const scoreGradient = hiddenGradient.map((value, i) => scores[i] > 0 ? value : 0); // ReLU'(0) = 0
  const firstWeightGradient = scoreGradient.map(value => inputs.map(input => value * input));
  return {
    scores, hidden, factors, passed, output, error, loss: error ** 2 / 2,
    outputWeightGradient, passedGradient, hiddenGradient, scoreGradient, firstWeightGradient,
    firstBiasGradient: scoreGradient, outputBiasGradient: error,
  };
}

// Every thinned network for a two-bit hidden mask, with its probability.
export function thinnedNetworks({ inputs = [1, 1], probability = 0.5 } = {}) {
  const keep = 1 - probability;
  return [[0, 0], [0, 1], [1, 0], [1, 1]].map(mask => ({
    mask,
    probability: mask.reduce((product, bit) => product * (bit ? keep : probability), 1),
    ...networkPass({ inputs, mask, probability, training: true }),
  }));
}

export function categoricalEntropy(probabilities) {
  return -probabilities.reduce((sum, value) => sum + (value > 0 ? value * Math.log(value) : 0), 0);
}

// Mean prediction and entropy decomposition for a small set of sampled probability vectors.
export function passDisagreement(passes) {
  const mean = passes[0].map((_, k) => passes.reduce((sum, row) => sum + row[k], 0) / passes.length);
  const predictive = categoricalEntropy(mean);
  const meanEntropy = passes.reduce((sum, row) => sum + categoricalEntropy(row), 0) / passes.length;
  return { mean, predictive, meanEntropy, disagreement: predictive - meanEntropy };
}
