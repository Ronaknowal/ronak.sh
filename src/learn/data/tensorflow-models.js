export function tapeBranches(weight, detached) {
  const branchValue = weight * weight;
  const firstGradient = 2 * weight;
  const secondGradient = detached ? 0 : firstGradient;
  return { branchValue, loss: 2 * branchValue, firstGradient, secondGradient,
    gradient: firstGradient + secondGradient };
}

export function aggregateBatchMeans(firstCount, firstMean, secondCount, secondMean) {
  const total = firstCount * firstMean + secondCount * secondMean;
  const count = firstCount + secondCount;
  return { total, count, mean: total / count, batchMean: (firstMean + secondMean) / 2 };
}
