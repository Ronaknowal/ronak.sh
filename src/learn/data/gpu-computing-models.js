export function gridOwnership(size, blocks, threads) {
  if (![size, blocks, threads].every(Number.isInteger) || size < 0 || blocks < 1 || threads < 1) {
    throw new Error('Nonnegative size and positive integer launch dimensions required');
  }
  const stride = blocks * threads;
  return Array.from({ length: stride }, (_, first) => ({
    first,
    block: Math.floor(first / threads),
    thread: first % threads,
    indices: Array.from({ length: Math.max(0, Math.ceil((size - first) / stride)) },
      (_, iteration) => first + iteration * stride),
  }));
}

export function gpuAccounting({ elements = 1_000_000, stages = 5, resident = true,
  fused = true, hostBandwidth = 16, deviceBandwidth = 400, launchCost = 10 } = {}) {
  if (![elements, stages].every(Number.isInteger) ||
      ![hostBandwidth, deviceBandwidth, launchCost].every(Number.isFinite) ||
      elements < 1 || stages < 1 || hostBandwidth <= 0 || deviceBandwidth <= 0 || launchCost < 0) {
    throw new Error('Positive workload/bandwidth and nonnegative launch cost required');
  }
  const vectorBytes = 4 * elements;
  const hostBytes = vectorBytes * (resident ? 2 : 2 * stages);
  const kernels = stages * (fused ? 1 : 3);
  const deviceBytes = 2 * kernels * vectorBytes;
  const transfer = hostBytes / (hostBandwidth * 1000);
  const traffic = deviceBytes / (deviceBandwidth * 1000);
  const launch = kernels * launchCost;
  return { hostBytes, deviceBytes, kernels, transfer, traffic, launch, total: transfer + traffic + launch };
}
