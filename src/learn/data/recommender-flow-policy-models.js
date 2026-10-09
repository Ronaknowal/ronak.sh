// Constructed policy and entry-risk arithmetic; no scientific training or data import.
export function policyPaths(loggingA = .8, targetA = .5, rewards = [.4, .8]) {
  const logging = [loggingA, 1 - loggingA], target = [targetA, 1 - targetA];
  const unsupported = target.map((weight, action) => weight > 0 && logging[action] === 0);
  const paths = logging.flatMap((probability, action) => [1, 0].map(reward => {
    const conditional = reward ? rewards[action] : 1 - rewards[action];
    const quotient = probability ? target[action] / probability : target[action] === 0 ? 0 : null;
    const ratio = quotient !== null && Number.isFinite(quotient) ? quotient : null;
    return { action, reward, conditional, mass: probability * conditional, ratio,
      weightedReward: ratio === null ? null : ratio * reward };
  }));
  const loggerValue = logging.reduce((sum, probability, action) => sum + probability * rewards[action], 0);
  const targetValue = target.reduce((sum, probability, action) => sum + probability * rewards[action], 0);
  const identified = !unsupported.some(Boolean);
  const representable = paths.every(path => path.ratio !== null);
  const second = identified && representable ? paths.reduce((sum, path) => sum + path.mass * path.weightedReward ** 2, 0) : null;
  const secondMoment = second !== null && Number.isFinite(second) ? second : null;
  return { logging, target, rewards, paths, unsupported, identified, representable, loggerValue, targetValue,
    secondMoment, variance: secondMoment !== null ? Math.max(0, secondMoment - targetValue ** 2) : null };
}

export const retainedPolicyEvents = Array.from({ length: 20 }, (_, index) => ({
  action: index < 16 ? 0 : 1, reward: index < 6 || (index >= 16 && index < 19) ? 1 : 0
}));
function randomStream(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6D2B79F5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), value | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
export function extendPolicyEvents(events, count, seed, loggingA, rewards) {
  const random = randomStream(seed), generated = [];
  // Generate each tail position deterministically, so shrinking drops and growing
  // adds declared new draws, never resurrects removed manually edited events.
  for (let index = 0; index < count; index++) {
    const action = random() < loggingA ? 0 : 1, reward = random() < rewards[action] ? 1 : 0;
    generated.push(index < events.length ? { ...events[index] } : { action, reward });
  }
  return generated;
}
export function finitePolicyLog(events, policy) {
  const rows = events.map((event, index) => {
    const probability = policy.logging[event.action], target = policy.target[event.action];
    const quotient = probability ? target / probability : target === 0 ? 0 : null;
    const ratio = quotient !== null && Number.isFinite(quotient) ? quotient : null;
    return { id: `L${index}`, ...event, probability, target, ratio,
      weightedReward: ratio === null ? null : ratio * event.reward,
      impossible: probability === 0 };
  });
  const possible = policy.identified && rows.every(row => !row.impossible && row.ratio !== null);
  const rewards = rows.reduce((sum, row) => sum + row.reward, 0);
  const weighted = possible ? rows.reduce((sum, row) => sum + row.weightedReward, 0) : null;
  const weights = possible ? rows.reduce((sum, row) => sum + row.ratio, 0) : null;
  const valid = possible && Number.isFinite(weighted) && Number.isFinite(weights);
  const weightedSum = valid ? weighted : null, weightSum = valid ? weights : null;
  return { rows, valid, rewards, weightedSum, weightSum, raw: events.length ? rewards / events.length : null,
    ips: valid && events.length ? weightedSum / events.length : null,
    snips: valid && weightSum > 0 ? weightedSum / weightSum : null,
    varianceOfMean: policy.variance === null || !events.length ? null : policy.variance / events.length };
}

export function entryRisk(mask = [1, 1, 1, 1], propensities = [1, .5, .25, 1], losses = [1, 4, 2, 3]) {
  const identified = propensities.every(probability => probability > 0);
  const finite = value => Number.isFinite(value) ? value : null;
  const rows = mask.map((observed, index) => ({ id: `U${Math.floor(index / 2)} I${index % 2}`,
    observed, propensity: propensities[index], loss: losses[index],
    term: propensities[index] > 0 ? finite(observed * losses[index] / propensities[index]) : null,
    weight: propensities[index] > 0 ? finite(observed / propensities[index]) : null }));
  const count = mask.reduce((sum, observed) => sum + observed, 0);
  const available = identified && rows.every(row => row.term !== null && row.weight !== null);
  const total = available ? finite(rows.reduce((sum, row) => sum + row.term, 0)) : null;
  const weights = available ? finite(rows.reduce((sum, row) => sum + row.weight, 0)) : null;
  const outcomes = Array.from({ length: 16 }, (_, bits) => {
    const values = propensities.map((probability, index) => (bits >> index) & 1);
    const mass = values.reduce((probability, observed, index) => probability * (observed ? propensities[index] : 1 - propensities[index]), 1);
    const n = values.reduce((sum, value) => sum + value, 0);
    const numerator = values.reduce((sum, observed, index) => sum + observed * losses[index], 0);
    const weighted = identified ? values.reduce((sum, observed, index) => sum + observed * losses[index] / propensities[index], 0) : null;
    const denominator = identified ? values.reduce((sum, observed, index) => sum + observed / propensities[index], 0) : null;
    return { bits, values, mass, count: n, naive: n ? numerator / n : null,
      ips: identified && Number.isFinite(weighted) ? weighted / 4 : null, snips: identified && Number.isFinite(weighted) && Number.isFinite(denominator) && denominator > 0 ? weighted / denominator : null };
  });
  const expectation = field => {
    const supported = outcomes.filter(outcome => outcome.mass > 0);
    return supported.every(outcome => outcome[field] !== null)
      ? supported.reduce((sum, outcome) => sum + outcome.mass * outcome[field], 0) : null;
  };
  return { rows, identified, available, count, total, weights, fullRisk: losses.reduce((sum, loss) => sum + loss, 0) / 4,
    ips: total !== null ? total / 4 : null, naive: count ? rows.reduce((sum, row) => sum + row.observed * row.loss, 0) / count : null,
    snips: total !== null && weights > 0 ? total / weights : null,
    outcomes, expectedIPS: expectation('ips'), expectedNaive: expectation('naive'), expectedSNIPS: expectation('snips') };
}
