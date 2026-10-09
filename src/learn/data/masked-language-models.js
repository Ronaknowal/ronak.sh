// Exact small browser investigations; measured training comes from a saved native run.
export const TOKENS = ['[CLS]', 'the', 'bank', 'was', 'flooded', '[SEP]', '[PAD]'];
export const HUES = ['#b7b2a9', '#e2b55a', '#60a5fa', '#c084fc', '#f472b6', '#b7b2a9', '#87837d'];
export const VOCAB = ['bank', 'road', 'river', 'shop'];
export function corruptionTrace(position = 2, branch = 'mask', replacement = 'road') {
  const original = [...TOKENS], input = [...original], labels = original.map(() => '−100');
  if (position >= 1 && position <= 4) {
    input[position] = branch === 'mask' ? '[MASK]' : branch === 'random' ? replacement : original[position];
    labels[position] = original[position];
  }
  return { original, input, labels, selected: position >= 1 && position <= 4 ? [position] : [] };
}
export function expectedCounts(eligible, rate) {
  if (!Number.isInteger(eligible) || eligible < 0 || rate < 0 || rate > 1) throw new RangeError('Invalid eligible count or rate');
  return { selected: eligible * rate, mask: eligible * rate * .8, random: eligible * rate * .1,
    keep: eligible * rate * .1, unselected: eligible * (1 - rate), emptyProbability: (1 - rate) ** eligible };
}
export function attentionPermissions(causal = false) {
  return TOKENS.map((_, query) => TOKENS.map((__, key) => key !== 6 && (!causal || key <= query)));
}
export function selectedLoss(probabilities, active = [true, true]) {
  if (probabilities.some(p => !(p > 0 && p <= 1))) throw new RangeError('Probabilities must be in (0,1]');
  const contributions = probabilities.map((p, i) => active[i] ? -Math.log(p) : null);
  const count = contributions.filter(v => v !== null).length;
  const sum = contributions.reduce((a, b) => a + (b ?? 0), 0);
  return { contributions, count, sum, mean: count ? sum / count : null };
}
export function probabilityRow(targetProbability, target = 0) {
  return VOCAB.map((_, i) => i === target ? targetProbability : (1 - targetProbability) / 3);
}
export function randomStream(seed) {
  let value = seed >>> 0;
  return () => { value += 0x6D2B79F5; let x = value; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}
export function dynamicView(seed, visit, rate) {
  const rng = randomStream(seed + visit * 65537), input = [...TOKENS], branches = TOKENS.map(() => 'ineligible');
  const selected = [];
  for (let i = 1; i <= 4; i++) {
    branches[i] = 'unselected';
    if (rng() >= rate) continue;
    selected.push(i);
    const draw = rng();
    branches[i] = draw < .8 ? 'mask' : draw < .9 ? 'random' : 'keep';
    input[i] = branches[i] === 'mask' ? '[MASK]' : branches[i] === 'random' ? VOCAB[Math.floor(rng() * VOCAB.length)] : TOKENS[i];
  }
  return { input, selected, branches };
}
export const ILLUSTRATIVE_EMBEDDINGS = {
  token: [[.2,.4,-.1,.3],[.6,-.2,.1,.5],[-.1,.3,.7,.2],[.4,.1,-.2,.6]],
  position: [[.1,0,.2,-.1],[0,.2,-.1,.1],[.2,-.1,0,.1],[-.1,.1,.2,0]],
  segment: [[.1,-.1,.1,0],[.1,-.1,.1,0],[.1,-.1,.1,0],[.1,-.1,.1,0]],
};
export const embeddingSum = ILLUSTRATIVE_EMBEDDINGS.token.map((row, i) => row.map((v, j) => v + ILLUSTRATIVE_EMBEDDINGS.position[i][j] + ILLUSTRATIVE_EMBEDDINGS.segment[i][j]));
