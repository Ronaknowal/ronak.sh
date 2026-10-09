export function labelObjectSizes(labels = 6, observations = 100) {
  if (!Number.isInteger(labels) || labels < 2 || labels > 50 || !Number.isInteger(observations) || observations < 10 || observations > 1000) throw Error('Use 2–50 labels and 10–1000 rows.');
  const features = 4, positives = Math.min(2, labels), members = 3, groupSize = Math.min(3, labels);
  return { labels, observations, features, positives, members, groupSize,
    targetCells: observations * labels, headSlopes: features * labels, queryScores: labels,
    prefixWidths: Array.from({ length: labels }, (_, stage) => features + stage),
    prefixCoordinates: labels * features + labels * (labels - 1) / 2,
    pairConstraints: positives * (labels - positives), powersetUpper: 2 ** labels,
    occupiedUpper: Math.min(observations, 2 ** labels), projectedMemberships: members * groupSize };
}

export const retrievalLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
export const retrievalHandScores = [.8, .7, .6, .4, .3, .9];
export function candidateBoundary(included = ['A', 'B', 'C'], trueLabel = 'F') {
  if (!Array.isArray(included) || new Set(included).size !== included.length || included.some(label => !retrievalLabels.includes(label)) || !retrievalLabels.includes(trueLabel)) throw Error('Use unique named candidates and a known true label.');
  const candidates = retrievalLabels.filter(label => included.includes(label));
  const decisions = candidates.filter(label => retrievalHandScores[retrievalLabels.indexOf(label)] >= .5);
  const retrievedTrue = Number(candidates.includes(trueLabel));
  const predictedTrue = Number(decisions.includes(trueLabel));
  return { candidates, trueLabel, decisions, retrievedTrue, predictedTrue,
    candidateRecall: retrievedTrue, finalRecall: predictedTrue, denominator: 1,
    slots: retrievalLabels.map((label, i) => ({ label, score: included.includes(label) ? retrievalHandScores[i] : null,
      truth: label === trueLabel, decision: decisions.includes(label) })) };
}

export const sketchHandGradients = [[1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1]];
export function splitGradientHand(coordinate = 0, cut = 2) {
  if (![0, 2].includes(coordinate) || ![1, 2, 3].includes(cut)) throw Error('Use sketch A/C and cut after 1–3 rows.');
  const sum = rows => [0, 1, 2].map(output => rows.reduce((total, row) => total + row[output], 0));
  const left = sum(sketchHandGradients.slice(0, cut)), right = sum(sketchHandGradients.slice(cut));
  const counts = [cut, 4 - cut];
  return { coordinate, cut, left, right, counts, sketch: sketchHandGradients.map(row => row[coordinate]),
    sketchSums: [left[coordinate], right[coordinate]],
    sketchImprovement: .5 * (left[coordinate] ** 2 / (cut + 1) + right[coordinate] ** 2 / (5 - cut)),
    fullImprovement: .5 * left.reduce((total, value, j) => total + value ** 2 / (cut + 1) + right[j] ** 2 / (5 - cut), 0),
    leaves: [left.map(value => -value / (cut + 1)), right.map(value => -value / (5 - cut))] };
}

export const sharedHiddenWeights = [[1, 0, -1], [0, 1, 1]];
export function joinedHiddenPullback(truth = [1, 0, 1], selected = 'all') {
  if (!Array.isArray(truth) || truth.length !== 3 || truth.some(value => ![0, 1].includes(value)) || !['all', 'A', 'B', 'C'].includes(selected)) throw Error('Use three known truth bits and a named output path.');
  const hidden = [1, 2];
  const logits = sharedHiddenWeights[0].map((_, j) => hidden.reduce((sum, value, i) => sum + value * sharedHiddenWeights[i][j], 0));
  const probabilities = logits.map(value => 1 / (1 + Math.exp(-value)));
  const delta = probabilities.map((value, j) => (value - truth[j]) / 3);
  const contributions = delta.map((value, j) => sharedHiddenWeights.map(row => value * row[j]));
  const gradient = hidden.map((_, i) => contributions.reduce((sum, row) => sum + row[i], 0));
  const selectedGradient = hidden.map((_, i) => contributions.reduce((sum, row, j) => sum + (selected === 'all' || selected === ['A', 'B', 'C'][j] ? row[i] : 0), 0));
  const loss = logits.reduce((sum, value, j) => sum + Math.log1p(Math.exp(value)) - truth[j] * value, 0) / 3;
  return { hidden, logits, probabilities, truth: [...truth], delta, contributions, gradient, selectedGradient, loss, selected };
}

export function outputCovarianceHand(rho = .5, observedOutput = 'A') {
  if (!Number.isFinite(rho) || rho < -.9 || rho > .9 || !['A', 'B'].includes(observedOutput)) throw Error('Use output correlation −.9… .9 and an observed A/B coordinate.');
  const input = [[1, .8], [.8, 1]], output = [[1, rho], [rho, 1]];
  const labels = ['(x0,A)', '(x0,B)', '(x1,A)', '(x1,B)'];
  const joint = labels.map((_, i) => labels.map((__, j) => input[Math.floor(i / 2)][Math.floor(j / 2)] * output[i % 2][j % 2]));
  const observed = observedOutput === 'A' ? 0 : 1;
  const opposite = observedOutput === 'A' ? 3 : 2;
  const variance = joint[observed][observed];
  const cross = joint.map(row => row[observed]);
  const mean = cross.map(value => value / variance);
  const conditional = joint.map((row, i) => row.map((value, j) => value - cross[i] * cross[j] / variance));
  return { input, output, labels, joint, observed, opposite, variance, cross, mean, conditional,
    eigenvalues: [1 + rho, 1 - rho], targetMean: mean[opposite], targetVariance: conditional[opposite][opposite] };
}
