// Private browser mechanisms for the accepted DBSCAN manuscript, D01–D12.
// No recorded study is imported or executed. Trace snapshots are requested output,
// separate from the O(n) metadata of the query-on-demand clustering operation.

export const diskObservations = Object.freeze([
  { id: 'P', coordinates: [0, 0] },
  { id: 'Q', coordinates: [0.75, 0] },
  { id: 'R', coordinates: [0, 1] },
  { id: 'S', coordinates: [-0.75, -0.5] },
  { id: 'T', coordinates: [1.25, 0.75] }
].map(row => Object.freeze({ ...row, coordinates: Object.freeze(row.coordinates) })));

export const trailObservations = Object.freeze([
  -1.75, -1.5, -1.25, -1, 1, 1.25, 1.5, 1.75, 0, 4
].map((value, position) => Object.freeze({
  id: String.fromCharCode(65 + position), coordinates: Object.freeze([value])
})));

export const coincidentObservations = Object.freeze([
  [0, 0], [0.5, 0], [1, 0], [1, 0], [3, 0]
].map((coordinates, position) => Object.freeze({
  id: String.fromCharCode(65 + position), coordinates: Object.freeze(coordinates)
})));

function positiveRadius(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new RangeError('The neighbourhood radius must be finite and positive.');
  }
  return value;
}

function positiveMinimum(value) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError('The self-inclusive minimum must be a positive integer.');
  }
  return value;
}

export class EuclideanNeighbourhoods {
  constructor(observations) {
    if (!Array.isArray(observations) || observations.length === 0) {
      throw new RangeError('Supply at least one observation.');
    }
    const width = observations[0]?.coordinates?.length;
    if (!Number.isSafeInteger(width) || width < 1) {
      throw new RangeError('An observation needs one or more feature coordinates.');
    }
    const ids = new Set();
    this.observations = Object.freeze(observations.map(row => {
      if (!(typeof row.id === 'string' || Number.isSafeInteger(row.id)) || ids.has(row.id)) {
        throw new RangeError('Observation IDs must be unique strings or integers.');
      }
      ids.add(row.id);
      if (!Array.isArray(row.coordinates) || row.coordinates.length !== width ||
          row.coordinates.some(value => typeof value !== 'number' || !Number.isFinite(value))) {
        throw new RangeError('Features must form a finite rectangular table.');
      }
      return Object.freeze({ id: row.id, coordinates: Object.freeze([...row.coordinates]) });
    }));
    this.dimension = width;
    Object.freeze(this);
  }

  requirePosition(position) {
    if (!Number.isSafeInteger(position) || position < 0 || position >= this.observations.length) {
      throw new RangeError('Position must identify an observation in the input table.');
    }
  }

  distance(left, right) {
    this.requirePosition(left);
    this.requirePosition(right);
    const a = this.observations[left].coordinates;
    const b = this.observations[right].coordinates;
    let length = 0;
    for (let feature = 0; feature < this.dimension; feature += 1) {
      length = Math.hypot(length, a[feature] - b[feature]);
    }
    if (!Number.isFinite(length)) throw new RangeError('Distance exceeds the finite supported geometry.');
    return length;
  }

  neighbours(position, eps) {
    this.requirePosition(position);
    positiveRadius(eps);
    const roster = [];
    for (let other = 0; other < this.observations.length; other += 1) {
      const distance = this.distance(position, other);
      if (distance <= eps) roster.push(Object.freeze({ position: other, id: this.observations[other].id, distance }));
    }
    return Object.freeze(roster);
  }

  rankedDistances(position) {
    this.requirePosition(position);
    return Object.freeze(this.observations.map((row, other) => Object.freeze({
      position: other, id: row.id, distance: this.distance(position, other)
    })).sort((a, b) => a.distance - b.distance || a.position - b.position));
  }
}

export function densityPartition(provider, eps, minimum, { seedOrder, trace = false } = {}) {
  positiveRadius(eps);
  positiveMinimum(minimum);
  const size = provider.observations.length;
  const order = seedOrder === undefined ? Array.from({ length: size }, (_, position) => position) : [...seedOrder];
  if (order.length !== size || new Set(order).size !== size ||
      order.some(position => !Number.isSafeInteger(position) || position < 0 || position >= size)) {
    throw new RangeError('Seed order must be a permutation of input positions.');
  }
  const labels = Array(size).fill(-2);
  const visited = Array(size).fill(false);
  const enqueued = Array(size).fill(false);
  const core = Array(size).fill(null);
  const queryCounts = Array(size).fill(0);
  const states = [];
  let group = 0;

  function emit(operation, current, pending, roster = [], head = 0) {
    if (!trace) return;
    states.push(Object.freeze({
      operation, current, group, pending: Object.freeze(pending.slice(head)),
      roster: Object.freeze([...roster]), labels: Object.freeze([...labels]),
      visited: Object.freeze([...visited]), enqueued: Object.freeze([...enqueued]),
      core: Object.freeze([...core]), queryCounts: Object.freeze([...queryCounts])
    }));
  }

  function query(position) {
    queryCounts[position] += 1;
    const roster = provider.neighbours(position, eps);
    core[position] = roster.length >= minimum;
    return roster;
  }

  for (const seed of order) {
    if (visited[seed]) continue;
    visited[seed] = true;
    let roster = query(seed);
    if (!core[seed]) {
      labels[seed] = -1;
      emit('noise', seed, [], roster);
      continue;
    }
    labels[seed] = group;
    const pending = [];
    let head = 0;
    function enqueue(response) {
      for (const { position } of response) {
        if (!enqueued[position]) {
          enqueued[position] = true;
          pending.push(position);
        }
      }
    }
    enqueue(roster);
    emit('core-seed', seed, pending, roster);
    roster = null;
    while (head < pending.length) {
      const current = pending[head];
      head += 1;
      emit('dequeue', current, pending, [], head);
      if (!visited[current]) {
        visited[current] = true;
        roster = query(current);
        if (core[current]) enqueue(roster);
        emit('query', current, pending, roster, head);
        roster = null;
      }
      if (labels[current] === -2 || labels[current] === -1) {
        const wasNoise = labels[current] === -1;
        labels[current] = group;
        emit(wasNoise ? 'noise-to-border' : 'attach', current, pending, [], head);
      }
    }
    group += 1;
  }
  emit('complete', null, []);
  return Object.freeze({
    ids: Object.freeze(provider.observations.map(row => row.id)),
    labels: Object.freeze(labels), core: Object.freeze(core),
    queryCounts: Object.freeze(queryCounts), states: Object.freeze(states)
  });
}

export function coreComponentRows(provider, partition) {
  if (partition.ids.length !== provider.observations.length ||
      partition.ids.some((id, position) => id !== provider.observations[position].id)) {
    throw new RangeError('The partition must match the provider observation IDs.');
  }
  const byGroup = new Map();
  partition.labels.forEach((label, position) => {
    if (partition.core[position]) {
      if (!byGroup.has(label)) byGroup.set(label, []);
      byGroup.get(label).push(position);
    }
  });
  return Object.freeze([...byGroup.values()].map(rows => Object.freeze(rows))
    .sort((a, b) => a[0] - b[0]));
}
