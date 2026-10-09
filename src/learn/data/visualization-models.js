export const visualFixture = [1, 1, 2, 2, 3, 4, 7];
export function histogramView(
  lastValue = 8,
  equalWidth = false,
  density = true,
) {
  const values = [...visualFixture, lastValue];
  const edges = equalWidth ? [0, 2, 4, 6, 8] : [0, 2, 4, 8];
  const bins = edges.slice(0, -1).map((lo, i) => {
    const hi = edges[i + 1];
    const count = values.filter(
        (v) => v >= lo && (v < hi || (i === edges.length - 2 && v === hi)),
      ).length;
    const height = density ? count / (values.length * (hi - lo)) : count;
    return { lo, hi, count, height, width: hi - lo, area: height * (hi - lo) };
  });
  return { values, bins, area: bins.reduce((s, b) => s + b.area, 0) };
}
export function scalePositions(value) {
  if (!Number.isFinite(value) || value < 1 || value > 100)
    throw new Error("Value must be in [1,100]");
  return { linear: (value - 1) / 99, logarithmic: Math.log10(value) / 2 };
}
