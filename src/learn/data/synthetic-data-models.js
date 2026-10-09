// Executable teaching calculations. Recorded neural measurements load separately.
export const COLORS = ['#f2bc63', '#b6a0ef', '#76c7e2', '#ef9daa'];
export const BASE = [0.55, 0.25, 0.15, 0.05];
export const TOKEN_NAMES = ['Alice', 'she', 'rabbit', 'EOS'];

export function sampling(masses = BASE, temperature = 1, topP = 0.8) {
  if (!(temperature > 0) || !(topP > 0 && topP <= 1)) throw new Error('Invalid sampling setting');
  const logs = masses.map((p) => Math.log(p));
  const max = Math.max(...logs);
  const weights = logs.map((x) => Math.exp((x - max) / temperature));
  const total = weights.reduce((a, b) => a + b, 0);
  const probabilities = weights.map((x) => x / total);
  const order = probabilities
    .map((_, i) => i)
    .sort((a, b) => probabilities[b] - probabilities[a] || a - b);
  let cumulative = 0;
  const kept = [];
  for (const i of order) {
    kept.push(i);
    cumulative += probabilities[i];
    if (cumulative >= topP) break;
  }
  const nucleus = probabilities.map((p, i) => (kept.includes(i) ? p / cumulative : 0));
  return { probabilities, order, kept, nucleus, retainedMass: cumulative };
}

export function inverseCDF(probabilities, u) {
  if (!(u >= 0 && u < 1)) throw new Error('Use a draw in [0, 1)');
  if (
    !Array.isArray(probabilities) ||
    !probabilities.length ||
    probabilities.some((p) => !Number.isFinite(p) || p < 0) ||
    Math.abs(probabilities.reduce((a, b) => a + b, 0) - 1) > 1.001e-5
  )
    throw new Error('Expected a normalized probability vector');
  const support = probabilities.map((p, i) => ({ p, i })).filter((x) => x.p > 0);
  const total = support.reduce((a, b) => a + b.p, 0);
  let cumulative = 0;
  for (let j = 0; j < support.length; j++) {
    cumulative += support[j].p;
    if (u < cumulative / total || j === support.length - 1) return support[j].i;
  }
  throw new Error('Empty probability support');
}

export function sequence(draws = [0.8, 0.8], topP = 0.9) {
  const tables = [BASE, [0.1, 0.2, 0.1, 0.6], [0.15, 0.1, 0.05, 0.7], [0.05, 0.05, 0.1, 0.8]];
  let previous = 0;
  const rows = [];
  for (const u of draws) {
    const state = sampling(tables[previous], 1, topP);
    const token = inverseCDF(state.nucleus, u);
    rows.push({ previous, probabilities: state.nucleus, u, token });
    previous = token;
    if (token === 3) return { rows, termination: 'EOS' };
  }
  return { rows, termination: 'length cap' };
}

export function selection(prevalence = 0.6, tpr = 0.9, fpr = 0.2, cost = 0.05) {
  const tp = prevalence * tpr;
  const fp = (1 - prevalence) * fpr;
  const acceptance = tp + fp;
  return {
    tp,
    fp,
    fn: prevalence - tp,
    tn: 1 - prevalence - fp,
    acceptance,
    precision: acceptance ? tp / acceptance : null,
    recall: prevalence ? tp / prevalence : null,
    costPerKeep: acceptance ? cost / acceptance : null,
  };
}

export function selectedMass(q, acceptance) {
  const joint = q.map((p, i) => p * acceptance[i]);
  const total = joint.reduce((a, b) => a + b, 0);
  return { joint, total, conditional: total ? joint.map((x) => x / total) : null };
}

export function familyExposure(rewrites = 3) {
  const counts = [rewrites, 1];
  const total = rewrites + 1;
  const weights = counts.map((n) => n / total);
  return { counts, weights, effective: 1 / weights.reduce((a, w) => a + w * w, 0) };
}

export function random(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mixBatch(alpha = 0.5, seed = 17, batch = 16) {
  const rng = random(seed);
  return Array.from({ length: batch }, () => ({ generated: rng() < alpha, rank: rng() }));
}

export function windows(text, context = 32) {
  const bytes = [...new TextEncoder().encode(text)];
  return { bytes, count: Math.max(0, bytes.length - context) };
}

export const heterozygosity = (q) => 1 - q.reduce((a, p) => a + p * p, 0);
export function populationPath({
  rule = 'replace',
  population = 10,
  generations = 20,
  seed = 17,
  alpha = 0.5,
} = {}) {
  const q0 = [0.6, 0.3, 0.1];
  let q = [...q0];
  const rng = random(seed);
  const rows = [
    {
      generation: 0,
      distribution: q,
      H: heterozygosity(q),
      stored: population,
      counts: q.map((p) => p * population),
    },
  ];
  for (let g = 0; g < generations; g++) {
    const counts = [0, 0, 0];
    for (let i = 0; i < population; i++) counts[inverseCDF(rule === 'fresh' ? q0 : q, rng())]++;
    const empirical = counts.map((n) => n / population);
    if (rule === 'replace' || rule === 'fresh') q = empirical;
    else if (rule === 'anchor') q = empirical.map((p, i) => (1 - alpha) * q0[i] + alpha * p);
    else if (rule === 'accumulate') q = empirical.map((p, i) => (q[i] * (g + 1) + p) / (g + 2));
    else throw new Error('Unknown population rule');
    rows.push({
      generation: g + 1,
      counts,
      distribution: q,
      H: heterozygosity(q),
      stored:
        rule === 'accumulate'
          ? (g + 2) * population
          : rule === 'anchor'
            ? 2 * population
            : population,
    });
  }
  return rows;
}

export function expectedH(rule = 'replace', population = 10, generations = 20) {
  let h = 0.54;
  const values = [h];
  for (let g = 0; g < generations; g++) {
    h *= rule === 'replace' ? 1 - 1 / population : 1 - 1 / (population * (g + 2) ** 2);
    values.push(h);
  }
  return values;
}

export function populationEnsemble(population = 10, generations = 20, trials = 64) {
  const paths = Array.from({ length: trials }, (_, seed) =>
    populationPath({ population, generations, seed: seed + 100 }),
  );
  return {
    paths,
    mean: Array.from(
      { length: generations + 1 },
      (_, g) => paths.reduce((s, p) => s + p[g].H, 0) / trials,
    ),
    expected: expectedH('replace', population, generations),
  };
}

export function costLedger(generation = 0.04, verification = 0.01, acceptance = 0.62) {
  return {
    candidate: generation + verification,
    perKeep: acceptance > 0 ? (generation + verification) / acceptance : null,
    expectedAttempts: acceptance > 0 ? 1 / acceptance : null,
  };
}
