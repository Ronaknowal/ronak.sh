import { affine, attention, dot, softmax, sum } from './cross-attention-flow-models.js';

// erf(x) = 2/sqrt(pi) integral_0^x exp(-t²)dt. Adaptive Simpson integration
// keeps the browser GELU close to Python math.erf without a polynomial shortcut.
// Above |x|=6, the omitted tail is below float64 machine precision.
export function erf(x) {
  if (!Number.isFinite(x)) throw new RangeError('erf needs a finite number.');
  const a = Math.abs(x);
  if (a >= 6) return Math.sign(x);
  if (a === 0) return 0;
  const f = t => Math.exp(-t * t), simpson = (lo, hi, fl, fm, fh) => (hi - lo) * (fl + 4 * fm + fh) / 6;
  function integrate(lo, hi, fl, fm, fh, whole, tolerance, depth) {
    const mid = (lo + hi) / 2, leftMid = (lo + mid) / 2, rightMid = (mid + hi) / 2;
    const fLeft = f(leftMid), fRight = f(rightMid);
    const left = simpson(lo, mid, fl, fLeft, fm), right = simpson(mid, hi, fm, fRight, fh), delta = left + right - whole;
    if (depth === 0 || Math.abs(delta) <= 15 * tolerance) return left + right + delta / 15;
    return integrate(lo, mid, fl, fLeft, fm, left, tolerance / 2, depth - 1) + integrate(mid, hi, fm, fRight, fh, right, tolerance / 2, depth - 1);
  }
  const fl = 1, fm = f(a / 2), fh = f(a);
  return Math.sign(x) * 2 / Math.sqrt(Math.PI) * integrate(0, a, fl, fm, fh, simpson(0, a, fl, fm, fh), 2e-14, 20);
}
const expectedShapes = {
  'position': [1, 16, 24], 'query.weight': [2, 24], 'patch.weight': [24, 4], 'patch.bias': [24],
  'read.in_proj_weight': [72, 24], 'read.in_proj_bias': [72], 'read.out_proj.weight': [24, 24], 'read.out_proj.bias': [24],
  'feed.0.weight': [24], 'feed.0.bias': [24], 'feed.1.weight': [48, 24], 'feed.1.bias': [48],
  'feed.3.weight': [24, 48], 'feed.3.bias': [24], 'head.weight': [12, 24], 'head.bias': [12],
};
function checkShape(x, shape) {
  if (!shape.length) return Number.isFinite(x);
  return Array.isArray(x) && x.length === shape[0] && x.every(v => checkShape(v, shape.slice(1)));
}
export function validateSavedState(state) {
  if (!state || Object.keys(state).length !== Object.keys(expectedShapes).length) throw new RangeError('The complete cross/seed11 state requires all16 named tensors.');
  for (const [name, shape] of Object.entries(expectedShapes)) if (!checkShape(state[name], shape)) throw new RangeError(`Missing or malformed saved tensor ${name}.`);
  const parameters = sum(Object.values(expectedShapes).map(shape => shape.reduce((a, b) => a * b, 1)));
  if (parameters !== 5676) throw new RangeError('The complete state must contain5,676 parameters.');
  return state;
}
export function savedCrossForward(pixels, question, state) {
  validateSavedState(state);
  const raw = pixels.flat();
  if (raw.length !== 64 || raw.some(v => !Number.isFinite(v) || v < 0 || v > 16)) throw new RangeError('Supply64 finite pixel counts in0..16.');
  if (question !== 0 && question !== 1) throw new RangeError('Question must be0=digit or1=even/odd.');
  const patches = Array.from({ length: 16 }, (_, p) => {
    const row = 2 * Math.floor(p / 4), col = 2 * (p % 4);
    return [raw[row * 8 + col], raw[row * 8 + col + 1], raw[(row + 1) * 8 + col], raw[(row + 1) * 8 + col + 1]].map(v => v / 16);
  });
  const lin = (x, name) => affine([x], state[`${name}.weight`], state[`${name}.bias`])[0];
  const memory = affine(patches, state['patch.weight'], state['patch.bias']).map((row, i) => row.map((v, j) => v + state.position[0][i][j]));
  const query = [...state['query.weight'][question]], iw = state['read.in_proj_weight'], ib = state['read.in_proj_bias'];
  const queryAll = iw.slice(0, 24).map((w, i) => dot(query, w) + ib[i]);
  const keyAll = affine(memory, iw.slice(24, 48), ib.slice(24, 48));
  const valueAll = affine(memory, iw.slice(48), ib.slice(48));
  const heads = Array.from({ length: 3 }, (_, h) => attention([queryAll.slice(h * 8, (h + 1) * 8)],
    keyAll.map(row => row.slice(h * 8, (h + 1) * 8)), valueAll.map(row => row.slice(h * 8, (h + 1) * 8))));
  const joined = heads.flatMap(head => head.output[0]), update = lin(joined, 'read.out_proj');
  const hidden = query.map((v, i) => v + update[i]), mean = sum(hidden) / 24, variance = sum(hidden.map(v => (v - mean) ** 2)) / 24;
  const normalized = hidden.map((v, i) => (v - mean) / Math.sqrt(variance + 1e-5) * state['feed.0.weight'][i] + state['feed.0.bias'][i]);
  const pre = lin(normalized, 'feed.1'), activated = pre.map(v => .5 * v * (1 + erf(v / Math.SQRT2)));
  const dense = lin(activated, 'feed.3'), final = hidden.map((v, i) => v + dense[i]), logits = lin(final, 'head');
  const probabilities = softmax(logits).shares, prediction = probabilities.indexOf(Math.max(...probabilities));
  return { category: 'computed from retained cross/seed11 state', patches, memory, query,
    q: heads.map(head => head.query[0]), k: heads.map(head => head.key), v: heads.map(head => head.value),
    heads, scores: heads.map(head => head.scores[0]), shares: heads.map(head => head.weights[0]), read: heads.map(head => head.output[0]),
    joined, update, hidden, mean, variance, normalized, pre, activated, dense, final, logits, probabilities, prediction };
}
