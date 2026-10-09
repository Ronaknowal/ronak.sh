// Bounded teaching arithmetic. No estimator, random fit or historical main runs here.
export const X0 = [[2, 1, 3], [1, 3, 4], [0, 2, 2]];
export const H0 = [[1, 0, 1], [0, 1, 1]];
export const W0 = [[2, 1], [1, 3], [0, 2]];
export const onesW = [[1, 1], [1, 1], [1, 1]],
  onesH = [[1, 1, 1], [1, 1, 1]];
export const transpose = a => a[0].map((_, j) => a.map(r => r[j]));
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const matmul = (a, b) => a.map(r => transpose(b).map(c => dot(r, c)));
export const add = (a, b) => a.map((r, i) => r.map((v, j) => v + b[i][j]));
export const scale = (a, s) => a.map(r => r.map(v => v * s));
export const subtract = (a, b) => a.map((r, i) => r.map((v, j) => v - b[i][j]));
export const sum = a => a.flat().reduce((s, v) => s + v, 0);
export const halfLoss = (x, y, mask) => x.reduce((s, r, i) => s + r.reduce((t, v, j) => t + (mask?.[i]?.[j] ?? 1) * (v - y[i][j]) ** 2 / 2, 0), 0);
export const norm2 = a => dot(a, a);
export const clamp = (v, l, h) => Math.max(l, Math.min(h, v));
export const close = (a, b, t = 1e-10) => Math.abs(a - b) <= t * Math.max(1, Math.abs(a), Math.abs(b));
export function table(values, {
  nonnegative = true
} = {}) {
  if (!Array.isArray(values) || !values.length || !Array.isArray(values[0]) || !values[0].length) throw Error('Supply a nonempty rectangular real table.');
  const d = values[0].length;
  if (values.some(r => !Array.isArray(r) || r.length !== d || r.some(v => typeof v !== 'number' || !Number.isFinite(v) || nonnegative && v < 0))) throw Error('Values must be finite, real, rectangular and nonnegative.');
  return values.map(r => r.slice());
}
export function coordinateBlock(x, w, h, {
  l1 = 0,
  l2 = 0
} = {}) {
  x = table(x);
  w = table(w);
  h = table(h);
  if (x.length !== w.length || x[0].length !== h[0].length || w[0].length !== h.length) throw Error('Coordinate shapes disagree.');
  const g = matmul(h, transpose(h)),
    p = matmul(x, transpose(h)),
    trace = [{
      w: w.map(r => r.slice()),
      loss: halfLoss(x, matmul(w, h)),
      component: null
    }];
  for (let c = 0; c < h.length; c++) {
    for (let i = 0; i < w.length; i++) {
      const other = w[i].reduce((s, v, t) => s + (t === c ? 0 : v * g[t][c]), 0),
        den = g[c][c] + l2;
      if (den === 0) {
        if (p[i][c] !== 0) throw Error('Inconsistent flat coordinate.');
        w[i][c] = 0;
      } else w[i][c] = Math.max(0, (p[i][c] - other - l1) / den);
    }
    trace.push({
      w: w.map(r => r.slice()),
      loss: halfLoss(x, matmul(w, h)),
      component: c
    });
  }
  return {
    w,
    g,
    p,
    trace
  };
}
export function cdSweep(x, w, h) {
  const first = coordinateBlock(x, w, h),
    second = coordinateBlock(transpose(x), transpose(h), transpose(first.w));
  return {
    w: first.w,
    h: transpose(second.w),
    wTrace: first.trace,
    hTrace: second.trace
  };
}
export function muSweep(x, w, h) {
  const ratio = (a, b) => a.map((r, i) => r.map((v, j) => b[i][j] === 0 ? v === 0 ? 1 : (() => {
    throw Error('Positive numerator over zero denominator.');
  })() : v / b[i][j]));
  const multiply = (a, b) => a.map((r, i) => r.map((v, j) => v * b[i][j]));
  const hn = matmul(transpose(w), x),
    hd = matmul(matmul(transpose(w), w), h),
    nextH = multiply(h, ratio(hn, hd));
  const wn = matmul(x, transpose(nextH)),
    wd = matmul(w, matmul(nextH, transpose(nextH))),
    nextW = multiply(w, ratio(wn, wd));
  return {
    w: nextW,
    h: nextH,
    hn,
    hd,
    wn,
    wd
  };
}
export function divergence(x, y, beta = 2) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) throw Error('Loss needs finite nonnegative values.');
  if (beta === 2) return (x - y) ** 2 / 2;
  if (beta === 1) {
    if (x === 0) return y;
    if (y === 0) throw Error('Positive observation over zero prediction has infinite KL.');
    return x * Math.log(x / y) - x + y;
  }
  if (x <= 0 || y <= 0) throw Error('This beta illustration requires positive observation and prediction.');
  if (beta === 0) return x / y - Math.log(x / y) - 1;
  return (x ** beta + (beta - 1) * y ** beta - beta * x * y ** (beta - 1)) / (beta * (beta - 1));
}
export const gamma = b => b < 1 ? 1 / (2 - b) : b <= 2 ? 1 : 1 / (b - 1);
export function coneQuery(u, v) {
  const w = v <= u ? [u - v, v] : [0, (u + v) / 2];
  return {
    w,
    prediction: [w[0] + w[1], w[1]]
  };
}
export function shear(t) {
  return {
    w: [[2, 1 + 2 * t]],
    h: [[1, 1 - t, 1 - t], [0, 1, 1]],
    product: [[2, 3, 3]]
  };
}
export function signPair(a) {
  const u = [a, -Math.sqrt(Math.max(0, 1 - a * a))],
    v = [.6, -.8];
  const positive = Math.max(u[0], 0) * .6,
    negative = Math.max(-u[1], 0) * .8;
  const choosePositive = positive >= negative,
    weight = 5 * (choosePositive ? positive : negative);
  return {
    u,
    v,
    positive,
    negative,
    choosePositive,
    term: choosePositive ? [[weight, 0], [0, 0]] : [[0, 0], [0, weight]]
  };
}
export const normalizedRows = [[1, 0], [0, 1], [.75, .25], [.25, .75]];
export function anchorStep(rows, ids, k) {
  const active = rows.map((r, i) => ({
    id: ids[i],
    original: r,
    amount: r.reduce((s, v) => s + v, 0)
  })).filter(r => r.amount > 0).map(r => ({
    ...r,
    unit: r.original.map(v => v / r.amount)
  }));
  let residuals = active.map(r => r.unit.slice());
  const chosen = [],
    states = [residuals.map(r => r.slice())];
  for (let step = 0; step < k; step++) {
    const order = active.map((r, i) => ({
      i,
      norm: norm2(residuals[i]),
      originalNorm: norm2(r.unit),
      id: r.id
    })).sort((a, b) => b.norm - a.norm || b.originalNorm - a.originalNorm || a.id - b.id);
    const pick = order[0];
    if (!pick || pick.norm < 1e-20) throw Error('Requested independent direction is unsupported.');
    const direction = residuals[pick.i].map(v => v / Math.sqrt(pick.norm));
    chosen.push(pick.id);
    residuals = residuals.map(r => r.map((v, j) => v - dot(r, direction) * direction[j]));
    states.push(residuals.map(r => r.slice()));
  }
  return {
    active,
    chosen,
    states
  };
}
export function staleCode(h) {
  const den = 2 * h * h + 1,
    w = [(4 * h + 2) / den, (4 * h * h - 2 * h + 1) / den],
    dictionary = [[h, 0, 1], [0, 1, 1]];
  return {
    w,
    dictionary,
    oldPrediction: matmul([[2, 1]], dictionary)[0],
    freshPrediction: matmul([w], dictionary)[0]
  };
}
export const fmt = v => typeof v === 'number' ? Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(6)).toString() : String(v);
