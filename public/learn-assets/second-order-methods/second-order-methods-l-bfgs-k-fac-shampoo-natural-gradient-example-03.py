import numpy as np

def objective(point):
    x, y = point
    return (x*x - 1)**2 / 4 + y*y / 2

def attempt(point, damping):
    x, y = point
    gradient = np.array([x * (x*x - 1), y])
    hessian = np.diag([3*x*x - 1, 1.0])
    system = hessian + damping * np.eye(2)
    if np.min(np.linalg.eigvalsh(system)) <= 0:
        raw = np.linalg.solve(system, -gradient)
        return {"status": "indefinite: reject as SPD model", "raw": raw,
                "slope": gradient @ raw, "full_loss": objective(point + raw)}
    direction = np.linalg.solve(system, -gradient)
    slope = gradient @ direction
    if slope >= 0:
        return {"status": "no strict descent direction"}
    for reductions in range(20):
        alpha = 0.5**reductions
        candidate = point + alpha * direction
        if objective(candidate) <= objective(point) + 1e-4 * alpha * slope:
            return {"status": "accepted", "alpha": alpha, "point": candidate,
                    "loss": objective(candidate), "reductions": reductions}
    raise RuntimeError("Backtracking budget exhausted; inspect the model.")

point = np.array([0.2, 0.5])
raw = attempt(point, 0)
print(raw["status"])
print("raw direction:", np.round(raw["raw"], 6))
print("raw full-step loss:", round(raw["full_loss"], 6))
for point, damping in [(point, 1.2), (np.array([0.6, 0.5]), 0.01)]:
    result = attempt(point, damping)
    print("start:", point, "damping:", damping)
    print(result["status"], "alpha:", result["alpha"],
          "point:", np.round(result["point"], 6), "loss:", round(result["loss"], 6))
