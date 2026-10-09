export const jointVectors = Object.freeze([[0, 0], [0, 1], [1, 0], [1, 1]]);
export const referenceJointCounts = () => [6, 5, 1, 8];

export function binaryJointLaw(counts = referenceJointCounts()) {
  if (counts.length !== 4 || counts.some(value => !Number.isInteger(value) || value < 0 || value > 50)) throw new Error('Use four integer joint counts from 0 to 50.');
  const total = counts.reduce((sum, value) => sum + value, 0);
  const masses = total ? counts.map(value => value / total) : null;
  const marginals = masses ? [masses[2] + masses[3], masses[1] + masses[3]] : [null, null];
  return { counts: [...counts], total, masses, marginals, empty: total === 0 };
}

export function jointActionRisks(law, loss = 'hamming') {
  if (loss !== 'hamming' && loss !== 'subset') throw new Error('Choose Hamming or subset loss.');
  if (law.empty) return { loss, candidates: [], winners: [], action: null, risk: null };
  const candidates = jointVectors.map((vector, action) => {
    const terms = jointVectors.map((truth, outcome) => {
      const disagreements = truth.map((value, coordinate) => Number(value !== vector[coordinate]));
      const value = loss === 'hamming' ? (disagreements[0] + disagreements[1]) / 2 : Number(disagreements.some(Boolean));
      return { outcome, truth, disagreements, mass: law.masses[outcome], loss: value, product: law.masses[outcome] * value };
    });
    return { action, vector, terms, risk: terms.reduce((sum, term) => sum + term.product, 0) };
  });
  const risk = Math.min(...candidates.map(candidate => candidate.risk));
  const winners = candidates.filter(candidate => Math.abs(candidate.risk - risk) <= 1e-12).map(candidate => candidate.action);
  return { loss, candidates, winners, action: winners[0], risk };
}

export function cardinalityF1Choice(counts = referenceJointCounts(), emptyPayoff = 1) {
  if (emptyPayoff !== 0 && emptyPayoff !== 1) throw new Error('Use empty/empty payoff 0 or 1.');
  const law = binaryJointLaw(counts);
  if (law.empty) return { law, gains: [], candidates: [], action: null, reward: null };
  const gains = [1, 2].map(size => [0, 1].map(label => jointVectors.reduce((sum, vector, index) => {
    const cardinality = vector[0] + vector[1];
    return sum + (vector[label] ? 2 * law.masses[index] / (size + cardinality) : 0);
  }, 0)));
  const candidates = [{ size: 0, vector: [0, 0], chosen: [], reward: law.masses[0] * emptyPayoff }];
  for (const size of [1, 2]) {
    const ordered = [0, 1].sort((a, b) => gains[size - 1][b] - gains[size - 1][a] || a - b);
    const chosen = ordered.slice(0, size);
    candidates.push({ size, chosen, vector: [0, 1].map(label => Number(chosen.includes(label))), reward: chosen.reduce((sum, label) => sum + gains[size - 1][label], 0) });
  }
  const reward = Math.max(...candidates.map(candidate => candidate.reward));
  const action = candidates.find(candidate => Math.abs(candidate.reward - reward) <= 1e-12);
  return { law, gains, candidates, action, reward };
}

export function factorBinaryLaw(law, order = 'AB') {
  if (order !== 'AB' && order !== 'BA') throw new Error('Factor in order AB or BA.');
  if (law.empty) return { order, first: [], leaves: [], empty: true };
  const firstCoordinate = order === 'AB' ? 0 : 1;
  const secondCoordinate = 1 - firstCoordinate;
  const first = [0, 1].map(bit => {
    const members = jointVectors.map((vector, index) => ({ vector, index })).filter(row => row.vector[firstCoordinate] === bit);
    const mass = members.reduce((sum, row) => sum + law.masses[row.index], 0);
    const next = [0, 1].map(second => {
      const leaf = members.find(row => row.vector[secondCoordinate] === second);
      return { bit: second, vector: leaf.vector, index: leaf.index, mass: law.masses[leaf.index], conditional: mass ? law.masses[leaf.index] / mass : null };
    });
    return { bit, mass, next };
  });
  return { order, first, leaves: first.flatMap(branch => branch.next), empty: false };
}

export function greedyBinaryLaw(law, order = 'AB') {
  const factor = factorBinaryLaw(law, order);
  if (factor.empty) return { factor, first: null, leaf: null, map: null };
  // Positive bit wins an exact binary local tie; global MAP uses lexicographic.
  const first = factor.first[1].mass >= factor.first[0].mass ? factor.first[1] : factor.first[0];
  const leaf = first.next[1].mass >= first.next[0].mass ? first.next[1] : first.next[0];
  const mapIndex = law.masses.indexOf(Math.max(...law.masses));
  return { factor, first, leaf, map: { index: mapIndex, vector: jointVectors[mapIndex], mass: law.masses[mapIndex] } };
}
