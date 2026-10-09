// Bounded deterministic teaching models; Python companions verify framework semantics.
export function tensorStorage(mode = 'view', value = 2) {
  const source = [1, 2, 3, 4, 5, 6];
  const transposedAddresses = [0, 3, 1, 4, 2, 5];
  const copy = transposedAddresses.map(address => source[address]);
  if (mode === 'view') source[1] = value;
  else copy[2] = value;
  return { source, logical: mode === 'view' ? transposedAddresses.map(address => source[address]) : copy,
    storage: mode === 'view' ? source : copy,
    addresses: mode === 'view' ? transposedAddresses : [0, 1, 2, 3, 4, 5],
    strides: mode === 'view' ? [1, 3] : [2, 1] };
}

export function gradientState({ weight = 1, rate = 0.1, reduction = 'mean', passes = 1, detached = false } = {}) {
  const rows = [1, 2].map(x => ({ x, target: 2 * x, output: weight * x, residual: (weight - 2) * x }));
  const divisor = reduction === 'mean' ? rows.length : 1;
  const loss = rows.reduce((sum, row) => sum + 0.5 * row.residual ** 2, 0) / divisor;
  const derivative = rows.reduce((sum, row) => sum + row.residual * row.x, 0) / divisor;
  const accumulated = detached ? null : derivative * passes;
  const nextWeight = detached ? null : weight - rate * accumulated;
  const nextLoss = detached ? null : [1, 2].reduce((sum, x) => sum + 0.5 * ((nextWeight - 2) * x) ** 2, 0) / divisor;
  return { rows, loss, derivative, accumulated, nextWeight, nextLoss };
}

export function dropoutMode({ probability = 0.5, training = true, recording = true } = {}) {
  const uniforms = [0.1, 0.4, 0.7, 0.9];
  return { recording, rows: [1, 2, 3, 4].map((input, index) => {
    const kept = !training || uniforms[index] >= probability;
    return { input, uniform: uniforms[index], kept, output: kept ? input / (training ? 1 - probability : 1) : 0 };
  }) };
}
