// Finite browser teaching translation of the accepted shared disjoint_set.py,
// mutual_reachability_tree.py and density_hierarchy.py contracts. No fits/mains.
import { EuclideanNeighbourhoods, trailObservations } from './dbscan-neighbourhood-models.mjs';
import { rankedSupport } from './dbscan-geometry-models.mjs';
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
export class DisjointSet {
  constructor(n) {
    if (!Number.isSafeInteger(n) || n < 0) throw Error('Nonnegative integer vertex count required');
    this.parent = Array.from({
      length: n
    }, (_, i) => i);
    this.size = Array(n).fill(1);
    this.count = n;
  }
  validate(item) {
    if (!Number.isSafeInteger(item) || item < 0 || item >= this.parent.length) throw Error('Vertex outside 0..n−1');
  }
  find(item) {
    this.validate(item);
    let root = item;
    while (this.parent[root] !== root) root = this.parent[root];
    while (this.parent[item] !== item) {
      const next = this.parent[item];
      this.parent[item] = root;
      item = next;
    }
    return root;
  }
  union(a, b) {
    this.validate(a);
    this.validate(b);
    let left = this.find(a),
      right = this.find(b);
    if (left === right) return false;
    if (this.size[left] < this.size[right]) [left, right] = [right, left];
    this.parent[right] = left;
    this.size[left] += this.size[right];
    this.count--;
    return true;
  }
  groups() {
    const groups = new Map();
    for (let i = 0; i < this.parent.length; i++) {
      const root = this.find(i);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(i);
    }
    return [...groups.values()];
  }
}
export function primTree(n, weight, trace = false) {
  if (!Number.isSafeInteger(n) || n < 0 || typeof trace !== 'boolean') throw Error('Integer vertex count and boolean trace required');
  if (trace && n > 64) throw Error('Full teaching trace is limited to 64 vertices');
  if (n === 0) return freeze({
    edges: [],
    trace: []
  });
  const included = Array(n).fill(false),
    best = Array(n).fill(Infinity),
    parent = Array(n).fill(-1),
    edges = [],
    frames = [];
  best[0] = 0;
  const capture = (operation, row, previous = null) => {
    if (trace) frames.push({
      operation,
      row,
      previous,
      included: [...included],
      best: [...best],
      parent: [...parent],
      edges: edges.map(edge => ({
        ...edge
      }))
    });
  };
  for (let iteration = 0; iteration < n; iteration++) {
    const row = Array.from({
      length: n
    }, (_, i) => i).filter(i => !included[i]).sort((a, b) => best[a] - best[b] || a - b)[0];
    if (!Number.isFinite(best[row])) throw Error('Finite graph is disconnected');
    included[row] = true;
    if (parent[row] !== -1) edges.push({
      weight: best[row],
      left: parent[row],
      right: row
    });
    capture('admit', row);
    for (let candidate = 0; candidate < n; candidate++) {
      if (included[candidate]) continue;
      const value = weight(row, candidate);
      if (!Number.isFinite(value) || value < 0) throw Error('Finite nonnegative edge lengths required');
      if (value < best[candidate] || value === best[candidate] && row < parent[candidate]) {
        const previous = {
          key: best[candidate],
          parent: parent[candidate]
        };
        best[candidate] = value;
        parent[candidate] = row;
        capture('update', candidate, previous);
      }
    }
  }
  return freeze({
    edges,
    trace: frames
  });
}
export function thresholdComponents(n, edges, cut) {
  if (typeof cut !== 'number' || Number.isNaN(cut) || cut <= 0) throw Error('Positive cut required');
  const dsu = new DisjointSet(n);
  for (const edge of edges) if (edge.weight <= cut) dsu.union(edge.left, edge.right);
  return dsu.groups();
}
export function mutualExample(position = 0) {
  if (!Number.isFinite(position) || position < -.5 || position > .5) throw Error('I position is in [−.5,.5]');
  const observations = trailObservations.map(row => ({
      id: row.id,
      coordinates: row.id === 'I' ? [position] : [...row.coordinates]
    })),
    provider = new EuclideanNeighbourhoods(observations),
    cores = rankedSupport(provider, 4).map(row => row.value),
    raw = provider.distance(3, 8),
    operands = [cores[3], cores[8], raw],
    weight = Math.max(...operands);
  return {
    observations,
    provider,
    cores,
    raw,
    weight,
    operands,
    controlling: ['D core', 'I core', 'raw edge'].filter((_, i) => operands[i] === weight)
  };
}
export const fourProvider = new EuclideanNeighbourhoods([0, 1, 4, 5].map((x, i) => ({
  id: `v${i}`,
  coordinates: [x]
})));
export const fourCores = Object.freeze(rankedSupport(fourProvider, 2).map(row => row.value));
export const fourWeight = (i, j) => Math.max(fourCores[i], fourCores[j], fourProvider.distance(i, j));
export const fourCompleteEdges = freeze(Array.from({
  length: 4
}, (_, i) => Array.from({
  length: 3 - i
}, (_, k) => ({
  left: i,
  right: i + k + 1,
  weight: fourWeight(i, i + k + 1)
}))).flat());
export const fourPrim = primTree(4, fourWeight, true);
export function buildHierarchy(n, edges) {
  if (!Number.isSafeInteger(n) || n < 2 || edges.length !== n - 1) throw Error('Hierarchy requires n≥2 and exactly n−1 edges');
  for (const edge of edges) {
    if (![edge.left, edge.right].every(x => Number.isSafeInteger(x) && x >= 0 && x < n)) throw Error('Integer edge endpoints required');
    if (!Number.isFinite(edge.weight) || edge.weight <= 0) throw Error('UNSUPPORTED_NONPOSITIVE_OR_NONFINITE_MERGE_LENGTH');
  }
  const nodes = Array.from({
      length: n
    }, () => ({
      children: [],
      distance: 0,
      count: 1
    })),
    dsu = new DisjointSet(n),
    nodeForRoot = new Map(Array.from({
      length: n
    }, (_, i) => [i, i])),
    events = [];
  const sorted = [...edges].sort((a, b) => a.weight - b.weight || a.left - b.left || a.right - b.right);
  for (let offset = 0; offset < sorted.length;) {
    let end = offset + 1;
    while (end < sorted.length && sorted[end].weight === sorted[offset].weight) end++;
    const batch = sorted.slice(offset, end),
      length = batch[0].weight,
      oldRoots = new Set(batch.flatMap(edge => [dsu.find(edge.left), dsu.find(edge.right)])),
      previous = new Map([...oldRoots].map(root => [root, nodeForRoot.get(root)]));
    for (const edge of batch) if (!dsu.union(edge.left, edge.right)) throw Error('Tree contains a cycle or duplicate edge');
    const merged = new Map();
    for (const [root, node] of previous) {
      const representative = dsu.find(root);
      if (!merged.has(representative)) merged.set(representative, []);
      merged.get(representative).push(node);
    }
    const created = [];
    for (const [root, childNodes] of [...merged].sort(([a], [b]) => a - b)) {
      const children = childNodes.sort((a, b) => a - b),
        node = nodes.length;
      nodes.push({
        children,
        distance: length,
        count: children.reduce((total, child) => total + nodes[child].count, 0)
      });
      nodeForRoot.set(root, node);
      created.push(node);
    }
    events.push({
      distance: length,
      batch: batch.map(edge => ({
        ...edge
      })),
      representatives: Array.from({
        length: n
      }, (_, i) => dsu.find(i)),
      nodeForRoot: [...nodeForRoot].filter(([root]) => dsu.find(root) === root),
      created
    });
    offset = end;
  }
  if (dsu.count !== 1) throw Error('Tree is disconnected');
  return freeze({
    rowCount: n,
    nodes,
    root: nodeForRoot.get(dsu.find(0)),
    events
  });
}
export const chainTree = weights => buildHierarchy(weights.length + 1, weights.map((weight, i) => ({
  weight,
  left: i,
  right: i + 1
})));
export const shrinkWeights = Object.freeze([1 / 8, 1, 1 / 8, 1 / 3, 1 / 6, 1 / 6]);
export const splitWeights = Object.freeze([1 / 2, 1 / 2, 1, 1 / 3, 1 / 6, 1 / 6]);
export function selectionWeights(departure = 4) {
  if (!Number.isFinite(departure) || departure < 4 || departure > 6) throw Error('Child departure must be in [4,6]');
  return [1 / 2, 1 / 2, 1, 1 / departure, 1 / departure, 1 / 3, 1 / departure, 1 / departure];
}
export function condense(tree, minimumSize, method = 'eom') {
  const n = tree.rowCount;
  if (!Number.isSafeInteger(minimumSize) || minimumSize < 2 || minimumSize > n || !['eom', 'leaf'].includes(method)) throw Error('Supported integer minimum size and eom/leaf selection required');
  const work = [{
      parent: -1,
      birth: 0,
      stability: 0,
      maximum: 0
    }],
    records = [],
    events = [];
  const emit = (parent, kind, child, level, count) => {
    records.push({
      parent,
      kind,
      child,
      level,
      count
    });
    work[parent].stability += count * (level - work[parent].birth);
    work[parent].maximum = Math.max(work[parent].maximum, level);
  };
  const departSubtree = (node, branch, level) => {
    const pending = [node];
    while (pending.length) {
      const current = pending.pop(),
        children = tree.nodes[current].children;
      if (children.length) pending.push(...[...children].reverse());else emit(branch, 'point', current, level, 1);
    }
  };
  const pending = [[tree.root, 0]];
  while (pending.length) {
    const [node, branch] = pending.pop(),
      current = tree.nodes[node],
      level = 1 / current.distance;
    if (!Number.isFinite(level)) throw Error('UNSUPPORTED_NONFINITE_LAMBDA');
    const qualifying = current.children.filter(child => tree.nodes[child].count >= minimumSize),
      recordStart = records.length;
    let operation;
    if (qualifying.length >= 2) {
      operation = 'split: create qualifying child identities';
      const tasks = [];
      for (const child of current.children) {
        const count = tree.nodes[child].count;
        if (count < minimumSize) departSubtree(child, branch, level);else {
          const childBranch = work.length;
          work.push({
            parent: branch,
            birth: level,
            stability: 0,
            maximum: 0
          });
          emit(branch, 'branch', childBranch, level, count);
          tasks.push([child, childBranch]);
        }
      }
      pending.push(...tasks.reverse());
    } else if (qualifying.length === 1) {
      operation = 'shrink: retain the same branch and birth';
      const survivor = qualifying[0];
      for (const child of current.children) if (child !== survivor) departSubtree(child, branch, level);
      pending.push([survivor, branch]);
    } else {
      operation = 'depart: no qualifying child remains';
      departSubtree(node, branch, level);
    }
    events.push({
      node,
      branch,
      level,
      operation,
      qualifying: [...qualifying],
      records: records.slice(recordStart).map(row => ({
        ...row
      }))
    });
  }
  if (work.some(branch => !Number.isFinite(branch.stability))) throw Error('UNSUPPORTED_NONFINITE_STABILITY');
  const branches = work.map(branch => ({
      ...branch
    })),
    outgoing = branches.map(() => []),
    children = branches.map(() => []);
  for (const record of records) {
    outgoing[record.parent].push(record);
    if (record.kind === 'branch') children[record.parent].push(record.child);
  }
  const best = branches.map(() => 0),
    chooseParent = branches.map(() => false),
    decisions = [];
  for (let branch = branches.length - 1; branch >= 0; branch--) {
    const descendantTotal = children[branch].reduce((total, child) => total + best[child], 0);
    chooseParent[branch] = method === 'leaf' ? children[branch].length === 0 : branches[branch].stability >= descendantTotal;
    best[branch] = chooseParent[branch] ? branches[branch].stability : descendantTotal;
    decisions.push({
      branch,
      own: branches[branch].stability,
      descendantTotal,
      best: best[branch],
      chooseParent: chooseParent[branch],
      excludedRoot: branch === 0
    });
  }
  const selected = [],
    reconstruct = [0];
  while (reconstruct.length) {
    const branch = reconstruct.pop();
    if (branch !== 0 && chooseParent[branch]) selected.push(branch);else reconstruct.push(...[...children[branch]].reverse());
  }
  selected.sort((a, b) => a - b);
  const labelForBranch = new Map(selected.map((branch, label) => [branch, label])),
    labels = Array(n).fill(-1),
    strengths = Array(n).fill(0),
    outliers = Array(n).fill(0),
    reference = branches.map(branch => branch.maximum),
    pointRecords = [];
  for (let branch = branches.length - 1; branch >= 0; branch--) for (const child of children[branch]) reference[branch] = Math.max(reference[branch], reference[child]);
  const traversal = [[0, -1, null]];
  while (traversal.length) {
    let [branch, owner, ownerDeparture] = traversal.pop();
    if (labelForBranch.has(branch)) {
      owner = branch;
      ownerDeparture = null;
    }
    for (const record of outgoing[branch]) {
      if (record.kind === 'branch') {
        const departure = owner !== -1 && ownerDeparture === null ? record.level : ownerDeparture;
        traversal.push([record.child, owner, departure]);
      } else {
        const row = record.child;
        outliers[row] = Math.max(0, Math.min(1, (reference[branch] - record.level) / reference[branch]));
        let departure = null;
        if (owner !== -1) {
          departure = ownerDeparture === null ? record.level : ownerDeparture;
          labels[row] = labelForBranch.get(owner);
          strengths[row] = Math.min(departure, branches[owner].maximum) / branches[owner].maximum;
        }
        pointRecords.push({
          row,
          immediateBranch: branch,
          pointExit: record.level,
          reference: reference[branch],
          selectedOwner: owner,
          ownerDeparture: departure
        });
      }
    }
  }
  // Small display-only memberships are derived after the linear record model.
  // They are not part of its production storage bound or recursively copied.
  const branchRows = branches.map(() => []);
  for (const point of pointRecords) {
    let branch = point.immediateBranch;
    while (branch !== -1) {
      branchRows[branch].push(point.row);
      branch = branches[branch].parent;
    }
  }
  branchRows.forEach(rows => rows.sort((a, b) => a - b));
  return freeze({
    tree,
    minimumSize,
    method,
    branches,
    records,
    events,
    selected,
    labels,
    strengths,
    outliers,
    children,
    decisions,
    reference,
    pointRecords,
    branchRows,
    total: selected.reduce((sum, branch) => sum + branches[branch].stability, 0)
  });
}
