// Pure calculations for the accepted PRM teaching fixtures. No browser fitting.
export const classes = ['invalid', 'neutral', 'progress'];
export const pool = [
  { id: 'A', answer: '3', steps: ['2x=6', 'x=3'], scores: [0.9, 0.9], correct: true },
  {
    id: 'B',
    answer: '3',
    steps: ['2x+2=8', '2x=6', 'x=3'],
    scores: [0.98, 0.95, 0.94],
    correct: true,
  },
  { id: 'C', answer: '4', steps: ['2x=8', 'x=4'], scores: [0.99, 0.98], correct: false },
  { id: 'D', answer: '3.5', steps: ['2x=7', 'x=3.5'], scores: [0.6, 0.8], correct: false },
  { id: 'E', answer: '4', steps: ['answer 4'], scores: [0.75], correct: false },
  { id: 'F', answer: '3', steps: ['2(x+1)=8 so x+1=4', 'x=3'], scores: [0.9, 0.9], correct: true },
];
export function aggregate(values, method = 'product') {
  if (!values.length) return null;
  if (values.some((value) => value < 0 || value > 1)) throw new Error('Probability outside [0,1]');
  if (method === 'minimum') return Math.min(...values);
  if (method === 'mean') return values.reduce((a, b) => a + b, 0) / values.length;
  if (method === 'log_product') return values.reduce((a, b) => a + Math.log(b), 0);
  return values.reduce((a, b) => a * b, 1);
}
export function rankPool(count, method = 'product') {
  const scored = pool
    .slice(0, count)
    .map((item, index) => ({ ...item, index, score: aggregate(item.scores, method) }));
  const ordered = [...scored].sort((a, b) => b.score - a.score || a.index - b.index);
  const finite = scored.filter((item) => Number.isFinite(item.score));
  const maximum = finite.length ? Math.max(...finite.map((item) => item.score)) : null;
  const votes = new Map();
  for (const item of scored) {
    const mass =
      method === 'log_product'
        ? Number.isFinite(item.score)
          ? Math.exp(item.score - maximum)
          : 0
        : item.score;
    votes.set(item.answer, (votes.get(item.answer) || 0) + mass);
  }
  const answerWeights = [...votes];
  const weightedVote = answerWeights.some(([, mass]) => mass > 0)
    ? [...answerWeights].sort((a, b) => b[1] - a[1])[0][0]
    : null;
  return {
    ordered,
    scored: scored.length,
    selected: ordered[0] || null,
    answerWeights,
    weightedVote,
    oracle: scored.length ? scored.some((item) => item.correct) : null,
  };
}
export function reductions(rows, masks) {
  const included = rows.map((row, index) => row.filter((_, column) => masks[index][column]));
  const nonempty = included.filter((row) => row.length);
  const values = included.flat();
  return {
    boundaries: values.length,
    trajectories: nonempty.length,
    boundary: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    trajectory: nonempty.length
      ? nonempty.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0) / row.length, 0) /
        nonempty.length
      : null,
  };
}
export function binary(z, target, eligible = true) {
  if (!Number.isFinite(z)) {
    const p = z > 0 ? 1 : 0;
    return {
      p,
      loss: eligible ? (p === target ? 0 : Infinity) : null,
      derivative: eligible ? p - target : null,
    };
  }
  const p = z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
  return {
    p,
    loss: eligible ? Math.max(z, 0) + Math.log1p(Math.exp(-Math.abs(z))) - target * z : null,
    derivative: eligible ? p - target : null,
  };
}
export function firstError(scores, threshold) {
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] === null) return null;
    if (scores[i] < threshold) return i;
  }
  return -1;
}
export function localization(predicted, targets) {
  const error = targets
    .map((target, index) => [target, predicted[index]])
    .filter(([target]) => target !== null && target >= 0);
  const correct = targets
    .map((target, index) => [target, predicted[index]])
    .filter(([target]) => target === -1);
  const a = error.length ? error.filter(([x, y]) => x === y).length / error.length : null;
  const b = correct.length ? correct.filter(([x, y]) => x === y).length / correct.length : null;
  return {
    a,
    b,
    errors: error.length,
    correct: correct.length,
    h: a === null || b === null ? null : a + b === 0 ? 0 : (2 * a * b) / (a + b),
  };
}
export function binomial(value, budget) {
  if (!budget) return { distribution: [1], hard: null, mean: null, variance: null };
  let choose = 1;
  const distribution = Array.from({ length: budget + 1 }, (_, k) => {
    if (k) choose *= (budget - k + 1) / k;
    return choose * value ** k * (1 - value) ** (budget - k);
  });
  return {
    distribution,
    hard: 1 - (1 - value) ** budget,
    mean: value,
    variance: (value * (1 - value)) / budget,
  };
}
export function policy(q = 0.6, a = 0.8, b = 0.2, baseline = false) {
  const expected = q * a + (1 - q) * b;
  const gradient = [0, 0, 0];
  const leaves = [];
  for (const [branch, branchMass, successP] of [
    ['A', q, a],
    ['B', 1 - q, b],
  ]) {
    for (const success of [1, 0]) {
      const mass = branchMass * (success ? successP : 1 - successP);
      const score = [
        (branch === 'A' ? 1 : 0) - q,
        branch === 'A' ? success - a : 0,
        branch === 'B' ? success - b : 0,
      ];
      const bases = [expected, branch === 'A' ? a : 0, branch === 'B' ? b : 0];
      const credit = score.map((_, index) => success - (baseline ? bases[index] : 0));
      const contribution = score.map((value, index) => mass * value * credit[index]);
      contribution.forEach((value, index) => {
        gradient[index] += value;
      });
      leaves.push({ branch, success, mass, score, credit, contribution });
    }
  }
  return { expected, gradient, leaves };
}
export function shaping(potentials, gamma) {
  const bonuses = potentials.slice(1).map((next, index) => gamma * next - potentials[index]);
  const weighted = bonuses.map((value, index) => gamma ** index * value);
  return {
    bonuses,
    weighted,
    sum: weighted.reduce((a, b) => a + b, 0),
    omitted: weighted.slice(0, -1).reduce((a, b) => a + b, 0),
    telescoped: -potentials[0] + gamma ** bonuses.length * potentials.at(-1),
  };
}
export const finiteNodes = [
  { id: 'root', parent: null, x: 320, y: 35, local: 1, value: 0.5, text: '2(x+1)=8' },
  { id: 'A', parent: 'root', x: 160, y: 130, local: 0.6, value: 0.8, text: '2x=6' },
  { id: 'B', parent: 'root', x: 480, y: 130, local: 0.9, value: 0.2, text: '2x=8' },
  { id: 'A1', parent: 'A', x: 80, y: 235, local: 0.95, value: 1, reward: 1, text: 'x=3' },
  { id: 'A2', parent: 'A', x: 240, y: 235, local: 0.4, value: 0, reward: 0, text: 'x=6' },
  { id: 'B1', parent: 'B', x: 400, y: 235, local: 0.5, value: 0, reward: 0, text: 'x=4' },
  { id: 'B2', parent: 'B', x: 560, y: 235, local: 0.4, value: 0, reward: 0, text: 'x=8' },
];
export function beam(width, depth = 2, family = 'product') {
  let frontier = [{ node: finiteNodes[0], scores: [], path: [] }];
  let scored = 0;
  const layers = [];
  for (let level = 0; level < depth; level++) {
    const expanded = frontier.flatMap((item) =>
      finiteNodes
        .filter((node) => node.parent === item.node.id)
        .map((node) => {
          const scores = [...item.scores, node.local];
          return {
            node,
            scores,
            path: [...item.path, node.id],
            score: family === 'value' ? node.value : aggregate(scores, family),
          };
        }),
    );
    scored += expanded.length;
    frontier = [...expanded]
      .sort((a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id))
      .slice(0, width);
    layers.push({
      kept: frontier.map((item) => item.node.id),
      scored: expanded.map((item) => item.node.id),
      pruned: expanded
        .filter((item) => !frontier.some((kept) => kept.node.id === item.node.id))
        .map((item) => item.node.id),
    });
  }
  const completed = frontier.filter((item) => item.node.reward !== undefined);
  return { layers, scored, selected: completed[0] || null };
}
// These lexical calculations implement the frozen Python feature contract.
export function lexemes(text) {
  return text.match(/[\p{L}\p{Nl}\p{No}]+|\p{Nd}+(?:\.\p{Nd}+)?|[^\s]/gu) || [];
}
export async function signedFeatures(text) {
  const words = lexemes(text);
  const vector = Array(512).fill(0);
  const trace = [];
  for (const word of words) {
    const bytes = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(word)),
    );
    // Modulo512 only needs the low nine bits of this big-endian eight-byte integer.
    const bucket = (bytes[6] & 1) * 256 + bytes[7];
    const sign = bytes[8] & 1 ? -1 : 1;
    vector[bucket] += sign;
    trace.push({
      word,
      bucket,
      sign,
      digest: [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join(''),
    });
  }
  const scale = words.length ? Math.sqrt(words.length) : 1;
  return { vector: vector.map((value) => value / scale), trace };
}
export async function inspect(model, example, initial = false) {
  const prefix = await signedFeatures([example.question, ...example.prefix_steps].join('\n'));
  const current = await signedFeatures(example.current_step);
  const x = [...prefix.vector, ...current.vector];
  const weights = initial ? model.initial_weights : model.weights;
  const bias = initial ? model.initial_bias : model.bias;
  const logits = bias.map(
    (value, column) =>
      value + x.reduce((sum, feature, row) => sum + feature * weights[row][column], 0),
  );
  const maximum = Math.max(...logits);
  const masses = logits.map((value) => Math.exp(value - maximum));
  const total = masses.reduce((a, b) => a + b, 0);
  return {
    x,
    prefix,
    current,
    logits,
    probabilities: masses.map((value) => value / total),
    weights,
  };
}
