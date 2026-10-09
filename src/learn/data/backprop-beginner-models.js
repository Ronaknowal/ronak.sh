// Small exact traces for the beginner reading path. Independent checks live in
// scripts/verify-backprop-beginner.py; no values here are measured experiments.

// One neuron from §1: z = wx + b, a = ReLU(z), L = ½(a − y)².
export const neuron = { x: 2, w: 3, b: -1, y: 1 };

export function neuronForward({ x, w, b, y }) {
  const z = w * x + b;
  const a = Math.max(0, z);
  return { z, a, loss: 0.5 * (a - y) ** 2 };
}

// Nudge w by a small amount and measure how each downstream value moves.
export function nudgeChain(nudge = 0.01) {
  const before = neuronForward(neuron);
  const after = neuronForward({ ...neuron, w: neuron.w + nudge });
  const rates = {
    zPerW: (after.z - before.z) / nudge,
    aPerZ: (after.a - before.a) / (after.z - before.z),
    lossPerA: (after.loss - before.loss) / (after.a - before.a),
  };
  return { nudge, before, after, rates, measured: (after.loss - before.loss) / nudge,
    chainProduct: rates.zPerW * rates.aPerZ * rates.lossPerA };
}

// Forward-mode tangents for the same neuron: one pass per chosen input direction.
export function neuronTangent(direction) {
  const { x, w } = neuron;
  const { z, a } = neuronForward(neuron);
  const zDot = direction.w * x + w * direction.x + direction.b;
  const aDot = (z > 0 ? 1 : 0) * zDot;
  return { zDot, aDot, lossDot: (a - neuron.y) * aDot };
}

// A one-example, two-hidden-unit, two-class ReLU network. Weights use the
// teaching engine's input × output storage, so Z = xW + b.
export const tinyDefaults = { x1: 1, x2: 2, label: 1 };
export const tinyParameters = {
  W1: [[1, -1], [1, 1]],
  b1: [-1, -1.5],
  W2: [[1, -1], [2, 1]],
  b2: [0, 0],
};

export function tinyNetwork({ x1, x2, label }) {
  const { W1, b1, W2, b2 } = tinyParameters;
  const x = [x1, x2];
  const z1 = [0, 1].map(j => x[0] * W1[0][j] + x[1] * W1[1][j] + b1[j]);
  const a1 = z1.map(value => Math.max(0, value));
  const z2 = [0, 1].map(c => a1[0] * W2[0][c] + a1[1] * W2[1][c] + b2[c]);
  const top = Math.max(...z2);
  const exps = z2.map(value => Math.exp(value - top));
  const total = exps[0] + exps[1];
  const p = exps.map(value => value / total);
  const loss = -(z2[label] - top - Math.log(total));
  const g2 = p.map((value, c) => value - (c === label ? 1 : 0));
  const gW2 = [0, 1].map(j => [0, 1].map(c => a1[j] * g2[c]));
  const gb2 = [...g2];
  const ga1 = [0, 1].map(j => g2[0] * W2[j][0] + g2[1] * W2[j][1]);
  const mask = z1.map(value => (value > 0 ? 1 : 0));
  const g1 = ga1.map((value, j) => value * mask[j]);
  const gW1 = [0, 1].map(i => [0, 1].map(j => x[i] * g1[j]));
  const gb1 = [...g1];
  return { x, z1, a1, z2, p, loss, g2, gW2, gb2, ga1, mask, g1, gW1, gb1 };
}

// Unit 2's score is x₂ − x₁ − 1.5, so it is off whenever x₂ ≤ x₁ + 1.5.
export const unitTwoOffThreshold = x1 => x1 + 1.5;

// The teaching engine's recorded order for u = x * x, L = u + 2 * u.
// ordered = [x, u, constant 2, 2u, L]; backward runs it in reverse.
export const engineOrder = ['x', 'u', 'c', 'm', 'L'];
export const engineTrace = [
  { node: 'seed', note: 'backward() clears every buffer, then sets L.grad = 1.', grads: { x: 0, u: 0, c: 0, m: 0, L: 1 } },
  { node: 'L', note: 'L = u + m. Addition passes L.grad = 1 unchanged to both parents: u.grad += 1 and m.grad += 1.', grads: { x: 0, u: 1, c: 0, m: 1, L: 1 } },
  { node: 'm', note: 'm = u × 2. u receives 2 × m.grad = 2, so u.grad becomes 1 + 2 = 3. The constant 2 does not ask for a gradient (its requires_grad flag is false), so its share is discarded.', grads: { x: 0, u: 3, c: 0, m: 1, L: 1 } },
  { node: 'c', note: 'The constant 2 is a leaf with no parents. Its pullback does nothing.', grads: { x: 0, u: 3, c: 0, m: 1, L: 1 } },
  { node: 'u', note: 'u = x × x. Its pullback runs only now, after both consumers (L and m) have contributed. Slot 1 adds x × u.grad = 3 × 3 = 9; slot 2 adds another 9. x.grad = 18.', grads: { x: 18, u: 3, c: 0, m: 1, L: 1 } },
  { node: 'x', note: 'x is a leaf. Its buffer holds the finished derivative dL/dx = 18.', grads: { x: 18, u: 3, c: 0, m: 1, L: 1 } },
];
