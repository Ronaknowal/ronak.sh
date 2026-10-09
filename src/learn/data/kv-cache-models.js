// Finite teaching models. Native timings and model outputs are loaded separately.
export const cacheColors = ['#65a7f5', '#6ed3dd', '#e5b356', '#b79aef', '#e898ae'];

export function dot(left, right) {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

export function softmax(scores, allowed = scores.map(() => true)) {
  const valid = scores.filter((_, index) => allowed[index]);
  if (valid.length === 0) return null;
  const maximum = Math.max(...valid);
  const masses = scores.map((value, index) => allowed[index] ? Math.exp(value - maximum) : 0);
  const total = masses.reduce((sum, value) => sum + value, 0);
  return masses.map(value => value / total);
}

export function attention(query, keys, values, allowed = keys.map(() => true), scaled = true) {
  const scores = keys.map(key => dot(query, key) / (scaled ? Math.sqrt(key.length) : 1));
  const weights = softmax(scores, allowed);
  if (!weights) return { scores, weights: null, output: null, contributions: [] };
  const contributions = values.map((value, index) => value.map(coordinate => coordinate * weights[index]));
  const output = values[0].map((_, coordinate) => contributions.reduce((sum, row) => sum + row[coordinate], 0));
  return { scores, weights, contributions, output };
}

export function traceAttention({ qx = Math.SQRT2 * Math.log(2), qy = 0, value = 2, append = false, equal = false, newKey = -1, newValue = -1 } = {}) {
  const keys = [[1, 0], [0, 1], [1, 1]];
  const values = [[value, 0], [0, 2], [1, 1]];
  if (append) {
    keys.push([newKey, 0]);
    values.push([newValue, 1]);
  }
  const usedValues = equal ? values.map(() => [1, .5]) : values;
  return { query: [qx, qy], keys, values: usedValues, ...attention([qx, qy], keys, usedValues) };
}

export function offsetMasks(past = 3, count = 2, capacity = 7) {
  const occupied = past + count;
  return Array.from({ length: count }, (_, row) => Array.from({ length: capacity }, (_, column) => ({
    position: past + row,
    key: column,
    valid: column < occupied,
    correct: column < occupied && column <= past + row,
    upperLeft: column < occupied && column <= row,
  })));
}

export function maskedTrace(past, count, mode) {
  const capacity = past + count + 2;
  const grid = offsetMasks(past, count, capacity);
  const keys = Array.from({ length: capacity }, (_, index) => [index / 3, 1 - index / 7]);
  const values = Array.from({ length: capacity }, (_, index) => [index, 1 - index]);
  return { grid, results: grid.map(row => attention([1, .5], keys, values, row.map(cell => cell[mode]))) };
}

export function poisonedTail(poison = 20, omit = false) {
  const keys = [[1, 0], [0, 1], [1, 1], [-1, 0], [.5, 1], [1, 0], [1, 0]];
  const values = [[2, 0], [0, 2], [1, 1], [-1, 1], [.5, .5], [poison, poison], [poison, poison]];
  const valid = keys.map((_, index) => omit || index < 5);
  return { keys, values, valid, ...attention([1, 0], keys, values, valid) };
}

export function causalReach(edit = 3, unrestricted = false) {
  let changed = [0, 1, 2, 3].map(index => index === edit);
  const layers = [changed];
  for (let layer = 0; layer < 2; layer += 1) {
    changed = changed.map((_, query) => changed.some((value, key) => value && (unrestricted || key <= query)));
    layers.push(changed);
  }
  return layers;
}

export function workCounts(prompt, generated) {
  const lengths = Array.from({ length: generated }, (_, index) => prompt + index);
  const cachedRows = [prompt, ...Array(Math.max(0, generated - 1)).fill(1)];
  const fullPairs = lengths.map(length => length * (length + 1) / 2);
  const cachedPairs = [prompt * (prompt + 1) / 2, ...lengths.slice(1)];
  const sum = values => values.reduce((total, value) => total + value, 0);
  return { lengths, cachedRows, fullPairs, cachedPairs,
    fullRows: sum(lengths), newRows: sum(cachedRows), fullAttention: sum(fullPairs), cachedAttention: sum(cachedPairs) };
}

export function allocation(lengths, capacity, blockSize, heads = 2, width = 8, layers = 4, bytes = 2) {
  const live = lengths.reduce((sum, value) => sum + value, 0);
  const allocated = lengths.map(length => Math.ceil(length / blockSize) * blockSize);
  const paged = allocated.reduce((sum, value) => sum + value, 0);
  const reserved = lengths.length * capacity;
  const perToken = 2 * layers * heads * width * bytes;
  return { live, allocated, paged, reserved, slack: paged - live, perToken,
    liveBytes: live * perToken, staticBytes: reserved * perToken, pagedBytes: paged * perToken,
    validCapacity: capacity >= Math.max(...lengths) };
}

export function deviceBudget({ requests = 2, length = 8192, devices = 2, heads = 8, replicated = false, capacityGiB = 24, weightsGiB = 14, workspaceGiB = 2, reserveGiB = 1 } = {}) {
  const globalPerRequest = 2 * 80 * heads * 128 * 2 * length;
  const ownedHeads = replicated ? heads : Math.ceil(heads / devices);
  const perRequest = 2 * 80 * ownedHeads * 128 * 2 * length;
  const availableGiB = capacityGiB - weightsGiB - workspaceGiB - reserveGiB;
  const cacheGiB = requests * perRequest / 2 ** 30;
  return { globalPerRequest, ownedHeads, perRequest, availableGiB, cacheGiB,
    freeGiB: availableGiB - cacheGiB, maxRequests: Math.max(0, Math.floor(availableGiB * 2 ** 30 / perRequest)) };
}

export function rotate(vector, angle) {
  return [Math.cos(angle) * vector[0] - Math.sin(angle) * vector[1],
    Math.sin(angle) * vector[0] + Math.cos(angle) * vector[1]];
}

export function movedRecord(angle = Math.PI / 6, wrong = false) {
  const query = rotate([1, 0], 3 * angle);
  const key = rotate([1, 0], angle);
  const readKey = wrong ? [1, 0] : key;
  return { query, key, readKey, correct: dot(query, key), current: dot(query, readKey) };
}

export function bankRound(value) {
  const floor = Math.floor(value);
  const fraction = value - floor;
  return fraction === .5 ? floor + (floor % 2) : Math.round(value);
}

export function quantize(values, bits = 4) {
  // Same flattened group and FP32 operations as the supplied NumPy source.
  const source = values.map(Math.fround);
  const offset = Math.min(...source);
  const levels = 2 ** bits - 1;
  const scale = Math.fround(Math.fround(Math.max(...source) - offset) / levels);
  const codes = source.map(value => scale === 0 ? 0 : Math.max(0, Math.min(levels, bankRound(Math.fround(Math.fround(value - offset) / scale)))));
  const payload = bits === 8 ? Uint8Array.from(codes) : Uint8Array.from(
    Array.from({ length: Math.ceil(codes.length / 2) }, (_, index) => codes[2 * index] | ((codes[2 * index + 1] || 0) << 4)));
  const reconstructed = codes.map(code => Math.fround(Math.fround(code * scale) + offset));
  return { source, offset, scale, codes, payload: Array.from(payload), reconstructed,
    bytes: payload.byteLength, metadata: 8, fp16: values.length * 2 };
}

export function precisionTrace({ qx = .7, qy = -.4, route = 'both', equal = false, value = .12 } = {}) {
  const keys = [[0, .3], [1, -.7], [.47, .12]];
  const values = equal ? Array.from({ length: 3 }, () => [.75, .75]) : [[value, 1], [-.4, .7], [.6, -.2]];
  const reshape = flat => [flat.slice(0, 2), flat.slice(2, 4), flat.slice(4, 6)];
  const quantizedKeys = reshape(quantize(keys.flat()).reconstructed);
  const quantizedValues = reshape(quantize(values.flat()).reconstructed);
  const currentKeys = route === 'values' ? keys : quantizedKeys;
  const currentValues = route === 'keys' ? values : quantizedValues;
  const exact = attention([qx, qy], keys, values);
  const current = attention([qx, qy], currentKeys, currentValues);
  return { keys, values, currentKeys, currentValues, exact, current,
    error: Math.max(...exact.output.map((valueAt, index) => Math.abs(valueAt - current.output[index]))) };
}

export function matmul(left, right) {
  return left.map(row => right[0].map((_, column) => row.reduce((sum, value, index) => sum + value * right[index][column], 0)));
}

export const transpose = matrix => matrix[0].map((_, column) => matrix.map(row => row[column]));

export function latentTrace(coefficient = 2, angle = Math.PI / 3) {
  const latent = [[1, coefficient], [-1, 1]];
  const upKeys = [[1, 0, 2], [0, 1, -1]];
  const upValues = [[1, 2], [3, -1]];
  const query = [[2, -1, .5]];
  const keys = matmul(latent, upKeys);
  const values = matmul(latent, upValues);
  const scores = matmul(query, transpose(keys))[0];
  const absorbed = matmul(query, transpose(upKeys));
  const absorbedScores = matmul(absorbed, transpose(latent))[0];
  const weights = softmax(scores);
  const direct = matmul([weights], values)[0];
  const mixed = matmul([weights], latent);
  const output = matmul(mixed, upValues)[0];
  const projection = [[2, 1], [0, 1]];
  const row = [1, 2];
  const after = rotate(matmul([row], projection)[0], angle);
  const before = matmul([rotate(row, angle)], projection)[0];
  return { latent, upKeys, upValues, query, keys, values, scores, absorbed, absorbedScores,
    weights, mixed, direct, output, after, before };
}

export function createPool(count = 5, size = 4) {
  return { size, pages: Array.from({ length: count }, () => Array(size).fill(null)),
    free: Array.from({ length: count }, (_, index) => index), requests: {}, error: null };
}

export function appendPool(pool, id, values) {
  const next = structuredClone(pool);
  const row = next.requests[id] || { table: [], length: 0 };
  const required = Math.ceil((row.length + values.length) / next.size) - row.table.length;
  if (required > next.free.length) return { ...pool, error: `Append needs ${required} free pages; only ${next.free.length} available. State unchanged.` };
  next.requests[id] = row;
  for (let index = 0; index < required; index += 1) row.table.push(next.free.shift());
  values.forEach((value, index) => {
    const position = row.length + index;
    next.pages[row.table[Math.floor(position / next.size)]][position % next.size] = value;
  });
  row.length += values.length;
  next.error = null;
  return next;
}

export function releasePool(pool, id) {
  if (!pool.requests[id]) return pool;
  const next = structuredClone(pool);
  for (const page of next.requests[id].table) {
    next.pages[page].fill(null);
    next.free.push(page);
  }
  delete next.requests[id];
  next.error = null;
  return next;
}

export function poolFixture() {
  let pool = createPool();
  pool = appendPool(pool, 'A', [0, 1, 2, 3]);
  pool = appendPool(pool, 'B', [10, 11, 12, 13]);
  pool = appendPool(pool, 'A', [4, 5, 6, 7, 8, 9]);
  return pool;
}
