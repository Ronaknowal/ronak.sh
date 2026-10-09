export const COLORS = ['#75b7fa', '#edb864', '#bca0ed', '#ef9fba'];
export const DOCUMENTS = ['A', 'B', 'C', 'D'];
export const sigmoid = (x) => (x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)));
// Python str.split()/strip() whitespace; U+FEFF is not whitespace in Python.
const pythonWhitespace = /[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/u;
const pythonWords = (text) => text.split(pythonWhitespace).filter(Boolean);
export function repetition(text) {
  const lines = text
    .split(/\r\n|[\n\r\u000b\u000c\u001c-\u001e\u0085\u2028\u2029]/u)
    .map((line) => pythonWords(line).join(' '))
    .filter(Boolean);
  const seen = new Set();
  const rows = lines.map((line) => {
    const duplicate = seen.has(line);
    seen.add(line);
    return { line, duplicate, characters: Array.from(line).length };
  });
  const characters = rows.reduce((a, row) => a + row.characters, 0);
  const duplicateLines = rows.filter((row) => row.duplicate).length;
  const duplicateCharacters = rows.reduce((a, row) => a + (row.duplicate ? row.characters : 0), 0);
  return {
    rows,
    characters,
    duplicateLines,
    duplicateCharacters,
    lineShare: rows.length ? duplicateLines / rows.length : null,
    characterShare: characters ? duplicateCharacters / characters : null,
  };
}
export const SUPPORT = ['the', 'home', 'pendulum', 'energy', 'UNK'];
export const REFERENCE_COUNTS = {
  general: [3, 3, 0, 1, 0],
  target: [0, 0, 2, 3, 0],
  empty: [0, 0, 0, 0, 0],
};
export function reference(kind, alpha = 1) {
  const counts = REFERENCE_COUNTS[kind];
  if (!counts || !(alpha > 0)) throw new Error('Known reference and positive smoothing required');
  const denominator = counts.reduce((a, b) => a + b, 0) + alpha * counts.length;
  return { counts, denominator, probabilities: counts.map((c) => (c + alpha) / denominator) };
}
export function surprise(text, distribution) {
  const words = pythonWords(text);
  const rows = words.map((word) => {
    const index = SUPPORT.indexOf(word);
    const bucket = index >= 0 && word !== 'UNK' ? index : SUPPORT.length - 1;
    const probability = distribution.probabilities[bucket];
    return { word, bucket: SUPPORT[bucket], probability, loss: -Math.log(probability) };
  });
  const total = rows.reduce((a, row) => a + row.loss, 0);
  const mean = rows.length ? total / rows.length : null;
  return { rows, total, mean, perplexity: mean === null ? null : Math.exp(mean) };
}
export function gradientStep({
  x = [0.6, 0.8],
  w = [0.4, -0.2],
  b = 0.1,
  label = 1,
  l2 = 0.1,
  rate = 0.1,
} = {}) {
  const z = x.reduce((a, v, i) => a + v * w[i], b);
  const p = sigmoid(z);
  const dataLoss = Math.max(z, 0) - z * label + Math.log1p(Math.exp(-Math.abs(z)));
  const residual = p - label;
  const dataGradient = x.map((v) => v * residual);
  const penaltyGradient = w.map((v) => l2 * v);
  const gradient = dataGradient.map((v, i) => v + penaltyGradient[i]);
  const next = w.map((v, i) => v - rate * gradient[i]);
  const nextBias = b - rate * residual;
  return {
    z,
    p,
    dataLoss,
    loss: dataLoss + (l2 / 2) * w.reduce((a, v) => a + v * v, 0),
    residual,
    dataGradient,
    penaltyGradient,
    gradient,
    next,
    nextBias,
    nextProbability: sigmoid(x.reduce((a, v, i) => a + v * next[i], nextBias)),
  };
}
export function select(rows, mode, value) {
  const ranked = [...rows].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id, 'en'));
  return mode === 'count' ? ranked.slice(0, value) : ranked.filter((row) => row.score >= value);
}
export function metrics(rows, selected) {
  const ids = new Set(selected.map((row) => row.id));
  const cells = { tp: [], fp: [], fn: [], tn: [] };
  rows.forEach((row) =>
    cells[ids.has(row.id) ? (row.label ? 'tp' : 'fp') : row.label ? 'fn' : 'tn'].push(row.id),
  );
  const { tp, fp, fn, tn } = Object.fromEntries(
    Object.entries(cells).map(([k, v]) => [k, v.length]),
  );
  const ratio = (a, b) => (b ? a / b : null);
  return {
    cells,
    tp,
    fp,
    fn,
    tn,
    precision: ratio(tp, tp + fp),
    recall: ratio(tp, tp + fn),
    f1: ratio(2 * tp, 2 * tp + fp + fn),
    brier: rows.length
      ? rows.reduce((a, row) => a + (row.score - row.label) ** 2, 0) / rows.length
      : null,
  };
}
export function calibration(rows) {
  return Array.from({ length: 5 }, (_, i) => {
    const members = rows.filter((row) => Math.min(Math.floor(row.score * 5), 4) === i);
    return {
      low: i / 5,
      high: (i + 1) / 5,
      count: members.length,
      score: members.length ? members.reduce((a, row) => a + row.score, 0) / members.length : null,
      frequency: members.length
        ? members.reduce((a, row) => a + row.label, 0) / members.length
        : null,
    };
  });
}
export function connectedGroups(ids, edges) {
  const parent = Object.fromEntries(ids.map((id) => [id, id]));
  const find = (id) => (parent[id] === id ? id : (parent[id] = find(parent[id])));
  for (const [a, b] of edges) parent[find(b)] = find(a);
  const groups = {};
  for (const id of ids) (groups[find(id)] ??= []).push(id);
  return Object.values(groups);
}
export function roundEven(x) {
  const low = Math.floor(x),
    fraction = x - low;
  return fraction === 0.5 ? (low % 2 === 0 ? low : low + 1) : Math.round(x);
}
export function neuralPolicy(raw) {
  const clamped = Math.max(0, Math.min(5, raw));
  const integer = roundEven(clamped);
  return { clamped, integer, keep: integer >= 3 };
}
export function rankPercentiles(scores) {
  const ordered = Object.keys(scores).sort((a, b) => scores[a] - scores[b] || a.localeCompare(b));
  const result = {};
  for (let start = 0; start < ordered.length; ) {
    let end = start + 1;
    while (end < ordered.length && scores[ordered[end]] === scores[ordered[start]]) end++;
    for (let j = start; j < end; j++)
      result[ordered[j]] =
        ordered.length === 1 ? 0.5 : (start + end - 1) / (2 * (ordered.length - 1));
    start = end;
  }
  return result;
}
export function pipelineAudit(rows, order) {
  return rows.map((row) => {
    const failures = order.filter((name) => !row[name]);
    return { id: row.id, failures, first: failures[0] ?? null, keep: failures.length === 0 };
  });
}
export function costLedger(n, costs, fractions) {
  let incoming = n;
  const stages = costs.map((cost, i) => {
    const row = { incoming, cost, work: incoming * cost };
    incoming *= fractions[i];
    return row;
  });
  return { stages, total: stages.reduce((a, row) => a + row.work, 0), remaining: incoming };
}
