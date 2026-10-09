import numpy as np
from scipy.integrate import solve_ivp


def lorenz(time, state, rho):
    first, second, third = state
    return [
        10 * (second - first),
        first * (rho - third) - second,
        first * second - 8 * third / 3,
    ]


def solve_lorenz(initial, rho, horizon, tolerance):
    initial = np.asarray(initial, dtype=float)
    if (
        initial.shape != (3,)
        or not np.isfinite(initial).all()
        or np.max(np.abs(initial)) > 20
    ):
        raise ValueError(
            "Use three finite initial components of magnitude at most twenty."
        )
    if (
        not np.isfinite(rho)
        or not 0.5 <= rho <= 28
        or not np.isfinite(horizon)
        or not 0 < horizon <= 30
    ):
        raise ValueError("Use rho in [.5,28] and horizon in (0,30].")
    if not np.isfinite(tolerance) or not 1e-12 <= tolerance <= 1e-6:
        raise ValueError("Use a tolerance in [1e-12,1e-6].")
    result = solve_ivp(
        lorenz,
        (0, horizon),
        initial,
        args=(rho,),
        method="DOP853",
        t_eval=np.linspace(0, horizon, 101),
        max_step=0.01,
        rtol=tolerance,
        atol=tolerance / 100,
    )
    if not result.success:
        raise RuntimeError(result.message)
    return result


first = solve_lorenz([1, 1, 1], 28, 1, 1e-9)
refined = solve_lorenz([1, 1, 1], 28, 1, 1e-12)
for index in (0, 50, 100):
    print(
        f"t={refined.t[index]:.2f}:",
        [round(value, 6) for value in refined.y[:, index].tolist()],
    )
print(
    "short-horizon disagreement below 1e-6:",
    bool(np.max(np.abs(first.y - refined.y)) < 1e-6),
)
print("Matching this finite trajectory does not prove a long-time chaos claim.")
