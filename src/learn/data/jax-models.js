export const calibrationRows = Object.freeze([
  Object.freeze({ x: -2, y: -3 }), Object.freeze({ x: -1, y: -1 }),
  Object.freeze({ x: 1, y: 3 }), Object.freeze({ x: 2, y: 5 }),
]);

export function calibrationState(weight, bias, rate, rows = calibrationRows) {
  const contributions = rows.map(({ x, y }) => {
    const prediction = weight * x + bias;
    const residual = prediction - y;
    return { x, y, prediction, residual, weightGradient: residual * x, biasGradient: residual };
  });
  const mean = accessor => contributions.reduce((sum, row) => sum + accessor(row), 0) / rows.length;
  const gradient = { weight: mean(row => row.weightGradient), bias: mean(row => row.biasGradient) };
  const next = { weight: weight - rate * gradient.weight, bias: bias - rate * gradient.bias };
  return {
    contributions, gradient, next,
    loss: mean(row => row.residual ** 2 / 2),
    nextLoss: rows.reduce((sum, row) => sum + (next.weight * row.x + next.bias - row.y) ** 2 / 2, 0) / rows.length,
  };
}

export function traceSignature(length, dtype, reduction) {
  return `x:(${length},)/${dtype}; static reduction=${reduction}`;
}

export function traceOutput(length, offset, reduction) {
  const values = Array.from({ length }, (_, index) => index + offset);
  const total = values.reduce((sum, value) => sum + value * value, 0);
  return { values, result: reduction === 'mean' ? total / length : total };
}
