// Explicit teaching computations. Measured study results are immutable data.
export const roles = {
  prompt: '#85b6ff', answer: '#edbd67', boundary: '#bd9bf2',
  tool: '#75c9be', gradient: '#ed93b5', muted: '#a7aab3',
};
export const sum = values => values.reduce((a, b) => a + b, 0);
export const zeros = (rows, columns) => Array.from({ length: rows }, () => Array(columns).fill(0));
export function softmax(logits) {
  const largest = Math.max(...logits);
  const masses = logits.map(value => Math.exp(value - largest));
  return masses.map(value => value / sum(masses));
}

export function contextTrace({ ids, labels, embedding, head, visible, rate = .1 }) {
  const length = ids.length;
  const width = head.length;
  const vocabulary = embedding.length;
  const graph = visible || ids.map((_, j) => ids.map((__, k) => k <= j));
  const mixing = graph.map(row => row.map(edge => Number(edge) / sum(row.map(Number))));
  const hidden = mixing.map(row => Array.from({ length: width }, (_, d) =>
    sum(row.map((weight, k) => weight * embedding[ids[k]][d]))));
  const logits = hidden.map(row => Array.from({ length: vocabulary }, (_, v) =>
    sum(row.map((value, d) => value * head[d][v]))));
  const probabilities = logits.map(softmax);
  const selected = labels.map((target, j) => ({ target, targetPosition: j, logitPosition: j - 1 }))
    .filter(row => row.targetPosition > 0 && row.target !== -100);
  const count = selected.length;
  if (!count) return { graph, mixing, hidden, logits, probabilities, selected, count, valid: false };
  const dlogits = zeros(length, vocabulary);
  selected.forEach(row => {
    row.probability = probabilities[row.logitPosition][row.target];
    row.nll = -Math.log(row.probability);
    dlogits[row.logitPosition] = probabilities[row.logitPosition].map((p, v) =>
      (p - Number(v === row.target)) / count);
  });
  const dhead = zeros(width, vocabulary);
  const dposition = zeros(length, width);
  for (let j = 0; j < length; j++) {
    for (let d = 0; d < width; d++) {
      for (let v = 0; v < vocabulary; v++) dhead[d][v] += hidden[j][d] * dlogits[j][v];
      const dh = sum(dlogits[j].map((value, v) => value * head[d][v]));
      for (let k = 0; k < length; k++) dposition[k][d] += mixing[j][k] * dh;
    }
  }
  const dembedding = zeros(vocabulary, width);
  ids.forEach((id, k) => dposition[k].forEach((value, d) => { dembedding[id][d] += value; }));
  return {
    graph, mixing, hidden, logits, probabilities, selected, count, valid: true,
    loss: sum(selected.map(row => row.nll)) / count,
    dlogits, dhead, dposition, dembedding,
    updated: {
      embedding: embedding.map((row, v) => row.map((value, d) => value - rate * dembedding[v][d])),
      head: head.map((row, d) => row.map((value, v) => value - rate * dhead[d][v])),
    },
  };
}

export function conditionalUpdate(target = 4, rate = .5) {
  const rows = [Array(7).fill(.5 / 6), Array(7).fill(.75 / 6)];
  rows[0][4] = .5;
  rows[1][5] = .25;
  const targets = [target, 5];
  const logits = rows.map(row => row.map(Math.log));
  const gradient = rows.map((row, j) => row.map((p, v) => (p - Number(v === targets[j])) / 2));
  const after = logits.map((row, j) => softmax(row.map((z, v) => z - rate * gradient[j][v])));
  return { before: rows, after, gradient, targets,
    beforeLoss: -sum(targets.map((y, j) => Math.log(rows[j][y]))) / 2,
    afterLoss: -sum(targets.map((y, j) => Math.log(after[j][y]))) / 2 };
}

export function selectedLoss(probabilities, owned) {
  const terms = probabilities.map((p, i) => ({ p, selected: owned[i], nll: -Math.log(p) }));
  const count = owned.filter(Boolean).length;
  const numerator = sum(terms.filter(row => row.selected).map(row => row.nll));
  return { terms, count, numerator, mean: count ? numerator / count : null };
}

export function packGraph(lengths, isolated = true) {
  const segments = lengths.flatMap((length, id) => Array(length).fill(id));
  return segments.map((segment, j) => segments.map((other, k) =>
    k <= j && (!isolated || segment === other)));
}

export function capstone(secondLong = true, eos = true) {
  const records = [[0, 1, 2, 3, 4, 6], secondLong ? [0, 1, 2, 3, 5, 4, 6] : [0, 1, 2, 3, 5, 6]];
  const ids = records.flat();
  const labels = records.flatMap(row => row.map((id, j) => j >= 4 && (eos || id !== 6) ? id : -100));
  const visible = packGraph(records.map(row => row.length));
  const embedding = Array.from({ length: 7 }, (_, i) => Array.from({ length: 7 }, (__, j) => Number(i === j)));
  const trace = contextTrace({ ids, labels, embedding, head: zeros(7, 7), visible });
  return { records, ids, labels, visible, positions: records.flatMap(row => row.map((_, j) => j)), ...trace };
}

export function maskedBatch(bad = false) {
  const ids = [[6, 1, 2, 3, 4, 0, 0], [6, 1, 2, 3, 5, 4, 0]];
  const lengths = [6, 7];
  const valid = ids.map((row, r) => row.map((_, j) => Number(j < lengths[r])));
  const labels = ids.map((row, r) => row.map((id, j) =>
    j >= 4 && valid[r][j] && !(bad && id === 0) ? id : -100));
  return { ids, valid, labels, targets: labels.flat().filter(v => v !== -100).length };
}
