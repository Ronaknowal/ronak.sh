// Exact small fixtures behind the convolution lesson's foundational figures.
import { initialImage, initialKernel } from './convolution-models.js';

export const anatomyImage = initialImage;
export const anatomyKernel = initialKernel;

// The centre pixel lies in all four windows of the section-1 anatomy, under a different
// kernel tap in each. Returns, per window, the tap it uses and how much its output changes
// when the centre moves from its original value to `centre` (zero where that tap's weight is 0).
export function centreChange(centre) {
  const change = centre - initialImage[1][1];
  return [[0, 0], [0, 1], [1, 0], [1, 1]].map(([u, v]) => {
    const tap = [1 - u, 1 - v];
    const weight = initialKernel[tap[0]][tap[1]];
    return { u, v, tap: tap[0] * 2 + tap[1], weight, delta: change * weight || 0 };
  });
}

// Two input channels; channel 0 is the section-1 image.
export const channelImage = [initialImage, [[0, 1, 1], [2, 0, 1], [1, 1, 0]]];
// weight[outputChannel][inputChannel] is one 2×2 slice.
export const channelWeight = [
  [[[1, -1], [0, 1]], [[0, 1], [1, 0]]],
  [[[1, 0], [0, 0]], [[0, 0], [1, 1]]],
];
export const channelBias = [1, 0];

/** Terms of one output value: y[o,u,v] = b[o] + Σc Σa Σb W[o,c,a,b]·x[c,u+a,v+b]. */
export function outputTerms(image, weight, bias, o, u, v) {
  const channels = weight[o].map((slice, c) => {
    const terms = slice.flatMap((row, a) => row.map((w, b) => ({ a, b, x: image[c][u + a][v + b], w, product: image[c][u + a][v + b] * w })));
    return { c, terms, sum: terms.reduce((total, term) => total + term.product, 0) };
  });
  const value = channels.reduce((total, channel) => total + channel.sum, bias[o]);
  return { channels, bias: bias[o], value };
}

export function convolveChannels(image, weight, bias) {
  const kh = weight[0][0].length, kw = weight[0][0][0].length;
  const h = image[0].length - kh + 1, w = image[0][0].length - kw + 1;
  return weight.map((_, o) => Array.from({ length: h }, (_, u) => Array.from({ length: w }, (_, v) => outputTerms(image, weight, bias, o, u, v).value)));
}

/** Window starts for a square input of size n, kernel k, padding p, stride s (padded coordinates). */
export function squareWindows(n, k, p, s) {
  const count = Math.floor((n + 2 * p - k) / s) + 1;
  return { count, starts: Array.from({ length: Math.max(count, 0) }, (_, i) => i * s) };
}

// A real handwritten 7: source_id 28 in digits-400.csv (UCI optical digits, values 0–16).
export const realSeven = [
  [0, 0, 0, 8, 14, 14, 2, 0], [0, 0, 0, 6, 10, 15, 11, 0], [0, 0, 0, 0, 0, 14, 10, 0], [0, 2, 8, 11, 12, 16, 8, 0],
  [0, 8, 16, 16, 16, 16, 7, 0], [0, 0, 0, 0, 11, 15, 1, 0], [0, 0, 0, 9, 16, 7, 0, 0], [0, 0, 0, 12, 13, 1, 0, 0],
];
// Hand-set 2×2 kernels: right column minus left column, bottom row minus top row.
export const edgeKernels = {
  vertical: { name: 'Vertical-edge kernel', kernel: [[-1, 1], [-1, 1]], reads: 'right minus left' },
  horizontal: { name: 'Horizontal-edge kernel', kernel: [[-1, -1], [1, 1]], reads: 'bottom minus top' },
};

// A 1×1 convolution at one position: output channel o = Σc weights[o][c]·x[c] + bias[o].
export const channelMix = { weights: [[4, -1], [2, 1]], bias: [1, 0] };

// Groups = 2 with four input and six output channels: [input, output] connections.
export const groupConnections = [0, 1].flatMap(input => [0, 1, 2].map(output => [input, output]))
  .concat([2, 3].flatMap(input => [3, 4, 5].map(output => [input, output])));

export const poolingMap =[[1, 3, 2, 0], [4, 2, 1, 1], [0, 1, 5, 6], [3, 2, 7, 3]];

/** 2×2, stride-2 pooling; returns values and the first maximizing cell of each window. */
export function pool2x2(map) {
  const out = [];
  for (let r = 0; r < map.length; r += 2) {
    const row = [];
    for (let c = 0; c < map[0].length; c += 2) {
      const cells = [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]];
      const values = cells.map(([i, j]) => map[i][j]);
      const max = Math.max(...values);
      row.push({ max, mean: values.reduce((a, b) => a + b, 0) / 4, winner: cells[values.indexOf(max)], cells });
    }
    out.push(row);
  }
  return out;
}

export const cnnStages = [
  { label: 'Input', shape: [1, 8, 8] },
  { label: 'Conv 3×3 + ReLU', shape: [8, 8, 8], parameters: 'W [8, 1, 3, 3] · b [8]', count: 80, code: 'F.relu(self.conv1(x))' },
  { label: 'Max pool 2×2', shape: [8, 4, 4], parameters: 'no learned values', count: 0, code: 'pool(first, 2)' },
  { label: 'Conv 3×3 + ReLU', shape: [16, 4, 4], parameters: 'W [16, 8, 3, 3] · b [16]', count: 1168, code: 'F.relu(self.conv2(…))' },
  { label: 'Max pool 2×2', shape: [16, 2, 2], parameters: 'no learned values', count: 0, code: 'pool(second, 2)' },
  { label: 'Flatten', shape: [64], parameters: 'no learned values', count: 0, code: 'final.flatten(1)' },
  { label: 'Linear → logits', shape: [10], parameters: 'W [10, 64] · b [10]', count: 650, code: 'self.head(features)' },
];
