// Bounded hand arithmetic from the accepted section-14 examples. These are
// explicit matrices and small active-system solves, not fitted browser models.
export const reducedRankHandX = [[-1, 0], [1, 0], [0, -1], [0, 1]];
export const reducedRankHandY = [[-2, 10], [2, 10], [0, -11], [0, -9]];

export function reducedRankHand(rank = 1) {
  if (![1, 2].includes(rank)) throw Error('This hand example supports rank 1 or 2.');
  const root = Math.sqrt(2);
  const basis = reducedRankHandX.map(row => row.map(value => value / root));
  const triangular = [[root, 0], [0, root]];
  const projected = [[2 * root, 0], [0, root]];
  const retained = [[2 * root, 0], [0, rank === 2 ? root : 0]];
  const weights = retained.map(row => row.map(value => value / root));
  const prediction = reducedRankHandX.map(row => weights[0].map((_, output) =>
    row.reduce((sum, value, feature) => sum + value * weights[feature][output], 0)));
  const unfit = [[0, 10], [0, 10], [0, -10], [0, -10]];
  const error = prediction.reduce((sum, row, i) => sum + row.reduce((local, value, j) =>
    local + (value - reducedRankHandY[i][j]) ** 2, 0), 0);
  return { basis, triangular, projected, retained, weights, prediction, unfit,
    fittedSingular: [2 * root, root], rawSingular: [Math.sqrt(402), Math.sqrt(8)],
    error, fixedUnfitError: 400, fittedDiscardError: rank === 1 ? 2 : 0,
    rawPcaPrediction: [[0, 0], [0, 0], [0, -1], [0, 1]], rawPcaError: 408 };
}

export function rareCompressionHand(row = 0) {
  if (!Number.isInteger(row) || row < 0 || row > 199) throw Error('Select original row 0–199.');
  const common = row % 2;
  const rare = Number(row < 2);
  return { original: [common, common, rare], centered: [common - .5, common - .5, rare - .01],
    coordinate: (common - .5) * Math.sqrt(2), reconstructed: [common, common, .01],
    decisions: [common, common, 0], energy: [100, 1.98, 0], retained: 100 / 101.98,
    rareMean: .01, rareSupport: 2, rareRecall: 0 };
}

export const compressedHandDictionary = [[1, 0, 1 / Math.sqrt(2)], [0, 1, 1 / Math.sqrt(2)]];

// The accepted two-measurement dictionary permits at most two independent
// active atoms. Solve its 1×1 or 2×2 Gram system; report every intermediate.
export function compressedHandRecovery(measurement = [1, 0], maxAtoms = 1) {
  if (!Array.isArray(measurement) || measurement.length !== 2 ||
      measurement.some(value => !Number.isFinite(value) || value < -2 || value > 2) ||
      ![1, 2].includes(maxAtoms)) throw Error('Use two finite measurements −2…2 and an atom cap of 1 or 2.');
  const dictionary = compressedHandDictionary;
  const tolerance = 1e-10;
  let residual = [...measurement];
  let coefficients = [0, 0, 0];
  let active = [];
  const trace = [];
  let status = 'atom cap reached';
  for (let step = 0; step < maxAtoms; step++) {
    if (Math.hypot(...residual) <= tolerance) { status = 'residual tolerance reached'; break; }
    const correlations = dictionary[0].map((_, atom) =>
      dictionary.reduce((sum, row, i) => sum + row[atom] * residual[i], 0));
    const eligible = correlations.map((_, atom) => atom).filter(atom => !active.includes(atom));
    eligible.sort((a, b) => Math.abs(correlations[b]) - Math.abs(correlations[a]) || a - b);
    const chosen = eligible[0];
    if (Math.abs(correlations[chosen]) <= tolerance) { status = 'no correlated atom'; break; }
    const nextActive = [...active, chosen];
    const gram = nextActive.map(a => nextActive.map(b =>
      dictionary.reduce((sum, row) => sum + row[a] * row[b], 0)));
    const rhs = nextActive.map(atom => dictionary.reduce((sum, row, i) => sum + row[atom] * measurement[i], 0));
    let local;
    if (nextActive.length === 1) local = [rhs[0] / gram[0][0]];
    else {
      const determinant = gram[0][0] * gram[1][1] - gram[0][1] * gram[1][0];
      if (determinant <= 1e-12) throw Error('The selected active system is numerically dependent.');
      local = [(rhs[0] * gram[1][1] - rhs[1] * gram[0][1]) / determinant,
        (gram[0][0] * rhs[1] - gram[1][0] * rhs[0]) / determinant];
    }
    coefficients = [0, 0, 0];
    nextActive.forEach((atom, i) => { coefficients[atom] = local[i]; });
    const successor = dictionary.map((row, i) => measurement[i] -
      row.reduce((sum, value, atom) => sum + value * coefficients[atom], 0));
    trace.push({ step, correlations, chosen, active: nextActive, gram, rhs, local,
      coefficients: [...coefficients], residualBefore: residual, residualAfter: successor });
    active = nextActive;
    residual = successor;
  }
  const residualNorm = Math.hypot(...residual);
  if (residualNorm <= tolerance) status = 'residual tolerance reached';
  return { measurement: [...measurement], active, coefficients, residual, residualNorm, trace, status, tolerance };
}

export function denseConditionalMeanHand() {
  const mean = [.25, .25, .25, .25];
  const sparse = [0, 0, 0, (1 + Math.sqrt(3)) / 4];
  const dictionary = [[1, 0, 0, 1 / Math.sqrt(3)], [0, 1, 0, 1 / Math.sqrt(3)], [0, 0, 1, 1 / Math.sqrt(3)]];
  const encode = vector => dictionary.map(row => row.reduce((sum, value, i) => sum + value * vector[i], 0));
  return { outcomes: mean.map((_, i) => mean.map((__, j) => Number(i === j))), mean, sparse, dictionary,
    meanMeasurement: encode(mean), sparseMeasurement: encode(sparse),
    outputError: sparse.reduce((sum, value, i) => sum + (value - mean[i]) ** 2, 0) };
}
