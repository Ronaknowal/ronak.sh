import { poissonMass } from "./stochastic-processes-models.js";
import coal from "./stochastic-coal-frame.json";
function coalAuditState(split = 1907) {
  if (![1887, 1907, 1927].includes(split)) throw new RangeError("Use split year 1887, 1907 or 1927.");
  const years = coal.annualYears;
  const counts = coal.annualCounts;
  const training = counts.filter((_, i) => years[i] < split);
  const heldOut = counts.filter((_, i) => years[i] >= split);
  const trainingEvents = training.reduce((sum, value) => sum + value, 0);
  const testEvents = heldOut.reduce((sum, value) => sum + value, 0);
  const rate = trainingEvents / training.length;
  const zero = poissonMass(rate, 0);
  const fourOrMore = 1 - [0, 1, 2, 3].reduce((sum, k) => sum + poissonMass(rate, k), 0);
  const mean = counts.reduce((sum, value) => sum + value, 0) / counts.length;
  const variance = counts.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (counts.length - 1);
  return { split, years, counts, records: coal.records, trainingYears: training.length, testYears: heldOut.length, trainingEvents, testEvents, rate, predictedTestEvents: rate * heldOut.length, zero, fourOrMore, predictedEmptyYears: zero * heldOut.length, actualEmptyYears: heldOut.filter((value) => value === 0).length, mean, variance, dispersion: variance / mean };
}
function stoppedCoinHistories() {
  return Array.from({ length: 16 }, (_, mask) => {
    const signs = Array.from({ length: 4 }, (_2, i) => mask >> 3 - i & 1 ? 1 : -1);
    const values = [0];
    let stop = 4;
    for (let i = 0; i < 4; i += 1) {
      values.push(values.at(-1) + signs[i]);
      if (Math.abs(values.at(-1)) === 2) {
        stop = i + 1;
        break;
      }
    }
    return { signs, values, stop, final: values.at(-1), probability: 1 / 16 };
  });
}
export {
  coalAuditState,
  stoppedCoinHistories
};
