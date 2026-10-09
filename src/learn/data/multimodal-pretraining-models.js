// Teaching mechanisms; full learner programs and measured weights live in public/learn-code.
export const IMAGES = [
  [1, 0],
  [0, 1],
  [-1, 0],
];
export const TEXTS = [
  [1, 0],
  [0.6, 0.8],
  [-1, 0],
];
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const transpose = (a) => a[0].map((_, j) => a.map((r) => r[j]));
export const matmul = (a, b) => a.map((r) => transpose(b).map((c) => dot(r, c)));
export const lse = (a) => {
  const m = Math.max(...a);
  return m + Math.log(a.reduce((s, x) => s + Math.exp(x - m), 0));
};
export const softmax = (a) => {
  const z = lse(a);
  return a.map((x) => Math.exp(x - z));
};
export function normalize(a) {
  const n = Math.hypot(...a);
  return n > 1e-12 ? a.map((v) => v / n) : null;
}
export const BASE_SCORES = matmul(IMAGES, transpose(TEXTS)).map((r) => r.map((x) => 2 * x));
export function paired(scores) {
  const n = scores.length;
  if (!n || scores.some((r) => r.length !== n || r.some((v) => !Number.isFinite(v)))) return null;
  const rowP = scores.map(softmax),
    colP = transpose(transpose(scores).map(softmax));
  const rowLoss = scores.map((r, i) => lse(r) - r[i]);
  const colLoss = transpose(scores).map((r, i) => lse(r) - r[i]);
  const loss = [...rowLoss, ...colLoss].reduce((s, v) => s + v, 0) / (2 * n);
  return {
    rowP,
    colP,
    rowLoss,
    colLoss,
    loss,
    gradient: scores.map((r, i) =>
      r.map((_, j) => (rowP[i][j] + colP[i][j] - 2 * (i === j)) / (2 * n)),
    ),
  };
}
export function linearAlignment(
  wi = [
    [1, 0],
    [0, 1],
  ],
  wt = [
    [1, 0],
    [0, 1],
  ],
  a = Math.log(2),
) {
  const rawU = matmul(IMAGES, transpose(wi)),
    rawV = matmul(TEXTS, transpose(wt));
  const u = rawU.map(normalize),
    v = rawV.map(normalize);
  if (u.includes(null) || v.includes(null)) return null;
  const scale = Math.exp(a),
    scores = matmul(u, transpose(v)).map((r) => r.map((x) => scale * x)),
    p = paired(scores);
  const du = matmul(p.gradient, v).map((r) => r.map((x) => scale * x));
  const dv = matmul(transpose(p.gradient), u).map((r) => r.map((x) => scale * x));
  const tangent = (g, unit, raw) =>
    g.map((r, i) => r.map((x, j) => (x - unit[i][j] * dot(r, unit[i])) / Math.hypot(...raw[i])));
  const drawU = tangent(du, u, rawU),
    drawV = tangent(dv, v, rawV);
  return {
    ...p,
    scores,
    u,
    v,
    du,
    dv,
    drawU,
    drawV,
    wi: matmul(transpose(drawU), IMAGES),
    wt: matmul(transpose(drawV), TEXTS),
    da: dot(p.gradient.flat(), scores.flat()),
  };
}
export function alignmentStep(rate) {
  const before = linearAlignment(),
    identity = [
      [1, 0],
      [0, 1],
    ];
  const wi = identity.map((r, i) => r.map((x, j) => x - rate * before.wi[i][j]));
  const wt = identity.map((r, i) => r.map((x, j) => x - rate * before.wt[i][j]));
  return { before, wi, wt, after: linearAlignment(wi, wt, Math.log(2) - rate * before.da) };
}
export function positiveSet(scores, mask) {
  if (mask.some((r) => !r.some(Boolean)) || transpose(mask).some((r) => !r.some(Boolean)))
    return null;
  const terms = (s, m) => s.map((r, i) => lse(r) - lse(r.filter((_, j) => m[i][j])));
  return (
    [...terms(scores, mask), ...terms(transpose(scores), transpose(mask))].reduce(
      (s, v) => s + v,
      0,
    ) /
    (2 * scores.length)
  );
}
export const softplus = (x) => Math.max(0, x) + Math.log1p(Math.exp(-Math.abs(x)));
export function sigmoidPairs(scores, mask, bias) {
  const terms = scores.map((r, i) =>
    r.map((s, j) => softplus(-(mask[i][j] ? 1 : -1) * (s + bias))),
  );
  return { terms, loss: terms.flat().reduce((s, v) => s + v, 0) / scores.length };
}
export function savedForward(data, pixels) {
  const w = data.weights;
  const linear = (x, weight, bias) => weight.map((r, i) => dot(r, x) + bias[i]);
  const h = linear(
    pixels.map((v) => v / 16),
    w['image.0.weight'],
    w['image.0.bias'],
  ).map(Math.tanh);
  const raw = linear(h, w['image.2.weight'], w['image.2.bias']);
  const vector = normalize(raw);
  if (!vector) return null;
  const scale = Math.exp(w.logit_scale),
    scores = data.caption_vectors.map((v) => scale * dot(vector, v));
  return {
    hidden: h,
    vector,
    scores,
    probabilities: softmax(scores),
    predicted: scores.indexOf(Math.max(...scores)),
  };
}
export function queryRead(
  queryX = 1,
  valueX = -0.8,
  permissions = [
    [true, true, false, false],
    [false, true, true, true],
  ],
) {
  const q = [
      [queryX, 0],
      [0, 1],
    ],
    memory = [
      [1, 0],
      [0, 1],
      [1, 1],
      [-1, 0],
    ];
  const projected = matmul(
    q,
    transpose([
      [1, 0.2],
      [0.1, 1],
    ]),
  );
  const values = matmul(
    memory,
    transpose([
      [0.8, 0.1],
      [0.2, 1],
    ]),
  );
  values[3][0] = valueX;
  if (permissions.some((r) => !r.some(Boolean))) return null;
  const weights = projected.map((row, i) =>
    softmax(memory.map((m, j) => (permissions[i][j] ? dot(row, m) / Math.sqrt(2) : -Infinity))),
  );
  return { projected, memory, values, weights, output: matmul(weights, values) };
}
export function qformerMask(mode, q = 2, t = 3) {
  return Array.from({ length: q + t }, (_, i) =>
    Array.from(
      { length: q + t },
      (_, j) =>
        mode === 'ITM' ||
        (i < q && j < q) ||
        (mode === 'ITC' && i >= q && j >= q) ||
        (mode === 'ITG' && i >= q && (j < q || j <= i)),
    ),
  );
}
export function detailCounts(height, width, patch, queries, text) {
  if (height % patch || width % patch || Math.min(height, width, patch, queries, text) <= 0)
    return null;
  const n = ((height / patch) * width) / patch;
  return {
    n,
    vision: n * n,
    directPositions: text + n,
    direct: (text + n) ** 2,
    queryPositions: text + queries,
    queryPrefix: (text + queries) ** 2,
    queryRead: queries * n,
    textOnly: text * text,
    memoryRead: text * queries,
  };
}
