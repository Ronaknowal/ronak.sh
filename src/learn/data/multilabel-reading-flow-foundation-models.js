// Topic-local, bounded arithmetic for the accepted foundational objects.
// No data fitting, scientific-program execution or hidden test-label access.
export const labelIdentities = Object.freeze([
  Object.freeze({ id: 'A', name: 'Billing', color: '#f0b45b' }),
  Object.freeze({ id: 'B', name: 'Access', color: '#75adff' }),
  Object.freeze({ id: 'C', name: 'Urgent', color: '#bc9aff' }),
  Object.freeze({ id: 'D', name: 'D', color: '#ef8ca4' }),
  Object.freeze({ id: 'E', name: 'E', color: '#59cbd3' }),
  Object.freeze({ id: 'F', name: 'F', color: '#e3d0a0' }),
]);

export const labelOrders = Object.freeze(['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA']);
export const foundationCollections = Object.freeze([[0, 1], [2], []]);

export function encodeFoundationCollections(order = 'ABC') {
  if (!labelOrders.includes(order)) throw new Error('Choose a complete A/B/C vocabulary permutation.');
  const columns = [...order].map(id => labelIdentities.find(label => label.id === id));
  const rows = foundationCollections.map((collection, index) => ({
    id: `M${index + 1}`,
    names: collection.map(position => labelIdentities[position].name),
    values: columns.map(column => Number(collection.includes(labelIdentities.indexOf(column)))),
  }));
  return { columns, rows, cardinality: 1, density: 1 / 3 };
}

export function groupedTextMembership(group = 1, intact = true) {
  if (!Number.isInteger(group) || group < 0 || group > 15) throw new Error('Choose a group from 0 to 15.');
  const groups = Array.from({ length: 16 }, (_, id) => {
    const role = id < 8 ? 'train' : id < 12 ? 'validation' : 'test';
    const first = { id: 2 * id, role };
    const second = { id: 2 * id + 1, role: !intact && id === group ? (role === 'train' ? 'test' : 'train') : role };
    return { id, role, rows: [first, second], split: first.role !== second.role };
  });
  return { groups, selected: groups[group], intact, counts: ['train', 'validation', 'test'].map(role => ({ role, rows: groups.flatMap(value => value.rows).filter(row => row.role === role).length })) };
}

const allocationRows = Object.freeze([[1, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]]);

function tiePriorities(length, random) {
  const permutation = Array.from({ length }, (_, index) => index);
  for (let last = length - 1; last > 0; last -= 1) {
    const selected = Math.floor(random() * (last + 1));
    [permutation[last], permutation[selected]] = [permutation[selected], permutation[last]];
  }
  const priority = Array(length);
  permutation.forEach((value, index) => { priority[value] = index; });
  return priority;
}

export function multilabelAllocationTrace(seed = 0) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 100) throw new Error('Use an integer tie seed from 0 to 100.');
  // The browser's deterministic tie ordering is a constructed illustration.
  // It does not claim NumPy PCG64 or the separate recorded three-fold output.
  let state = seed + 1;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const rowPriority = tiePriorities(6, random);
  const foldPriority = tiePriorities(2, random);
  const capacity = [3, 3];
  const deficits = [[1.5, 1, .5], [1.5, 1, .5]];
  const assignment = Array(6).fill(null);
  const remaining = new Set([0, 1, 2, 3, 4, 5]);
  const frames = [];
  function save(move) {
    frames.push({ step: frames.length, rows: allocationRows.map((values, id) => ({ id, values: [...values], fold: assignment[id] })), capacity: [...capacity], deficits: deficits.map(row => [...row]), remainingCounts: [0, 1, 2].map(label => [...remaining].reduce((sum, row) => sum + allocationRows[row][label], 0)), move });
  }
  save(null);
  while (remaining.size) {
    const counts = [0, 1, 2].map(label => [...remaining].reduce((sum, row) => sum + allocationRows[row][label], 0));
    const positive = [0, 1, 2].filter(label => counts[label] > 0);
    positive.sort((a, b) => counts[a] - counts[b] || a - b);
    const label = positive[0] ?? null;
    const candidates = [...remaining].filter(row => label === null || allocationRows[row][label]);
    candidates.sort((a, b) => allocationRows[b].reduce((x, y) => x + y, 0) - allocationRows[a].reduce((x, y) => x + y, 0) || rowPriority[a] - rowPriority[b]);
    const row = candidates[0];
    const eligible = [0, 1].filter(fold => capacity[fold] > 0);
    eligible.sort((a, b) => (label === null ? 0 : deficits[b][label] - deficits[a][label]) || capacity[b] - capacity[a] || foldPriority[a] - foldPriority[b]);
    const fold = eligible[0];
    assignment[row] = fold;
    capacity[fold] -= 1;
    deficits[fold] = deficits[fold].map((value, column) => value - allocationRows[row][column]);
    remaining.delete(row);
    save({ row, fold, label });
  }
  return frames;
}

export const foundationMaskTargets = Object.freeze([[1, 1, 0], [0, 0, 1], [0, 0, 0]]);
export const foundationMaskProbabilities = Object.freeze([[.8, .7, .2], [.2, .3, .8], [.1, .2, .1]]);
export const defaultFoundationMask = () => [[true, true, true], [true, false, true], [true, true, true]];

export function observedFoundationTerms(mask) {
  if (mask.length !== 3 || mask.some(row => row.length !== 3 || row.some(value => typeof value !== 'boolean'))) throw new Error('Use an aligned three-row/three-label observation mask.');
  const columns = labelIdentities.slice(0, 3).map((label, column) => {
    const terms = mask.map((row, index) => {
      const target = foundationMaskTargets[index][column];
      const probability = foundationMaskProbabilities[index][column];
      return { row: index, observed: row[column], target, probability, loss: -Math.log(target ? probability : 1 - probability) };
    });
    const observed = terms.filter(term => term.observed);
    const sum = observed.reduce((total, term) => total + term.loss, 0);
    return { label, terms, count: observed.length, sum, mean: observed.length ? sum / observed.length : null };
  });
  const count = columns.reduce((total, column) => total + column.count, 0);
  const sum = columns.reduce((total, column) => total + column.sum, 0);
  return { columns, count, globalMean: count ? sum / count : null, outputMeanSum: columns.every(column => column.count > 0) ? columns.reduce((total, column) => total + column.mean, 0) : null };
}
