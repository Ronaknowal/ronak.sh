import numpy as np

def consensus(c, budget=1.0, rho=1.0, max_steps=500,
              abs_tol=1e-4, rel_tol=1e-3):
    c = np.asarray(c, dtype=float)
    if c.shape != (2,) or not np.isfinite(c).all():
        raise ValueError("Expected a finite two-coordinate target")
    if not all(np.isfinite(v) and v > 0 for v in
               (budget, rho, abs_tol, rel_tol)):
        raise ValueError("Budget, rho and tolerances must be positive")
    if type(max_steps) is not int or max_steps < 1:
        raise ValueError("max_steps must be a positive integer")
    x = np.full(2, budget / 2)
    z = x.copy()
    u = np.zeros(2)
    history = []
    for step in range(1, max_steps + 1):
        previous_z = z.copy()
        x = np.maximum(0, (c + rho * (z - u)) / (1 + rho))
        temporary = x + u
        z = temporary - (temporary.sum() - budget) / 2
        u = u + x - z
        primal = np.linalg.norm(x - z)
        dual = np.linalg.norm(-rho * (z - previous_z))
        eps_primal = np.sqrt(2) * abs_tol + rel_tol * max(
            np.linalg.norm(x), np.linalg.norm(z))
        eps_dual = np.sqrt(2) * abs_tol + rel_tol * np.linalg.norm(rho * u)
        passed = primal <= eps_primal and dual <= eps_dual
        history.append((step, x.copy(), z.copy(), u.copy(), primal, dual, passed))
        if passed:
            break
    return history

history = consensus([2, -0.6])
first, final = history[0], history[-1]
print("First x:", first[1].tolist(), "z:", first[2].tolist())
print("First residual norms:", round(first[4], 6), round(first[5], 6))
print("Both stopping tests:", bool(final[6]))
print("Approximate x:", np.round(final[1], 3).tolist())
print("Original x sum residual:", round(float(final[1].sum() - 1), 6))
# A passing numerical test still leaves a small original-constraint residual.