// Constructed teaching arithmetic. Recorded model results are loaded separately.
export const tokens = ['door', 'window', 'garden', 'river', 'EOS'];
export const base = [0.5, 0.25, 0.125, 0.0625, 0.0625];
export const peaked = [0.9, 0.04, 0.03, 0.02, 0.01];
export const flat = Array(5).fill(0.2);
export const tied = [0.4, 0.4, 0.1, 0.05, 0.05];
export const sum = (values) => values.reduce((a, b) => a + b, 0);
export function softmax(scores) {
  const maximum = Math.max(...scores);
  if (!Number.isFinite(maximum)) return null;
  const weights = scores.map((score) => Math.exp(score - maximum));
  const total = sum(weights);
  return weights.map((weight) => weight / total);
}
export function temperature(p, t) {
  if (!(t > 0)) throw new Error('Temperature must be positive');
  return softmax(p.map((value) => (value > 0 ? Math.log(value) / t : -Infinity)));
}
export function entropy(p) {
  return -sum(p.map((value) => (value > 0 ? value * Math.log(value) : 0)));
}
export function entropyDerivative(p, t) {
  const q = temperature(p, t);
  const logs = p.map((value) => Math.log(value));
  const mean = sum(logs.map((value, i) => value * q[i]));
  const variance = sum(logs.map((value, i) => (value - mean) ** 2 * q[i]));
  return { entropy: entropy(q), variance, derivative: variance / t ** 3 };
}
export function categorical(p, u) {
  let mass = 0;
  for (let i = 0; i < p.length; i += 1) {
    mass += p[i];
    if (u < mass) return i;
  }
  return p.findLastIndex((value) => value > 0);
}
export function filter(p, kind, amount, exact = false) {
  const order = p
    .map((value, id) => ({ value, id }))
    .sort((a, b) => b.value - a.value || a.id - b.id);
  let mask,
    cutoff = null,
    ranking = order.map((row) => row.id);
  if (kind === 'k') {
    cutoff = order[Math.min(p.length, amount) - 1].value;
    mask = p.map((value, id) => (exact ? ranking.slice(0, amount).includes(id) : value >= cutoff));
  } else if (kind === 'p') {
    let accumulated = 0;
    const kept = [];
    for (const row of order) {
      if (accumulated >= amount && kept.length) break;
      kept.push(row.id);
      accumulated += row.value;
    }
    mask = p.map((value, id) => (amount === 1 ? value > 0 : kept.includes(id)));
  } else if (kind === 'typical') {
    const h = entropy(p);
    const distances = p.map((value) => (value > 0 ? Math.abs(-Math.log(value) - h) : Infinity));
    ranking = p.map((_, id) => id).sort((a, b) => distances[a] - distances[b] || a - b);
    let accumulated = 0;
    for (const id of ranking) {
      accumulated += p[id];
      cutoff = distances[id];
      if (accumulated >= amount) break;
    }
    mask = distances.map((value) => value <= cutoff);
  } else {
    const peak = Math.max(...p);
    cutoff =
      kind === 'min'
        ? amount * peak
        : kind === 'eta'
          ? Math.min(amount, Math.sqrt(amount) * Math.exp(-entropy(p)))
          : amount;
    mask = p.map((value) => value >= cutoff || (kind !== 'min' && value === peak));
  }
  mask = mask.map((keep, id) => keep && p[id] > 0);
  const mass = sum(p.map((value, id) => (mask[id] ? value : 0)));
  return {
    mask,
    mass,
    cutoff,
    ranking,
    q: mass > 0 ? p.map((value, id) => (mask[id] ? value / mass : 0)) : null,
  };
}
export function repetition(scores, seen, penalty) {
  return scores.map((score, id) =>
    !seen.includes(id) ? score : score < 0 ? score * penalty : score / penalty,
  );
}
export function bans(history, n) {
  const map = new Map();
  for (let i = 0; i + n <= history.length; i += 1) {
    const key = history.slice(i, i + n - 1).join('|');
    map.set(key, [...new Set([...(map.get(key) || []), history[i + n - 1]])]);
  }
  const suffix = n === 1 ? '' : history.slice(-(n - 1)).join('|');
  return { map: [...map], suffix, banned: map.get(suffix) || [] };
}
export const tree = {
  '': [
    ['A', 0.6],
    ['B', 0.35],
    ['EOS', 0.05],
  ],
  A: [
    ['X', 0.45],
    ['Y', 0.4],
    ['EOS', 0.15],
  ],
  B: [
    ['X', 0.9],
    ['EOS', 0.1],
  ],
  'A X': [['EOS', 1]],
  'A Y': [['EOS', 1]],
  'B X': [['EOS', 1]],
};
export function beam(width = 2, horizon = 3, fixture = 'standard') {
  const scores =
    fixture === 'early'
      ? {
          '': [
            ['A', 0.6],
            ['EOS', 0.4],
          ],
          A: [
            ['X', 0.5],
            ['Y', 0.5],
          ],
          'A X': [['EOS', 1]],
          'A Y': [['EOS', 1]],
        }
      : tree;
  let alive = [{ path: '', probability: 1, parent: null }],
    finished = [];
  const states = [{ alive, finished, candidates: [] }];
  for (let step = 0; step < horizon && alive.length; step += 1) {
    const candidates = alive.flatMap((parent, index) =>
      (fixture === 'no-eos'
        ? [
            ['A', 0.6],
            ['B', 0.4],
          ]
        : scores[parent.path] || [['EOS', 1]]
      ).map(([token, edge]) => ({
        path: [parent.path, token].filter(Boolean).join(' '),
        probability: parent.probability * edge,
        parent: index,
        edge,
        token,
      })),
    );
    candidates.sort((a, b) => b.probability - a.probability || a.path.localeCompare(b.path));
    finished = [...finished, ...candidates.filter((row) => row.token === 'EOS')]
      .sort((a, b) => b.probability - a.probability)
      .slice(0, width);
    alive = candidates.filter((row) => row.token !== 'EOS').slice(0, width);
    states.push({ alive, finished, candidates });
  }
  return states;
}
export function localGlobal(a, b) {
  const accepted = [0.6 * a, 0.4 * b],
    mass = sum(accepted);
  return {
    accepted,
    mass,
    global: mass ? accepted.map((x) => x / mass) : null,
    local: [a > 0 ? 0.6 : 0, b > 0 ? 0.4 : 0],
    failure: (a === 0 ? 0.6 : 0) + (b === 0 ? 0.4 : 0),
  };
}
export function work(vocabulary, width, steps, finishes, replenish) {
  const rows = Array.from({ length: steps }, (_, step) =>
    step === 0 || replenish ? width : width - finishes,
  );
  return { rows, cells: rows.map((n) => n * vocabulary), total: sum(rows) * vocabulary };
}
