import { calibratedAverageLaw } from './ensemble-methods-models.js';
import predictionMap from './ensemble-prediction-map.json';

export const savedMapLabels = Object.freeze({
  line: 'Logistic line', tree: 'Depth-four tree', neighbor: 'Nine nearest neighbors',
  soft: 'Equal probability mean', stack: 'OOF logistic stack'
});

export function calibrationGroups() {
  const cases = calibratedAverageLaw().map((row, index) => ({ ...row, id: `S${index + 1}` }));
  const groups = ['forecastA', 'forecastB', 'average'].flatMap(rule => [...new Set(cases.map(row => row[rule]))].map(forecast => {
    const members = cases.filter(row => row[rule] === forecast);
    const mass = members.reduce((sum, row) => sum + row.mass, 0);
    const chance = members.reduce((sum, row) => sum + row.mass * row.trueChance, 0) / mass;
    return { rule, forecast, members, mass, chance, calibrated: chance === forecast };
  }));
  const risk = Object.fromEntries(['forecastA', 'forecastB', 'average'].map(rule => [rule, cases.reduce((sum, row) =>
    sum + row.mass * (row.trueChance * (1 - row[rule]) ** 2 + (1 - row.trueChance) * row[rule] ** 2), 0)]));
  return { cases, groups, risk };
}

export function savedMapCell(model = 'stack', horizontal = 16, vertical = 12) {
  if (!Object.hasOwn(savedMapLabels, model) || !Number.isInteger(horizontal) || horizontal < 0 || horizontal > 24 ||
      !Number.isInteger(vertical) || vertical < 0 || vertical > 24) throw new RangeError('Choose a saved model and integer grid indices 0–24.');
  const index = vertical * 25 + horizontal;
  return { model, horizontal, vertical, index, x: predictionMap.coordinates[horizontal], y: predictionMap.coordinates[vertical],
    probability: predictionMap.models[model].probabilities[index], selected: predictionMap.models[model], map: predictionMap,
    comparisons: Object.entries(predictionMap.models).map(([name, state]) => ({ model: name, probability: state.probabilities[index], report: state.report })) };
}

export function thresholdActionState(threshold = .3, missedCost = 4) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1 || !Number.isFinite(missedCost) || missedCost < 0 || missedCost > 10) throw new RangeError('Threshold 0–1 and missed-event cost 0–10.');
  const probabilities = [.1, .3, .3, .9], labels = [0, 1, 0, 1];
  const counts = { tn: 0, fp: 0, fn: 0, tp: 0 };
  const rows = probabilities.map((probability, index) => {
    const positive = probability >= threshold, target = labels[index];
    const outcome = positive ? target ? 'tp' : 'fp' : target ? 'fn' : 'tn';
    counts[outcome] += 1;
    return { id: `V${index + 1}`, probability, target, positive, outcome, cost: outcome === 'fp' ? 1 : outcome === 'fn' ? missedCost : 0 };
  });
  return { threshold, missedCost, rows, counts, cost: counts.fp + missedCost * counts.fn };
}

export function probabilityColour(value) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError('Probability colour domain 0–1.');
  const low = [48, 82, 108], high = [232, 187, 96];
  return `rgb(${low.map((channel, index) => Math.round(channel + value * (high[index] - channel))).join(', ')})`;
}
