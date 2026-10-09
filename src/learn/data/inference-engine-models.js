export const enginePrompts = {
  A: [11, 12, 13],
  B: [11, 12, 14, 15],
};

export function qkvPermutation(heads = 2, channels = 2) {
  if (!Number.isInteger(heads) || heads < 1 || !Number.isInteger(channels) || channels < 1)
    throw new Error('Head and channel counts must be positive integers.');
  return Array.from({ length: heads * 3 * channels }, (_, source) => {
    const head = Math.floor(source / (3 * channels));
    const projection = Math.floor((source % (3 * channels)) / channels);
    const channel = source % channels;
    return {
      source,
      destination: projection * heads * channels + head * channels + channel,
      head,
      projection: ['Q', 'K', 'V'][projection],
      channel,
    };
  });
}

export function reusablePrefix(stored, requested, sameIdentity) {
  if (!sameIdentity) return 0;
  let count = 0;
  while (count < Math.min(stored.length, requested.length) && stored[count] === requested[count])
    count++;
  return count;
}

export function composedCost(prefillRetained, decodeRetained) {
  if (![prefillRetained, decodeRetained].every((x) => Number.isFinite(x) && x >= 0 && x <= 1))
    throw new Error('Retained work fractions must lie in [0,1].');
  const prefill = 20 * prefillRetained;
  const decode = 80 * decodeRetained;
  const total = prefill + decode;
  return {
    prefill,
    decode,
    total,
    baseline: 100,
    speedup: total === 0 ? null : 100 / total,
    independentProduct:
      (prefill + 80) * (20 + decode) === 0 ? null : (100 / (prefill + 80)) * (100 / (20 + decode)),
  };
}

export function nativeRequest(data, id) {
  const row = data.native.requests.find((request) => request.id === id);
  if (!row) throw new Error(`No retained native request ${id}.`);
  return row;
}
