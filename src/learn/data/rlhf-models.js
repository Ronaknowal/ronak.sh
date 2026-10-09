// Constructed teaching mechanisms. Measured study values have a separate owner.
export const responses = [
  { id: 'A', text: 'Paris', colour: 'amber' },
  { id: 'B', text: 'Paris is the capital of France.', colour: 'blue' },
  { id: 'C', text: "Rome is France's capital, certainly.", colour: 'violet' },
];
export const sum = (values) => values.reduce((total, value) => total + value, 0);
export function sigmoid(value) {
  return value >= 0 ? 1 / (1 + Math.exp(-value)) : Math.exp(value) / (1 + Math.exp(value));
}
export function softplus(value) {
  return Math.max(value, 0) + Math.log1p(Math.exp(-Math.abs(value)));
}
export function softmax(logits) {
  const maximum = Math.max(...logits);
  const mass = logits.map((value) => Math.exp(value - maximum));
  const total = sum(mass);
  return mass.map((value) => value / total);
}
export function head(w = [0.4, -0.2], target = 1, offset = 0, scale = 1, identical = false) {
  const features = [[1, 0], identical ? [1, 0] : [0, 1]];
  const scores = features.map((row) => scale * sum(row.map((value, i) => value * w[i])) + offset);
  const gap = scores[0] - scores[1];
  const probability = sigmoid(gap);
  const derivative = probability - target;
  const gradient = w.map((_, i) => derivative * scale * (features[0][i] - features[1][i]));
  return {
    features,
    w,
    scores,
    gap,
    probability,
    derivative,
    gradient,
    nextWeights: w.map((value, i) => value - 0.1 * gradient[i]),
    loss: softplus(gap) - target * gap,
  };
}
export function referenceTerms(
  policy = [0.6, 0.3, 0.1],
  reference = [0.4, 0.4, 0.2],
  rewards = [1, 0.4, -0.2],
  beta = 0.5,
) {
  if (policy.some((value) => value < 0) || Math.abs(sum(policy) - 1) > 1e-9)
    return { valid: false, reason: 'Current probabilities must be nonnegative and sum to one.' };
  if (reference.some((value) => value < 0) || Math.abs(sum(reference) - 1) > 1e-9)
    return { valid: false, reason: 'Reference probabilities must form a distribution.' };
  const unsupported = policy.some((value, i) => value > 0 && reference[i] === 0);
  const ratios = policy.map((value, i) => (value === 0 ? null : Math.log(value / reference[i])));
  const contributions = policy.map((value, i) => (value === 0 ? 0 : value * ratios[i]));
  const rewardParts = policy.map((value, i) => value * rewards[i]);
  const kl = unsupported ? Infinity : sum(contributions);
  return {
    valid: !unsupported,
    reason: unsupported
      ? 'Positive current mass on zero reference support gives infinite KL.'
      : null,
    policy,
    reference,
    rewards,
    ratios,
    contributions,
    rewardParts,
    kl,
    reward: sum(rewardParts),
    penalty: beta * kl,
    objective: sum(rewardParts) - beta * kl,
  };
}
export function tilted(reference, rewards, beta) {
  if (!(beta > 0) || reference.some((value) => value < 0) || Math.abs(sum(reference) - 1) > 1e-9)
    throw new Error('Use positive beta and a valid reference distribution.');
  const maximum = Math.max(...rewards.filter((_, i) => reference[i] > 0));
  const factors = rewards.map((value) => Math.exp((value - maximum) / beta));
  const masses = reference.map((value, i) => (value === 0 ? 0 : value * factors[i]));
  const normalizer = sum(masses);
  return {
    factors,
    masses,
    normalizer,
    policy: masses.map((value) => value / normalizer),
    shift: maximum,
  };
}
export function estimator(p = 0.25, baseline = 0, actionDependent = false) {
  const probabilities = [p, 1 - p];
  const rewards = [2, 0];
  const scores = [
    [1 - p, -(1 - p)],
    [-p, p],
  ];
  const estimates = scores.map((row, i) =>
    row.map((value) => value * (rewards[i] - (actionDependent ? rewards[i] : baseline))),
  );
  const mean = [0, 1].map((j) => sum(estimates.map((row, i) => row[j] * probabilities[i])));
  const variance = [0, 1].map((j) =>
    sum(estimates.map((row, i) => probabilities[i] * (row[j] - mean[j]) ** 2)),
  );
  return {
    probabilities,
    rewards,
    scores,
    estimates,
    mean,
    variance,
    exact: [2 * p * (1 - p), -2 * p * (1 - p)],
  };
}
export function path(temperature = 1) {
  const first = softmax([Math.log(0.6) / temperature, Math.log(0.4) / temperature]);
  const afterParis = softmax([Math.log(0.8) / temperature, Math.log(0.2) / temperature]);
  return {
    first,
    afterParis,
    probability: first[0] * afterParis[0],
    logProbability: Math.log(first[0]) + Math.log(afterParis[0]),
  };
}
export function tokenMask(promptCount = 2, actionCount = 2, samePad = false) {
  const prompt = ['BOS', ...Array.from({ length: promptCount - 1 }, (_, i) => `Q${i + 1}`)];
  const action =
    actionCount === 0
      ? []
      : [...Array.from({ length: actionCount - 1 }, (_, i) => (i === 0 ? 'Paris' : 'next')), 'EOS'];
  const tokens = [...prompt, ...action, samePad ? 'EOS' : 'PAD', samePad ? 'EOS' : 'PAD'];
  return {
    tokens,
    roles: tokens.map((_, i) =>
      i < promptCount ? 'prompt' : i < promptCount + actionCount ? 'action' : 'padding',
    ),
    attention: tokens.map((_, i) => Number(i < promptCount + actionCount)),
    target: tokens.map((_, i) => Number(i >= promptCount && i < promptCount + actionCount)),
    predictor: tokens.map((_, i) =>
      Number(i >= promptCount - 1 && i < promptCount + actionCount - 1),
    ),
    actionCount,
  };
}
export function shaped(beta = 0.1, equal = false) {
  const actions = ['Paris', '.', 'EOS'];
  const old = [-0.5, -0.8, -0.3];
  const reference = equal ? old.slice() : [-0.7, -0.6, -0.8];
  const logRatio = old.map((value, i) => value - reference[i]);
  const penalties = logRatio.map((value) => -beta * value);
  const terminal = [0, 0, 1.3];
  return {
    actions,
    old,
    reference,
    logRatio,
    penalties,
    terminal,
    rewards: penalties.map((value, i) => value + terminal[i]),
    values: [0.4, 0.5, 0.6],
  };
}
export function gae(
  rewards = [-0.1, -0.2, 1.3],
  values = [0.4, 0.5, 0.6],
  lambda = 0.8,
  gamma = 1,
  bootstrap = 0,
) {
  const residuals = rewards.map(
    (value, i) => value + gamma * (values[i + 1] ?? bootstrap) - values[i],
  );
  const advantages = Array(rewards.length).fill(0);
  let carry = 0;
  for (let i = rewards.length - 1; i >= 0; i--) {
    carry = residuals[i] + gamma * lambda * carry;
    advantages[i] = carry;
  }
  return {
    rewards,
    values,
    residuals,
    advantages,
    targets: advantages.map((value, i) => value + values[i]),
    lambda,
    gamma,
    bootstrap,
  };
}
export function normalization(filler = 100, constant = false, empty = false) {
  const mask = empty
    ? [
        [0, 0, 0],
        [0, 0, 0],
      ]
    : [
        [1, 1, 1],
        [1, 0, 0],
      ];
  const values = constant
    ? [
        [2, 2, 2],
        [2, filler, filler],
      ]
    : [
        [0.368, 0.46, 0.7],
        [-0.2, filler, filler],
      ];
  const selected = values.flatMap((row, i) => row.filter((_, j) => mask[i][j]));
  const mean = selected.length ? sum(selected) / selected.length : null;
  const variance = selected.length
    ? sum(selected.map((value) => (value - mean) ** 2)) / selected.length
    : null;
  const normalized = values.map((row, i) =>
    row.map((value, j) => (mask[i][j] ? (value - mean) / Math.sqrt(variance + 1e-8) : 0)),
  );
  return { mask, values, selected, mean, variance, normalized };
}
export function clip(ratio, advantage, epsilon = 0.2) {
  const clippedRatio = Math.max(1 - epsilon, Math.min(1 + epsilon, ratio));
  const raw = ratio * advantage;
  const capped = clippedRatio * advantage;
  const plateau = advantage > 0 ? ratio > 1 + epsilon : advantage < 0 ? ratio < 1 - epsilon : true;
  const atKink =
    advantage !== 0 && Math.abs(ratio - (advantage > 0 ? 1 + epsilon : 1 - epsilon)) < 1e-10;
  return {
    raw,
    capped,
    clippedRatio,
    surrogate: Math.min(raw, capped),
    slope: atKink ? null : plateau ? 0 : advantage,
    plateau,
    atKink,
  };
}
export function sharedParameter(rate = 0.2) {
  const theta = 0.7;
  const probabilities = [sigmoid(theta), sigmoid(-0.1 * theta - Math.log(4))];
  const old = [0.5, 0.2];
  const gradient = (0.1 * probabilities[1] * (1 - probabilities[1])) / old[1];
  const next = theta + rate * gradient;
  const after = [sigmoid(next), sigmoid(-0.1 * next - Math.log(4))];
  return {
    theta,
    next,
    probabilities,
    after,
    old,
    gradient,
    firstGradient: 0,
    ratios: probabilities.map((value, i) => value / old[i]),
    afterRatios: after.map((value, i) => value / old[i]),
  };
}
export function splitFamilies(seed = 31, leak = false) {
  const families = Array.from({ length: 8 }, (_, i) => ({
    id: `Q${i + 1}`,
    rows: [`${i + 1}a`, `${i + 1}b`],
  }));
  const train = [],
    heldout = [];
  for (const [i, family] of families.entries()) {
    if (leak) {
      train.push({ ...family, rows: [family.rows[0]] });
      heldout.push({ ...family, rows: [family.rows[1]] });
    } else {
      ((Math.imul(i + 11, 2654435761) ^ seed) >>> 0) % 3 === 0
        ? heldout.push(family)
        : train.push(family);
    }
  }
  return {
    train,
    heldout,
    overlap: train.filter((family) => heldout.some((row) => row.id === family.id)).length,
  };
}
export function calibration(predictions, binCount = 5) {
  const observations = predictions.flatMap((row) => [
    { p: row.probability, label: 1 },
    { p: 1 - row.probability, label: 0 },
  ]);
  return Array.from({ length: binCount }, (_, i) => {
    const rows = observations.filter(
      (row) => Math.min(binCount - 1, Math.floor(row.p * binCount)) === i,
    );
    return {
      low: i / binCount,
      high: (i + 1) / binCount,
      count: rows.length,
      confidence: rows.length ? sum(rows.map((row) => row.p)) / rows.length : null,
      frequency: rows.length ? sum(rows.map((row) => row.label)) / rows.length : null,
    };
  });
}
export function work(batch = 16, tokens = 6, epochs = 4) {
  return {
    collection: batch * tokens,
    reference: batch * tokens,
    rewardSequences: batch,
    actorValueUpdate: epochs * batch * tokens,
    batch,
    tokens,
    epochs,
  };
}
export function timeline(step) {
  const round = Math.floor(step / 5);
  const inner = step % 5;
  const theta = round * 0.4 + inner * 0.1;
  const oldTheta = round * 0.4;
  const probability = sigmoid(theta);
  const oldProbability = sigmoid(oldTheta);
  return {
    round,
    inner,
    theta,
    oldTheta,
    probability,
    oldProbability,
    currentLogp: Math.log(probability),
    oldLogp: Math.log(oldProbability),
    referenceLogp: Math.log(0.5),
    ratio: probability / oldProbability,
  };
}
