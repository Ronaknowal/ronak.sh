// Bounded browser translations of §19's supplied contracts. No Python/main/fit replay.
import { EuclideanNeighbourhoods, densityPartition, trailObservations } from './dbscan-neighbourhood-models.mjs';
import { DisjointSet } from './dbscan-hierarchy-models.mjs';
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const provider = (ids, values) => new EuclideanNeighbourhoods(values.map((x, i) => ({
  id: ids[i],
  coordinates: Array.isArray(x) ? x : [x]
})));
const contract = (eps, minimum) => {
  if (!Number.isFinite(eps) || eps <= 0 || !Number.isSafeInteger(minimum) || minimum < 1) throw Error('Positive finite radius and integer self-inclusive minimum required');
};
export function weightedPartition(p, eps, minimum, weights) {
  contract(eps, minimum);
  const n = p.observations.length;
  if (weights.length !== n || weights.some(w => typeof w !== 'number' || !Number.isFinite(w))) throw Error('One finite weight per observation required');
  const labels = Array(n).fill(-2),
    visited = Array(n).fill(false),
    queued = Array(n).fill(false),
    core = Array(n).fill(false),
    calls = Array(n).fill(0),
    sums = Array(n).fill(null);
  let group = 0;
  const query = i => {
    calls[i]++;
    const roster = p.neighbours(i, eps);
    sums[i] = roster.reduce((sum, row) => sum + weights[row.position], 0);
    core[i] = sums[i] >= minimum;
    return roster;
  };
  for (let seed = 0; seed < n; seed++) {
    if (visited[seed]) continue;
    visited[seed] = true;
    let roster = query(seed);
    if (!core[seed]) {
      labels[seed] = -1;
      continue;
    }
    labels[seed] = group;
    const pending = [];
    let head = 0;
    const enqueue = rows => {
      for (const row of rows) if (!queued[row.position]) {
        queued[row.position] = true;
        pending.push(row.position);
      }
    };
    enqueue(roster);
    roster = null;
    while (head < pending.length) {
      const row = pending[head++];
      if (!visited[row]) {
        visited[row] = true;
        roster = query(row);
        if (core[row]) enqueue(roster);
        roster = null;
      }
      if (labels[row] === -2 || labels[row] === -1) labels[row] = group;
    }
    group++;
  }
  return freeze({
    ids: p.observations.map(row => row.id),
    labels,
    core,
    calls,
    sums,
    weights: [...weights]
  });
}
export function duplicateWeights(weight = 3) {
  if (!Number.isSafeInteger(weight) || weight < 0 || weight > 6) throw Error('Representative weight is an integer in [0,6]');
  const original = provider([...'abcde'], [0, 0, 0, .5, 4]),
    compact = provider(['zero', 'half', 'four'], [0, .5, 4]),
    partition = weightedPartition(compact, .6, 3, [weight, 1, 1]),
    expansion = [0, 0, 0, 1, 2];
  return {
    weight,
    original,
    compact,
    partition,
    expansion,
    expandedLabels: expansion.map(i => partition.labels[i]),
    literalOriginalPreserved: weight === 3
  };
}
export const inhibition = (() => {
  const p = provider([...'pqr'], [0, .5, 1]);
  return freeze({
    observations: p.observations,
    partition: weightedPartition(p, .6, 2, [1, -1, 1])
  });
})();
export class SparseNeighbourhoods {
  constructor(ids, indptr, indices, data) {
    const n = ids.length;
    if (!n || new Set(ids).size !== n || ids.some(id => typeof id !== 'string' && !Number.isSafeInteger(id))) throw Error('Unique string/integer IDs required');
    if (indptr.length !== n + 1 || indptr[0] !== 0 || indptr[n] !== indices.length || indices.length !== data.length || indptr.some((v, i) => !Number.isSafeInteger(v) || v < 0 || i && v < indptr[i - 1])) throw Error('Canonical square CSR row pointers required');
    const edges = new Map(),
      adjacency = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      let previous = -1;
      for (let slot = indptr[i]; slot < indptr[i + 1]; slot++) {
        const j = indices[slot],
          distance = data[slot];
        if (!Number.isSafeInteger(j) || j <= previous || j >= n || !Number.isFinite(distance) || distance < 0) throw Error('Unique sorted columns and finite nonnegative lengths required');
        previous = j;
        edges.set(`${i},${j}`, distance);
        row.push({
          position: j,
          id: ids[j],
          distance
        });
      }
      adjacency.push(row);
    }
    for (let i = 0; i < n; i++) if (edges.get(`${i},${i}`) !== 0) throw Error('Explicit self zero required');
    for (const [key, value] of edges) {
      const [i, j] = key.split(',');
      if (edges.get(`${j},${i}`) !== value) throw Error('Exact stored symmetry required');
    }
    this.observations = freeze(ids.map(id => ({
      id
    })));
    this.indptr = freeze([...indptr]);
    this.indices = freeze([...indices]);
    this.data = freeze([...data]);
    this.adjacency = freeze(adjacency);
    Object.freeze(this);
  }
  neighbours(row, eps) {
    contract(eps, 1);
    if (!Number.isSafeInteger(row) || row < 0 || row >= this.observations.length) throw Error('Valid graph row required');
    return freeze(this.adjacency[row].filter(edge => edge.distance <= eps));
  }
}
export const sparseExample = (() => {
  const graph = new SparseNeighbourhoods([...'ABC'], [0, 2, 4, 5], [0, 1, 0, 1, 2], [0, 0, 0, 0, 0]),
    deleted = new SparseNeighbourhoods([...'ABC'], [0, 1, 2, 3], [0, 1, 2], [0, 0, 0]);
  return {
    graph,
    partition: weightedPartition(graph, .1, 2, [1, 1, 1]),
    deleted,
    deletedPartition: weightedPartition(deleted, .1, 2, [1, 1, 1])
  };
})();
export function haloComponents(p, eps, minimum, owners) {
  contract(eps, minimum);
  const n = p.observations.length;
  if (owners.length !== n || owners.some(owner => typeof owner !== 'string' && !Number.isSafeInteger(owner))) throw Error('One stable owner per row required');
  const rosters = p.observations.map((_, i) => p.neighbours(i, eps)),
    core = rosters.map(row => row.length >= minimum),
    dsu = new DisjointSet(n),
    halos = new Map(),
    crossEdges = [];
  for (let i = 0; i < n; i++) {
    if (!halos.has(owners[i])) halos.set(owners[i], new Set());
    for (const row of rosters[i]) halos.get(owners[i]).add(row.position);
    if (core[i]) for (const row of rosters[i]) if (core[row.position]) {
      dsu.union(i, row.position);
      if (i < row.position && owners[i] !== owners[row.position]) crossEdges.push([i, row.position]);
    }
  }
  const components = dsu.groups().filter(rows => core[rows[0]]).sort((a, b) => a[0] - b[0]),
    componentFor = Array(n).fill(-1);
  components.forEach((rows, g) => rows.forEach(i => componentFor[i] = g));
  return freeze({
    observations: p.observations,
    owners: [...owners],
    rosters,
    counts: rosters.map(row => row.length),
    core,
    components,
    crossEdges,
    halos: [...halos].map(([owner, rows]) => ({
      owner,
      owned: owners.flatMap((name, i) => name === owner ? [i] : []),
      rows: [...rows].sort((a, b) => a - b)
    })),
    borderCandidates: p.observations.flatMap((row, i) => core[i] ? [] : [{
      id: row.id,
      position: i,
      components: [...new Set(rosters[i].filter(row => core[row.position]).map(row => componentFor[row.position]))].sort()
    }])
  });
}
export const trailHalos = haloComponents(new EuclideanNeighbourhoods(trailObservations), 1, 4, ['left', 'left', ...Array(8).fill('right')]);
export const frozenReference = (() => {
  const p = provider([...'ABCDEF'], [-2, -1.5, -1, 1, 1.5, 2]);
  return {
    provider: p,
    partition: densityPartition(p, 1, 3)
  };
})();
export function frozenQuery(p, partition, coordinates, eps) {
  contract(eps, 1);
  if (partition.ids.length !== p.observations.length || partition.ids.some((id, i) => id !== p.observations[i].id) || partition.core.length !== p.observations.length || partition.core.some(v => typeof v !== 'boolean') || partition.labels.some((label, i) => !Number.isSafeInteger(label) || label < -1 || partition.core[i] && label < 0)) throw Error('Immutable aligned reference core/label arrays required');
  if (coordinates.length !== p.dimension || coordinates.some(v => typeof v !== 'number' || !Number.isFinite(v))) throw Error('Finite query of reference width required');
  const eligible = p.observations.flatMap((row, i) => partition.core[i] && Math.hypot(...row.coordinates.map((v, j) => v - coordinates[j])) <= eps ? [i] : []),
    components = [...new Set(eligible.map(i => partition.labels[i]))].sort((a, b) => a - b);
  return freeze({
    status: components.length === 0 ? 'none' : components.length === 1 ? 'one_component' : 'ambiguous',
    eligible,
    eligibleIds: eligible.map(i => p.observations[i].id),
    components
  });
}
export function referenceQuery(x = -1.5) {
  if (!Number.isFinite(x) || x < -5 || x > 5) throw Error('Query position is in [−5,5]');
  return {
    x,
    ...frozenQuery(frozenReference.provider, frozenReference.partition, [x], 1)
  };
}
export const insertionWitness = (() => {
  const before = new EuclideanNeighbourhoods(trailObservations),
    after = new EuclideanNeighbourhoods([...trailObservations, {
      id: 'I′',
      coordinates: [0]
    }]);
  return freeze({
    before: {
      observations: before.observations,
      partition: densityPartition(before, 1, 4),
      roster: before.neighbours(8, 1)
    },
    after: {
      observations: after.observations,
      partition: densityPartition(after, 1, 4),
      roster: after.neighbours(8, 1),
      newRoster: after.neighbours(10, 1)
    }
  });
})();
export function outputCost(n) {
  if (!Number.isSafeInteger(n) || n < 1) throw Error('Positive integer row count required');
  const incidences = BigInt(n) ** 2n;
  return {
    n,
    incidences,
    indexBytes: incidences * 8n
  };
}
export function portableExample() {
  const raw = provider([...'ABCDEFGH'], [[0, 0], [0, .2], [.2, 0], [.2, .2], [5, 5], [5, 5.2], [5.2, 5], [5.2, 5.2]]),
    n = 8,
    mean = [0, 1].map(j => raw.observations.reduce((sum, row) => sum + row.coordinates[j], 0) / n),
    variance = [0, 1].map(j => raw.observations.reduce((sum, row) => sum + (row.coordinates[j] - mean[j]) ** 2, 0) / n),
    scale = variance.map(Math.sqrt),
    normalized = new EuclideanNeighbourhoods(raw.observations.map(row => ({
      ...row,
      coordinates: row.coordinates.map((v, j) => (v - mean[j]) / scale[j])
    }))),
    radii = [.04, .08, .12],
    partitions = radii.map(eps => densityPartition(normalized, eps, 3));
  // This declared fixture has only full-assignment or no-assignment states. Compare
  // actual assigned pair equivalence, rather than substituting scalar ARI for no support.
  const candidates = partitions.map((p, i) => {
    const next = partitions[i + 1],
      common = next ? p.labels.flatMap((label, j) => label >= 0 && next.labels[j] >= 0 ? [j] : []) : [],
      same = common.length >= 2 && common.every(a => common.every(b => p.labels[a] === p.labels[b] === (next.labels[a] === next.labels[b])));
    return {
      eps: radii[i],
      partition: p,
      groups: new Set(p.labels.filter(v => v >= 0)).size,
      coverage: p.labels.filter(v => v >= 0).length / n,
      nextCommonCoverage: common.length / n,
      nextAssignedAri: common.length < 2 ? null : same ? 1 : null
    };
  });
  const chosen = candidates.find(row => row.groups >= 2 && row.coverage >= .8 && row.nextCommonCoverage >= .8 && row.nextAssignedAri === 1);
  if (!chosen) throw Error('NO_CANDIDATE_MEETS_DECLARED_DEVELOPMENT_PROTOCOL');
  const heldOut = [[.1, .1], [2.6, 2.6], [9, 9]].map(coordinates => {
    const transformed = coordinates.map((v, j) => (v - mean[j]) / scale[j]);
    return {
      coordinates,
      transformed,
      query: frozenQuery(normalized, chosen.partition, transformed, chosen.eps)
    };
  });
  return freeze({
    raw: raw.observations,
    mean,
    variance,
    scale,
    normalized: normalized.observations,
    candidates,
    chosen,
    heldOut,
    side: .2 / scale[0],
    diagonal: Math.SQRT2 * .2 / scale[0],
    externalAnnotations: ['left', 'left', 'left', 'left', 'right', 'right', 'right', 'right']
  });
}
export const portableState = portableExample();
