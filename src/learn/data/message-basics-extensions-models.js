// Constructed explanatory graphs only. No fitted state or scientific program is changed.
const finiteRange = (v, lo, hi, name) => {
  if (!Number.isFinite(v) || v < lo || v > hi) throw new RangeError(`${name}: ${lo}…${hi}.`);
};
export const initialIntroGraph = () => ({
  x: [1, 2, 4],
  a: [[0, 1, 0], [1, 0, 1], [0, 1, 0]],
  selected: 0,
  source: 1,
  receiver: 0,
  paired: true,
  loops: true,
  reverse: false,
  rounds: 2,
  inPlace: false,
  pin: null
});
export const initialGcnGraph = () => ({
  x: [1, 2, 4],
  a: [[0, 1, 0], [1, 0, 1], [0, 1, 0]],
  selected: 0,
  edge: 0,
  loops: true,
  rule: 'symmetric',
  receiver: 0,
  weight: .5,
  target: 1,
  rate: .1,
  bias: 1
});
export const gcnPairs = [[0, 1], [1, 2], [0, 2]];
export function validateGraph(a, x, size = null) {
  if (a.length !== x.length || a.length < 2 || a.length > 6 || size !== null && a.length !== size) throw new RangeError('Supported node count is 2…6.');
  x.forEach(v => finiteRange(v, -8, 8, 'Feature'));
  a.forEach((row, v) => {
    if (row.length !== x.length) throw new RangeError('Both adjacency axes must match nodes.');
    row.forEach((w, u) => {
      finiteRange(w, 0, 4, 'Edge');
      if (v === u && w !== 0) throw new RangeError('Automatic loops are separate from editable edges.');
    });
  });
}
export function resizeIntro(s, count) {
  if (!Number.isInteger(count) || count < 2 || count > 6) throw new RangeError('Node count 2…6.');
  const receiver = s.receiver < count ? s.receiver : 0,
    source = s.source < count && s.source !== receiver ? s.source : receiver === 0 ? 1 : 0;
  return {
    ...s,
    x: Array.from({
      length: count
    }, (_, i) => s.x[i] ?? 0),
    a: Array.from({
      length: count
    }, (_, v) => Array.from({
      length: count
    }, (_, u) => s.a[v]?.[u] ?? 0)),
    selected: s.selected < count ? s.selected : 0,
    receiver,
    source,
    pin: null
  };
}
export function editEdge(a, source, receiver, weight, paired = false) {
  finiteRange(weight, 0, 4, 'Edge');
  if (source === receiver || !a[source] || !a[receiver]) throw new RangeError('Select distinct existing endpoints.');
  return a.map((row, v) => row.map((old, u) => v === receiver && u === source || paired && v === source && u === receiver ? weight : old));
}
export const reconcilePairs = a => a.map((row, v) => row.map((w, u) => Math.max(w, a[u][v])));
export function graphOperators(a, loops = true) {
  const b = a.map((row, v) => row.map((w, u) => w + Number(loops && v === u))),
    d = b.map(row => row.reduce((s, w) => s + w, 0));
  const p = b.map((row, v) => row.map(w => d[v] ? w / d[v] : 0));
  // Divide in stages: d[v]*d[u] can underflow for supported positive tiny edges.
  const s = b.map((row, v) => row.map((w, u) => d[v] && d[u] ? w / Math.sqrt(d[v]) / Math.sqrt(d[u]) : 0));
  return {
    b,
    d,
    p,
    s
  };
}
export const matvec = (a, x) => a.map(row => row.reduce((s, w, u) => s + w * x[u], 0));
export function basicNumber(value, digits = 6) {
  if (value === null || value === undefined) return 'undefined';
  if (!Number.isFinite(value)) return String(value).replaceAll('-', '−');
  if (value !== 0 && (Math.abs(value) >= 1e9 || Number(value.toFixed(digits)) === 0)) return value.toExponential(Math.min(2, digits)).replace(/\.0+(?=e)/, '').replaceAll('-', '−');
  return Number(value.toFixed(digits)).toString().replaceAll('-', '−');
}
export function trajectory(matrix, x, count, reverse = false, inPlace = false) {
  if (!Number.isInteger(count) || count < 0 || count > 4) throw new RangeError('Rounds 0…4.');
  const order = x.map((_, i) => i);
  if (reverse) order.reverse();
  const history = [[...x]],
    sweeps = [];
  for (let round = 0; round < count; round++) {
    const old = history.at(-1),
      next = [...old],
      steps = [];
    for (const receiver of order) {
      const read = [...(inPlace ? next : old)],
        products = matrix[receiver].map((w, u) => w * read[u]);
      next[receiver] = products.reduce((s, v) => s + v, 0);
      steps.push({
        receiver,
        read,
        products,
        written: next[receiver],
        buffer: [...next]
      });
    }
    history.push(next);
    sweeps.push(steps);
  }
  return {
    history,
    sweeps,
    order
  };
}
export function introTrace(s) {
  validateGraph(s.a, s.x);
  const {
      b,
      d,
      p
    } = graphOperators(s.a, s.loops),
    ownSum = s.a.map((row, v) => row.map((w, u) => w + Number(v === u)));
  const correct = trajectory(p, s.x, s.rounds, s.reverse),
    faulty = trajectory(p, s.x, s.rounds, s.reverse, true),
    sum = trajectory(ownSum, s.x, s.rounds, s.reverse);
  // Every nonzero dependency is traced from the SAME current graph; initial node IDs persist.
  const support = [];
  let ids = new Set([0]);
  for (let r = 0; r <= s.rounds; r++) {
    support.push([...ids].sort((a, b) => a - b));
    const next = new Set();
    for (const v of ids) ownSum[v].forEach((w, u) => {
      if (w) next.add(u);
    });
    ids = next;
  }
  return {
    b,
    d,
    p,
    ownSum,
    correct,
    faulty,
    sum,
    support,
    current: s.inPlace ? faulty : correct
  };
}
export function captureIntroPin(s) {
  const t = introTrace(s);
  return structuredClone({
    x: s.x,
    a: s.a,
    ids: s.x.map((_, i) => i),
    selected: s.selected,
    source: s.source,
    receiver: s.receiver,
    paired: s.paired,
    rounds: s.rounds,
    loops: s.loops,
    reverse: s.reverse,
    inPlace: s.inPlace,
    rule: 'closed-neighborhood mean',
    output: t.current.history.at(-1),
    current: t.current.history,
    currentSweeps: t.current.sweeps,
    correct: t.correct.history,
    sum: t.sum.history
  });
}
export function gcnTrace(s) {
  validateGraph(s.a, s.x, 3);
  if (s.a.some((row, v) => row.some((w, u) => w !== s.a[u][v]))) throw new RangeError('GCN context has undirected weights.');
  if (!['symmetric', 'mean'].includes(s.rule) || ![0, 1, 2].includes(s.receiver)) throw new RangeError('Choose the taught operator and receiver.');
  finiteRange(s.weight, -4, 4, 'Weight');
  finiteRange(s.target, -8, 8, 'Target');
  finiteRange(s.bias, -4, 4, 'Bias');
  finiteRange(s.rate, 0, 1, 'Rate');
  const {
      b,
      d,
      p,
      s: matrixS
    } = graphOperators(s.a, s.loops),
    sx = matvec(matrixS, s.x),
    px = matvec(p, s.x),
    f = s.x.map((v, i) => d[i] ? v / Math.sqrt(d[i]) : null);
  const divided = sx.map((v, i) => d[i] ? v / Math.sqrt(d[i]) : null),
    pf = p.map(row => row.some((w, u) => w !== 0 && f[u] === null) ? null : row.reduce((sum, w, u) => sum + w * (f[u] ?? 0), 0));
  const matrix = s.rule === 'symmetric' ? matrixS : p,
    aggregate = matvec(matrix, s.x),
    a = aggregate[s.receiver],
    prediction = a * s.weight,
    residual = prediction - s.target,
    derivative = a * residual,
    nextWeight = s.weight - s.rate * derivative,
    nextPrediction = a * nextWeight;
  return {
    b,
    d,
    p,
    s: matrixS,
    sx,
    px,
    f,
    divided,
    pf,
    matrix,
    aggregate,
    a,
    prediction,
    residual,
    derivative,
    nextWeight,
    nextPrediction,
    loss: .5 * residual ** 2,
    nextLoss: .5 * (nextPrediction - s.target) ** 2,
    applyAllowed: Number.isFinite(nextWeight) && Math.abs(nextWeight) <= 4,
    stableRate: a === 0 ? null : 2 / a ** 2,
    biasBefore: matvec(matrix, s.x.map(v => v + s.bias)),
    biasAfter: aggregate.map(v => v + s.bias),
    rowSums: matrix.map(row => row.reduce((z, w) => z + w, 0)),
    products: matrix[s.receiver].map((w, u) => w * s.x[u])
  };
}
