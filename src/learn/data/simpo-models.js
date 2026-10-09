/** Constructed finite mechanisms. Measured training remains in simpo-observations. */
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

export function pair(gap, beta = 2, gamma = 0.4) {
  if (![gap, beta, gamma].every(Number.isFinite) || beta <= 0 || gamma < 0) {
    throw new RangeError('Finite gap, positive beta and nonnegative gamma required');
  }
  const z = beta * gap - gamma;
  return {
    gap,
    beta,
    gamma,
    z,
    loss: softplus(-z),
    derivative: -beta * sigmoid(-z),
    threshold: gamma / beta,
  };
}

export function score(contributions) {
  if (!contributions.length || contributions.some((x) => !Number.isFinite(x) || x > 0)) {
    throw new RangeError('At least one finite nonpositive token log probability is required');
  }
  const total = sum(contributions);
  return { sum: total, count: contributions.length, mean: total / contributions.length };
}

export function probabilityTree() {
  return Object.entries({ A: [0.4, 1], B1: [0.3, 0.9, 1], B2: [0.3, 0.1, 1], C: [0.3, 1] }).map(
    ([name, transitions]) => {
      const result = score(transitions.map(Math.log));
      return {
        name,
        transitions,
        ...result,
        mass: Math.exp(result.sum),
        geometricMean: Math.exp(result.mean),
      };
    },
  );
}

export function sampleTree(seed, count = 40) {
  let state = seed >>> 0;
  const leaves = probabilityTree();
  const counts = Object.fromEntries(leaves.map((leaf) => [leaf.name, 0]));
  for (let i = 0; i < count; i += 1) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    let draw = state / 4294967296;
    const leaf =
      leaves.find((row) => {
        draw -= row.mass;
        return draw < 0;
      }) ?? leaves.at(-1);
    counts[leaf.name] += 1;
  }
  return counts;
}

export function drift(step = 0.1) {
  const derivative = -2 * sigmoid(0.4);
  const theta = -step * derivative;
  const before = [1 / 3, 1 / 3, 1 / 3];
  const after = softmax([theta, -theta, 10 * theta]);
  return {
    derivative,
    theta,
    before,
    after,
    gap: 2 * theta,
    kl: sum(after.map((p, i) => p * Math.log(p / before[i]))),
  };
}

export function repeated(gap, q, beta = 2, gamma = 0.5) {
  if (!(q >= 0 && q <= 1)) throw new RangeError('q must lie in [0,1]');
  pair(gap, beta, gamma);
  return {
    loss: q * softplus(gamma - beta * gap) + (1 - q) * softplus(gamma + beta * gap),
    derivative: beta * ((1 - q) * sigmoid(gamma + beta * gap) - q * sigmoid(gamma - beta * gap)),
    smoothedLoss: q * softplus(gamma - beta * gap) + (1 - q) * softplus(beta * gap - gamma),
  };
}

export function repeatedOptimum(q, beta = 2, gamma = 0.5) {
  repeated(0, q, beta, gamma);
  if (q === 0) return -Infinity;
  if (q === 1) return Infinity;
  let left = -1;
  let right = 1;
  while (repeated(left, q, beta, gamma).derivative > 0) left *= 2;
  while (repeated(right, q, beta, gamma).derivative < 0) right *= 2;
  for (let i = 0; i < 100; i += 1) {
    const middle = (left + right) / 2;
    if (repeated(middle, q, beta, gamma).derivative < 0) left = middle;
    else right = middle;
  }
  return (left + right) / 2;
}

export function gathered(fixture, batchIndex = 0) {
  const batch = fixture.batch;
  const ids = batch.input_ids[batchIndex];
  const attention = batch.attention_mask[batchIndex];
  const targets = batch.completion_mask[batchIndex];
  const rows = fixture.logits[batchIndex].slice(0, -1).map((logits, position) => {
    const probabilities = softmax(logits);
    const target = ids[position + 1];
    const selected = Boolean(attention[position + 1] && targets[position + 1]);
    return { position, target, probabilities, logp: Math.log(probabilities[target]), selected };
  });
  const scored = rows.filter((row) => row.selected).map((row) => row.logp);
  return { ids, attention, targets, rows, ...score(scored) };
}

export function cost(parameters, bytes, pairs, reference) {
  if (![parameters, bytes, pairs].every((x) => Number.isFinite(x) && x >= 0))
    throw new RangeError('Nonnegative sizes required');
  return {
    policyWeights: parameters * bytes,
    referenceWeights: reference === 'online' ? parameters * bytes : 0,
    referenceScores: reference === 'cached' ? pairs * 2 * 4 : 0,
  };
}
