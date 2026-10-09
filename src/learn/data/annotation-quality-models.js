export function annotationEvidence(prior, raters, duplicateB = false) {
  const observations = duplicateB ? [...raters, {
    ...raters[1],
    name: 'B copied'
  }] : raters;
  const stages = [{
    name: 'Prior',
    zero: 1 - prior,
    one: prior
  }];
  let zero = 1 - prior,
    one = prior;
  for (const rater of observations) {
    if (rater.vote === '') continue;
    const likelihoodZero = rater.vote === '1' ? 1 - rater.specificity : rater.specificity;
    const likelihoodOne = rater.vote === '1' ? rater.sensitivity : 1 - rater.sensitivity;
    zero *= likelihoodZero;
    one *= likelihoodOne;
    stages.push({
      name: `${rater.name} says ${rater.vote}`,
      zero,
      one,
      likelihoodZero,
      likelihoodOne
    });
  }
  return {
    stages,
    zero,
    one,
    posterior: zero + one === 0 ? null : one / (zero + one)
  };
}
export function weightedAnnotationAudit(hardShare, counts, errors) {
  const weights = [1 - hardShare, hardShare];
  const rates = counts.map((count, i) => count === 0 ? null : errors[i] / count);
  const unknown = rates.some((rate, i) => rate === null && weights[i] > 0);
  const weighted = unknown ? null : rates.reduce((sum, rate, i) => sum + (rate ?? 0) * weights[i], 0);
  const n = counts[0] + counts[1];
  return {
    weights,
    rates,
    weighted,
    pooled: n ? (errors[0] + errors[1]) / n : null
  };
}
