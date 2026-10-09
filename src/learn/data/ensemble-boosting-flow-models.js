import { signedBoostingTrace } from './ensemble-methods-models.js';

export function retainedBoostingState(fixture, rounds, stage, query) {
  if (!Number.isFinite(query) || query < -1e6 || query > 1e6) throw new RangeError('Query is −1e6…1e6.');
  const trace = signedBoostingTrace(fixture, rounds);
  if (!Number.isInteger(stage) || stage < 0 || stage > trace.frames.length) throw new RangeError('Choose an available stage.');
  const committed = trace.frames.slice(0, stage);
  const votes = committed.filter(frame => frame.status === 'accepted').map(frame => {
    const sign = query <= frame.stump.threshold ? frame.stump.polarity : -frame.stump.polarity;
    return { round: frame.round, threshold: frame.stump.threshold, polarity: frame.stump.polarity,
      sign, alpha: frame.alpha, contribution: frame.alpha * sign };
  });
  const dominant = committed.find(frame => frame.status === 'perfect');
  const score = votes.reduce((sum, vote) => sum + vote.contribution, 0);
  const prediction = dominant ? (query <= dominant.stump.threshold ? dominant.stump.polarity : -dominant.stump.polarity) : score >= 0 ? 1 : -1;
  const totalAlpha = votes.reduce((sum, vote) => sum + vote.alpha, 0);
  const scores = trace.x.map(x => votes.reduce((sum, vote) => sum + vote.alpha * (x <= vote.threshold ? vote.polarity : -vote.polarity), 0));
  const margins = !dominant && totalAlpha > 0 ? scores.map((value, index) => ({ id: String.fromCharCode(65 + index),
    label: trace.y[index], score: value, numerator: trace.y[index] * value, margin: trace.y[index] * value / totalAlpha })) : null;
  const groups = [];
  if (margins) {
    for (const row of [...margins].sort((a, b) => a.margin - b.margin)) {
      const previous = groups.at(-1);
      if (previous && previous.margin === row.margin) previous.ids.push(row.id);
      else groups.push({ margin: row.margin, ids: [row.id] });
    }
    let count = 0;
    for (const group of groups) { count += group.ids.length; group.count = count; group.cdf = count / margins.length; }
  }
  return { ...trace, stage, committed, frame: trace.frames[Math.max(0, stage - 1)], votes, dominant, score,
    prediction, totalAlpha, margins, groups, scores,
    nonpositiveFraction: margins ? margins.filter(row => row.margin <= 0).length / margins.length : null };
}

export function exponentialLineSearch(error, alpha) {
  if (!Number.isFinite(error) || error < 0 || error > .5 || !Number.isFinite(alpha) || alpha < 0 || alpha > 1.6) {
    throw new RangeError('Use error 0…0.5 and candidate alpha 0…1.6.');
  }
  const correct = (1 - error) * Math.exp(-alpha);
  const wrong = error * Math.exp(alpha);
  const optimum = error === 0 ? null : .5 * (Math.log1p(-error) - Math.log(error));
  return { error, alpha, correct, wrong, total: correct + wrong, derivative: -correct + wrong,
    optimum, optimumZ: error === 0 ? 0 : 2 * Math.sqrt(error * (1 - error)),
    status: error === 0 ? 'perfect-no-finite-minimum' : error === .5 ? 'no-positive-edge' : 'finite-minimum' };
}

export function suppliedEdgeBounds() {
  const build = shrinking => {
    let product = 1;
    let squaredEdges = 0;
    return Array.from({ length: 12 }, (_, index) => {
      const round = index + 1;
      const edge = shrinking ? 1 / (4 * (round + 1)) : 1 / 8;
      const normalizer = Math.sqrt(1 - 4 * edge ** 2);
      product *= normalizer;
      squaredEdges += edge ** 2;
      return { round, edge, error: .5 - edge, normalizer, product, squaredEdges,
        exponentialUpper: Math.exp(-2 * squaredEdges) };
    });
  };
  return { uniform: build(false), shrinking: build(true) };
}
