/** Exact finite mechanisms for the reasoning lesson; no neural fitting in the browser. */
export const sums = [4, 5, 6];
export const answers = [12, 15, 18];
export const initial = [
  [0.2, 0.5, 0.3],
  [0.7, 0.2, 0.1],
  [0.1, 0.8, 0.1],
  [0.2, 0.3, 0.5],
];
export const total = (values) => values.reduce((sum, value) => sum + value, 0);

export function softmax(logits) {
  const peak = Math.max(...logits);
  const weights = logits.map((value) => Math.exp(value - peak));
  const denominator = total(weights);
  return weights.map((value) => value / denominator);
}

export function tree(offset = 0, strict = false, root = initial[0]) {
  const logits = [root, ...initial.slice(1)].map((row) => row.map(Math.log));
  logits[0][1] += offset;
  return treeFromLogits(logits, strict);
}

export function treeFromLogits(logits, strict = false) {
  const probabilities = logits.map(softmax);
  const paths = sums.flatMap((sum, i) =>
    answers.map((answer, j) => ({
      sum,
      answer,
      i,
      j,
      probability: probabilities[0][i] * probabilities[i + 1][j],
      reward: Number(answer === 15 && (!strict || sum === 5)),
    })),
  );
  const value = total(paths.map((path) => path.probability * path.reward));
  const childValues = sums.map((_, i) =>
    total(paths.filter((p) => p.i === i).map((p) => probabilities[i + 1][p.j] * p.reward)),
  );
  const gradient = [
    probabilities[0].map((p, i) => p * (childValues[i] - value)),
    ...sums.map((_, i) =>
      probabilities[i + 1].map(
        (p, j) =>
          probabilities[0][i] *
          p *
          (Number(answers[j] === 15 && (!strict || sums[i] === 5)) - childValues[i]),
      ),
    ),
  ];
  return { logits, probabilities, paths, value, gradient };
}

export function trajectoryScore(state, pathIndex, baseline = 0) {
  const path = state.paths[pathIndex];
  const score = state.probabilities.map((row) => row.map(() => 0));
  for (const [node, selected] of [
    [0, path.i],
    [path.i + 1, path.j],
  ]) {
    score[node] = state.probabilities[node].map((p, k) => Number(k === selected) - p);
  }
  return {
    path,
    score,
    weighted: score.map((row) => row.map((v) => v * (path.reward - baseline))),
  };
}

export function gradientStep(rate, strict = false) {
  const before = tree(0, strict);
  const after = treeFromLogits(
    before.logits.map((row, i) => row.map((z, j) => z + rate * before.gradient[i][j])),
    strict,
  );
  return { before, after };
}

export function checkTrace(a, b, c, text, terminated = true) {
  const trace = text.match(/^\s*sum\s*=\s*(-?\d+)\s*;\s*answer\s*=\s*(-?\d+)\s*$/);
  const direct = text.match(/^\s*answer\s*=\s*(-?\d+)\s*$/);
  const answer = trace ? Number(trace[2]) : direct ? Number(direct[1]) : null;
  const intermediate = trace ? Number(trace[1]) : null;
  const final = answer !== null && answer === (a + b) * c;
  const sumCorrect = intermediate === null ? null : intermediate === a + b;
  const product = intermediate === null ? null : answer === intermediate * c;
  return {
    format: Boolean(trace || direct),
    answer,
    intermediate,
    final,
    sumCorrect,
    product,
    derivation: Boolean(trace && sumCorrect && product),
    terminated,
    reward: Number(final && terminated),
  };
}

export function group(rewards) {
  const mean = total(rewards) / rewards.length;
  const standardDeviation = Math.sqrt(
    total(rewards.map((r) => (r - mean) ** 2)) / (rewards.length - 1),
  );
  return {
    mean,
    standardDeviation,
    advantages: rewards.map((r) => (r - mean) / (standardDeviation + 0.0001)),
    loo: rewards.map((r) => r - (total(rewards) - r) / (rewards.length - 1)),
  };
}

export function clipped(ratio, advantage, epsilon = 0.2) {
  const bounded = Math.max(1 - epsilon, Math.min(1 + epsilon, ratio));
  return {
    raw: ratio * advantage,
    bounded: bounded * advantage,
    objective: Math.min(ratio * advantage, bounded * advantage),
  };
}

export function nucleus(probabilities, temperature, topP) {
  const original = softmax(probabilities.map((p) => Math.log(p) / temperature));
  const order = original.map((_, i) => i).sort((a, b) => original[b] - original[a] || a - b);
  const kept = [];
  let mass = 0;
  for (const index of order) {
    kept.push(index);
    mass += original[index];
    if (mass >= topP) break;
  }
  return {
    original,
    kept,
    mass,
    sampled: original.map((p, i) => (kept.includes(i) ? p / mass : 0)),
  };
}

export function sampledTree(temperature = 1, topP = 1, difficult = false) {
  const source = [difficult ? [0.7, 0.2, 0.1] : initial[0], ...initial.slice(1)];
  const nodes = source.map((p) => nucleus(p, temperature, topP));
  const paths = sums.flatMap((sum, i) =>
    answers.map((answer, j) => ({
      sum,
      answer,
      i,
      j,
      probability: nodes[0].sampled[i] * nodes[i + 1].sampled[j],
    })),
  );
  return {
    nodes,
    paths,
    success: total(paths.filter((p) => p.answer === 15).map((p) => p.probability)),
  };
}

export function groupEvents(p, count) {
  const failed = (1 - p) ** count;
  const successful = p ** count;
  return { failed, mixed: Math.max(0, 1 - failed - successful), successful };
}

export const noSuccessUpper = (count) => -Math.expm1(Math.log(0.05) / count);

export function emitted(ids, cap = ids.length, eos = 98) {
  const tokens = ids.slice(0, cap);
  const first = tokens.indexOf(eos);
  const terminated = first >= 0;
  const mask = tokens.map((_, i) => first < 0 || i <= first);
  return { tokens, mask, terminated, count: total(mask.map(Number)) };
}

export function reductions(length = 4, value = 3) {
  return {
    sequence: (2 + length * value) / 2,
    response: (1 + value) / 2,
    pooled: (2 + length * value) / (2 + length),
  };
}

export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= Math.min(k, n - k); i += 1) result = (result * (n - i + 1)) / i;
  return Math.round(result);
}

export function passAtK(n, successes, k) {
  if (successes === 0) return 0;
  if (n - successes < k) return 1;
  let logFailure = 0;
  for (let i = 0; i < k; i += 1) logFailure += Math.log1p(-successes / (n - i));
  return -Math.expm1(logFailure);
}

export function majority(values) {
  const counts = new Map();
  for (const value of values) if (value !== null) counts.set(value, (counts.get(value) || 0) + 1);
  let selected = null;
  let maximum = 0;
  for (const [value, count] of counts)
    if (count > maximum) {
      selected = value;
      maximum = count;
    }
  return selected;
}

export function budgetPrefix(attempts, budget) {
  const completed = [];
  let used = 0;
  for (const attempt of attempts) {
    if (used + attempt.tokens > budget)
      return { completed, used: budget, partial: budget - used, unfinished: true };
    completed.push(attempt);
    used += attempt.tokens;
    if (used === budget) break;
  }
  return { completed, used, partial: 0, unfinished: false };
}

export const successCurve = (p, count) => (p === 1 ? 1 : -Math.expm1(count * Math.log1p(-p)));
export const crossing = (count, second = 0.01) => ({
  base: successCurve(0.2, count),
  changed: (successCurve(0.8, count) + successCurve(second, count)) / 2,
});

export function reportedSchedule(step) {
  return { cap: step < 8200 ? 32768 : 65536, reference: Math.floor(step / 400) * 400 };
}

export function observedSets(base, changed, count = 8) {
  const result = { both: [], base: [], changed: [], neither: [] };
  for (let id = 1; id <= count; id += 1)
    result[
      base.includes(id)
        ? changed.includes(id)
          ? 'both'
          : 'base'
        : changed.includes(id)
          ? 'changed'
          : 'neither'
    ].push(id);
  return result;
}
