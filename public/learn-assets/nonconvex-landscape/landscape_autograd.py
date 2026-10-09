"""Compare analytic derivatives with ordinary CPU, float64 autograd.

Run: python landscape_autograd.py
Requires NumPy and PyTorch. Hessians here have only two coordinates;
dense storage is O(d^2), so this is not a large-network Hessian recipe.
ReLU's derivative at zero is a software convention, not differentiability.
"""
import numpy as np
import torch
from torch.autograd.functional import hessian, jacobian


def factor(theta):
    a, b = theta.unbind()
    return 0.5 * (a * b - 1) ** 2


def analytic(a, b):
    error = a * b - 1
    return (np.array([error * b, error * a]),
            np.array([[b*b, 2*a*b-1], [2*a*b-1, a*a]]))


def unit(theta):
    # One declared input x=1 and target y=1, with output weight fixed at one.
    return 0.5 * (torch.relu(theta[0] + theta[1]) - 1) ** 2


def main():
    for a, b in [(0., 0.), (1., 1.), (4., 0.25), (1., 0.5)]:
        theta = torch.tensor([a, b], dtype=torch.float64)
        g = jacobian(factor, theta).numpy()
        H = hessian(factor, theta).numpy()
        expected_g, expected_H = analytic(a, b)
        np.testing.assert_allclose(g, expected_g, atol=1e-14, rtol=1e-14)
        np.testing.assert_allclose(H, expected_H, atol=1e-14, rtol=1e-14)
        values, vectors = np.linalg.eigh(H)
        residual = np.linalg.norm(H @ vectors - vectors * values)
        assert residual < 1e-12
        print(f"factor ({a:g},{b:g}) loss={float(factor(theta)):.6f} "
              f"gradient={g.tolist()} eigenvalues={values.round(9).tolist()}")
    for bias in [-1., 0., 0.5]:
        theta = torch.tensor([0., bias], dtype=torch.float64)
        g = jacobian(unit, theta).numpy()
        print(f"ReLU bias={bias:g} loss={float(unit(theta)):.6f} "
              f"gradient={g.tolist()}")
    # At the kink the loss has unequal one-sided directional derivatives.
    h = 1e-6
    centre = torch.tensor([0., 0.], dtype=torch.float64)
    step = torch.tensor([0., h], dtype=torch.float64)
    right = (unit(centre + step) - unit(centre)) / h
    left = (unit(centre) - unit(centre - step)) / h
    print(f"kink bias slopes: left={float(left):.6f} right={float(right):.6f}")
    assert abs(float(left)) < 1e-12 and abs(float(right) + 1) < 2e-6


if __name__ == "__main__":
    main()
