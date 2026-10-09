export function pairedAndCross(predictions, targets) {
  if (
    predictions.length !== targets.length ||
    predictions.length === 0 ||
    ![...predictions, ...targets].every(Number.isFinite)
  ) {
    throw new Error(
      "Finite equal nonempty prediction and target vectors required",
    );
  }
  const size = predictions.length;
  const paired = predictions.map((value, index) => value - targets[index]);
  const cross = predictions.map((value) =>
    targets.map((target) => value - target),
  );
  return {
    paired,
    cross,
    pairedLoss:
      paired.reduce((sum, value) => sum + value * value, 0) / (2 * size),
    crossLoss:
      cross.flat().reduce((sum, value) => sum + value * value, 0) /
      (2 * size * size),
    pairedGradient: paired.map((value) => value / size),
    crossGradient: cross.map(
      (row) => row.reduce((sum, value) => sum + value, 0) / (size * size),
    ),
  };
}

export function tensorBoundary(mode, weight, x, bias, target) {
  if (
    !["connected", "clone", "detach", "detached-copy"].includes(mode) ||
    ![weight, x, bias, target].every(Number.isFinite)
  ) {
    throw new Error("Known routing mode and finite inputs required");
  }
  const product = weight * x;
  const output = product + bias;
  const residual = output - target;
  const tracked = mode === "connected" || mode === "clone";
  const shared = mode === "connected" || mode === "detach";
  return {
    product,
    output,
    residual,
    loss: 0.5 * residual * residual,
    tracked,
    shared,
    weightGradient: tracked ? residual * x : null,
    biasGradient: residual,
  };
}
