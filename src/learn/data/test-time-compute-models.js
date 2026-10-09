// Finite mechanisms for the lesson; no neural generation or evaluator gold here.
export const candidateColors = [
  '#7db8ff',
  '#b5a0ff',
  '#ffc56b',
  '#79d8e8',
  '#f498ba',
  '#e8ac80',
  '#c4c9e4',
  '#ddabe8',
];
export const pool = [
  { id: 'A', text: '5.5', answer: '11/2', score: 0.7 },
  { id: 'B', text: '11/2', answer: '11/2', score: 0.65 },
  { id: 'C', text: '7.5', answer: '15/2', score: 0.9 },
  { id: 'D', text: '2/11', answer: '2/11', score: 0.3 },
  { id: 'E', text: 'roughly five', answer: null, score: 0.95 },
];
export function select(rows, method = 'vote') {
  const valid = rows.filter((x) => x.answer != null);
  if (!valid.length) return null;
  if (method === 'best') return valid.reduce((a, b) => (b.score > a.score ? b : a)).answer;
  const groups = new Map();
  valid.forEach((x) => groups.set(x.answer, (groups.get(x.answer) || 0) + 1));
  return [...groups].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}
export function schedule(workers) {
  const free = Array(workers).fill(0);
  const jobs = Array.from({ length: 3 }, (_, i) => {
    const start = Math.min(...free),
      worker = free.indexOf(start);
    free[worker] = start + 2;
    return { id: 'ABC'[i], worker, start, end: start + 2 };
  });
  return { jobs, makespan: Math.max(...free), work: 6 };
}
export const opportunity = (p, n) => 1 - (1 - p) ** n;
export function plurality(probabilities, count) {
  const result = probabilities.map(() => 0);
  function walk(sequence, mass) {
    if (sequence.length === count) {
      const counts = probabilities.map((_, i) => sequence.filter((x) => x === i).length);
      const largest = Math.max(...counts);
      result[sequence.find((x) => counts[x] === largest)] += mass;
      return;
    }
    probabilities.forEach((p, i) => walk([...sequence, i], mass * p));
  }
  walk([], 1);
  return result;
}
export function risk(kind) {
  const actions = [0, 2, 10],
    weights = [0.4, 0.35, 0.25];
  const matrix = actions.map((a) =>
    actions.map((b) => (kind === 'absolute' ? Math.abs(a - b) : Number(a !== b))),
  );
  const risks = matrix.map((row) => row.reduce((s, x, j) => s + x * weights[j], 0));
  return { actions, weights, matrix, risks, selected: risks.indexOf(Math.min(...risks)) };
}
export const tree = [
  { id: 'root', x: 310, y: 40, step: '2(x+1)=8', local: 1, product: 1, value: 0.5 },
  { id: 'A', parent: 'root', x: 160, y: 135, step: '2x=6', local: 0.6, product: 0.6, value: 0.8 },
  { id: 'B', parent: 'root', x: 460, y: 135, step: '2x=8', local: 0.9, product: 0.9, value: 0.2 },
  { id: 'A1', parent: 'A', x: 80, y: 255, step: 'x=3', local: 0.95, product: 0.57, value: 1 },
  { id: 'A2', parent: 'A', x: 235, y: 255, step: 'x=6', local: 0.4, product: 0.24, value: 0 },
  { id: 'B1', parent: 'B', x: 390, y: 255, step: 'x=4', local: 0.5, product: 0.45, value: 0 },
  { id: 'B2', parent: 'B', x: 545, y: 255, step: 'x=8', local: 0.4, product: 0.36, value: 0 },
];
export function beam(width, depth, family = 'product') {
  let frontier = ['root'];
  const scored = [],
    kept = [];
  for (let level = 0; level < depth; level++) {
    const expanded = frontier.flatMap((parent) => tree.filter((n) => n.parent === parent));
    scored.push(...expanded.map((n) => n.id));
    frontier = [...expanded]
      .sort((a, b) => b[family] - a[family] || a.id.localeCompare(b.id))
      .slice(0, width)
      .map((n) => n.id);
    kept.push(...frontier);
  }
  return { scored, kept, selected: depth >= 2 ? frontier[0] : null };
}
export const revisions = [
  { id: 'R0', text: '11/2', answer: '11/2', score: 0.8 },
  { id: 'R1', text: '15/2', answer: '15/2', score: 0.7 },
  { id: 'R2', text: '7.5', answer: '15/2', score: 0.9 },
];
export function hybrid(breadth, depth) {
  const prompts = Array.from({ length: depth }, (_, j) => 20 + 10 * j);
  return {
    prompts,
    calls: breadth * depth,
    generated: 10 * breadth * depth,
    promptWork: breadth * prompts.reduce((a, b) => a + b, 0),
    critical: depth,
  };
}
export function controller(cap, context) {
  const allowance = Math.min(cap, context - 2),
    trace = [];
  let used = 0,
    stop = 'source_end';
  const segments = [
    ['15−4', '=11'],
    ['11/2', '=5.5'],
  ];
  for (let i = 0; i < segments.length; i++) {
    if (i > 0) {
      if (used >= allowance) {
        stop = 'thinking_cap';
        break;
      }
      trace.push({ phase: 'continue', token: 'Wait', charged: true });
      used++;
    }
    for (const token of segments[i]) {
      if (used >= allowance) {
        stop = 'thinking_cap';
        break;
      }
      trace.push({ phase: 'think', token, charged: true });
      used++;
    }
    if (used >= allowance) {
      stop = 'thinking_cap';
      break;
    }
    trace.push({ phase: 'boundary', token: 'boundary', charged: false });
  }
  trace.push(...['Answer:', '5.5'].map((token) => ({ phase: 'final', token, charged: true })));
  return { trace, used, charged: used + 2, stop, complete: true };
}
export const allocationValues = [
  [40, 70, 75],
  [20, 35, 65],
];
export function allocation(budget, overhead) {
  const points = allocationValues[0].flatMap((a, i) =>
    allocationValues[1].map((b, j) => ({ choices: [i, j], work: i + j, value: a + b })),
  );
  const feasible = points.filter((p) => p.work + overhead <= budget);
  // Iteration is already lexicographic; keep the first equal optimum.
  const selected = feasible.reduce((best, p) => (!best || p.value > best.value ? p : best), null);
  return { points, selected };
}
export const exchange = (y, m) => ({
  total: m * (100 + y),
  inference: m * (100 + y) - 100,
  multiplier: (m * (100 + y) - 100) / y,
});
