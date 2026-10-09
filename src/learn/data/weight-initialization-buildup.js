// Small deterministic calculations for the beginner layer, stack and width figures.
// Recorded training runs stay in weight-initialization-measurements.json.

// Three fixed standard-normal draws (rows = outputs, columns = inputs), rounded to two decimals
// and then treated as exact numbers. W = s · E for a chosen weight std s. For this input the
// forward multiplier ÷ s² over random draws has mean exactly 2, median ≈ 1.27, quartiles ≈ 0.36 and
// 2.88 (200,000 simulated draws). A, B and C sit at 0.82, 1.29 and 2.53: below, near and above the
// middle of that spread, so they show typical noise rather than tail events.
export const layerDraws = {
  A: [[0.64, 0.2, -0.45, 1.09], [-0.01, -0.42, -2.32, 0.55], [-0.92, -0.56, 1.09, -0.2], [0.85, 0.98, 0.29, -0.69]],
  B: [[-1.69, -0.65, 0.98, 0.89], [-0.14, -1.36, -1.93, -1.13], [-0.09, 0.32, -0.22, 0.38], [0.13, 0.9, 1.16, -1.08]],
  C: [[0.55, 2.2, 0.87, -0.83], [-1.68, 0.77, 0.3, 0.7], [0.48, -0.55, 0.75, -1.0], [-1.24, 0.98, -1.25, 0.04]],
};
export const layerInput = [1.2, -0.4, 0.8, -1.5];
// A fixed gradient arriving at the four outputs from later layers, for the backward trace.
export const upstreamGradient = [1, -0.5, 0.8, -1.2];

const meanSquare = values => values.reduce((sum, value) => sum + value * value, 0) / values.length;

function layerFromEntries(entries, std, input = layerInput, upstream = upstreamGradient) {
  const weights = entries.map(row => row.map(entry => std * entry));
  const scores = weights.map(row => row.reduce((sum, weight, i) => sum + weight * input[i], 0));
  const outputs = scores.map(score => Math.max(0, score));
  const gates = scores.map(score => (score > 0 ? 1 : 0));
  // Backward: ∂/∂x_i = Σ_j W_ji · gate_j · g_j (PyTorch convention: ReLU slope 0 at a score of exactly 0).
  const inputGradient = input.map((_, i) => weights.reduce((sum, row, j) => sum + row[i] * gates[j] * upstream[j], 0));
  const inputSecondMoment = meanSquare(input);
  return {
    weights, scores, outputs, gates, inputGradient, inputSecondMoment,
    scoreSecondMoment: meanSquare(scores),
    outputSecondMoment: meanSquare(outputs),
    realizedFactor: meanSquare(outputs) / inputSecondMoment,
    backwardFactor: meanSquare(inputGradient) / meanSquare(upstream),
    // Average over weight draws for this fixed input: E[z_j^2] = s^2 Σ x_i^2, then ReLU keeps half.
    expectedFactor: input.length * std * std / 2,
  };
}
export const layerForward = (std, draw = 'A', input = layerInput) => layerFromEntries(layerDraws[draw], std, input);

// Deterministic seeded standard-normal generator (mulberry32 + Box–Muller) for the many-draws readout.
function normalStream(seed) {
  let state = seed >>> 0, spare = null;
  const uniform = () => { state = (state + 0x6D2B79F5) >>> 0; let t = state; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return () => {
    if (spare !== null) { const value = spare; spare = null; return value; }
    const u = Math.max(uniform(), 1e-12), v = uniform(), radius = Math.sqrt(-2 * Math.log(u));
    spare = radius * Math.sin(2 * Math.PI * v);
    return radius * Math.cos(2 * Math.PI * v);
  };
}
// Forward and backward multipliers ÷ s² averaged over many fresh 4 × 4 draws (independent of s).
export function manyDrawAverages(count = 1000, seed = 2026) {
  const next = normalStream(seed);
  let forward = 0, backward = 0;
  const forwardValues = [];
  for (let k = 0; k < count; k++) {
    const entries = Array.from({ length: 4 }, () => Array.from({ length: 4 }, next));
    const layer = layerFromEntries(entries, 1);
    forward += layer.realizedFactor; backward += layer.backwardFactor; forwardValues.push(layer.realizedFactor);
  }
  forwardValues.sort((a, b) => a - b);
  const within = forwardValues.filter(value => value >= 1 && value <= 4).length / count;
  return { count, forward: forward / count, backward: backward / count, median: (forwardValues[count / 2 - 1] + forwardValues[count / 2]) / 2, withinFactorTwo: within, values: forwardValues };
}

// Idealized per-layer multiplier of the pooled mean square for a fan-in n ReLU layer.
export const reluLayerFactor = (fanIn, weightVariance) => fanIn * weightVariance / 2;

export const probeSchemes = [
  { id: 'zero', label: 'All-zero weights', variance: 0 },
  { id: 'small', label: 'Normal, std 0.01', variance: 0.01 ** 2 },
  { id: 'xavier', label: 'Xavier, gain 1', variance: 2 / (64 + 64) },
  { id: 'kaiming', label: 'Kaiming, ReLU', variance: 2 / 64 },
  { id: 'orthogonal', label: 'Orthogonal, gain √2', variance: null },
  { id: 'large', label: 'Normal, std 0.5', variance: 0.5 ** 2 },
];

// Prediction for the 20-layer width-64 probe: q_L = q_0 · factor^L, and the backward RMS shrinks or
// grows by the square root of the same factor per layer (square layers: fan-in = fan-out).
export function probePrediction(variance, inputSecondMoment, cotangentRms, depth = 20, width = 64) {
  const factor = variance === null ? 1 : reluLayerFactor(width, variance);
  return { factor, finalSecondMoment: inputSecondMoment * factor ** depth, inputGradientRms: cotangentRms * Math.sqrt(factor) ** depth };
}

// First Adam step on a matrix whose inputs are half active (h_i ∈ {0, 1}). The first bias-corrected
// Adam update of each entry is -η·g/(|g| + ε) ≈ -η·sign(g). For a gradient g_ji = δ_j h_i, every
// active entry moves by η in the direction that helps, so one output changes by η × (active inputs).
export function firstAdamChange(width, rate, mode, baseWidth = 32) {
  const multiplier = width / baseWidth, active = width / 2;
  const hiddenRate = mode === 'mu' ? rate / multiplier : rate;
  const readoutScale = mode === 'mu' ? 1 / multiplier : 1;
  return {
    multiplier,
    hiddenChange: hiddenRate * active,
    readoutChange: rate * active * readoutScale,
    // Initial μP logit std for fixed activation RMS: sqrt(n · (1/32)) / m = 1/sqrt(m) of the base value.
    initialReadoutRelative: mode === 'mu' ? 1 / Math.sqrt(multiplier) : 1,
  };
}

// Axis lengths of the three WidthMLP weight matrices and how many axes grow with width.
export function widthShapes(width) {
  return [
    { short: 'input', name: 'Input matrix', rows: width, columns: 64, changing: 1, rule: 'Std √(2/64); Adam rate η' },
    { short: 'hidden', name: 'Hidden matrix', rows: width, columns: width, changing: 2, rule: 'Std √(2/n); μP Adam rate η/m' },
    { short: 'readout', name: 'Readout matrix', rows: 10, columns: width, changing: 1, rule: 'μP: raw std 1/√32, input divided by m; rate η' },
  ];
}
