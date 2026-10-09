// Finite explanatory models only. Measured language-model observations are
// loaded separately from source-bound retained files; these functions fit none.
export const responseColors = ['#7db5ff', '#ef93ae', '#bba2ff', '#edbc69'];
export const roles = {
  input: '#79cbd5',
  parameter: '#edbc69',
  score: '#bba2ff',
  frozen: '#a3a8b6',
};
export const taskQuestion =
  'Natalia sold clips to 48 of her friends in April, and then she sold half as many clips in May. How many clips did Natalia sell altogether in April and May?';
export const exampleResponses = [
  '48/2=24; 48+24=72.\n#### 72',
  '48/2=20; 48+20=68.\n#### 72',
  '#### 24',
  'The answer is probably seventy-two',
];
const gcd = (a, b) => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
export function numericObject(source) {
  const text = String(source).trim();
  let numerator, denominator;
  if (/^[+-]?\d+\/[+-]?\d+$/.test(text)) {
    [numerator, denominator] = text.split('/').map(BigInt);
    if (denominator === 0n) throw new Error('zero denominator');
  } else if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
    const negative = text.startsWith('-');
    const unsigned = text.replace(/^[+-]/, '');
    const [integer = '', fraction = ''] = unsigned.split('.');
    denominator = 10n ** BigInt(fraction.length);
    numerator = BigInt((integer || '0') + fraction) * (negative ? -1n : 1n);
  } else throw new Error('outside the declared numeric grammar');
  const divisor = gcd(numerator, denominator);
  if (denominator < 0n) numerator = -numerator;
  denominator = denominator < 0n ? -denominator : denominator;
  numerator /= divisor;
  denominator /= divisor;
  return denominator === 1n ? String(numerator) : `${numerator}/${denominator}`;
}
export function extractNumber(text, boxed = false) {
  let begin, end, value;
  // The rendered character row uses Unicode code points. JS slice/search use
  // UTF-16 offsets internally; translate only displayed addresses, never text.
  const addresses = (start, stop) => [
    Array.from(text.slice(0, start)).length,
    Array.from(text.slice(0, Math.max(start, stop))).length,
  ];
  if (boxed) {
    const start = text.lastIndexOf('\\boxed{');
    if (start < 0) return { span: null, parsed: null, reason: 'missing boxed expression' };
    begin = start + 7;
    let depth = 1;
    end = begin;
    while (end < text.length && depth) {
      if (text[end] === '{') depth++;
      if (text[end] === '}') depth--;
      end++;
    }
    if (depth)
      return { span: addresses(begin, text.length), parsed: null, reason: 'unbalanced braces' };
    end--;
    value = text.slice(begin, end).trim();
    const fraction = value.match(/^\\frac\{([+-]?\d+)\}\{([+-]?\d+)\}$/);
    if (fraction) value = `${fraction[1]}/${fraction[2]}`;
  } else {
    const marker = text.lastIndexOf('####');
    if (marker < 0) return { span: null, parsed: null, reason: 'missing final marker' };
    const raw = text.slice(marker + 4);
    begin = marker + 4 + raw.length - raw.trimStart().length;
    end = marker + 4 + raw.trimEnd().length;
    value = raw.trim();
  }
  try {
    return {
      span: addresses(begin, end),
      parsed: numericObject(value),
      reason: boxed ? 'parsed narrow boxed number' : 'parsed numeric object',
    };
  } catch (error) {
    return { span: addresses(begin, end), parsed: null, reason: error.message };
  }
}
export function verdict(text, gold) {
  const parsed = extractNumber(text);
  if (gold === null) return { ...parsed, accepted: null, reward: null, reason: 'gold unavailable' };
  let expected;
  try {
    expected = numericObject(gold);
  } catch {
    return { ...parsed, accepted: null, reward: null, reason: 'gold outside contract' };
  }
  const accepted = parsed.parsed !== null && parsed.parsed === expected;
  return {
    ...parsed,
    gold_parsed: expected,
    accepted,
    reward: Number(accepted),
    reason:
      parsed.parsed === null
        ? parsed.reason
        : accepted
          ? 'exact numeric match'
          : 'numeric mismatch',
  };
}
export function arithmeticTree(source) {
  if (source.length > 256) throw new Error('expression too large');
  const tokens = source.match(/\d+|[xy()+*\-]|\S/g) || [];
  let index = 0,
    nodes = 0;
  function primary() {
    if (++nodes > 64) throw new Error('too many AST nodes');
    const token = tokens[index++];
    if (/^\d+$/.test(token || '')) return { kind: 'number', value: Number(token) };
    if (token === 'x' || token === 'y') return { kind: 'name', value: token };
    if (token === '-') return { kind: 'negate', child: primary() };
    if (token === '(') {
      const value = expression();
      if (tokens[index++] !== ')') throw new Error('unbalanced parentheses');
      return value;
    }
    throw new Error('unsupported arithmetic AST node');
  }
  function product() {
    let value = primary();
    while (tokens[index] === '*') {
      index++;
      value = { kind: '*', left: value, right: primary() };
    }
    return value;
  }
  function expression() {
    let value = product();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const kind = tokens[index++];
      value = { kind, left: value, right: product() };
    }
    return value;
  }
  const tree = expression();
  if (index !== tokens.length) throw new Error('unsupported arithmetic AST node');
  return tree;
}
export function evaluateTree(tree, x, y) {
  if (tree.kind === 'number') return tree.value;
  if (tree.kind === 'name') return tree.value === 'x' ? x : y;
  if (tree.kind === 'negate') return -evaluateTree(tree.child, x, y);
  const a = evaluateTree(tree.left, x, y),
    b = evaluateTree(tree.right, x, y);
  return tree.kind === '+' ? a + b : tree.kind === '-' ? a - b : a * b;
}
export function checkExpression(source, strong = false) {
  const tests = [[2, 0, 2], [-1, 0, -1], ...(strong ? [[2, 3, 5]] : [])];
  try {
    const tree = arithmeticTree(source);
    const rows = tests.map(([x, y, expected]) => {
      const actual = evaluateTree(tree, x, y);
      return { x, y, expected, actual, passed: actual === expected };
    });
    return {
      tree,
      rows,
      accepted: rows.every((row) => row.passed),
      reason: 'declared finite tests',
    };
  } catch (error) {
    return {
      tree: null,
      rows: tests.map(([x, y, expected]) => ({ x, y, expected, actual: null, passed: false })),
      accepted: false,
      reason: error.message,
    };
  }
}
export function deriveProof(proof, context = {}) {
  const [rule, ...parts] = proof;
  if (rule === 'assume') {
    if (!(parts[0] in context)) throw new Error(`assumption out of scope: ${parts[0]}`);
    return context[parts[0]];
  }
  if (rule === 'and-left' || rule === 'and-right') {
    const proposition = deriveProof(parts[0], context);
    if (!Array.isArray(proposition) || proposition[0] !== 'and')
      throw new Error('conjunction elimination needs a conjunction');
    return proposition[rule === 'and-left' ? 1 : 2];
  }
  if (rule === 'and-intro')
    return ['and', deriveProof(parts[0], context), deriveProof(parts[1], context)];
  if (rule === 'imp-intro') {
    const [name, premise, body] = parts;
    if (name in context) throw new Error('fresh assumption name required');
    return ['implies', premise, deriveProof(body, { ...context, [name]: premise })];
  }
  throw new Error(`unsupported proof rule: ${rule}`);
}
export function proofCase(mode = 'valid') {
  const premise = ['and', 'P', 'Q'],
    assumption = ['assume', 'h'];
  const body = [
    'and-intro',
    [mode === 'left' ? 'and-left' : 'and-right', assumption],
    ['and-left', assumption],
  ];
  const proof = mode === 'scope' ? body : ['imp-intro', 'h', premise, body];
  const goal = ['implies', premise, ['and', 'Q', 'P']];
  try {
    const derived = deriveProof(proof);
    return {
      proof,
      goal,
      derived,
      accepted: JSON.stringify(derived) === JSON.stringify(goal),
      reason:
        JSON.stringify(derived) === JSON.stringify(goal)
          ? 'goal matches'
          : 'different derived proposition',
    };
  } catch (error) {
    return { proof, goal, derived: null, accepted: false, reason: error.message };
  }
}
export function groupStatistics(rewards, { sample = false, scaled = true, epsilon = 0 } = {}) {
  const values = rewards.filter((value) => value !== null && Number.isFinite(value));
  if (!values.length)
    return {
      count: 0,
      mean: null,
      std: null,
      centered: rewards.map(() => null),
      advantages: rewards.map(() => 0),
    };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const denominator = values.length - Number(sample);
  const std =
    denominator > 0
      ? Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / denominator)
      : null;
  const centered = rewards.map((value) => (value === null ? null : value - mean));
  const advantages = centered.map((value) =>
    value === null
      ? 0
      : !scaled
        ? value
        : std === null || std + epsilon === 0
          ? 0
          : value / (std + epsilon),
  );
  return { count: values.length, mean, std, centered, advantages };
}
export function objective(probabilities, rewards = [1, 0, 0]) {
  const total = probabilities.reduce((sum, p) => sum + p, 0);
  if (!(total > 0))
    return {
      probabilities: probabilities.map(() => null),
      value: null,
      gradient: probabilities.map(() => null),
    };
  const p = probabilities.map((value) => value / total);
  const value = p.reduce((sum, mass, i) => sum + mass * rewards[i], 0);
  return { probabilities: p, value, gradient: p.map((mass, i) => mass * (rewards[i] - value)) };
}
export function enumerateBaselines(p, size) {
  const rows = [];
  for (let mask = 0; mask < 2 ** size; mask++) {
    const outcomes = Array.from({ length: size }, (_, i) => (mask >> (size - i - 1)) & 1);
    const successes = outcomes.reduce((sum, value) => sum + value, 0);
    const probability = p ** successes * (1 - p) ** (size - successes);
    const mean = successes / size;
    const raw = outcomes.reduce((sum, r) => sum + r * (r - p), 0) / size;
    const same = outcomes.reduce((sum, r) => sum + (r - mean) * (r - p), 0) / size;
    const standardized =
      groupStatistics(outcomes).advantages.reduce((sum, a, i) => sum + a * (outcomes[i] - p), 0) /
      size;
    rows.push({ outcomes, probability, raw, same, loo: (same * size) / (size - 1), standardized });
  }
  const moments = {};
  for (const field of ['raw', 'same', 'loo', 'standardized']) {
    const mean = rows.reduce((sum, row) => sum + row.probability * row[field], 0);
    moments[field] = {
      mean,
      variance: rows.reduce((sum, row) => sum + row.probability * (row[field] - mean) ** 2, 0),
    };
  }
  return { rows, moments };
}
export function clippedTerm(ratio, advantage, epsilon = 0.2) {
  const clipped = Math.max(1 - epsilon, Math.min(1 + epsilon, ratio));
  const value = Math.min(ratio * advantage, clipped * advantage);
  const boundary =
    (advantage > 0 && Math.abs(ratio - 1 - epsilon) < 1e-12) ||
    (advantage < 0 && Math.abs(ratio - 1 + epsilon) < 1e-12);
  const derivative = boundary
    ? null
    : (advantage > 0 && ratio > 1 + epsilon) || (advantage < 0 && ratio < 1 - epsilon)
      ? 0
      : advantage;
  return { value, derivative, boundary, clipped };
}
export function tokenReduction(lengths, values, cap = 6) {
  const tokens = lengths.reduce((sum, n) => sum + n, 0);
  const numerator = lengths.reduce((sum, n, i) => sum + n * values[i], 0);
  const available = lengths
    .map((n, i) => (n > 0 ? values[i] : null))
    .filter((value) => value !== null);
  return {
    tokens,
    numerator,
    response: available.length ? available.reduce((a, b) => a + b, 0) / available.length : null,
    pooled: tokens ? numerator / tokens : null,
    fixed: lengths.length && cap > 0 ? numerator / (lengths.length * cap) : null,
  };
}
export function klRoutes(p, q) {
  const masses = [p, 1 - p],
    reference = [q, 1 - q];
  const terms = masses.map((mass, i) =>
    mass === 0 ? 0 : reference[i] === 0 ? Infinity : mass * Math.log(mass / reference[i]),
  );
  const value = terms.reduce((sum, term) => sum + term, 0);
  const supported = masses.every((mass, i) => mass > 0 || reference[i] === 0);
  const k3 = masses.map((mass, i) =>
    mass === 0
      ? null
      : reference[i] === 0
        ? Infinity
        : reference[i] / mass - Math.log(reference[i] / mass) - 1,
  );
  const exactDerivative =
    p > 0 && p < 1 && q > 0 && q < 1 ? p * (1 - p) * Math.log((p * (1 - q)) / (q * (1 - p))) : null;
  const sampledValue = masses.reduce((sum, mass, i) => sum + (mass === 0 ? 0 : mass * k3[i]), 0);
  return {
    masses,
    reference,
    terms,
    value,
    k3,
    sampledValue,
    supported,
    exactDerivative,
    partialDerivative: p > 0 && p < 1 && q > 0 && q < 1 ? p - q : null,
  };
}
export function samplingEvents(p, size) {
  const failure = (1 - p) ** size,
    success = p ** size;
  return { failure, success, any: 1 - failure, mixed: Math.max(0, 1 - failure - success) };
}
export function samplingDistribution(temperature = 1, topK = 0) {
  const logits = [0.2, 0.5, 0.3].map(Math.log);
  const kept = topK
    ? logits
        .map((value, i) => [value, i])
        .sort((a, b) => b[0] - a[0])
        .slice(0, topK)
        .map(([, i]) => i)
    : [0, 1, 2];
  const weights = logits.map((value, i) =>
    kept.includes(i) ? Math.exp(value / temperature - Math.max(...logits) / temperature) : 0,
  );
  const total = weights.reduce((a, b) => a + b, 0);
  const probabilities = weights.map((value) => value / total);
  return {
    probabilities,
    entropy: -probabilities.reduce((sum, p) => sum + (p ? p * Math.log(p) : 0), 0),
    expectedReward: probabilities[0],
    kept,
  };
}
export function confusion(p, falsePositive, falseNegative) {
  const tp = p * (1 - falseNegative),
    fn = p * falseNegative,
    fp = (1 - p) * falsePositive,
    tn = (1 - p) * (1 - falsePositive);
  return {
    cells: [
      [tp, fn],
      [fp, tn],
    ],
    accepted: tp + fp,
    precision: tp + fp > 0 ? tp / (tp + fp) : null,
    prevalence: p,
  };
}
export function correctedRewards(rewards, f, n, epsilon = 0) {
  const scale = 1 - f - n;
  const corrected = scale > 0 ? rewards.map((value) => (value - f) / scale) : null;
  return {
    scale,
    corrected,
    raw: groupStatistics(rewards, { epsilon }),
    transformed: corrected ? groupStatistics(corrected, { epsilon }) : null,
  };
}
export function corruptionGrid(mode = 'none') {
  const clean = [
    [1, 1, 1],
    [1, 0, 1],
    [0, 0, 1],
    [0, 0, 0],
  ];
  const mask = clean.map((row, i) =>
    row.map(
      (_, j) =>
        (mode === 'cell' && i === 0 && j === 1) ||
        (mode === 'row' && i === 0) ||
        (mode === 'column' && j === 1) ||
        mode === 'all',
    ),
  );
  const edited = clean.map((row, i) => row.map((value, j) => (mask[i][j] ? 1 - value : value)));
  const rewards = edited.map((row) => row.reduce((a, b) => a + b, 0) / row.length);
  return { clean, mask, edited, rewards, ...groupStatistics(rewards) };
}
export function reasoningMass(pc, alpha, wrongAnswerSuccess) {
  const b = wrongAnswerSuccess;
  const cells = [
    [pc * alpha, pc * (1 - alpha)],
    [(1 - pc) * b, (1 - pc) * (1 - b)],
  ];
  const mean = cells[0][0] + cells[1][0],
    std = Math.sqrt(mean * (1 - mean));
  return {
    cells,
    mean,
    std,
    correct: std ? (alpha - mean) / std : null,
    incorrect: std ? (b - mean) / std : null,
  };
}
export function binomial(n, k) {
  if (k < 0 || k > n) return 0;
  let value = 1;
  for (let i = 1; i <= k; i++) value = (value * (n - k + i)) / i;
  return Math.round(value);
}
export function passAtK(n, c, k) {
  if (c < 0 || c > n || k < 1 || k > n) return null;
  return n - c < k ? 1 : 1 - binomial(n - c, k) / binomial(n, k);
}
export function answerVote(answers) {
  const counts = new Map();
  for (const answer of answers)
    if (answer !== null) counts.set(answer, (counts.get(answer) || 0) + 1);
  const rows = [...counts].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  const tied = rows.length > 1 && rows[0][1] === rows[1][1];
  return {
    rows,
    invalid: answers.filter((answer) => answer === null).length,
    plurality: !rows.length || tied ? null : rows[0][0],
    majority: rows.length && rows[0][1] > answers.length / 2 ? rows[0][0] : null,
    tied,
  };
}
export const byteIds = (text) => [
  258,
  ...new TextEncoder().encode(text + '\nGive the final numeric answer as #### number.\n'),
  259,
];
export const responseMask = (prefixLength, responseLength, paddedLength) =>
  Array.from(
    { length: paddedLength - 1 },
    (_, i) => i + 1 >= prefixLength && i + 1 < prefixLength + responseLength,
  );
export const armLabel = (name) =>
  ({
    'group-scaled-grpo': 'Scaled GRPO',
    'unscaled-centred-grpo': 'Unscaled GRPO',
    'verified-sample-sft': 'Verified SFT',
  })[name] || name;

export function finiteScheduler(strategy, tape, initialTheta = 0, offsets = [-2, 1]) {
  let theta = initialTheta;
  const history = [],
    counts = [0, 0];
  for (let step = 0; step < 24; step++) {
    const probabilities = offsets.map((offset) => 1 / (1 + Math.exp(-theta - offset)));
    const mixed = probabilities.map((p) => 1 - p ** 4 - (1 - p) ** 4);
    const weights =
      strategy === 'easy-first'
        ? step < 12
          ? [0, 1]
          : [1, 0]
        : strategy === 'mixed-rate'
          ? mixed.map((value) => value / (mixed[0] + mixed[1]))
          : [0.5, 0.5];
    const task = Number(tape[step * 5] >= weights[0]),
      p = probabilities[task];
    const outcomes = Array.from({ length: 4 }, (_, i) => Number(tape[step * 5 + i + 1] < p));
    const mean = outcomes.reduce((a, b) => a + b, 0) / 4;
    const gradient = outcomes.reduce((sum, r) => sum + (r - mean) * (r - p), 0) / 4;
    const before = theta;
    theta += 0.15 * gradient;
    counts[task]++;
    history.push({
      step: step + 1,
      task,
      probabilities,
      mixed_probabilities: mixed,
      proposed_weights: weights,
      outcomes,
      same_group_logit_gradient: gradient,
      theta_before: before,
      theta_after: theta,
    });
  }
  return {
    strategy,
    initial_theta: initialTheta,
    task_offsets: offsets,
    task_counts: counts,
    history,
  };
}
