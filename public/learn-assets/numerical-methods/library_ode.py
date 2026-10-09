"""Adaptive local control, assessed at shared physical output times."""
import numpy as np
from scipy.integrate import solve_ivp


def main():
    k, horizon = 2., 3.
    times = np.array([0., .5, 1., 2., 3.])
    for rtol, atol in [(1e-3, 1e-6), (1e-8, 1e-10)]:
        result = solve_ivp(lambda t, y: -k*y, (0., horizon), [1.],
                           method="RK45", t_eval=times, rtol=rtol, atol=atol)
        print(f"rtol={rtol:g} atol={atol:g}; success={result.success} status={result.status} evaluations={result.nfev}")
        print("message:", result.message)
        for t, y in zip(result.t, result.y[0]):
            exact = np.exp(-k*t)
            print(f"  t={t:.1f} computed={y:.10f} exact={exact:.10f} absolute error={abs(y-exact):.3e}")


if __name__ == "__main__":
    main()
