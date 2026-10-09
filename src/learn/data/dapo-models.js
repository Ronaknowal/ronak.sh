// Finite explanatory DAPO calculations. Measured outcomes have a separate source.
export const sum = (values) => values.reduce((total, value) => total + value, 0);
export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export function groupStatistics(rewards, epsilon = 1e-6) {
  if (rewards.length < 2 || !rewards.every(Number.isFinite)) return null;
  const mean = sum(rewards) / rewards.length;
  const centered = rewards.map((reward) => reward - mean);
  const variance = sum(centered.map((value) => value * value)) / (rewards.length - 1);
  const sd = Math.sqrt(variance);
  return {
    mean,
    centered,
    variance,
    sd,
    advantages: centered.map((value) => value / (sd + epsilon)),
  };
}
export function clippedTerm(ratio, advantage, high = 0.28, low = 0.2, dual = null) {
  if (!(ratio > 0)) throw new Error('A selected-action ratio must be positive.');
  const clipped = clamp(ratio, 1 - low, 1 + high);
  const surrogate = Math.min(ratio * advantage, clipped * advantage);
  let loss = -surrogate;
  let derivative =
    (advantage > 0 && ratio < 1 + high) || (advantage < 0 && ratio > 1 - low)
      ? -ratio * advantage
      : 0;
  let kink = (advantage > 0 && ratio === 1 + high) || (advantage < 0 && ratio === 1 - low);
  if (dual !== null && advantage < 0) {
    if (loss > -dual * advantage) derivative = 0;
    if (ratio === dual) kink = true;
    loss = Math.min(loss, -dual * advantage);
  }
  return { ratio, clipped, surrogate: -loss, loss, derivative: kink ? null : derivative, kink };
}
export function softmax(logits) {
  const maximum = Math.max(...logits);
  const weights = logits.map((value) => Math.exp(value - maximum));
  const total = sum(weights);
  return weights.map((value) => value / total);
}
export const entropy = (probabilities) =>
  -sum(probabilities.map((p) => (p > 0 ? p * Math.log(p) : 0)));
export function probabilityStep(probabilities, selected, advantage, rate, high = 0.28, ratio = 1) {
  const term = clippedTerm(ratio, advantage, high);
  if (term.kink) return { probabilities, term, gradient: null, after: null };
  const gradient = probabilities.map(
    (p, index) => term.derivative * ((index === selected ? 1 : 0) - p),
  );
  const after = softmax(probabilities.map((p, index) => Math.log(p) - rate * gradient[index]));
  return { probabilities, term, gradient, after };
}
export const lengthPenalty = (length, cap, buffer) =>
  clamp((cap - buffer - length) / buffer, -1, 0);
export const mixedProbability = (p, group) => 1 - p ** group - (1 - p) ** group;
export function acceptedPopulation(weights, probabilities, group) {
  const masses = weights.map(
    (weight, index) => weight * mixedProbability(probabilities[index], group),
  );
  const total = sum(masses);
  return { masses, total, accepted: total > 0 ? masses.map((value) => value / total) : null };
}
export function binaryPaths(p, group) {
  return Array.from({ length: 2 ** group }, (_, number) => {
    const bits = Array.from({ length: group }, (_, index) => (number >> (group - 1 - index)) & 1);
    const successes = sum(bits);
    return {
      bits,
      probability: p ** successes * (1 - p) ** (group - successes),
      mixed: successes > 0 && successes < group,
    };
  });
}
export function raggedLoss(rows, reduction = 'token') {
  const lengths = rows.map((row) => row.filter((cell) => cell.selected).length);
  const sums = rows.map((row) =>
    sum(row.filter((cell) => cell.selected).map((cell) => cell.value)),
  );
  const count = sum(lengths);
  if (!count || (reduction === 'response' && lengths.some((n) => n === 0)))
    return { lengths, sums, count, loss: null };
  const loss =
    reduction === 'token'
      ? sum(sums) / count
      : sum(sums.map((value, index) => value / lengths[index])) / rows.length;
  return { lengths, sums, count, loss };
}
export const collectorPresets = {
  filled: [
    [
      ['P0', [1, 1, 1, 1]],
      ['P1', [0, 0, 0, 0]],
    ],
    [
      ['P2', [1, 0, 1, 0]],
      ['P3', [1, 1, 1, 1]],
    ],
    [
      ['P4', [0, 1, 0, 1]],
      ['P5', [1, 0, 0, 0]],
    ],
  ],
  exhausted: [
    [
      ['P0', [1, 1, 1, 1]],
      ['P1', [0, 0, 0, 0]],
    ],
    [
      ['P2', [1, 0, 1, 0]],
      ['P3', [1, 1, 1, 1]],
    ],
    [
      ['P4', [0, 0, 0, 0]],
      ['P5', [1, 1, 1, 1]],
    ],
  ],
  overflow: [
    [
      ['P0', [1, 0, 1, 0]],
      ['P1', [0, 1, 0, 1]],
    ],
    [
      ['P2', [1, 0, 0, 0]],
      ['P3', [0, 0, 1, 1]],
    ],
  ],
};
export function collectGroups(preset, batches, target = 2) {
  const selected = [];
  const decisions = [];
  const source = collectorPresets[preset];
  let generated = 0;
  for (const batch of source.slice(0, batches)) {
    if (selected.length >= target) break;
    for (const [id, correct] of batch) {
      generated += 1;
      const mixed = correct.some(Boolean) && !correct.every(Boolean);
      const keep = mixed && selected.length < target;
      if (keep) selected.push(id);
      decisions.push({
        id,
        correct,
        mixed,
        keep,
        reason: !mixed ? 'homogeneous' : keep ? 'accepted' : 'quota full',
      });
    }
  }
  return {
    decisions,
    selected,
    generated,
    status:
      selected.length === target ? 'filled' : batches >= source.length ? 'exhausted' : 'collecting',
  };
}
export const identityRecords = ['A', 'B', 'C', 'D'].map((id, index) => ({
  id,
  uid: `${id}:0`,
  prompt: [10, 20 + index, 11],
  completion: [40 + index, 0],
  old: [-0.4 - index * 0.1, -0.2],
  mask: [1, 1],
  reward: index % 2 ? 1 : -1,
}));
export function integerParser(text) {
  const marker = String.raw`\boxed{`;
  const start = text.lastIndexOf(marker);
  if (start < 0)
    return { start, end: -1, body: null, value: null, reason: 'No literal boxed marker' };
  const end = text.indexOf('}', start + marker.length);
  if (end < 0) return { start, end, body: null, value: null, reason: 'No following closing brace' };
  const body = text.slice(start + marker.length, end).trim();
  const accepted = /^[+-]?\d+$/.test(body);
  return {
    start,
    end,
    body,
    value: accepted ? Number(body) : null,
    reason: accepted ? 'Signed decimal integer accepted' : 'Body is not a signed decimal integer',
  };
}
export const parserFixtures = [
  ['integer', String.raw`Work gives \boxed{12}`],
  ['repeated', String.raw`\boxed{12} then \boxed{13}`],
  ['nested', String.raw`\boxed{\boxed{12}}`],
  ['whitespace', String.raw`\boxed{  +12 }`],
  ['expression', String.raw`\boxed{6+6}`],
  ['unfinished', String.raw`\boxed{12} then \boxed{`],
  ['wrong reasoning', String.raw`7+5 is a prime-number theorem, so \boxed{12}`],
];
export function workedTrace(firstReward = -1) {
  const rewards = [firstReward, 1];
  const stats = groupStatistics(rewards);
  const ratios = [
    [0.9, 1.1],
    [1, 1.3, 1.1],
  ];
  const rows = ratios.map((values, index) =>
    values.map((ratio) => {
      const term = clippedTerm(ratio, stats.advantages[index]);
      return {
        ...term,
        value: term.loss,
        selected: true,
        derivative: term.derivative === null ? null : term.derivative / 5,
      };
    }),
  );
  return { rewards, stats, ratios, rows, loss: raggedLoss(rows).loss };
}
export function budget(target, candidates, batches, group, cap) {
  return {
    bound: candidates * batches * group * cap,
    possible: target <= candidates * batches,
    minimumResponses: target * group,
    candidateGroups: candidates * batches,
  };
}
