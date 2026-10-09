"""Differentiate an addressed read from scratch and compare PyTorch autograd.

C is key rows by value columns. These are local read derivatives, not a
complete recurrent training engine. The branch tie has no unique gradient.
"""
import numpy as np


def read_and_vjp(cell, normalizer, query, floor, upstream):
    cell = np.asarray(cell, dtype=np.float64)
    normalizer = np.asarray(normalizer, dtype=np.float64)
    query = np.asarray(query, dtype=np.float64)
    upstream = np.asarray(upstream, dtype=np.float64)
    if (cell.ndim != 2 or normalizer.shape != (cell.shape[0],)
            or query.shape != normalizer.shape
            or upstream.shape != (cell.shape[1],)):
        raise ValueError("Expected C[key,value], n[key], q[key], upstream[value]")
    if (not all(np.isfinite(x).all() for x in
                (cell, normalizer, query, upstream))
            or not np.isfinite(floor) or floor <= 0):
        raise ValueError("Finite coordinates and a finite positive floor are required")
    numerator = cell.T @ query
    mass = float(normalizer @ query)
    denominator = max(abs(mass), floor)
    if abs(mass) == floor:
        raise ValueError("Branch tie: no unique classical read derivative")
    numerator_gradient = upstream / denominator
    denominator_gradient = -float(upstream @ numerator) / denominator**2
    mass_gradient = (denominator_gradient * np.sign(mass)
                     if abs(mass) > floor else 0.0)
    gradients = {
        "cell": np.outer(query, numerator_gradient),
        "normalizer": query * mass_gradient,
        "query": cell @ numerator_gradient + normalizer * mass_gradient,
        "floor": denominator_gradient if abs(mass) < floor else 0.0,
    }
    return numerator / denominator, gradients


def check():
    import torch
    cell = np.array([[2.0, -1.0], [0.5, 3.0]])
    normalizer = np.array([0.5, 0.2])
    upstream = np.array([1.0, -0.5])
    checked = 0
    largest_error = 0.0
    for query in (np.array([0.2, 0.1]), np.array([2.0, 1.0]),
                  np.array([-2.0, -1.0])):
        floor = 1.0
        values = {"cell": cell, "normalizer": normalizer, "query": query,
                  "floor": np.asarray(floor)}
        read, analytical = read_and_vjp(cell, normalizer, query, floor, upstream)
        tensors = {name: torch.tensor(value, dtype=torch.float64, requires_grad=True)
                   for name, value in values.items()}
        mass = tensors["normalizer"] @ tensors["query"]
        denominator = torch.maximum(mass.abs(), tensors["floor"])
        native_read = tensors["cell"].T @ tensors["query"] / denominator
        (native_read @ torch.tensor(upstream)).backward()
        np.testing.assert_allclose(read, native_read.detach().numpy(), atol=1e-12)
        for name, value in values.items():
            np.testing.assert_allclose(analytical[name], tensors[name].grad.numpy(),
                                       rtol=1e-11, atol=1e-11)
            for index in np.ndindex(value.shape):
                positive = {key: v.copy() for key, v in values.items()}
                negative = {key: v.copy() for key, v in values.items()}
                positive[name][index] += 1e-6
                negative[name][index] -= 1e-6
                objective = lambda inputs: float(read_and_vjp(
                    inputs["cell"], inputs["normalizer"], inputs["query"],
                    float(inputs["floor"]), upstream)[0] @ upstream)
                finite_difference = (objective(positive) - objective(negative)) / 2e-6
                expected = float(np.asarray(analytical[name])[index])
                largest_error = max(largest_error, abs(expected - finite_difference))
                np.testing.assert_allclose(expected, finite_difference, atol=1e-8)
                checked += 1
        branch = "floor" if abs(normalizer @ query) < floor else "alignment"
        print(branch, "read", read.tolist(), "query derivative", analytical["query"].tolist())
    try:
        read_and_vjp(cell, np.array([1.0, 0.0]), np.array([1.0, 0.0]), 1.0, upstream)
    except ValueError as error:
        assert "Branch tie" in str(error)
    else:
        raise AssertionError("Tie must not be presented as a unique derivative")
    print(f"{checked} finite-difference coordinates; largest error {largest_error:.3e}; autograd agrees")


if __name__ == "__main__":
    check()
