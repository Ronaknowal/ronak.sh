// Transparent scalar/tensor mechanisms. Real experiment curves are separate recorded data.
export const FORMATS = {
  e4m3: { name: 'E4M3FN', p: 3, bias: 7, maxCode: 126, max: 448, expBits: 4 },
  e5m2: { name: 'E5M2', p: 2, bias: 15, maxCode: 123, max: 57344, expBits: 5 },
};
export function decode(byte, name = 'e4m3') {
  const f = FORMATS[name], magnitude = byte & 127, sign = byte & 128 ? -1 : 1;
  if (magnitude > f.maxCode) return name === 'e5m2' && magnitude === 124 ? sign * Infinity : NaN;
  const exponent = magnitude >> f.p, fraction = magnitude % (2 ** f.p);
  return sign * (exponent === 0 ? fraction / 2 ** f.p * 2 ** (1 - f.bias)
    : (1 + fraction / 2 ** f.p) * 2 ** (exponent - f.bias));
}
export function encode(value, name = 'e4m3') {
  if (!Number.isFinite(value)) throw new Error('Finite input required');
  const f = FORMATS[name], x = Math.min(Math.abs(value), f.max);
  let low = 0, high = f.maxCode;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (decode(middle, name) <= x) low = middle; else high = middle;
  }
  const dl = x - decode(low, name), dh = decode(high, name) - x;
  const magnitude = dh < dl || (dh === dl && high % 2 === 0) ? high : low;
  return magnitude + (value < 0 || Object.is(value, -0) ? 128 : 0);
}
export const quantize = (value, name = 'e4m3') => decode(encode(value, name), name);
export function scaleTrace(values, name = 'e4m3', power = false, supplied = null) {
  const maximum = Math.max(...values.map(Math.abs));
  let scale = supplied ?? (maximum ? maximum / FORMATS[name].max : 1);
  if (power && maximum && supplied === null) scale = 2 ** Math.ceil(Math.log2(scale));
  const scaled = values.map(x => x / scale), bytes = scaled.map(x => encode(x, name));
  const q = bytes.map(b => decode(b, name)), recovered = q.map(x => x * scale);
  return { scale, maximum, scaled, bytes, q, recovered,
    clipped: scaled.filter(x => Math.abs(x) > FORMATS[name].max).length,
    newZeros: recovered.filter((x, i) => x === 0 && values[i] !== 0).length,
    maxError: Math.max(...recovered.map((x, i) => Math.abs(x - values[i]))) };
}
export function grouped(matrix, mode = 'tensor') {
  const rows = matrix.length, cols = matrix[0].length;
  const br = mode === 'tensor' ? rows : mode === 'row' ? 1 : 2;
  const bc = mode === 'block' ? 2 : cols;
  const result = matrix.map(row => row.map(() => 0)), groupIds = matrix.map(row => row.map(() => 0)), scales = [];
  let group = 0;
  for (let r = 0; r < rows; r += br) for (let c = 0; c < cols; c += bc) {
    const coordinates = [];
    for (let i = r; i < r + br; i++) for (let j = c; j < c + bc; j++) coordinates.push([i, j]);
    const trace = scaleTrace(coordinates.map(([i, j]) => matrix[i][j]));
    scales.push(trace.scale);
    coordinates.forEach(([i, j], n) => { result[i][j] = trace.recovered[n]; groupIds[i][j] = group; });
    group++;
  }
  const differences = result.flat().map((v, i) => Math.abs(v - matrix.flat()[i]));
  return { result, groupIds, scales, maxError: Math.max(...differences),
    smallError: differences.filter((_, i) => Math.abs(matrix.flat()[i]) === 1).reduce((a, b) => Math.max(a, b), 0),
    bytes: rows * cols + 4 * scales.length };
}
export function historyTrace(values, window = 3, margin = 0) {
  const past = [];
  return values.map((amax, index) => {
    const history = [...past], reference = history.length ? Math.max(...history) : amax;
    const scale = reference ? 2 ** margin * reference / 448 : 1;
    const trace = scaleTrace([amax, amax / 10], 'e4m3', false, scale);
    past.push(amax); if (past.length > window) past.shift();
    return { index, amax, history, reference, ...trace, capacity: scale * 448 };
  });
}
export const transpose = matrix => matrix[0].map((_, j) => matrix.map(row => row[j]));
export const mm = (a, b) => a.map(row => b[0].map((_, j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0)));
export const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
export function matrixTrace(x, w) {
  const xt = scaleTrace(x.flat()), wt = scaleTrace(w.flat());
  const reshape = (values, rows, cols) => Array.from({ length: rows }, (_, i) => values.slice(i * cols, (i + 1) * cols));
  const xq = reshape(xt.q, x.length, x[0].length), wq = reshape(wt.q, w.length, w[0].length);
  const exact = mm(x, transpose(w)), raw = mm(xq, transpose(wq));
  const result = raw.map(row => row.map(v => v * xt.scale * wt.scale));
  const err = Math.hypot(...result.flat().map((v, i) => v - exact.flat()[i]));
  const norm = Math.hypot(...exact.flat());
  return { xt, wt, xq, wq, exact, result, raw, error: err, relative: norm ? err / norm : null };
}
export function masterTrace(update = .01, steps = 12) {
  let master = Math.fround(1), low = 1;
  const points = [{ step: 0, master, low, copy: 1 }];
  for (let step = 1; step <= steps; step++) {
    master = Math.fround(master - Math.fround(update));
    low = quantize(Math.fround(low - Math.fround(update)));
    points.push({ step, master, low, copy: quantize(master) });
  }
  return points;
}
export const cost = (f = .8, r = 2, h = .05) => ({ time: 1 - f + f / r + h, speedup: 1 / (1 - f + f / r + h) });
