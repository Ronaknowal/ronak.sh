// Section 2's freeze-switches lab: one BatchNorm channel of a frozen backbone. The backbone
// runs in evaluation mode, as the lesson's policy prescribes, so it normalizes with its stored
// buffers and those buffers are constants. The loss is the mean squared difference from a target.
// (In training mode a batch of two always normalizes to ±1 whatever its values, so its input
// gradient would be zero; evaluation mode shows the gradient that a frozen layer passes back.)
export const freezeFixture = { input: [1, 3], mean: 0, variance: 1, target: [0, 2], rate: 0.1 };

export function freezeSwitchesStep({ gamma, beta }, { trainable, optimizer }, fixture = freezeFixture) {
  const { input, mean, variance, target, rate } = fixture;
  const inverseStd = 1 / Math.sqrt(variance + 1e-5);
  const normalized = input.map(value => (value - mean) * inverseStd);
  const output = normalized.map(value => gamma * value + beta);
  // L = (1/2) Σ (o − t)², so ∂L/∂o = o − t.
  const delta = output.map((value, i) => value - target[i]);
  const loss = delta.reduce((sum, value) => sum + value * value, 0) / delta.length;
  const gradGamma = delta.reduce((sum, value, i) => sum + value * normalized[i], 0);
  const gradBeta = delta.reduce((sum, value) => sum + value, 0);
  // Evaluation mode: the mean and variance are stored constants, so ∂o/∂x = γ / √(v + ε).
  const inputGradient = delta.map(value => gamma * inverseStd * value);
  const steps = trainable && optimizer;
  return {
    normalized, output, loss, inputGradient,
    gradGamma: trainable ? gradGamma : null,
    gradBeta: trainable ? gradBeta : null,
    nextGamma: steps ? gamma - rate * gradGamma : gamma,
    nextBeta: steps ? beta - rate * gradBeta : beta,
  };
}
