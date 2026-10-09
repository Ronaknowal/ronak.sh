// Topic-local arithmetic. Constructed fixtures are separate from recorded inference.
export const candidates = [
  { id: 'R1', text: "Ask someone for Mira's private phone number.", hue: 'amber' },
  { id: 'R2', text: 'I cannot help with this request.', hue: 'blue' },
  {
    id: 'R3',
    text: 'Use the team directory or ask Mira how she prefers to be contacted.',
    hue: 'violet',
  },
];
export const request =
  "Can you share Mira's private phone number? I need to contact her about a project.";
export const principles = [
  {
    id: 'P1',
    scope: "requests for another person's private contact details",
    criterion: 'do not disclose private contact details',
    alternative: "suggest a public team directory or ask the person's preferred contact method",
  },
  {
    id: 'P2',
    scope: 'all responses',
    criterion: 'preserve a useful permitted part of the request',
    alternative: 'help the user contact the colleague without supplying private details',
  },
  {
    id: 'P3',
    scope: 'claims about unavailable information',
    criterion: 'do not invent contact information',
    alternative: 'state the limit without claiming to have searched an unavailable directory',
  },
];
export const revisions = [
  candidates[0].text,
  'I cannot share private contact details. Use the team directory.',
  'I cannot share private contact details. Use the team directory or ask Mira how she prefers to be contacted.',
  'I cannot share private contact details. Use the team directory or ask Mira how she prefers to be contacted.',
];
export function finite(values) {
  if (!values.length || !values.every(Number.isFinite)) throw new Error('Supply finite values.');
  return values;
}
export function probability(q) {
  if (!Number.isFinite(q) || q < 0 || q > 1) throw new Error('Probability must be in [0, 1].');
  return q;
}
export function softmax(logits) {
  finite(logits);
  const maximum = Math.max(...logits);
  const weights = logits.map((x) => Math.exp(x - maximum));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((x) => x / total);
}
export function logSoftmax(logits) {
  finite(logits);
  const maximum = Math.max(...logits);
  const normalizer = maximum + Math.log(logits.reduce((sum, x) => sum + Math.exp(x - maximum), 0));
  return logits.map((x) => x - normalizer);
}
export function sigmoid(x) {
  finite([x]);
  return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
}
export function softLoss(delta, q) {
  probability(q);
  finite([delta]);
  return Math.max(delta, 0) + Math.log1p(Math.exp(-Math.abs(delta))) - q * delta;
}
export function compiledPrinciple(scope, criterion, alternative) {
  if (![scope, criterion, alternative].every((x) => x.trim()))
    return {
      valid: false,
      text: 'Incomplete instruction: supply scope, criterion and permitted alternative.',
    };
  return {
    valid: true,
    text: `User request: ${request}\nDraft response: ${revisions[0]}\nPrinciple P1. Scope: ${scope}. Criterion: ${criterion}. Allowed alternative: ${alternative}.\nIdentify a specific violation, or state that this criterion finds none.`,
  };
}
export function targetFixture(
  promptCount = 3,
  padding = 2,
  promptLoss = false,
  allIgnored = false,
) {
  if (
    !Number.isInteger(promptCount) ||
    promptCount < 1 ||
    !Number.isInteger(padding) ||
    padding < 0
  )
    throw new Error('Token counts must be integers; prompt must include at least BOS.');
  const prompt = Array.from({ length: promptCount }, (_, i) => ({
    token: i === 0 ? 'BOS' : `prompt${i}`,
    id: i === 0 ? 1 : i < 3 ? i + 2 : i + 4,
    kind: 'prompt',
  }));
  const answer = [
    { token: 'answer0', id: 5, kind: 'answer' },
    { token: 'answer1', id: 6, kind: 'answer' },
    { token: 'EOS', id: 2, kind: 'answer' },
  ];
  const pad = Array.from({ length: padding }, () => ({ token: 'PAD', id: 0, kind: 'pad' }));
  const tokens = [...prompt, ...answer, ...pad];
  const labels = tokens.map((x) =>
    allIgnored || x.kind === 'pad' || (x.kind === 'prompt' && !promptLoss) ? -100 : x.id,
  );
  const attention = tokens.map((x) => (x.kind === 'pad' ? 0 : 1));
  const targets = labels
    .slice(1)
    .flatMap((label, i) =>
      label === -100 ? [] : [{ logit: i, labelPosition: i + 1, target: label }],
    );
  return { tokens, labels, attention, targets, count: targets.length };
}
export function conditionalChoice(logits) {
  const mass = softmax(logits);
  const pair = softmax(logits.slice(0, 2));
  return { mass, q: pair[0], subset: mass[0] + mass[1] };
}
export function mappedOrders(first, second) {
  probability(first);
  if (second === null) return { first, second: null, mean: null, gap: null };
  probability(second);
  const mapped = 1 - second;
  return { first, second: mapped, mean: (first + mapped) / 2, gap: Math.abs(first - mapped) };
}
export function transformedLabel(q, mode, lower = 0.4, upper = 0.6) {
  probability(q);
  if (mode === 'hard') return q === 0.5 ? 0.5 : Number(q > 0.5);
  if (mode === 'clamped') {
    probability(lower);
    probability(upper);
    if (lower > upper) throw new Error('Clamp lower bound exceeds upper bound.');
    return Math.max(lower, Math.min(upper, q));
  }
  return q;
}
export function headPair(hA, hB, w, offset = 0) {
  if (!w.length || hA.length !== w.length || hB.length !== w.length)
    throw new Error('Hidden rows and shared weight need the same nonzero width.');
  finite([...hA, ...hB, ...w, offset]);
  const termsA = w.map((x, i) => x * hA[i]);
  const termsB = w.map((x, i) => x * hB[i]);
  const a = termsA.reduce((x, y) => x + y, 0) + offset;
  const b = termsB.reduce((x, y) => x + y, 0) + offset;
  return { termsA, termsB, a, b, delta: a - b, p: sigmoid(a - b) };
}
export function preferenceStep(a, b, q, rate) {
  finite([a, b, rate]);
  probability(q);
  const p = sigmoid(a - b),
    gradient = p - q;
  return {
    p,
    loss: softLoss(a - b, q),
    gradient,
    next: [a - rate * gradient, b + rate * gradient],
  };
}
export function policyOptimum(reference, rewards, beta) {
  if (!reference.length || reference.length !== rewards.length)
    throw new Error('One reward is required per reference candidate.');
  finite([...reference, ...rewards, beta]);
  if (reference.some((x) => x < 0) || beta < 0)
    throw new Error('Reference weights and beta must be nonnegative.');
  const total = reference.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new Error('Reference needs positive total mass.');
  const ref = reference.map((x) => x / total);
  const supported = rewards.filter((_, i) => ref[i] > 0);
  const maximum = Math.max(...supported);
  const factors = rewards.map((r, i) =>
    ref[i] === 0 ? 0 : beta === 0 ? Number(r === maximum) : Math.exp((r - maximum) / beta),
  );
  const weights = factors.map((x, i) => x * ref[i]);
  const normalizer = weights.reduce((a, b) => a + b, 0);
  const policy = weights.map((x) => x / normalizer);
  const reward = policy.reduce((sum, p, i) => sum + p * rewards[i], 0);
  const kl = policy.reduce((sum, p, i) => sum + (p === 0 ? 0 : p * Math.log(p / ref[i])), 0);
  return {
    ref,
    factors,
    weights,
    policy,
    reward,
    kl,
    objective: reward - beta * kl,
    limit: beta === 0,
  };
}
export function dpoStep(logits, reference, chosen, rejected, beta, rate) {
  if (
    !logits.length ||
    logits.length !== reference.length ||
    ![chosen, rejected].every((i) => Number.isInteger(i) && i >= 0 && i < logits.length)
  )
    throw new Error('Policy/reference widths and pair indices must agree.');
  finite([...logits, ...reference, beta, rate]);
  if (beta < 0 || reference.some((x) => x <= 0))
    throw new Error('DPO demo requires positive reference mass and beta ≥ 0.');
  const total = reference.reduce((a, b) => a + b, 0),
    ref = reference.map((x) => x / total);
  const logPolicy = logSoftmax(logits),
    policy = softmax(logits);
  const ratios = logPolicy.map((x, i) => x - Math.log(ref[i]));
  const margin = beta * (ratios[chosen] - ratios[rejected]);
  const coefficient = beta * (sigmoid(margin) - 1);
  const gradients = logits.map(
    (_, i) => coefficient * (Number(i === chosen) - Number(i === rejected)),
  );
  const nextLogits = logits.map((x, i) => x - rate * gradients[i]);
  return {
    policy,
    ref,
    ratios,
    margin,
    loss: softLoss(margin, 1),
    gradients,
    next: softmax(nextLogits),
    informative: chosen !== rejected && beta !== 0,
  };
}
export function coverage(rows) {
  if (
    rows.length !== 2 ||
    rows.some((row) => row.length !== 3 || row.some((x) => !Number.isInteger(x) || x < 0))
  )
    throw new Error('Supply two strata with three nonnegative integer category counts each.');
  const totals = rows.map((row) => row.reduce((a, b) => a + b, 0));
  return {
    totals,
    overRefusal: totals[0] ? rows[0][1] / totals[0] : null,
    disclosure: totals[1] ? rows[1][2] / totals[1] : null,
  };
}
export function calibration(rows, binCount) {
  if (
    !Number.isInteger(binCount) ||
    binCount < 1 ||
    rows.some((row) => ![0, 1].includes(row.label))
  )
    throw new Error('Calibration needs a positive integer bin count and binary external labels.');
  const bins = Array.from({ length: binCount }, () => []);
  rows.forEach((row) => {
    probability(row.q);
    bins[Math.min(binCount - 1, Math.floor(row.q * binCount))].push(row);
  });
  return {
    bins: bins.map((group) => ({
      count: group.length,
      mean: group.length ? group.reduce((s, r) => s + r.q, 0) / group.length : null,
      observed: group.length ? group.reduce((s, r) => s + r.label, 0) / group.length : null,
    })),
    brier: rows.length ? rows.reduce((s, r) => s + (r.q - r.label) ** 2, 0) / rows.length : null,
  };
}
export function errorStructure(e, shared) {
  probability(e);
  const outcomes = Array.from({ length: 8 }, (_, i) => {
    const bits = [(i >> 2) & 1, (i >> 1) & 1, i & 1],
      errors = bits.reduce((a, b) => a + b, 0);
    return {
      bits,
      errors,
      mass: shared
        ? errors === 0
          ? 1 - e
          : errors === 3
            ? e
            : 0
        : e ** errors * (1 - e) ** (3 - errors),
    };
  });
  return {
    outcomes,
    majority: outcomes.filter((x) => x.errors >= 2).reduce((s, x) => s + x.mass, 0),
  };
}
export function consensus(agreements, sizes, missing = false) {
  if (
    !sizes.length ||
    sizes.length !== agreements.length ||
    sizes.some(
      (x, i) =>
        !Number.isInteger(x) ||
        x < 0 ||
        !Number.isInteger(agreements[i]) ||
        agreements[i] < 0 ||
        agreements[i] > x,
    )
  )
    throw new Error('Vote counts must be integers within matching group sizes.');
  const rates = agreements.map((a, i) => (sizes[i] > 0 ? a / sizes[i] : null));
  if (missing) rates[1] = null;
  const total = sizes.reduce((a, b) => a + b, 0);
  return {
    rates,
    gac: rates.some((x) => x === null) ? null : rates.reduce((a, b) => a * b, 1),
    majority: !missing && total ? agreements.reduce((a, b) => a + b, 0) / total : null,
  };
}
export function workLedger(n, rounds, pairs, orders, judges, prompt, response, retainHistory) {
  if (
    ![n, rounds, pairs, orders, judges, prompt, response].every(
      (x) => Number.isInteger(x) && x >= 0,
    ) ||
    orders < 1 ||
    judges < 1 ||
    response < 1
  )
    throw new Error(
      'Use nonnegative integer counts, positive order/judge counts and positive output length.',
    );
  const calls = [{ kind: 'Draft', count: n, input: prompt, output: response }];
  for (let r = 0; r < rounds; r++) {
    const prior = retainHistory ? r * response * 2 : 0;
    calls.push({
      kind: `Critique round ${r + 1}`,
      count: n,
      input: prompt + response + prior,
      output: response,
    });
    calls.push({
      kind: `Revision round ${r + 1}`,
      count: n,
      input: prompt + response * 2 + prior,
      output: response,
    });
  }
  calls.push({
    kind: 'Judge',
    count: pairs * orders * judges,
    input: prompt + response * 2,
    output: 2,
  });
  return {
    calls,
    generation: n + 2 * n * rounds,
    judge: pairs * orders * judges,
    allTargets: n * rounds,
    finalTargets: rounds ? n : 0,
    tokens: calls.reduce((s, c) => s + c.count * (c.input + c.output), 0),
    pairs,
  };
}
