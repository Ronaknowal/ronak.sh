import { normalizationStep } from './dropout-models.js';

// §5's batch: activations X = [1, 1, 3, 3] with dropout keep bits [0, 1, 0, 1] (q = 0.5),
// then BatchNorm with momentum 1, ε = 10⁻⁵ and no learned scale or shift.
export const modeBatch = { x: [1, 1, 3, 3], bits: [0, 1, 0, 1], keep: 0.5 };
const fresh = { runningMean: 0, runningVariance: 1, batches: 0 };

// The buffers BatchNorm holds after one training pass on the dropped batch.
export function storedAfterTraining() {
  const dropped = modeBatch.x.map((value, i) => value * modeBatch.bits[i] / modeBatch.keep);
  const step = normalizationStep({ values: dropped, ...fresh, batchTraining: true, recordGradients: true });
  return { runningMean: step.runningMean, runningVariance: step.runningVariance, batches: step.batches };
}

// Four ways the same batch can pass through dropout → BatchNorm.
export const modeCases = {
  train: { dropout: true, batchNorm: 'train', gradients: true, label: 'Training pass' },
  noGrad: { dropout: true, batchNorm: 'train', gradients: false, label: 'Training mode inside no_grad' },
  eval: { dropout: false, batchNorm: 'eval', gradients: false, label: 'Evaluation pass' },
  mc: { dropout: true, batchNorm: 'eval', gradients: false, label: 'MC dropout' },
};

export function modePass(name) {
  const c = modeCases[name];
  // Training-mode passes start from fresh buffers; evaluation-mode passes read the trained buffers.
  const before = c.batchNorm === 'train' ? fresh : storedAfterTraining();
  const reaching = modeBatch.x.map((value, i) => c.dropout ? value * modeBatch.bits[i] / modeBatch.keep : value);
  const mean = reaching.reduce((sum, value) => sum + value, 0) / reaching.length;
  const variance = reaching.reduce((sum, value) => sum + (value - mean) ** 2, 0) / reaching.length;
  const step = normalizationStep({ values: reaching, ...before, batchTraining: c.batchNorm === 'train', recordGradients: c.gradients });
  return {
    ...c, reaching, batchMean: mean, batchVariance: variance, before,
    after: { runningMean: step.runningMean, runningVariance: step.runningVariance, batches: step.batches },
    written: step.batches !== before.batches, output: step.output,
  };
}

// §4 branch lab: the sentence under the drawing for each gate position and bit.
export function branchSentence(placement, bit) {
  if (placement === 'branch') return bit ? 'The kept correction is doubled and added to x; the skip is untouched.' : 'The correction is dropped and the skip still delivers x unchanged.';
  return bit ? 'The whole sum, skip included, is doubled.' : 'Masking after the addition removes the skip as well: nothing reaches the output.';
}
