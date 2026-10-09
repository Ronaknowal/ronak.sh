// Small analytical models for the accepted RLAIF/IPO/ORPO lesson.
// Recorded pretrained/model observations are loaded separately; nothing trains here.
export const candidateNames = ['A', 'B', 'C', 'D'];
export const candidateColors = ['#76b8ff', '#e6a3bd', '#ba9bff', '#76d0d9'];
export const methodColors = { SFT: '#76d0d9', DPO: '#76b8ff', IPO: '#ba9bff', ORPO: '#e6a3bd' };
export const note =
  'The workshop is on Friday, starts at 10 am, takes place in Room 4, and requires no booking.';
export const request = 'Tell a visitor when and where to come, and whether booking is needed.';
export const criterion = 'Accurate and complete visitor guidance.';
export const responses = [
  'Come on Friday at 10 am to Room 4; no booking is needed.',
  'Come on Friday at 10 am to Room 4.',
  'Come on Friday at 10 am to Room 4; booking is required.',
];
export const publishedMatrix = [
  [0.5, 0.99, 0.25, 0.25],
  [0.01, 0.5, 0.75, 0.25],
  [0.75, 0.25, 0.5, 0.25],
  [0.75, 0.75, 0.75, 0.5],
];
export const gatherProbabilities = [
  [0.1, 0.2, 0.6, 0.1],
  [0.1, 0.7, 0.1, 0.1],
  [0.1, 0.2, 0.2, 0.5],
];
export const gatherTargets = [2, 1, 3];
export const sigmoid = (value) =>
  value >= 0 ? 1 / (1 + Math.exp(-value)) : Math.exp(value) / (1 + Math.exp(value));
export const softplus = (value) => Math.max(value, 0) + Math.log1p(Math.exp(-Math.abs(value)));
export const sum = (values) => values.reduce((a, b) => a + b, 0);
export const dot = (a, b) => sum(a.map((value, index) => value * b[index]));
export function normalize(values) {
  if (!values.length || values.some((v) => !Number.isFinite(v) || v < 0) || sum(values) <= 0)
    return null;
  const total = sum(values);
  return values.map((value) => value / total);
}
export function conditionalMass(a, b) {
  if (![a, b].every((v) => Number.isFinite(v) && v >= 0) || a + b > 1 + 1e-12)
    return { valid: false, reason: 'Masses must be nonnegative and their sum at most 1.' };
  return {
    valid: true,
    raw: [a, b, Math.max(0, 1 - a - b)],
    conditional: a + b > 0 ? [a / (a + b), b / (a + b)] : null,
  };
}
export function mapOrders(first, reversed) {
  if ([first, reversed].some((v) => !Number.isFinite(v) || v < 0 || v > 1)) return null;
  const mapped = [first, 1 - reversed];
  return { mapped, target: sum(mapped) / 2, gap: Math.abs(mapped[0] - mapped[1]) };
}
export function compiledPrompt(detailed = false, missing = false) {
  const rubric = detailed
    ? 'Use only the source note. Check day, time, room and booking. Prefer complete factual visitor guidance; do not reward extra unsupported claims.'
    : criterion;
  const segments = [
    `Compare the responses. Criterion: ${rubric}`,
    `Request: ${request}\nSource note: ${missing ? '' : note}`,
    `Response 1: ${responses[0]}`,
    `Response 2: ${responses[1]}`,
  ];
  return {
    segments,
    text: segments.join('\n\n') + '\n\nWhich response is better? Answer 1 or 2.',
    valid: !missing,
  };
}
export function feedbackStatus(choice, overBudget = false, missingOrder = false) {
  if (overBudget) return { valid: false, reason: 'Exceeded declared input budget', target: null };
  if (missingOrder) return { valid: false, reason: 'Second order missing', target: null };
  const cleaned = choice.trim();
  if (cleaned !== '1' && cleaned !== '2')
    return { valid: false, reason: 'Choice has no mapped option', target: null };
  return {
    valid: true,
    reason: 'Mapped hard choice in this constructed record',
    target: cleaned === '1' ? 1 : 0,
  };
}
export function softTargets(q) {
  if (!Number.isFinite(q) || q < 0 || q > 1) return null;
  return {
    full: [q, 1 - q],
    hard: q > 0.5 ? [1, 0] : q < 0.5 ? [0, 1] : null,
    winner: q >= 0.5 ? 'A' : 'B',
    confidence: Math.max(q, 1 - q),
  };
}
export function rewardHead(weights = [0], bias = 0, a = [0.5], b = [-0.5]) {
  const scores = [dot(weights, a) + bias, dot(weights, b) + bias];
  return {
    a,
    b,
    weights,
    bias,
    scores,
    gap: scores[0] - scores[1],
    probability: sigmoid(scores[0] - scores[1]),
  };
}
export function softBCE(q, logit) {
  if (q < 0 || q > 1 || !Number.isFinite(q) || !Number.isFinite(logit)) return null;
  const p = sigmoid(logit);
  return {
    p,
    full: q * softplus(-logit) + (1 - q) * softplus(logit),
    derivative: p - q,
    weighted: q * softplus(-logit),
    weightedDerivative: q * (p - 1),
    optimum: q === 0 ? -Infinity : q === 1 ? Infinity : Math.log(q / (1 - q)),
  };
}
export function ratings(masses) {
  const distribution = normalize(masses);
  if (!distribution || distribution.length !== 10) return null;
  const contributions = distribution.map((p, i) => p * (i + 1));
  const expected = sum(contributions);
  return { distribution, contributions, expected, reward: (expected - 5.5) / 4.5 };
}
export function policyVectors(
  p = 0.25,
  rewards = [2, 0],
  baseline = 0,
  dependent = false,
  reference = [0.5, 0.5],
  beta = 0,
) {
  if (p <= 0 || p >= 1 || !Number.isFinite(p) || reference.some((v) => v <= 0)) return null;
  const probabilities = [p, 1 - p];
  const scoreVectors = [
    [1 - p, -(1 - p)],
    [-p, p],
  ];
  const baselines = dependent ? rewards : [baseline, baseline];
  const samples = scoreVectors.map((vector, i) =>
    vector.map((v) => v * (rewards[i] - baselines[i])),
  );
  const rewardGradient = [0, 1].map((j) => sum(samples.map((row, i) => probabilities[i] * row[j])));
  const kl = sum(probabilities.map((v, i) => v * Math.log(v / reference[i])));
  const centeredLogRatio = probabilities.map((v, i) => Math.log(v / reference[i]) - kl);
  const klGradient = probabilities.map((v, i) => v * centeredLogRatio[i]);
  return {
    probabilities,
    scoreVectors,
    samples,
    rewardGradient,
    kl,
    klGradient,
    total: rewardGradient.map((v, i) => v - beta * klGradient[i]),
  };
}
export function analyticalPolicyStep(
  rate = 0.05,
  p = 0.5,
  rewards = [0.325491434659013, -0.325491434659013],
  beta = 0.1,
) {
  const model = policyVectors(p, rewards, 0, false, [0.5, 0.5], beta);
  if (!model) return null;
  const before = [Math.log(p), Math.log(1 - p)];
  const after = before.map((v, i) => v + rate * model.total[i]);
  const probability = sigmoid(after[0] - after[1]);
  return { ...model, before, after, probability };
}
export function gather(targets = gatherTargets) {
  if (!targets.length) return null;
  if (
    targets.length !== gatherProbabilities.length ||
    targets.some((v) => !Number.isInteger(v) || v < 0 || v >= 4)
  )
    return null;
  const aligned = targets.map((id, t) => gatherProbabilities[t][id]);
  const cartesian = gatherProbabilities.map((row) => targets.map((id) => row[id]));
  return {
    aligned,
    cartesian,
    selected: targets.map((id, t) => [t, id]),
    logSum: sum(aligned.map(Math.log)),
    product: aligned.reduce((a, b) => a * b, 1),
  };
}
export function tokenScore(probabilities) {
  if (!probabilities.length || probabilities.some((v) => v < 0 || v > 1 || !Number.isFinite(v)))
    return null;
  const logs = probabilities.map(Math.log);
  const total = sum(logs);
  return {
    probabilities,
    logs,
    count: logs.length,
    sum: total,
    mean: total / logs.length,
    product: Math.exp(total),
    geometric: Math.exp(total / logs.length),
  };
}
export function packedTokens(promptCount = 2, responseCount = 2, padCount = 2, sharedId = false) {
  const tokens = [
    { text: 'BOS', id: 1, kind: 'prompt' },
    ...Array.from({ length: promptCount }, (_, i) => ({
      text: ['Friday', '10 am', 'Room 4', 'no booking'][i % 4],
      id: 10 + i,
      kind: 'prompt',
    })),
    { text: 'SEP', id: 3, kind: 'prompt' },
    ...Array.from({ length: responseCount }, (_, i) => ({
      text: ['Come', 'Friday', '10 am', 'Room 4'][i % 4],
      id: 20 + i,
      kind: 'response',
    })),
    ...(responseCount > 0 ? [{ text: 'EOS', id: 2, kind: 'response' }] : []),
    ...Array.from({ length: padCount }, () => ({ text: 'PAD', id: sharedId ? 2 : 0, kind: 'pad' })),
  ];
  return {
    tokens,
    targets: tokens.slice(1).map((token) => token.kind === 'response'),
    count: responseCount > 0 ? responseCount + 1 : 0,
  };
}
export function gains(policy = [-2, -4], reference = [-3, -3.5], tau = 0.5) {
  const differences = policy.map((v, i) => v - reference[i]);
  const h = differences[0] - differences[1];
  return { policy, reference, gains: differences, h, scaled: tau * h };
}
export function preferenceLoss(h, tau = 0.5, beta = 0.5, prefactor = false) {
  if (
    !Number.isFinite(h) ||
    !Number.isFinite(tau) ||
    tau <= 0 ||
    !Number.isFinite(beta) ||
    beta < 0
  )
    return null;
  const target = 1 / (2 * tau),
    factor = prefactor ? tau : 1;
  return {
    target,
    IPO: factor * (h - target) ** 2,
    IPODerivative: factor * 2 * (h - target),
    DPO: softplus(-beta * h),
    DPODerivative: -beta * sigmoid(-beta * h),
    factor,
  };
}
export function contradictory(wins = 7, losses = 3, tau = 0.5, h = 0.4) {
  if (wins + losses === 0 || tau <= 0) return null;
  const q = wins / (wins + losses),
    c = 1 / (2 * tau);
  return {
    q,
    c,
    optimum: (2 * q - 1) * c,
    minimum: 4 * q * (1 - q) * c ** 2,
    positive: q * (h - c) ** 2,
    negative: (1 - q) * (h + c) ** 2,
    loss: q * (h - c) ** 2 + (1 - q) * (h + c) ** 2,
  };
}
export function matrixEdit(matrix, row, column, value) {
  const result = matrix.map((values) => [...values]);
  if (row === column || value < 0 || value > 1) return result;
  result[row][column] = value;
  result[column][row] = 1 - value;
  return result;
}
export function tilt(
  matrix = publishedMatrix,
  behavior = [0.25, 0.25, 0.25, 0.25],
  reference = [0.25, 0.25, 0.25, 0.25],
  tau = 0.1,
  transform = 'identity',
  offset = 0,
) {
  const mu = normalize(behavior),
    ref = normalize(reference);
  if (!mu || !ref || tau <= 0) return null;
  const transformed = matrix.map((row) =>
    row.map((p) => (transform === 'logit' ? Math.log(p / (1 - p)) : p)),
  );
  const scores = transformed.map((row) => dot(row, mu) + offset);
  if (scores.some((v) => !Number.isFinite(v)))
    return { valid: false, reason: 'Logit transform requires strictly interior probabilities.' };
  const logWeights = scores.map((v, i) => (ref[i] > 0 ? Math.log(ref[i]) + v / tau : -Infinity));
  const maximum = Math.max(...logWeights);
  const weights = logWeights.map((v) => Math.exp(v - maximum));
  return { valid: true, mu, ref, transformed, scores, logWeights, policy: normalize(weights) };
}
export function supportFamily(mass = 0.3, connected = false, empty = false) {
  if (empty) return { policy: null, h: null, loss: null };
  const e = Math.E;
  const policy = connected
    ? [e / (e + 2), 1 / (e + 2), 1 / (e + 2)]
    : [(mass * e) / (1 + e), mass / (1 + e), 1 - mass];
  const h = policy[0] > 0 && policy[1] > 0 ? Math.log(policy[0] / policy[1]) : null;
  return {
    policy,
    h,
    loss: h === null ? null : (h - 1) ** 2,
    AC: policy[2] > 0 && policy[0] > 0 ? Math.log(policy[0] / policy[2]) : null,
  };
}
export function log1mexp(logProbability) {
  if (logProbability >= 0) return logProbability === 0 ? -Infinity : NaN;
  return logProbability < -Math.LN2
    ? Math.log1p(-Math.exp(logProbability))
    : Math.log(-Math.expm1(logProbability));
}
export function oddsContrast(a, b) {
  if (![a, b].every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) return null;
  if (a === 1 || b === 1 || (a === 0 && b === 0))
    return { valid: false, reason: 'This boundary has no finite log-odds comparison.' };
  const logOdds = [a, b].map((p) => (p === 0 ? -Infinity : Math.log(p) - Math.log1p(-p)));
  const margin = logOdds[0] - logOdds[1];
  return {
    valid: true,
    logOdds,
    margin,
    probability: sigmoid(margin),
    loss: margin === Infinity ? 0 : margin === -Infinity ? Infinity : softplus(-margin),
  };
}
export function sharedWeight(theta = 0, xA = 1, xB = 3, lambda = 0.1, rate = 0.01) {
  const p = [sigmoid(theta * xA), sigmoid(theta * xB)];
  // For one binary target, log-odds(sigmoid(theta*x)) is exactly theta*x.
  const margin = theta * (xA - xB);
  const sftGradient = (p[0] - 1) * xA;
  const contrastGradient = -sigmoid(-margin) * (xA - xB);
  const total = sftGradient + lambda * contrastGradient;
  return {
    theta,
    xA,
    xB,
    p,
    margin,
    sftGradient,
    contrastGradient,
    weighted: lambda * contrastGradient,
    total,
    after: theta - rate * total,
  };
}
export function workCounts(
  pairs = 6,
  lengthA = 20,
  lengthB = 30,
  updates = 80,
  cached = true,
  teacherCalls = 0,
) {
  const sequences = pairs * 2 * updates,
    positions = pairs * (lengthA + lengthB) * updates;
  const cacheNeeded = cached && updates > 0;
  return {
    sequences,
    positions,
    updates,
    referenceSequences: cached ? (cacheNeeded ? pairs * 2 : 0) : sequences,
    referencePositions: cached ? (cacheNeeded ? pairs * (lengthA + lengthB) : 0) : positions,
    onlineReferenceSequences: cached ? 0 : sequences,
    teacherCalls,
  };
}
export function scalarSamples(fn, low, high, count = 65) {
  return Array.from({ length: count }, (_, i) => {
    const x = low + ((high - low) * i) / (count - 1);
    return [x, fn(x)];
  }).filter(([, y]) => Number.isFinite(y));
}
