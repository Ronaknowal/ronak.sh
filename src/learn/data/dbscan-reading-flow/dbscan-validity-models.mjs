// Browser anatomy for fixed labelled clouds, following current density_validity.py.
// No clustering fit, optional library execution, main or recorded study replay.
import { EuclideanNeighbourhoods } from './dbscan-neighbourhood-models.mjs';
import { primTree } from './dbscan-hierarchy-models.mjs';
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
export function allPointsCores(rows, distance, dimension, omitZero = false) {
  if (!Number.isSafeInteger(dimension) || dimension < 1 || rows.length < 2) throw Error('SINGLETON_CLUSTER');
  return rows.map(row => {
    const values = rows.filter(other => other !== row).map(other => distance(row, other)),
      positive = values.filter(value => value > 0);
    if (!omitZero && positive.length !== values.length) throw Error('DUPLICATE_POINTS');
    if (!positive.length) {
      if (omitZero) return 0;
      throw Error('NO_POSITIVE_DISTANCES');
    }
    const delta = Math.min(...positive),
      scaled = positive.reduce((sum, value) => sum + (delta / value) ** dimension, 0),
      core = delta * Math.exp((Math.log(rows.length - 1) - Math.log(scaled)) / dimension);
    if (!Number.isFinite(core)) throw Error('NONFINITE_ALL_POINTS_CORE');
    return core;
  });
}
export function validityReport(observations, labels, convention = 'strict') {
  if (!['strict', 'matlab', 'contrib'].includes(convention)) throw Error('Named convention required');
  const provider = new EuclideanNeighbourhoods(observations),
    n = observations.length,
    dimension = observations[0].coordinates.length,
    noise = convention === 'matlab' ? 0 : -1;
  if (labels.length !== n || labels.some(label => !['number', 'string'].includes(typeof label) || typeof label === 'number' && (!Number.isSafeInteger(label) || label < 0 && label !== noise))) throw Error('One supported integer/string label per row required');
  let groups = new Map();
  labels.forEach((label, row) => {
    if (label !== noise) {
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(row);
    }
  });
  if (convention === 'matlab') groups = new Map([...groups].filter(([, rows]) => rows.length > 1));
  const assigned = [...groups.values()].reduce((sum, rows) => sum + rows.length, 0),
    coverage = assigned / n;
  const diagnostic = (status, detail, score = null) => freeze({
    status,
    detail,
    score,
    conditional: null,
    coverage,
    clusters: [],
    convention
  });
  if (!groups.size) return diagnostic('ALL_NOISE', 'No assigned group supports separation', convention === 'strict' ? null : 0);
  if (groups.size === 1) return diagnostic('ONE_GROUP', 'No other group supplies separation', convention === 'matlab' ? 0 : null);
  if ([...groups.values()].some(rows => rows.length === 1)) return diagnostic('SINGLETON_CLUSTER', 'All-points denominator size−1 is unavailable');
  if (convention === 'strict' && [...groups.values()].some(rows => rows.length === 2)) return diagnostic('TWO_ROW_CLUSTER', 'Two-row tree has no internal vertex');
  const distance = (i, j) => {
    let value;
    try {
      value = provider.distance(i, j);
    } catch {
      throw Error('NONFINITE_DISTANCE');
    }
    if (convention === 'matlab') value *= value;
    if (!Number.isFinite(value)) throw Error('NONFINITE_DISTANCE_POWER');
    return value;
  };
  try {
    if (convention === 'strict') for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (distance(i, j) === 0) throw Error('DUPLICATE_POINTS');
    const anatomy = [];
    for (const [label, rows] of groups) {
      const cores = allPointsCores(rows, distance, dimension, convention !== 'strict'),
        tree = primTree(rows.length, (i, j) => Math.max(cores[i], cores[j], distance(rows[i], rows[j]))),
        degrees = rows.map(() => 0);
      for (const edge of tree.edges) {
        degrees[edge.left]++;
        degrees[edge.right]++;
      }
      let internal = rows.map((_, i) => i).filter(i => degrees[i] > 1);
      const internalEdges = tree.edges.filter(edge => degrees[edge.left] > 1 && degrees[edge.right] > 1);
      if (convention === 'strict' && (internal.length < 2 || !internalEdges.length)) return diagnostic('INSUFFICIENT_INTERNAL_VERTICES', 'Strict DSC requires an internal edge; no fallback');
      if (!internal.length) internal = convention === 'matlab' ? rows.map((_, i) => i) : [0];
      const usedEdges = internalEdges.length ? internalEdges : tree.edges,
        sparseness = Math.max(...usedEdges.map(edge => edge.weight));
      anatomy.push({
        label,
        rows: [...rows],
        cores,
        edges: tree.edges.map(edge => ({
          left: rows[edge.left],
          right: rows[edge.right],
          weight: edge.weight
        })),
        degrees,
        internal: internal.map(i => rows[i]),
        internalEdges: internalEdges.map(edge => ({
          left: rows[edge.left],
          right: rows[edge.right],
          weight: edge.weight
        })),
        sparseness,
        separation: Infinity,
        pair: [],
        pairs: []
      });
    }
    for (let left = 0; left < anatomy.length; left++) for (let right = left + 1; right < anatomy.length; right++) {
      const a = anatomy[left],
        b = anatomy[right];
      let separation = Infinity,
        chosen = [];
      for (const rowA of a.internal) for (const rowB of b.internal) {
        const coreA = a.cores[a.rows.indexOf(rowA)],
          coreB = b.cores[b.rows.indexOf(rowB)],
          raw = distance(rowA, rowB),
          candidate = Math.max(coreA, coreB, raw),
          record = {
            left: rowA,
            right: rowB,
            raw,
            coreA,
            coreB,
            weight: candidate
          };
        a.pairs.push(record);
        b.pairs.push({
          ...record,
          left: rowB,
          right: rowA,
          coreA: coreB,
          coreB: coreA
        });
        if (candidate < separation) {
          separation = candidate;
          chosen = [rowA, rowB];
        }
      }
      if (separation < a.separation) {
        a.separation = separation;
        a.pair = chosen;
      }
      if (separation < b.separation) {
        b.separation = separation;
        b.pair = [...chosen].reverse();
      }
    }
    for (const group of anatomy) {
      const denominator = Math.max(group.sparseness, group.separation);
      if (!Number.isFinite(denominator) || denominator === 0) return diagnostic('UNDEFINED_SCORE_DENOMINATOR', 'No finite positive score denominator');
      group.score = (group.separation - group.sparseness) / denominator;
      group.weight = group.rows.length / n;
      group.contribution = group.score * group.weight;
    }
    const score = anatomy.reduce((sum, group) => sum + group.contribution, 0);
    return freeze({
      status: 'OK',
      detail: 'Every global weight uses original input n',
      convention,
      score,
      conditional: score / coverage,
      coverage,
      clusters: anatomy,
      dimension
    });
  } catch (error) {
    return diagnostic(error.message, 'Outside the supported finite geometry/arithmetic domain');
  }
}
export function translatedCloud(offset = 12) {
  if (!Number.isFinite(offset) || offset < 2 || offset > 12) throw Error('Translation is in [2,12]');
  const coordinates = [[0, 0], [1, 0], [3, 1], [6, 1], [offset, 4], [offset + 2, 4], [offset + 5, 6], [offset + 9, 6], [8, 8]],
    ids = [...'ABCDEFGH', 'J'];
  const observations = coordinates.map((coordinates, i) => ({
      id: ids[i],
      coordinates
    })),
    labels = Array(4).fill('left').concat(Array(4).fill('right'), -1),
    report = validityReport(observations, labels);
  return {
    offset,
    observations,
    labels,
    report
  };
}
export const rightScoreZero = 1 + Math.sqrt(18096 / 1049 - 9);
export const fixedValidity = freeze(translatedCloud(12));
export function squareAlternatives() {
  const observations = [[0, 0], [1, 0], [1, 1], [0, 1]].map((coordinates, i) => ({
      id: 'ABCD'[i],
      coordinates
    })),
    provider = new EuclideanNeighbourhoods(observations),
    cores = allPointsCores([0, 1, 2, 3], (i, j) => provider.distance(i, j), 2);
  const paths = [[[0, 1], [1, 2], [2, 3]], [[1, 2], [2, 3], [3, 0]]].map(pairs => {
    const edges = pairs.map(([left, right]) => ({
        left,
        right,
        weight: Math.max(cores[left], cores[right], provider.distance(left, right))
      })),
      degrees = [0, 0, 0, 0];
    for (const edge of edges) {
      degrees[edge.left]++;
      degrees[edge.right]++;
    }
    return {
      edges,
      degrees,
      internal: degrees.map((degree, i) => degree > 1 ? i : -1).filter(i => i >= 0),
      total: edges.reduce((sum, edge) => sum + edge.weight, 0)
    };
  });
  return freeze({
    observations,
    cores,
    paths
  });
}
export function groupShape(points) {
  const observations = points.map((coordinates, i) => ({
      id: String.fromCharCode(65 + i),
      coordinates
    })),
    provider = new EuclideanNeighbourhoods(observations),
    rows = points.map((_, i) => i);
  if (points.length === 1) return {
    observations,
    status: 'SINGLETON_CLUSTER',
    edges: [],
    degrees: [0],
    internal: [],
    detail: 'size−1 = 0; no all-points core'
  };
  let cores;
  try {
    cores = allPointsCores(rows, (i, j) => provider.distance(i, j), points[0].length);
  } catch (error) {
    return {
      observations,
      status: error.message,
      edges: [],
      degrees: [],
      internal: [],
      detail: 'zero distance violates strict distinct-point geometry'
    };
  }
  const tree = primTree(points.length, (i, j) => Math.max(cores[i], cores[j], provider.distance(i, j))),
    degrees = rows.map(() => 0);
  for (const edge of tree.edges) {
    degrees[edge.left]++;
    degrees[edge.right]++;
  }
  const internal = rows.filter(i => degrees[i] > 1),
    internalEdges = tree.edges.filter(edge => degrees[edge.left] > 1 && degrees[edge.right] > 1);
  return {
    observations,
    cores,
    edges: tree.edges,
    degrees,
    internal,
    status: internalEdges.length ? 'SUPPORTED_INTERNAL_SHAPE' : points.length === 2 ? 'TWO_ROW_CLUSTER' : 'INSUFFICIENT_INTERNAL_VERTICES',
    detail: internalEdges.length ? 'An internal edge exists; another group is still needed for separation' : `internal vertices ${internal.length}; internal edges ${internalEdges.length}`
  };
}
