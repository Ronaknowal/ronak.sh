import { attentionSoftmax } from './recurrent-attention-models.js';

// Expected monotonic choice: each previous chosen position starts a scan at itself.
// Missing mass chose no position previously and cannot reenter a later scan.
export function monotonicExpectation(probabilities, previous = probabilities.map((_, index) => index === 0 ? 1 : 0)) {
  if (probabilities.length !== previous.length || probabilities.some(value => !Number.isFinite(value) || value < 0 || value > 1)
    || previous.some(value => !Number.isFinite(value) || value < 0) || previous.reduce((a, b) => a + b, 0) > 1 + 1e-12) {
    throw new Error('Use aligned choose probabilities and a nonnegative previous mass of at most one.');
  }
  let reach = 0;
  const chosen = probabilities.map((probability, index) => {
    reach = (index === 0 ? 0 : (1 - probabilities[index - 1]) * reach) + previous[index];
    return probability * reach;
  });
  return { chosen, unselected: 1 - chosen.reduce((a, b) => a + b, 0) };
}

export function temperatureRead(temperature) {
  if (!Number.isFinite(temperature) || temperature <= 0) throw new Error('Use a positive temperature.');
  const scores = [0, Math.log(3)];
  const weights = attentionSoftmax(scores.map(score => score / temperature));
  return { scores, weights, context: 2 * weights[0] + 10 * weights[1] };
}
