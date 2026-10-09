/** Exact finite calculations used by the DPO lesson, separate from recorded fits. */
export const sum = (values) => values.reduce((total, value) => total + value, 0);

export function softplus(value) {
  return Math.max(value, 0) + Math.log1p(Math.exp(-Math.abs(value)));
}

export function sigmoid(value) {
  return value >= 0 ? 1 / (1 + Math.exp(-value)) : Math.exp(value) / (1 + Math.exp(value));
}

export function softmax(values) {
  const maximum = Math.max(...values);
  const weights = values.map((value) => Math.exp(value - maximum));
  const total = sum(weights);
  return weights.map((value) => value / total);
}

export function pair(policy, reference, beta = 0.4) {
  if (!(beta > 0) || [...policy, ...reference].some((x) => !Number.isFinite(x))) {
    throw new RangeError('Finite scores and positive beta are required');
  }
  const gains = policy.map((score, index) => score - reference[index]);
  const margin = gains[0] - gains[1];
  const logit = beta * margin;
  return {
    gains,
    margin,
    logit,
    probability: sigmoid(logit),
    loss: softplus(-logit),
    weight: beta * sigmoid(-logit),
    massesValid: [policy, reference].every((scores) => sum(scores.map(Math.exp)) <= 1 + 1e-12),
  };
}

export function tilt(reference, rewards, beta) {
  if (!(beta > 0) || reference.some((p) => p < 0) || Math.abs(sum(reference) - 1) > 1e-9) {
    throw new RangeError('A normalized reference and positive beta are required');
  }
  const logits = reference.map((p, i) => (p > 0 ? Math.log(p) + rewards[i] / beta : -Infinity));
  const maximum = Math.max(...logits);
  const scaled = logits.map((value) => Math.exp(value - maximum));
  const logZ = maximum + Math.log(sum(scaled));
  return { probabilities: softmax(logits), logZ, weights: logits.map(Math.exp) };
}

export function kl(policy, reference) {
  return sum(
    policy.map((p, i) =>
      p === 0 ? 0 : reference[i] === 0 ? Infinity : p * Math.log(p / reference[i]),
    ),
  );
}

export function objective(policy, reference, rewards, beta) {
  const reward = sum(policy.map((p, i) => p * rewards[i]));
  const penalty = beta * kl(policy, reference);
  return { reward, penalty, objective: reward - penalty };
}

export function displacement(theta = 0, rate = 0.1, third = 10, beta = 1) {
  const margin = 2 * theta;
  const derivative = -2 * beta * sigmoid(-beta * margin);
  const next = theta - rate * derivative;
  const distribution = (value) => softmax([value, -value, third * value]);
  return {
    theta,
    next,
    derivative,
    before: distribution(theta),
    after: distribution(next),
    beforeMargin: margin,
    afterMargin: 2 * next,
  };
}

export function repeated(a, b, z) {
  if (a < 0 || b < 0 || a + b === 0) return null;
  const q = a / (a + b);
  return {
    q,
    loss: q * softplus(-z) + (1 - q) * softplus(z),
    derivative: sigmoid(z) - q,
    optimum: b === 0 ? Infinity : a === 0 ? -Infinity : Math.log(a / b),
  };
}

export function tokenFixture() {
  const vocabulary = ['Q', 'Paris', 'EOS', 'other'];
  const tokens = ['BOS', 'Q', 'Paris', 'EOS', 'PAD'];
  const logits = [
    [1.2, -0.3, -0.6, 0.1],
    [-0.2, 1.5, -0.8, 0.3],
    [-0.3, 0.2, 1.4, -0.5],
    [0, 0, 0, 0],
  ];
  const targets = [0, 1, 2, null];
  const selected = [false, true, true, false];
  const probabilities = logits.map(softmax);
  const contributions = targets.map((target, row) =>
    target === null ? 0 : Math.log(probabilities[row][target]),
  );
  return {
    vocabulary,
    tokens,
    logits,
    targets,
    selected,
    probabilities,
    contributions,
    responseSum: sum(contributions.filter((_, row) => selected[row])),
  };
}

export function reduction(gainA, gainB, lengthA, lengthB) {
  return { summed: gainA - gainB, mean: gainA / lengthA - gainB / lengthB };
}

export function ranking(rewards) {
  const first = softmax(rewards);
  const second = softmax(rewards.slice(1));
  return { first, second, probability: first[0] * second[0] };
}
