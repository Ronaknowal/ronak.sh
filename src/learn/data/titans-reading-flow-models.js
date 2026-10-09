import { associativeMemoryTrace, linearMemoryWrite, gatedMemorySequence, chunkMemoryTrace, neuralMemoryRead, neuralMemoryWrite, zeroMemory, rentalMemoryKey, rentalMemoryReplay } from './titans-memory-models.js';
import { titansStudy } from './titans-memory-study.js';
export { titansStudy };
export const dot = (a, b) => a.reduce((s, value, i) => s + value * b[i], 0);
export const scalar = value => Number.isFinite(value) ? (Math.abs(value) >= 10000 || (value !== 0 && Math.abs(value) < .0001) ? value.toExponential(3) : Number(value.toFixed(6)).toString()).replaceAll('-', '−') : 'nonfinite';
export const vector = value => `[${value.map(scalar).join(', ')}]`;
export function associativeDefault() {
  return { cards: [{ key: [1, 0], value: 2 }, { key: [0, 1], value: 4 }], query: [1, 0], rate: .5, retention: 0, decay: 0, events: [0], next: 1, editor: 0 };
}
export function associativeCase(caseValue) {
  const trace = associativeMemoryTrace(caseValue.cards, caseValue.events, caseValue.query, caseValue);
  const card = caseValue.cards[caseValue.next];
  const preview = linearMemoryWrite(trace.weight, trace.momentum, card.key, [card.value], caseValue);
  return { ...trace, preview, card, readAfter: dot(preview.weight[0], caseValue.query) };
}
export function gatedDefault() {
  return { tokens: [[1, 0], [0, 1], [1, 1], [1, -1]], selected: 1, prefix: true, writes: true, split: 2, mode: 'carry' };
}
export function gatedCase(value) {
  const options = { prefix: value.prefix, rate: value.writes ? .5 : 0 };
  const full = gatedMemorySequence(value.tokens, options);
  const past = gatedMemorySequence(value.tokens.slice(0, value.split), options);
  const suffix = gatedMemorySequence(value.tokens.slice(value.split), { ...options, state: value.mode === 'carry' ? past.state : null });
  const records = [...past.records, ...suffix.records];
  const difference = Math.max(...records.flatMap((record, i) => record.output.map((v, j) => Math.abs(v - full.outputs[i][j]))));
  return { full, past, suffix, records, record: records[value.selected], difference, requestB: gatedMemorySequence([[0, 1], [1, 0]], options) };
}
export const chunkDefault = () => ({ targets: [1, 2], initial: 0, rate: .5, size: 2, selected: 1 });
export const chunkCase = value => ({ sequential: chunkMemoryTrace(value.targets, value.initial, value.rate, value.size, false), anchor: chunkMemoryTrace(value.targets, value.initial, value.rate, value.size, true) });
export const nonlinearFixture = () => [[[1, -1], [0, 0], [0, 0]], [0, 0, 0], [[2, 0, 0]], [0]];
export function nonlinearCase(target = 1, rate = .1) {
  const parameters = nonlinearFixture(), key = [1, 1];
  const initial = neuralMemoryRead(parameters, key);
  const write = neuralMemoryWrite(parameters, zeroMemory(parameters), key, target, { rate, retention: 0, decay: 0 });
  return { parameters, key, initial, write, read: neuralMemoryRead(write.parameters, key), otherBefore: neuralMemoryRead(parameters, [1, -1]), otherAfter: neuralMemoryRead(write.parameters, [1, -1]) };
}
export function projectionCase() {
  const history = [[1, 0], [0, 1], [1, 2]], kernel = [[.25, .5], [.25, .5], [.5, 0]];
  const matrices = [[[1, 0], [0, 2]], [[1, 1], [1, -1]], [[2, 0], [0, 1]]];
  const filter = rows => [0, 1].map(c => rows.reduce((s, row, t) => s + row[c] * kernel[t][c], 0));
  const branches = matrices.map(matrix => {
    const rows = history.map(x => matrix.map(row => dot(row, x)));
    const convolved = filter(rows), norm = Math.hypot(...convolved);
    return { matrix, rows, convolved, norm, unit: convolved.map(v => v / norm) };
  });
  const raw = filter(history), wrong = matrices[1].map(row => dot(row, raw));
  return { history, kernel, branches, raw, wrong };
}
export function outerScalar(rate = .25) {
  const weight = 2 * rate, prediction = 3 * weight, loss = .5 * (prediction - 2) ** 2;
  const derivative = 6 * (prediction - 2), nextRate = rate - .01 * derivative;
  return { gradient: -2, weight, prediction, loss, derivative, nextRate, nextLoss: .5 * (6 * nextRate - 2) ** 2 };
}
export function rentalAnatomy(snapshot, index, counts = titansStudy.counts, parameters = snapshot.initial_parameters) {
  const mean = titansStudy.mean, scale = titansStudy.scale, dates = titansStudy.dates;
  const weekday = (new Date(`${dates[index]}T00:00:00Z`).getUTCDay() + 6) % 7;
  const raw = counts.slice(index - 7, index), standardized = raw.map(v => (v - mean) / scale);
  const features = [...standardized, Math.sin(2 * Math.PI * weekday / 7), Math.cos(2 * Math.PI * weekday / 7)];
  const key = rentalMemoryKey(dates, counts, index, mean, scale);
  const read = neuralMemoryRead(parameters, key);
  return { raw, rawDates: dates.slice(index - 7, index), standardized, features, norm: Math.hypot(...features), key, read, parameters, output: read.output * scale + mean, mean, scale, weekday };
}
export function rentalCase(snapshot, day, observed) {
  const counts = [...titansStudy.counts]; counts[day] = observed;
  const settings = { mean: titansStudy.mean, scale: titansStudy.scale };
  const baseline = rentalMemoryReplay(snapshot, titansStudy.dates, titansStudy.counts, settings);
  const edited = rentalMemoryReplay(snapshot, titansStudy.dates, counts, settings);
  const invalid = edited.trace.find(record => !Object.values(record).flat(Infinity).filter(v => typeof v === 'number').every(Number.isFinite));
  const valid = invalid ? edited.trace.filter(record => record.index < invalid.index) : edited.trace;
  const firstAffected = valid.find(record => Math.abs(record.adaptive - baseline.trace[record.index - 365].adaptive) > 1e-8)?.index ?? null;
  return { baseline, edited: { ...edited, trace: valid }, firstAffected, invalidIndex: invalid?.index ?? null, counts };
}
