// Topic-owned arithmetic. These are supplied fixtures, not trained vision/audio models.
export const MODALITY_COLORS = Object.freeze({ text: '#e2b55a', image: '#60a5fa', audio: '#c084fc', video: '#f472b6' });
export const IDENTITY_COLORS = Object.freeze(Object.values(MODALITY_COLORS));
export const INITIAL_PIXELS = Object.freeze([0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0]);
export const CODEBOOK = Object.freeze([[-1, -1], [1, -1], [-1, 1], [1, 1]].map(Object.freeze));
export const AUDIO_MATRIX = Object.freeze([[0, 1, 3], [2, 0, 1]].map(Object.freeze));
export const PACKED_EXAMPLE = Object.freeze({
  ids: [20, 11, 8, 21, 3, 4], alignedLabels: [-100, -100, -100, -100, 3, 4],
  nextTargets: [-100, -100, -100, 3, 4, -100],
});

const positiveInteger = (value, name) => {
  if (!Number.isInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive integer`);
};
const finiteVector = vector => {
  if (!Array.isArray(vector) || !vector.length || !vector.every(Number.isFinite)) throw new RangeError('Finite nonempty vector required');
};

export function patchImage(pixels, patchSide = 2, imageSide = 4) {
  positiveInteger(imageSide, 'Image side'); positiveInteger(patchSide, 'Patch side');
  if (imageSide % patchSide || pixels.length !== imageSide * imageSide || !pixels.every(Number.isFinite)) throw new RangeError('Complete divisible grayscale grid required');
  const patches = [];
  for (let row = 0; row < imageSide; row += patchSide) {
    for (let column = 0; column < imageSide; column += patchSide) {
      const values = [];
      for (let dy = 0; dy < patchSide; dy++) for (let dx = 0; dx < patchSide; dx++) values.push(pixels[(row + dy) * imageSide + column + dx]);
      const projected = [0, 0];
      values.forEach((value, i) => { projected[i % 2] += value; });
      const index = patches.length;
      patches.push({ index, id: String.fromCharCode(65 + index), row, column, values, projected });
    }
  }
  return { patches, count: patches.length, vectorWidth: patchSide * patchSide };
}

export function nearestCode(point, book = CODEBOOK) {
  finiteVector(point);
  if (!book.length || !book.every(row => row.length === point.length && row.every(Number.isFinite))) throw new RangeError('Compatible nonempty codebook required');
  const distances = book.map(row => row.reduce((sum, value, i) => sum + (point[i] - value) ** 2, 0));
  let index = 0;
  distances.forEach((distance, i) => { if (distance < distances[index]) index = i; });
  return { index, vector: [...book[index]], distances, distance: distances[index], residual: point.map((v, i) => v - book[index][i]) };
}

export function residualQuantize(point = [.8, .6], levels = 3) {
  finiteVector(point);
  if (point.length !== 2 || !Number.isInteger(levels) || levels < 0 || levels > 3) throw new RangeError('Two-dimensional fixture supports zero to three stages');
  let residual = [...point], sum = [0, 0];
  const stages = [];
  for (let i = 0; i < levels; i++) {
    const inputResidual = [...residual];
    const book = CODEBOOK.map(vector => vector.map(value => value * 2 ** -i));
    const selected = nearestCode(residual, book);
    sum = sum.map((value, j) => value + selected.vector[j]);
    residual = point.map((value, j) => value - sum[j]);
    stages.push({ level: i + 1, index: selected.index, vector: selected.vector, sum: [...sum], residual: [...residual], inputResidual, error: residual.reduce((s, v) => s + v * v, 0) });
  }
  return { stages, sum, residual, error: residual.reduce((s, v) => s + v * v, 0) };
}

const namespaces = Object.freeze({ text: [0, 8], image: [8, 4], audio0: [12, 4], audio1: [16, 4] });
export function namespaceId(name, localId) {
  if (!Object.hasOwn(namespaces, name)) throw new RangeError('Unknown namespace');
  const [offset, size] = namespaces[name];
  if (!Number.isInteger(localId) || localId < 0 || localId >= size) throw new RangeError('Local ID outside dictionary');
  return offset + localId;
}

export function orderAudio(matrix = AUDIO_MATRIX, order = 'time') {
  if (!['time', 'level'].includes(order) || !Array.isArray(matrix) || matrix.length > 2) throw new RangeError('Use time or level order and at most two declared codebooks');
  if (!matrix.length) return [];
  const frames = matrix[0].length;
  if (!matrix.every(row => row.length === frames && row.every(id => Number.isInteger(id) && id >= 0 && id < 4))) throw new RangeError('Rectangular frame grid with IDs0..3 required');
  const cells = [];
  const emit = (level, frame) => { const id = matrix[level][frame]; cells.push({ level, frame, id, globalId: namespaceId(`audio${level}`, id) }); };
  if (order === 'time') for (let f = 0; f < frames; f++) for (let l = 0; l < matrix.length; l++) emit(l, f);
  else for (let l = 0; l < matrix.length; l++) for (let f = 0; f < frames; f++) emit(l, f);
  return cells;
}

export function sampleVideo(fps = 1, duration = 2) {
  if (!Number.isFinite(fps) || fps <= 0 || !Number.isFinite(duration) || duration < 0) throw new RangeError('Positive sample rate and nonnegative duration required');
  const times = Array.from({ length: Math.ceil(duration * fps) }, (_, i) => i / fps);
  const event = [.45, .55];
  const hitTimes = times.filter(t => t >= event[0] && t <= event[1]);
  return { times, hitTimes, event, retained: hitTimes.length > 0 };
}

export function inputBudget(duration = 2, levels = 8, budget = 2048) {
  if (!Number.isFinite(duration) || duration < 0 || !Number.isInteger(levels) || levels < 0 || !Number.isInteger(budget) || budget < 0) throw new RangeError('Nonnegative duration, level count and budget required');
  const text = 20, markers = 4, image = 16, audio = Math.ceil(duration * 75) * levels;
  const total = text + markers + image + audio;
  return { text, markers, image, audio, total, remaining: budget - total, budget, overBudget: total > budget };
}

export function usageStatistics(counts = [4, 2, 0, 2]) {
  if (!counts.every(v => Number.isInteger(v) && v >= 0)) throw new RangeError('Nonnegative assignment counts required');
  const total = counts.reduce((sum, value) => sum + value, 0);
  if (!total) return { total, shares: null, entropy: null, perplexity: null };
  const shares = counts.map(value => value / total);
  const entropy = -shares.reduce((sum, p) => sum + (p ? p * Math.log2(p) : 0), 0);
  return { total, shares, entropy, perplexity: 2 ** entropy };
}

export function kvCacheBytes(positions, layers = 32, kvHeads = 8, headWidth = 128, bytes = 2) {
  [layers, kvHeads, headWidth, bytes].forEach(v => positiveInteger(v, 'Cache dimension'));
  if (!Number.isInteger(positions) || positions < 0) throw new RangeError('Nonnegative position count required');
  return positions * 2 * layers * kvHeads * headWidth * bytes;
}

export function tubeletCount(time = 4, height = 4, width = 4, temporal = 2, patch = 2) {
  [time, height, width, temporal, patch].forEach(v => positiveInteger(v, 'Spacetime dimension'));
  if (time % temporal || height % patch || width % patch) throw new RangeError('Divisible spacetime grid required');
  return time / temporal * (height / patch) * (width / patch);
}
