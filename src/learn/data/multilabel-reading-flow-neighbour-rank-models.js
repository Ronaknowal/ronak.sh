export const neighbourRows = Object.freeze([
  { id: 0, x: 0, bits: [1, 0] }, { id: 1, x: 1, bits: [1, 1] },
  { id: 2, x: 2, bits: [1, 0] }, { id: 3, x: 5, bits: [0, 1] },
  { id: 4, x: 6, bits: [0, 0] }, { id: 5, x: 7, bits: [0, 1] },
]);

export function nearestNamedRows(rows, query, k, excludedID = null) {
  if (!Number.isFinite(query) || !Number.isInteger(k) || k < 1 || k > rows.length - Number(excludedID !== null)) {
    throw Error('Use a finite query and a supported neighbour count.');
  }
  return rows.filter(row => row.id !== excludedID).map(row => ({ ...row, distance: Math.abs(row.x - query) }))
    .sort((a, b) => a.distance - b.distance || a.id - b.id).slice(0, k);
}
export function neighbourQuery(query = 1.2, k = 2) {
  if (!Number.isFinite(query) || query < -1 || query > 8 || !Number.isInteger(k) || k < 1 || k > 5) throw Error('Use query −1 to 8 and k=1 to 5.');
  const selected = nearestNamedRows(neighbourRows, query, k);
  const counts = [0, 1].map(column => selected.reduce((sum, row) => sum + row.bits[column], 0));
  return { query, k, selected, counts, radius: selected.at(-1).distance,
    distances: neighbourRows.map(row => ({ ...row, distance: Math.abs(row.x - query), selected: selected.some(neighbour => neighbour.id === row.id) }))
      .sort((a, b) => a.distance - b.distance || a.id - b.id) };
}
export function countHistograms(k = 2) {
  if (!Number.isInteger(k) || k < 1 || k > 5) throw Error('Use k=1 to 5.');
  const histograms = Array.from({ length: 2 }, () => [Array(k + 1).fill(0), Array(k + 1).fill(0)]);
  const rows = neighbourRows.map(row => {
    const neighbours = nearestNamedRows(neighbourRows, row.x, k, row.id);
    const counts = [0, 1].map(column => neighbours.reduce((sum, neighbour) => sum + neighbour.bits[column], 0));
    counts.forEach((count, column) => { histograms[column][row.bits[column]][count] += 1; });
    return { ...row, neighbours, counts };
  });
  return { k, rows, histograms };
}
export function countPosterior(count = 2, smoothing = 1, column = 0) {
  if (!Number.isInteger(count) || count < 0 || count > 2 || !Number.isFinite(smoothing) || smoothing < .1 || smoothing > 5 || ![0, 1].includes(column)) {
    throw Error('Use count 0–2, smoothing .1–5 and label A or B.');
  }
  const histograms = countHistograms().histograms[column];
  const branches = histograms.map((histogram, bit) => {
    const ownRows = histogram.reduce((a, b) => a + b, 0);
    const prior = (smoothing + ownRows) / (6 + 2 * smoothing);
    const denominator = ownRows + 3 * smoothing;
    const likelihood = (smoothing + histogram[count]) / denominator;
    return { bit, histogram, ownRows, prior, denominator, likelihood, numerator: prior * likelihood };
  });
  const denominator = branches.reduce((sum, branch) => sum + branch.numerator, 0);
  const posterior = branches[1].numerator / denominator;
  return { count, smoothing, column, branches, denominator, posterior, decision: Number(posterior >= .5) };
}
export function pairMargin(pair = 0, margin = .4) {
  if (![0, 1].includes(pair) || !Number.isFinite(margin) || margin < -2 || margin > 2) throw Error('Use A>B or C>B and a margin from −2 to 2.');
  const active = margin < 1;
  return { pair, relevant: pair === 0 ? 0 : 2, irrelevant: 1, x: [1, -1], weights: [.2, -.2],
    biasDifference: margin - .4, relevantScore: margin, irrelevantScore: 0,
    hinge: Math.max(0, 1 - margin), active,
    relevantGradient: active ? [-1, 1] : [0, 0], irrelevantGradient: active ? [1, -1] : [0, 0],
    biasGradients: active ? [-1, 1] : [0, 0] };
}

export const virtualPairs = Object.freeze([[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]);
export const virtualDefaultDirections = Object.freeze([0, 1, 0, 1, 1, 0]);
export function virtualTournament(directions = virtualDefaultDirections) {
  if (!Array.isArray(directions) || directions.length !== 6 || directions.some(value => value !== 0 && value !== 1)) throw Error('Use six binary pair directions.');
  const votes = Array(4).fill(0);
  const edges = virtualPairs.map((pair, index) => {
    const winner = pair[directions[index]], loser = pair[1 - directions[index]];
    votes[winner] += 1;
    return { winner, loser, pair };
  });
  const precedes = (a, b) => edges.some(edge => edge.winner === a && edge.loser === b);
  const cycles = [];
  for (let a = 0; a < 4; a += 1) for (let b = a + 1; b < 4; b += 1) for (let c = b + 1; c < 4; c += 1) {
    if (precedes(a, b) && precedes(b, c) && precedes(c, a)) cycles.push([a, b, c]);
    if (precedes(a, c) && precedes(c, b) && precedes(b, a)) cycles.push([a, c, b]);
  }
  return { edges, votes, decisions: votes.slice(0, 3).map(value => Number(value > votes[3])), cycles,
    order: [0, 1, 2, 3].sort((a, b) => votes[b] - votes[a] || a - b) };
}
