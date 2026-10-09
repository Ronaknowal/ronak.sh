import { assignmentTrace, scaledKnapsackState, COVER_SETS, KNAPSACK_ITEMS } from "./combinatorial-optimization-models.js";
import recorded from "./combinatorial-optimization-recorded-cover.json";
const integer = (v, lo, hi, name) => {
  if (!Number.isInteger(v) || v < lo || v > hi) throw new RangeError(`${name} must be an integer from ${lo} through ${hi}.`);
};
const popcount = (mask) => {
  let n = 0;
  for (let bits = mask; bits; bits &= bits - 1) n += 1;
  return n;
};
const members = (mask, size) => Array.from({ length: size }, (_, i) => i).filter((i) => mask & 1 << i);
const COVER_PRESETS = {
  equal: COVER_SETS,
  weighted: COVER_SETS.map((s, i) => ({ ...s, cost: [3, 2, 2][i] })),
  missing: COVER_SETS.map((s) => ({ ...s, elements: s.elements.filter((e) => e !== 4) }))
};
const ASSIGNMENT_PRESETS = {
  reversal: [[1, 2, 8], [2, 9, 8], [8, 8, 1]],
  missing: [[1, null, null], [2, null, null], [null, null, 1]]
};
function assignmentStage(preset = "reversal", step = 0) {
  if (!ASSIGNMENT_PRESETS[preset]) throw new RangeError("Unknown assignment preset.");
  const complete = assignmentTrace({ costs: ASSIGNMENT_PRESETS[preset] });
  integer(step, 0, complete.trace.length - 1, "Augmentation step");
  const stage = complete.trace[step];
  const usedWorkers = new Set(stage.pairs.map((p) => p.worker));
  const usedJobs = new Set(stage.pairs.map((p) => p.job));
  const arcs = [];
  const add = (from, to, cost, used, type, worker = null, job = null) => {
    arcs.push({ from, to, cost, residual: used ? 0 : 1, forward: true, type, worker, job });
    arcs.push({ from: to, to: from, cost: -cost, residual: used ? 1 : 0, forward: false, type, worker, job });
  };
  for (let i = 0; i < complete.workers; i++) add(complete.source, i, 0, usedWorkers.has(i), "worker-capacity");
  complete.costs.forEach((row, i) => row.forEach((cost, j) => {
    if (cost !== null) add(i, complete.workers + j, cost, stage.pairs.some((p) => p.worker === i && p.job === j), "assignment", i, j);
  }));
  for (let j = 0; j < complete.jobs; j++) add(complete.workers + j, complete.sink, 0, usedJobs.has(j), "job-capacity");
  return { complete, stage, arcs };
}
function dpWitness(row = 2, score = 20) {
  const state = scaledKnapsackState({ items: KNAPSACK_ITEMS, capacity: 10, epsilonDenominator: 4 });
  integer(row, 1, state.active.length, "DP row");
  integer(score, 0, state.columns - 1, "Scaled score");
  const item = state.active[row - 1];
  const skip = state.rows[row - 1][score];
  const admissible = score >= item.rounded;
  const predecessorScore = admissible ? score - item.rounded : null;
  const predecessorWeight = admissible ? state.rows[row - 1][predecessorScore] : null;
  const take = admissible ? predecessorWeight + item.weight : null;
  const value = state.rows[row][score];
  const chosen = take !== null && take < skip ? "take" : "skip";
  const reconstruction = [];
  let r = row, t = score;
  if (Number.isFinite(value)) while (r > 0) {
    const previous = state.rows[r - 1][t], current = state.rows[r][t];
    const takeItem = current < previous;
    const nextScore = takeItem ? t - state.active[r - 1].rounded : t;
    reconstruction.push({ from: [r, t], to: [r - 1, nextScore], decision: takeItem ? "take" : "skip", item: state.active[r - 1].name });
    t = nextScore;
    r -= 1;
  }
  return { state, row, score, item, skip, take, predecessorScore, predecessorWeight, admissible, value, chosen, reconstruction };
}
const ROUTE_POINTS = [[0, 0], [2, 0], [2, 2], [0, 2], [1, 1]];
const ROUTE_TREE = [[0, 1], [0, 3], [0, 4], [1, 2]];
const distance = (a, b) => Math.abs(ROUTE_POINTS[a][0] - ROUTE_POINTS[b][0]) + Math.abs(ROUTE_POINTS[a][1] - ROUTE_POINTS[b][1]);
const routeCost = (walk) => walk.slice(1).reduce((s, v, i) => s + distance(walk[i], v), 0);
function matchings(vertices) {
  if (!vertices.length) return [[]];
  const [a, ...rest] = vertices;
  return rest.flatMap((b, i) => matchings(rest.filter((_, j) => j !== i)).map((tail) => [[a, b], ...tail]));
}
function routeConstruction(method = "parity") {
  if (!["parity", "double"].includes(method)) throw new RangeError("Unknown route repair.");
  const degree = Array(5).fill(0);
  ROUTE_TREE.forEach(([a, b]) => {
    degree[a]++;
    degree[b]++;
  });
  const odd = degree.map((v, i) => v % 2 ? i : null).filter((v) => v !== null);
  const options = matchings(odd);
  options.sort((a, b) => a.reduce((s, [u, v]) => s + distance(u, v), 0) - b.reduce((s, [u, v]) => s + distance(u, v), 0));
  const added = method === "double" ? ROUTE_TREE.map((e) => [...e]) : options[0];
  const copies = [...ROUTE_TREE, ...added].map(([a, b], id) => ({ a, b, id, added: id >= ROUTE_TREE.length, cost: distance(a, b) }));
  const used = /* @__PURE__ */ new Set(), stack = [0], circuit = [], trace = [{ stack: [0], circuit: [], used: [], edge: null, action: "start" }];
  while (stack.length) {
    const v = stack.at(-1), edge = copies.findLast((e) => !used.has(e.id) && (e.a === v || e.b === v));
    if (edge) {
      used.add(edge.id);
      stack.push(edge.a === v ? edge.b : edge.a);
    } else circuit.push(stack.pop());
    trace.push({ stack: [...stack], circuit: [...circuit], used: [...used], edge: edge?.id ?? null, action: edge ? "consume edge copy" : "pop into circuit" });
  }
  const euler = circuit.reverse(), visited = /* @__PURE__ */ new Set(), shortcut = [];
  euler.forEach((v) => {
    if (!visited.has(v)) {
      visited.add(v);
      shortcut.push(v);
    }
  });
  shortcut.push(shortcut[0]);
  return { method, points: ROUTE_POINTS, tree: ROUTE_TREE, odd, added, copies, degree: degree.map((d, i) => d + added.filter((e) => e.includes(i)).length), trace, euler, shortcut, treeCost: 8, addedCost: added.reduce((s, [a, b]) => s + distance(a, b), 0), eulerCost: routeCost(euler), shortcutCost: routeCost(shortcut) };
}
function recordedCoverDiagnostic(method = "rounded", edge = 0) {
  if (!["lp", "rounded", "local_ratio", "optimal"].includes(method)) throw new RangeError("Unknown recorded cover method.");
  integer(edge, 0, recorded.edges.length - 1, "Recorded edge");
  const selected = method === "lp" ? [] : recorded[method];
  const values = method === "lp" ? recorded.fractional : recorded.nodes.map((v) => Number(selected.includes(v)));
  const coverage = recorded.edges.map(([a, b]) => values[a] + values[b]);
  const feasible = coverage.every((v) => v >= 1 - recorded.tolerance);
  return { ...recorded, method, edge, selected, values, coverage, feasible, cost: values.reduce((a, b) => a + b, 0), isIntegral: method !== "lp", upper: method === "lp" ? null : selected.length };
}
export {
  ASSIGNMENT_PRESETS,
  COVER_PRESETS,
  ROUTE_POINTS,
  ROUTE_TREE,
  assignmentStage,
  distance,
  dpWitness,
  members,
  popcount,
  recordedCoverDiagnostic,
  routeConstruction,
  routeCost
};
