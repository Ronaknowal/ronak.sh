export const CLM_TOKENS = [
  { text: 'sat', color: '#c084fc' },
  { text: 'ran', color: '#60a5fa' },
  { text: 'slept', color: '#e2b55a' },
  { text: 'EOS', color: '#f472b6' },
];
export const DEFAULT_LOGITS = [Math.log(4), Math.log(2), 0, 0];
export function distribution(logits, target = 0, temperature = 1) {
  const scaled = logits.map(value => value / temperature);
  const maximum = Math.max(...scaled);
  const exponents = scaled.map(value => Math.exp(value - maximum));
  const denominator = exponents.reduce((sum, value) => sum + value, 0);
  const probabilities = exponents.map(value => value / denominator);
  return {
    probabilities,
    loss: maximum + Math.log(denominator) - scaled[target],
    gradient: probabilities.map((value, index) => value - Number(index === target)),
  };
}
export function attentionTrace(row, futureValue, causal) {
  const values = [1, 2, 3, futureValue];
  const allowed = values.map((_, index) => !causal || index <= row);
  const count = allowed.filter(Boolean).length;
  const weights = allowed.map(value => Number(value) / count);
  return { values, weights, result: values.reduce((sum, value, index) => sum + value * weights[index], 0) };
}
export function targetLoss(enabled) {
  const losses = [.5, .5, .25, .25].map(probability => -Math.log(probability));
  const count = enabled.filter(Boolean).length;
  const sum = losses.reduce((total, loss, index) => total + (enabled[index] ? loss : 0), 0);
  return { losses, count, sum, mean: count ? sum / count : null, perplexity: count ? Math.exp(sum / count) : null };
}
export function packedMask(independent) {
  return Array.from({ length: 6 }, (_, row) => Array.from({ length: 6 }, (_, col) =>
    col <= row && (!independent || Math.floor(row / 3) === Math.floor(col / 3))));
}
export function objectiveMask(kind) {
  return Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, col) =>
    kind === 'masked' || (kind === 'prefix' && row < 2 ? col < 2 : col <= row)));
}
export function categorical(probabilities, uniform) {
  let cumulative = 0;
  const intervals = probabilities.map(probability => {
    const start = cumulative;
    cumulative += probability;
    return { start, end: cumulative };
  });
  return { intervals, selected: intervals.findIndex(interval => uniform < interval.end) };
}
export function scoringWindow(target, context = 4) {
  return Array.from({ length: target - Math.max(0, target - context) }, (_, index) => Math.max(0, target - context) + index);
}
