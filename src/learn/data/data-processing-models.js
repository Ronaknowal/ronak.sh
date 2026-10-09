export function paddingPlan(lengths, grouped) {
  const records = lengths.map((length, index) => ({ id: index + 1, length }));
  if (grouped) records.sort((a, b) => a.length - b.length || a.id - b.id);
  const batches = [];
  for (let start = 0; start < records.length; start += 2) {
    const rows = records.slice(start, start + 2);
    batches.push({ rows, width: Math.max(...rows.map(row => row.length)) });
  }
  const valid = lengths.reduce((a, b) => a + b, 0);
  const allocated = batches.reduce((sum, batch) => sum + batch.width * batch.rows.length, 0);
  return { batches, valid, allocated, padding: allocated - valid };
}

export function dataOwnership(count, ranks, workers, replicated) {
  const ownerCount = ranks * workers;
  const owners = Array.from({ length: ownerCount }, (_, owner) => ({ rank: Math.floor(owner / workers), worker: owner % workers, ids: Array.from({ length: count }, (_, index) => index).filter(index => replicated || index % ownerCount === owner) }));
  const yielded = owners.reduce((sum, owner) => sum + owner.ids.length, 0);
  return { owners, yielded, unique: count, duplicates: yielded - count };
}
