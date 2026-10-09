import numpy as np

def common_direction(first, second):
    first, second = np.asarray(first, float), np.asarray(second, float)
    if (first.ndim != 1 or first.size == 0 or first.shape != second.shape
            or not np.isfinite(first).all() or not np.isfinite(second).all()):
        raise ValueError("Expected equal finite nonempty gradient vectors")
    edge = first - second
    denominator = float(edge @ edge)
    alpha = 0.0 if denominator == 0 else float(
        np.clip(-(second @ edge) / denominator, 0, 1))
    v = alpha * first + (1-alpha) * second
    return alpha, -v

for first, second in [([2, 0], [0, 2]), ([2], [-2]), ([6], [2])]:
    alpha, direction = common_direction(first, second)
    rates = [float(np.dot(g, direction)) for g in (first, second)]
    print("weight", alpha, "direction", direction.tolist(), "rates", rates)
# Zero direction is only a first-order obstruction, not a global certificate.