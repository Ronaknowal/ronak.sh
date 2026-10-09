export function ensembleFitWork(bases, folds, rows) {
  if (![bases, folds, rows].every(Number.isInteger) || bases < 1 || bases > 10 || folds < 2 || folds > 10 || rows < 10 || rows > 1000 || folds > rows) {
    throw new RangeError('Use 1–10 bases, 2–10 folds and 10–1000 rows, with folds no larger than rows.');
  }
  const heldCounts = Array.from({ length: folds }, (_, i) => Math.floor(rows / folds) + Number(i < rows % folds));
  const trainingCounts = heldCounts.map(held => rows - held);
  const foldRowWork = bases * trainingCounts.reduce((sum, n) => sum + n, 0);
  const fullRowWork = bases * rows;
  return { bases, folds, rows, heldCounts, trainingCounts, foldFits: bases * folds, fullFits: bases, metaFits: 1,
    foldRowWork, fullRowWork, baseRowWork: foldRowWork + fullRowWork, metaRows: rows };
}

// Normalize before summing: finite nonnegative latency inputs may have a sum
// outside binary64's finite range. The scientific pair remains representable.
export function latencySum(values) {
  const largest = Math.max(...values);
  if (largest === 0) return { value: 0, mantissa: 0, exponent: 0, text: '0' };
  const normalized = values.reduce((sum, value) => sum + value / largest, 0);
  const value = largest * normalized;
  const [largestMantissa, rawExponent] = largest.toExponential(14).split('e');
  let mantissa = Number(largestMantissa) * normalized, exponent = Number(rawExponent);
  if (mantissa >= 10) { mantissa /= 10; exponent += 1; }
  const text = Number.isFinite(value) && value >= 1e-6 && value < 1e6
    ? String(Number(value.toPrecision(10))) : `${Number(mantissa.toPrecision(10))}×10^${exponent}`;
  return { value: Number.isFinite(value) ? value : null, mantissa, exponent, text };
}

export function ensembleServingPath(latencies, mode) {
  if (latencies.length !== 3 || latencies.some(x => !Number.isFinite(x) || x < 0) || !['sequential', 'parallel'].includes(mode)) {
    throw new RangeError('Enter three finite nonnegative hypothetical member latencies and a declared execution mode.');
  }
  const meta = 1, sequential = latencySum([...latencies, meta]), parallel = latencySum([Math.max(...latencies), meta]);
  const total = mode === 'sequential' ? sequential : parallel;
  const chartScale = Math.max(meta, ...latencies);
  const normalizedBase = mode === 'sequential' ? latencies.reduce((s, x) => s + x / chartScale, 0) : Math.max(...latencies) / chartScale;
  const chartTotal = normalizedBase + meta / chartScale;
  let start = 0;
  const branches = latencies.map((duration, index) => {
    const offset = mode === 'sequential' ? start : 0;
    start += duration / chartScale;
    return { index, duration, offset: offset / chartTotal, width: (duration / chartScale) / chartTotal };
  });
  return { latencies, mode, meta, sequential, parallel, total, branches, metaOffset: normalizedBase / chartTotal,
    metaWidth: (meta / chartScale) / chartTotal, budgets: [20, 50].map(budget => ({ budget, within: total.value !== null && total.value <= budget })) };
}
