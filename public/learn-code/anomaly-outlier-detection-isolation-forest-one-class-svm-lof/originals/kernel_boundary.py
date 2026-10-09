import numpy as np


def decision(x, gamma):
    rho = (1 + np.exp(-4 * gamma)) / 2
    return (np.exp(-gamma * (x + 1)**2)
            + np.exp(-gamma * (x - 1)**2)) / 2 - rho


for gamma in [0.1, 1.0]:
    print(f"gamma={gamma:.1f}: midpoint={decision(0, gamma):+.6f}, "
          f"reference={decision(1, gamma):+.6f}")