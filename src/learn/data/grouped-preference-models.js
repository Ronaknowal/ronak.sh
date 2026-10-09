export const answerNames = ['A', 'B', 'C'];
export const methods = [
  ['reinforce', 'Raw REINFORCE'],
  ['constant', 'Constant baseline'],
  ['self_mean', 'Self mean'],
  ['corrected', 'Corrected self mean'],
  ['loo', 'Leave one out'],
  ['standardized', 'Sample standardized'],
];

export const sum = (values) => values.reduce((total, value) => total + value, 0);
export const mean = (values) => sum(values) / values.length;
export const sigmoid = (value) =>
  value >= 0 ? 1 / (1 + Math.exp(-value)) : Math.exp(value) / (1 + Math.exp(value));
export function softmax(logits) {
  const maximum = Math.max(...logits);
  const weights = logits.map((value) => Math.exp(value - maximum));
  return weights.map((value) => value / sum(weights));
}
export function target(probabilities, rewards) {
  const reward = sum(probabilities.map((probability, index) => probability * rewards[index]));
  return {
    reward,
    gradient: probabilities.map((probability, index) => probability * (rewards[index] - reward)),
  };
}
export function advantages(rewards, method, baseline = 0.5) {
  if (method === 'own') return rewards.map(() => 0);
  if (method === 'reinforce') return [...rewards];
  if (method === 'constant') return rewards.map((reward) => reward - baseline);
  if (rewards.length < 2) return null;
  const center = mean(rewards);
  const deviations = rewards.map((reward) => reward - center);
  if (method === 'self_mean') return deviations;
  if (method === 'loo')
    return rewards.map((reward) => reward - (sum(rewards) - reward) / (rewards.length - 1));
  if (method === 'corrected')
    return deviations.map((value) => (value * rewards.length) / (rewards.length - 1));
  const deviation = Math.sqrt(sum(deviations.map((value) => value ** 2)) / (rewards.length - 1));
  return deviations.map((value) => value / (deviation + 1e-4));
}
export function distribution(probabilities, rewards, groupSize, method, baseline = 0.5) {
  const exact = target(probabilities, rewards);
  const groups = [];
  const visit = (actions, probability) => {
    if (actions.length === groupSize) {
      const values = advantages(
        actions.map((action) => rewards[action]),
        method,
        baseline,
      );
      const gradient = probabilities.map(
        (p, coordinate) =>
          sum(
            actions.map((action, index) => values[index] * ((action === coordinate ? 1 : 0) - p)),
          ) / groupSize,
      );
      groups.push({ actions, probability, gradient });
      return;
    }
    probabilities.forEach((p, action) => {
      if (p > 0) visit([...actions, action], probability * p);
    });
  };
  visit([], 1);
  const average = probabilities.map((_, coordinate) =>
    sum(groups.map((group) => group.probability * group.gradient[coordinate])),
  );
  const bias = average.map((value, index) => value - exact.gradient[index]);
  const variance = sum(
    groups.map(
      (group) =>
        group.probability *
        sum(group.gradient.map((value, index) => (value - average[index]) ** 2)),
    ),
  );
  const biasSquared = sum(bias.map((value) => value ** 2));
  return {
    groups,
    mean_gradient: average,
    target_gradient: exact.gradient,
    expected_reward: exact.reward,
    bias,
    covariance_trace: variance,
    bias_squared: biasSquared,
    mse: variance + biasSquared,
  };
}
export function aggregateCloud(groups) {
  const points = new Map();
  for (const group of groups) {
    const key = group.gradient.map((value) => value.toFixed(10)).join(',');
    const existing = points.get(key);
    if (existing) {
      existing.probability += group.probability;
      existing.count += 1;
    } else points.set(key, { gradient: group.gradient, probability: group.probability, count: 1 });
  }
  return [...points.values()];
}
export function standardize(rewards, sample = true) {
  const valid = rewards.filter((value) => value !== null);
  const center = valid.length ? mean(valid) : null;
  const deviations = rewards.map((value) => (value === null ? null : value - center));
  const denominator = valid.length - (sample ? 1 : 0);
  const variance =
    denominator > 0 ? sum(valid.map((value) => (value - center) ** 2)) / denominator : null;
  const std = variance === null ? null : Math.sqrt(variance);
  return {
    count: valid.length,
    center,
    deviations,
    variance,
    std,
    values: deviations.map((value) =>
      value === null || std === null ? null : value / (std + 1e-4),
    ),
  };
}
export function clipped(ratio, advantage, epsilon) {
  const bounded = Math.max(1 - epsilon, Math.min(1 + epsilon, ratio));
  const active = advantage > 0 ? ratio < 1 + epsilon : advantage < 0 && ratio > 1 - epsilon;
  return {
    raw: ratio * advantage,
    bounded: bounded * advantage,
    surrogate: Math.min(ratio * advantage, bounded * advantage),
    derivative: active ? advantage : 0,
  };
}
export function reductions(rows, cap = 4) {
  const count = sum(rows.map((row) => row.length));
  const total = sum(rows.flat());
  return [
    {
      name: 'Response mean',
      value: mean(rows.map(mean)),
      weights: rows.map((row) => row.map(() => 1 / (rows.length * row.length))),
    },
    {
      name: 'Pooled token mean',
      value: total / count,
      weights: rows.map((row) => row.map(() => 1 / count)),
    },
    {
      name: `Fixed cap ${cap}`,
      value: total / (rows.length * cap),
      weights: rows.map((row) => row.map(() => 1 / (rows.length * cap))),
    },
  ];
}
export function sampledKL(current, reference, weights = current) {
  const logRatio = current.map((value, index) => Math.log(value / reference[index]));
  const k3 = current.map((value, index) => reference[index] / value + logRatio[index] - 1);
  return {
    logRatio,
    k3,
    exact: sum(current.map((value, index) => value * logRatio[index])),
    sampled: sum(weights.map((value, index) => value * k3[index])),
  };
}
export function penaltyDerivative(current, old, reference, weighted = false) {
  const v = Math.exp(reference - current);
  const k3 = v - (reference - current) - 1;
  const ratio = Math.exp(current - old);
  return {
    k3,
    ratio,
    value: weighted ? ratio * k3 : k3,
    derivative: weighted ? ratio * (k3 + 1 - v) : 1 - v,
  };
}
export function utility(distance, reference = 0.2, beta = 0.5, desirable = 1, undesirable = 1) {
  const u = beta * (distance - reference);
  const probability = sigmoid(u);
  const slope = beta * probability * (1 - probability);
  return {
    u,
    desirable: desirable * sigmoid(-u),
    undesirable: undesirable * probability,
    desirableGradient: -desirable * slope,
    undesirableGradient: undesirable * slope,
  };
}
