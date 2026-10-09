export function accumulationComparison(weight, microbatch) {
  const x = [1, 2, 3, 4], y = [2, 0, 1, 3];
  const contributions = x.map((value, index) => (weight * value - y[index]) * value);
  const groups = [];
  for (let start = 0; start < x.length; start += microbatch) {
    const values = contributions.slice(start, start + microbatch);
    groups.push({ start, count: values.length, sum: values.reduce((sum, value) => sum + value, 0) });
  }
  const correct = contributions.reduce((sum, value) => sum + value, 0) / x.length;
  const meanOfMeans = groups.reduce((sum, group) => sum + group.sum / group.count, 0) / groups.length;
  return { x, y, contributions, groups, correct, meanOfMeans, correctWeight: weight - .1 * correct, wrongWeight: weight - .1 * meanOfMeans };
}

export function trainingMemoryBudget(parameters, activations, workers, stage, recompute) {
  const baseline = [4 * parameters, 4 * parameters, 8 * parameters, activations];
  const proposed = [baseline[0] / (stage >= 3 ? workers : 1), baseline[1] / (stage >= 2 ? workers : 1), baseline[2] / (stage >= 1 ? workers : 1), activations * (recompute ? .5 : 1)];
  return { baseline, proposed, baselineTotal: baseline.reduce((a, b) => a + b, 0), proposedTotal: proposed.reduce((a, b) => a + b, 0) };
}
