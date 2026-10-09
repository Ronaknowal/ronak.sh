// New reading-flow operations; protected original browser calculations are reused.
import { fitBoosting, CATEGORY_ROWS, bundleExclusive } from './gradient-boosted-trees-models.js';
export const sum = values => values.reduce((total, value) => total + value, 0);
export const mean = values => sum(values) / values.length;
export const valid = (v, min, max, integer = false) => Number.isFinite(v) && v >= min && v <= max && (!integer || Number.isInteger(v));
export function parseTargets(text) {
  const fields = text.trim().split(/[\s,]+/);
  if (fields.length !== 6 || fields.some(v => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(v) || !valid(Number(v), -30, 30)))
    throw new Error('Use six finite decimal/exponent values from −30 through 30.');
  return fields.map(Number);
}
export const foundationalModel = state => fitBoosting({ x: [1, 2, 3, 4, 5, 6], y: state.targets, rate: state.rate, depth: 1, rounds: 8 });
// Four-row capacity companions, not a replacement for the efficient Python tree.
export function capacityOperation(targets) {
  const rows = [[0, 0], [0, 1], [1, 0], [1, 1]];
  function grow(ids, depth) {
    const value = mean(ids.map(i => targets[i])), error = sum(ids.map(i => (targets[i] - value) ** 2));
    const leaf = { ids, value, error, leaf: true };
    if (depth === 2 || error === 0) return leaf;
    const candidates = [0, 1].map(feature => {
      const left = ids.filter(i => rows[i][feature] <= .5), right = ids.filter(i => rows[i][feature] > .5);
      if (!left.length || !right.length) return null;
      const cost = [left, right].reduce((s, group) => s + sum(group.map(i => (targets[i] - mean(group.map(j => targets[j]))) ** 2)), 0);
      return { feature, left, right, cost, gain: error - cost };
    }).filter(Boolean);
    const best = candidates.reduce((winner, c) => winner === null || c.gain > winner.gain ? c : winner, null);
    return best?.gain > 0 ? { ...leaf, leaf: false, feature: best.feature, cut: .5, gain: best.gain, left: grow(best.left, depth + 1), right: grow(best.right, depth + 1) } : leaf;
  }
  const tree = grow([0, 1, 2, 3], 0);
  return { rows, targets, tree, predictions: rows.map(row => { let node = tree; while (!node.leaf) node = row[node.feature] <= node.cut ? node.left : node.right; return node.value; }) };
}
export function splitScan(residuals) {
  return [1, 2, 3, 4, 5].map(count => {
    const left = mean(residuals.slice(0, count)), right = mean(residuals.slice(count));
    const error = sum(residuals.map((r, i) => (r - (i < count ? left : right)) ** 2));
    return { cut: count + .5, left, right, error, leftCount: count };
  });
}
export const huber = (error, delta) => Math.abs(error) <= delta ? .5 * error ** 2 : delta * (Math.abs(error) - .5 * delta);
export function robustLeaves(values, delta) {
  if (values.length !== 3 || values.some(v => !valid(v, -20, 20)) || !valid(delta, .1, 5)) throw new Error('Invalid robust-leaf state.');
  const ordered = [...values].sort((a, b) => a - b);
  const clip = r => Math.max(-delta, Math.min(delta, r)), derivativeAt = w => sum(values.map(r => clip(w-r)));
  let w;
  const center = mean(values);
  if (values.every(r => Math.abs(center-r) <= delta)) w = center;
  else {
    w = ordered.find(candidate => derivativeAt(candidate) === 0);
    if (w === undefined) {
      const boundaries = [...new Set(values.flatMap(r => [r-delta,r+delta]))].sort((a,b)=>a-b);
      for (let i=0;i+1<boundaries.length;i++) {
        const middle=boundaries[i]/2+boundaries[i+1]/2,active=values.filter(r=>Math.abs(middle-r)<delta);
        if (!active.length) continue;
        const low=values.filter(r=>middle-r>=delta).length,high=values.filter(r=>middle-r<=-delta).length;
        const candidate=(sum(active)-delta*(low-high))/active.length;
        if (candidate>=boundaries[i]&&candidate<=boundaries[i+1]) {w=candidate;break;}
      }
    }
    if (w === undefined) {
      let lower=ordered[0],upper=ordered.at(-1);
      for(let i=0;i<100;i++) {const middle=lower/2+upper/2,d=derivativeAt(middle);if(d===0||middle===lower||middle===upper){lower=upper=middle;break;}if(d<0)lower=middle;else upper=middle;}
      w=lower/2+upper/2;
    }
  }
  return { mean: mean(values), median: ordered[1], huber: w,
    requested: values.map(r => Math.max(-delta, Math.min(delta, r))),
    derivative: values.map(r => Math.max(-delta, Math.min(delta, w - r))),
    objective: sum(values.map(r => huber(r - w, delta))) };
}
export function quantileOperation(tau) {
  if (!valid(tau, .05, .95)) throw new Error('Invalid quantile.');
  const demand = [0, 1, 1, 2, 8];
  const index = demand.findIndex((_, i) => (i + 1) / demand.length >= tau);
  const lower = demand[index], upper = tau === (index + 1) / demand.length ? demand[index + 1] : lower;
  return { demand, lower, upper, ratio: tau / (1 - tau),
    cost: stock => sum(demand.map(y => y >= stock ? tau * (y - stock) : (1 - tau) * (stock - y))) };
}
export function softmaxOperation(scores, target) {
  if (scores.length !== 3 || scores.some(v => !valid(v, -4, 4)) || !valid(target, 0, 2, true)) throw new Error('Invalid class scores/target.');
  const maximum = Math.max(...scores), exp = scores.map(v => Math.exp(v - maximum)), total = sum(exp);
  const p = exp.map(v => v / total), g = p.map((v, i) => v - Number(i === target));
  const H = p.map((v, i) => p.map((other, j) => Number(i === j) * v - v * other));
  return { maximum, exp, total, p, g, H, loss: maximum + Math.log(total) - scores[target] };
}
export function cutMassOperation(mass) {
  if (!valid(mass, .1, 10)) throw new Error('Invalid cut mass.');
  const values = [0, 1, 2, 3], weights = [1, 1, mass, 2], total = sum(weights);
  let running = 0;
  return { values, weights, total, cdf: weights.map(v => (running += v) / total) };
}
export function bundleOperation(rows) {
  const graph = [0, 1, 2].map(a => [0, 1, 2].map(b => a !== b && rows.some(row => row[a] > 0 && row[b] > 0)));
  try { return { graph, valid: true, ...bundleExclusive(rows) }; }
  catch (error) { return { graph, valid: false, error: error.message, rows }; }
}
export function orderedOperation({ row, reverse, ownFlip, earlierFlip, strength }) {
  if (!valid(row, 0, 5, true) || !valid(strength, .25, 4)) throw new Error('Invalid ordered-category state.');
  const rows = CATEGORY_ROWS.map((r, i) => ({ ...r, id: i, target: i === row && ownFlip ? 1 - r.target : r.target }));
  const order = [0, 1, 2, 3, 4, 5]; if (reverse) order.reverse();
  const position = order.indexOf(row), preceding = order.slice(0, position).filter(i => rows[i].category === rows[row].category);
  const earlier = preceding[0] ?? null;
  if (earlierFlip && earlier !== null) rows[earlier].target = 1 - rows[earlier].target;
  const matching = order.filter(i => rows[i].category === rows[row].category);
  const encode = ids => (sum(ids.map(i => rows[i].target)) + strength * .5) / (ids.length + strength);
  const numerator = sum(preceding.map(i => rows[i].target)) + strength * .5;
  return { rows, order, row, preceding, earlier, matching, position, numerator,
    denominator: preceding.length + strength, prefix: encode(preceding), inference: encode(matching), unseen: .5,
    prefixes: order.map((i, j) => ({ id: i, eligible: order.slice(0, j).filter(k => rows[k].category === rows[i].category),
      value: encode(order.slice(0, j).filter(k => rows[k].category === rows[i].category)) })) };
}
export function prefixHistory() {
  const targets = [1, 3, 2, 6], rate = .5, histories = [Array(5).fill(0)], residuals = [];
  for (let round = 0; round < 2; round++) {
    const previous = histories.at(-1), residual = targets.map((y, i) => y - previous[i]);
    residuals.push(residual);
    histories.push([0, ...targets.map((_, i) => previous[i + 1] + rate * mean(residual.slice(0, i + 1)))]);
  }
  return { targets, rate, histories, residuals };
}
export const savedDiagnostic = {
  base: 5, rate: .5,
  trees: [{ feature: 0, cut: 3.5, left: -8 / 3, right: 8 / 3, gain: 64 / 3 },
    { feature: 1, cut: 3.5, left: -4 / 3, right: 4 / 3, gain: 16 / 3 }],
  rows: [1, 2, 3, 4, 5, 6].map(x => [x, x]), targets: [2, 2, 3, 7, 8, 8]
};
export const diagnosticPredict = row => savedDiagnostic.base + savedDiagnostic.rate * sum(savedDiagnostic.trees.map(t => row[t.feature] <= t.cut ? t.left : t.right));
export function diagnosticOperation(query) {
  const changed = savedDiagnostic.rows.map(row => [query, row[1]]), predictions = changed.map(diagnosticPredict);
  return { changed, predictions, average: mean(predictions) };
}
export function weightedProbability(p, a) {
  if (!valid(p, .01, .99) || !valid(a, .1, 10)) throw new Error('Invalid probability/positive weight.');
  return a * p / (a * p + 1 - p);
}
