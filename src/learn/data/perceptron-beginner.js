// Exact small calculations for the neuron lesson's beginner buildup figures and labs.
// The perceptron trace reproduces the lesson's NumPy AND/XOR program row by row.

export const pixelTemplates = {
  vertical: { title: 'Vertical stroke in the middle column', weights: [-1, 1, -1, -1, 1, -1, -1, 1, -1] },
  horizontal: { title: 'Horizontal stroke in the middle row', weights: [-1, -1, -1, 1, 1, 1, -1, -1, -1] },
};

export const pixelPresets = {
  'Clean vertical bar': [0, 1, 0, 0, 1, 0, 0, 1, 0],
  'Vertical bar + stray pixel': [0, 1, 0, 0, 1, 1, 0, 1, 0],
  'Horizontal bar': [0, 0, 0, 1, 1, 1, 0, 0, 0],
  'Every pixel inked': [1, 1, 1, 1, 1, 1, 1, 1, 1],
  'Blank image': [0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export function scorePixels(pixels, weights, bias) {
  const contributions = pixels.map((ink, i) => ink * weights[i]);
  const positive = contributions.filter(value => value > 0).reduce((sum, value) => sum + value, 0);
  const negative = contributions.filter(value => value < 0).reduce((sum, value) => sum + value, 0);
  const score = positive + negative + bias;
  return { contributions, positive, negative, bias, score, fires: score > 0 };
}

export const corners = [[0, 0], [0, 1], [1, 0], [1, 1]];
export const booleanTargets = { AND: [-1, -1, -1, 1], OR: [-1, 1, 1, 1], XOR: [-1, 1, 1, -1] };

// Step size 1, zero start, rows in the order 00, 01, 10, 11, update when y * score <= 0,
// stop after a pass without updates or after maxPasses passes.
export function perceptronTrace(labels, maxPasses = 12) {
  let coefficients = [0, 0, 0];
  const steps = [], passes = [];
  for (let pass = 1; pass <= maxPasses; pass++) {
    let updates = 0;
    corners.forEach((x, row) => {
      const input = [x[0], x[1], 1], label = labels[row];
      const score = input.reduce((sum, value, i) => sum + value * coefficients[i], 0);
      const margin = label * score, updated = margin <= 0;
      const before = coefficients;
      if (updated) { coefficients = coefficients.map((value, i) => value + label * input[i]); updates++; }
      steps.push({ pass, row, x, label, score, margin, updated, before, after: coefficients });
    });
    const predictions = corners.map(x => (x[0] * coefficients[0] + x[1] * coefficients[1] + coefficients[2] > 0 ? 1 : -1));
    passes.push({ pass, updates, coefficients, predictions, errors: predictions.filter((p, i) => p !== labels[i]).length });
    if (updates === 0) break;
  }
  return { steps, passes, converged: passes[passes.length - 1].updates === 0 };
}

// XOR as a function of the count of active inputs, s = x1 + x2.
export const relu = value => Math.max(0, value);
export function xorRampRows() {
  return [0, 1, 2].map(s => ({ s, h1: relu(s), h2: relu(s - 1), second: -2 * relu(s - 1), q: relu(s) - 2 * relu(s - 1), target: s === 1 ? 1 : 0 }));
}

export function hiddenSpaceRows() {
  return corners.map(x => {
    const s = x[0] + x[1], h1 = relu(s), h2 = relu(s - 1);
    return { id: x.join(''), x, h1, h2, q: h1 - 2 * h2, target: s === 1 ? 1 : 0 };
  });
}

// Finite nudges beside the exact local slopes used in the activation section.
const sigmoid = z => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
export const nudgeFunctions = {
  step: { title: 'Hard threshold', f: z => (z > 0 ? 1 : 0), slope: () => 0 },
  relu: { title: 'ReLU', f: relu, slope: z => (z > 0 ? 1 : 0) },
  sigmoid: { title: 'Sigmoid', f: sigmoid, slope: z => sigmoid(z) * (1 - sigmoid(z)) },
};
export function nudgeRows(delta = 0.01) {
  return [['step', 2], ['relu', 2], ['relu', -2], ['sigmoid', 0], ['sigmoid', 5], ['step', -0.005]].map(([name, z]) => {
    const fn = nudgeFunctions[name];
    const before = fn.f(z), after = fn.f(z + delta);
    const crossesJump = name === 'step' && z <= 0 && z + delta > 0;
    return { name, title: fn.title, z, delta, before, after, ratio: (after - before) / delta, slope: fn.slope(z), crossesJump };
  });
}

// Short §4 core: the three taught activations, the nn.Linear layout and input sensitivity.
// Executed in the lesson environment; scripts/verify-perceptron-beginner.mjs reruns it.
export const neuronCoreProgram = "import numpy as np\nimport torch\n\n\ndef activation(name, z):\n    \"\"\"Return (value, local slope) for an array of scores z.\"\"\"\n    z = np.asarray(z, dtype=float)\n    if name == \"sigmoid\":\n        e = np.exp(-np.abs(z))  # never exponentiates a large positive number\n        value = np.where(z >= 0, 1 / (1 + e), e / (1 + e))\n        return value, e / (1 + e) ** 2\n    if name == \"tanh\":\n        value = np.tanh(z)\n        return value, 1 - value**2\n    if name == \"relu\":\n        return np.maximum(z, 0), (z > 0).astype(float)  # slope 0 at z = 0, as PyTorch\n    raise ValueError(f\"unknown activation {name!r}\")\n\n\nz = np.array([-2.0, 0.0, 2.0])\nfor name in [\"sigmoid\", \"tanh\", \"relu\"]:\n    value, slope = activation(name, z)\n    print(f\"{name:8}\", \"values\", value.round(4), \"slopes\", slope.round(4))\n\n# A layer of 2 neurons on a batch of 2 examples: rows are examples, W is (outputs, inputs).\nX = np.array([[2.0, -1.0], [0.0, 3.0]])\nW = np.array([[1.5, -2.0], [-1.0, 1.0]])\nb = np.array([-1.0, 0.5])\nlayer = torch.nn.Linear(2, 2, dtype=torch.float64)\nwith torch.no_grad():\n    layer.weight.copy_(torch.from_numpy(W))  # nn.Linear stores the same (outputs, inputs) layout\n    layer.bias.copy_(torch.from_numpy(b))\nprint(\"NumPy  X @ W.T + b:\", (X @ W.T + b).tolist())\nprint(\"nn.Linear(X):      \", layer(torch.from_numpy(X)).tolist())\n\n# Input sensitivity of one sigmoid neuron at z = 0: da/dx = slope(z) * w.\n_, slope_at_0 = activation(\"sigmoid\", 0.0)\nfor w in [0.0, 0.5, 4.0]:\n    print(f\"w = {w}: da/dx = {float(slope_at_0 * w)}\")\n";
export const neuronCoreOutput = "sigmoid  values [0.1192 0.5    0.8808] slopes [0.105 0.25  0.105]\ntanh     values [-0.964  0.     0.964] slopes [0.0707 1.     0.0707]\nrelu     values [0. 0. 2.] slopes [0. 0. 1.]\nNumPy  X @ W.T + b: [[4.0, -2.5], [-7.0, 3.5]]\nnn.Linear(X):       [[4.0, -2.5], [-7.0, 3.5]]\nw = 0.0: da/dx = 0.0\nw = 0.5: da/dx = 0.125\nw = 4.0: da/dx = 1.0\n";
