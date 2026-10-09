import { contactDurations } from './queueing-observed-records.js';

/** Exact integer aggregation of the retained 4521-row duration projection. */
export function observedDurationGeometry() {
  const bounds = [60, 120, 300, 600, 86400];
  const bins = bounds.map((upper, i) => ({
    lower: i ? bounds[i - 1] : 0,
    upper,
    count: 0,
    sum: 0,
  }));
  const atoms = new Map();
  let sum = 0,
    sumSquares = 0;
  for (const duration of contactDurations) {
    sum += duration;
    sumSquares += duration * duration;
    const index = bounds.findIndex((upper) => duration <= upper);
    bins[index].count += 1;
    bins[index].sum += duration;
    atoms.set(duration, (atoms.get(duration) || 0) + 1);
  }
  const longest = contactDurations
    .map((duration, index) => ({ duration, sourceRow: index + 1 }))
    .sort((a, b) => b.duration - a.duration || a.sourceRow - b.sourceRow)
    .slice(0, Math.ceil(contactDurations.length / 10));
  const mean = sum / contactDurations.length;
  const second = sumSquares / contactDurations.length;
  return {
    count: contactDurations.length,
    sum,
    sumSquares,
    mean,
    second,
    variance: second - mean * mean,
    bins: bins.map((bin) => ({
      ...bin,
      countShare: bin.count / contactDurations.length,
      timeShare: bin.sum / sum,
    })),
    atoms: [...atoms]
      .sort((a, b) => a[0] - b[0])
      .map(([duration, multiplicity]) => ({
        duration,
        multiplicity,
        mass: multiplicity / contactDurations.length,
        bin: bounds.findIndex((upper) => duration <= upper),
      })),
    longest,
    longestShare: longest.reduce((total, item) => total + item.duration, 0) / sum,
    arrivalRate: 0.5 / mean,
    busyResidual: second / (2 * mean),
    wait: second / (2 * mean),
  };
}

export const observedGeometry = observedDurationGeometry();
// Printed run summaries, not newly generated stochastic measurements.
export const retainedRunMeans = [
  0.508615, 0.482854, 0.495349, 0.481578, 0.516882, 0.5184, 0.492325, 0.508635,
];
export const retainedRunSummary = { mean: 0.50058, mcse: 0.005147, theoretical: 0.5 };
