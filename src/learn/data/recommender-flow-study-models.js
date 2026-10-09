import saved from './recommender-flow-study-state.json' with { type: 'json' };
import { implicitAssembly } from './recommender-flow-implicit-models.js';
import { dot } from './recommender-flow-evidence-models.js';

export { saved as recommenderStudyState };
export function syntheticComparisons() {
  const blocks = saved.syntheticStdout.split('Changed cutoff, same untouched test period:');
  return blocks.map((block, index) => {
    const split = block.match(/split sizes=(\d+)\/(\d+)\/(\d+); selected rank=(\d+), penalty=([\d.]+), validation RMSE=([\d.]+)/);
    if (!split) throw new Error('Exact retained synthetic comparison header is unavailable.');
    const rows = [...block.matchAll(/(all|warm users|cold users): n=(\d+), shrunk item RMSE=([\d.]+), MF RMSE=([\d.]+)/g)].map(match => ({
      name: match[1], count: Number(match[2]), baseline: Number(match[3]), factor: Number(match[4])
    }));
    return { cutoff: index ? 18 : 20, split: split.slice(1, 4).map(Number), rank: Number(split[4]),
      penalty: Number(split[5]), validationRMSE: Number(split[6]), rows };
  });
}

export function studySummary(period, metric, cohort = 'all') {
  const rules = saved.report[period];
  return Object.entries(rules).map(([name, result]) => {
    const rows = result.perUser.filter(row => cohort === 'all' || (cohort === 'qualified' ? row.truthCount > 0 : row.truthCount === 0));
    const defined = rows.filter(row => row[metric] !== null);
    return { name, requests: rows.length, denominator: defined.length,
      value: defined.length ? defined.reduce((sum, row) => sum + row[metric], 0) / defined.length : null,
      rows, recordedMacro: result.macro[metric] };
  });
}

export function retailQuery(user, counts, selectedItem, candidateMask = Array(100).fill(true)) {
  const Q = saved.prefix.Q, penalty = saved.prediction.chosenConfig.lambda;
  const assembly = implicitAssembly(Q, counts, saved.prediction.alpha, penalty);
  if (!assembly.available) return { available: false, reason: assembly.reason, assembly };
  const history = counts.flatMap((count, item) => count > 0 ? [item] : []);
  const popularity = saved.prefix.popularityState;
  const cosine = Q.map((_, item) => history.length
    ? history.reduce((sum, neighbor) => sum + saved.prefix.itemCosineState[neighbor][item], 0)
    : popularity[item]);
  const scores = Q.map(q => dot(assembly.p, q));
  const winner = saved.report.overallWinner;
  const winnerScores = winner === 'popularity' ? popularity : winner === 'item-cosine' ? cosine : scores;
  const rows = scores.map((score, item) => ({ item, id: saved.ids.items[item], count: counts[item],
    confidence: 1 + saved.prediction.alpha * counts[item], q: Q[item], score,
    popularity: popularity[item], cosine: cosine[item], winnerScore: winnerScores[item],
    eligible: counts[item] === 0 && Boolean(candidateMask[item]), lexicalRank: saved.ids.itemOriginalLexicalTieRanks[item] }));
  const order = key => rows.filter(row => row.eligible).sort((a, b) => b[key] - a[key] || a.lexicalRank - b.lexicalRank);
  const selected = rows[selectedItem], products = selected.q.map((value, k) => value * assembly.p[k]);
  const measured = counts.every((count, item) => count === saved.prefix.counts[user][item]);
  return { available: true, assembly, history, rows, selected, products, winner,
    winnerOrder: order('winnerScore'), alsOrder: order('score'), measured,
    referenceScore: saved.prefix.scores[user][selectedItem],
    referenceQuery: saved.prefix.queryP[user], storedTraining: saved.prefix.P[user],
    maxReferenceDifference: measured ? Math.max(...scores.map((score, item) => Math.abs(score - saved.prefix.scores[user][item]))) : null };
}

export function reloadBundle(fault = 'valid', selectedUser = 0) {
  const expected = { users: saved.ids.users, items: saved.ids.items, counts: saved.prefix.counts,
    Q: saved.prefix.Q, rank: saved.prediction.chosenConfig.rank,
    lambda: saved.prediction.chosenConfig.lambda, alpha: saved.prediction.alpha,
    scorerId: saved.scorerId, conversion: saved.conversion,
    selectionLock: saved.report.selectionLockSHA256, predictionLock: saved.report.predictionLockSHA256 };
  const bundle = { ...expected };
  if (fault === 'reordered') bundle.items = [expected.items[1], expected.items[0], ...expected.items.slice(2)];
  if (fault === 'width') bundle.Q = [expected.Q[0].slice(0, -1), ...expected.Q.slice(1)];
  if (fault === 'prefix') bundle.counts = [[expected.counts[0][0] + 1, ...expected.counts[0].slice(1)], ...expected.counts.slice(1)];
  if (fault === 'scorer') bundle.scorerId = 'stored-training-users-v0';
  const guards = [
    ['Ordered user IDs', JSON.stringify(bundle.users) === JSON.stringify(expected.users)],
    ['Ordered item IDs match factor/count column meanings', JSON.stringify(bundle.items) === JSON.stringify(expected.items)],
    ['Every Q row has declared rank', bundle.Q.length === 100 && bundle.Q.every(row => row.length === bundle.rank && row.every(Number.isFinite))],
    ['Prefix counts match the locked reference', JSON.stringify(bundle.counts) === JSON.stringify(expected.counts)],
    ['Final-Q scorer and confidence conversion', bundle.scorerId === expected.scorerId && bundle.conversion === expected.conversion],
    ['Both declared locks and configuration', bundle.selectionLock === expected.selectionLock && bundle.predictionLock === expected.predictionLock && bundle.lambda === expected.lambda && bundle.alpha === 2]
  ].map(([name, pass]) => ({ name, pass }));
  const available = guards.every(row => row.pass);
  return { available, guards, bundle, expected,
    indexWitness: [0, 1].map(item => ({ index: item, expectedID: expected.items[item], loadedID: bundle.items[item],
      count: bundle.counts[selectedUser][item], q: bundle.Q[item], numericalScore: saved.prefix.scores[selectedUser][item] })),
    scores: available ? saved.prefix.scores[selectedUser] : null };
}
