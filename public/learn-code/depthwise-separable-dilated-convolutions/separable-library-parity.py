"""Map the scratch layer to grouped PyTorch Conv2d on exactly the same state.

Place beside separable-convolution.py; run python separable-library-parity.py.
Requires NumPy and PyTorch. Both routes use float64 CPU tensors, no depthwise
bias, one pointwise output bias, and half-squared error at the first output.
"""

import importlib.util
from pathlib import Path
import sys

import numpy as np
import torch


def main():
    # The downloadable filename contains a hyphen, so load its exact local path.
    path = Path(__file__).with_name("separable-convolution.py")
    spec = importlib.util.spec_from_file_location("separable_convolution", path)
    scratch = importlib.util.module_from_spec(spec)
    sys.dont_write_bytecode = True
    spec.loader.exec_module(scratch)
    x = np.array([[[[1., 2., 3.]], [[2., 0., 1.]]]])
    D = np.array([[[[1., -1.]]], [[[0.5, 1.]]]])
    P = np.array([[[2.], [-1.]]])
    b = np.zeros(1)
    target, rate = 1., .01
    y, cache = scratch.forward(x, D, P, b)
    gradient = np.zeros_like(y)
    gradient[0, 0, 0, 0] = y[0, 0, 0, 0] - target
    derivatives = scratch.backward(gradient, cache)

    C, m, kh, kw = D.shape
    O = P.shape[0]
    # Group c reads only input c; its m filters occupy consecutive output slots.
    depth = torch.nn.Conv2d(C, C * m, (kh, kw), groups=C, bias=False, dtype=torch.float64)
    point = torch.nn.Conv2d(C * m, O, 1, bias=True, dtype=torch.float64)
    with torch.no_grad():
        depth.weight.copy_(torch.from_numpy(D.reshape(C * m, 1, kh, kw)))
        point.weight.copy_(torch.from_numpy(P.reshape(O, C * m, 1, 1)))
        point.bias.copy_(torch.from_numpy(b))
    tx = torch.tensor(x, dtype=torch.float64, requires_grad=True)
    ty = point(depth(tx))
    loss = .5 * (ty[0, 0, 0, 0] - target) ** 2
    loss.backward()
    torch_derivatives = (tx.grad, depth.weight.grad.reshape(D.shape),
                         point.weight.grad.reshape(P.shape), point.bias.grad)
    errors = {}
    for name, own, usual in zip(("forward", "dx", "dD", "dP", "db"),
                                (y, *derivatives), (ty, *torch_derivatives)):
        usual = usual.detach().numpy()
        np.testing.assert_allclose(own, usual, atol=2e-11, rtol=2e-11)
        errors[name] = float(np.max(np.abs(own - usual)))

    # All updates use derivatives of the old state; x is data, not a parameter.
    _, dD, dP, db = derivatives
    updated, _ = scratch.forward(x, D - rate * dD, P - rate * dP, b - rate * db)
    with torch.no_grad():
        for parameter in (depth.weight, point.weight, point.bias):
            parameter -= rate * parameter.grad
        torch_updated = point(depth(tx)).numpy()
    np.testing.assert_allclose(updated, torch_updated, atol=2e-11, rtol=2e-11)
    errors["update"] = float(np.max(np.abs(updated - torch_updated)))
    print("first output:", float(y[0, 0, 0, 0]), "loss:", float(loss.detach()))
    print("maximum absolute errors:", ", ".join(f"{name}={error:.3e}" for name, error in errors.items()))
    print("updated first output, trained bias:", round(float(updated[0, 0, 0, 0]), 6))


if __name__ == "__main__":
    main()
