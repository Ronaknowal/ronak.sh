// Small, exact forward computations for the neuron anatomy and XOR wiring views.
// These are constructed examples, not fitted models or training simulations.
export function neuronAnatomy(input, bias, activation) {
  const contributions = [1.5 * 2, -2 * input];
  const score = contributions[0] + contributions[1] + bias;
  const output = activation === 'relu' ? Math.max(0, score)
    : activation === 'step' ? Number(score > 0)
      : 1 / (1 + Math.exp(-score));
  return { contributions, score, output };
}

export function xorWiring(x1, x2, nonlinear = true) {
  const scores = [x1 + x2, x1 + x2 - 1];
  const hidden = scores.map(value => nonlinear ? Math.max(0, value) : value);
  const contributions = [hidden[0], -2 * hidden[1]];
  return { scores, hidden, contributions, output: contributions[0] + contributions[1] };
}
