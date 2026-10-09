// Browser mechanisms mirror the complete Python programs. All inputs here are
// constructed teaching states; measured results are imported separately.
export const MIX_COLORS = ['#70b8ff', '#efbc68', '#bd9aff', '#ec96b2', '#65cdd3'];
export const normalize = (values) => {
  if (
    !values.length ||
    values.some((v) => !Number.isFinite(v) || v < 0) ||
    !values.some((v) => v > 0)
  )
    throw new Error('Use finite nonnegative mass with positive total.');
  const max = Math.max(...values),
    scaled = values.map((v) => v / max),
    sum = scaled.reduce((a, b) => a + b, 0);
  return scaled.map((v) => v / sum);
};
export const tokenShares = (p, lengths) => normalize(p.map((v, i) => v * lengths[i]));
export function powerShares(masses, alpha) {
  const logs = masses.map((v) => (v > 0 ? alpha * Math.log(v) : -Infinity)),
    max = Math.max(...logs);
  return normalize(logs.map((v) => Math.exp(v - max)));
}
export function quotas(q, budget) {
  const exact = normalize(q).map((v) => v * budget),
    result = exact.map(Math.floor);
  const order = exact
    .map((v, i) => ({ i, remainder: v - result[i] }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  const remaining = budget - result.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i++) result[order[i].i]++;
  return result;
}
export function updateWeights(q, signals, eta = 1, smoothing = 0.1) {
  const logs = q.map((v, i) => (v > 0 ? Math.log(v) + eta * signals[i] : -Infinity)),
    max = Math.max(...logs);
  return normalize(logs.map((v) => Math.exp(v - max))).map(
    (v) => (1 - smoothing) * v + smoothing / q.length,
  );
}
export function pacing(scores, progress, ramp = 1, reverse = false, full = false) {
  if (full) return scores.map(() => 1 / scores.length);
  const count = Math.max(
    1,
    Math.ceil((0.25 + 0.75 * Math.min(progress / ramp, 1)) * scores.length),
  );
  const order = scores
    .map((v, i) => ({ v, i }))
    .sort((a, b) => (reverse ? b.v - a.v : a.v - b.v) || a.i - b.i);
  return scores.map((_, i) => (order.slice(0, count).some((row) => row.i === i) ? 1 / count : 0));
}
export function orderPath(centers, rate) {
  return centers.reduce(
    (rows, center) => [...rows, rows.at(-1) - rate * (rows.at(-1) - center)],
    [0],
  );
}
// A transparent fixed uniform stream, deliberately distinct from Python/HF PRNGs.
export function sampleRecords(policy = 'wrap', count = 12, probability = 0.5) {
  const uniforms = [0.1, 0.7, 0.3, 0.9, 0.2, 0.6, 0.8, 0.4, 0.95, 0.05, 0.55, 0.45];
  const cursor = [0, 0],
    epoch = [0, 0],
    sizes = [2, 4],
    records = [];
  for (let step = 0; step < count; step++) {
    const u = uniforms[step % uniforms.length];
    let d = u < probability ? 0 : 1;
    if (policy === 'once') {
      const active = [0, 1].filter((i) => cursor[i] < sizes[i]);
      if (!active.length) break;
      if (active.length === 1) d = active[0];
    }
    if (cursor[d] === sizes[d]) {
      if (policy === 'first_exhausted') break;
      cursor[d] = 0;
      epoch[d]++;
    }
    records.push({
      domain: d,
      id: `${d ? 'B' : 'A'}${cursor[d]++}`,
      epoch: epoch[d],
      targets: d ? 8 : 2,
      u,
    });
  }
  return {
    records,
    cursor,
    epoch,
    targets: [0, 1].map((d) =>
      records.filter((r) => r.domain === d).reduce((s, r) => s + r.targets, 0),
    ),
  };
}
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const responseValue = (r, coefficients) =>
  coefficients[0] + Math.exp(coefficients[1] + coefficients[2] * r[0] + coefficients[3] * r[1]);
