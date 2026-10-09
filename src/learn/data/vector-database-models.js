export const vectorRecords = [{
  id: 'A',
  x: 1,
  y: 0,
  access: 'public'
}, {
  id: 'B',
  x: 4,
  y: 1,
  access: 'restricted'
}, {
  id: 'C',
  x: 0,
  y: 2,
  access: 'public'
}, {
  id: 'D',
  x: 2,
  y: 2,
  access: 'restricted'
}, {
  id: 'E',
  x: 3,
  y: 0,
  access: 'public'
}, {
  id: 'F',
  x: 1,
  y: 3,
  access: 'public'
}];
export const coarseCentroids = [{
  id: 'L0',
  x: 0,
  y: 0
}, {
  id: 'L1',
  x: 4,
  y: 0
}, {
  id: 'L2',
  x: 2,
  y: 4
}];
export const coarseRecords = [{
  id: 'A',
  x: 1.9,
  y: 0
}, {
  id: 'B',
  x: 2.1,
  y: 0
}, {
  id: 'C',
  x: 4.2,
  y: 0
}, {
  id: 'D',
  x: 0,
  y: 1
}, {
  id: 'E',
  x: 2,
  y: 3
}, {
  id: 'F',
  x: 3,
  y: 4
}];
const distance = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export function rankVectors(records, query, metric = 'l2') {
  if (metric === 'cosine' && Math.hypot(query.x, query.y) === 0) return null;
  return records.map(record => ({
    ...record,
    score: metric === 'l2' ? -distance(record, query) : metric === 'dot' ? record.x * query.x + record.y * query.y : (record.x * query.x + record.y * query.y) / (Math.hypot(record.x, record.y) * Math.hypot(query.x, query.y))
  })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
export function filteredRetrieval(query, metric, access, k) {
  const ranking = rankVectors(vectorRecords, query, metric);
  if (!ranking) return null;
  const permitted = record => access === 'all' || record.access === access;
  return {
    ranking,
    eligible: ranking.filter(permitted),
    winners: ranking.filter(permitted).slice(0, k),
    postfiltered: ranking.slice(0, k).filter(permitted)
  };
}
export function coarseRetrieval(query, probes) {
  const lists = coarseCentroids.map(center => ({
    ...center,
    records: []
  }));
  for (const record of coarseRecords) {
    const owner = [...lists].sort((a, b) => distance(record, a) - distance(record, b) || a.id.localeCompare(b.id))[0];
    owner.records.push(record);
  }
  const selected = [...lists].sort((a, b) => distance(query, a) - distance(query, b) || a.id.localeCompare(b.id)).slice(0, probes);
  const candidates = selected.flatMap(list => list.records);
  const exact = rankVectors(coarseRecords, query).slice(0, 2);
  const approximate = rankVectors(candidates, query).slice(0, 2);
  return {
    lists,
    selected,
    candidates,
    exact,
    approximate,
    recall: approximate.filter(row => exact.some(other => other.id === row.id)).length / 2
  };
}
