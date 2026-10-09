"""Independent native checks for the reading-flow separable-convolution program.

Run from the repository root with a Python environment containing NumPy/Torch:
  python scripts/verify-depthwise-flow-native.py
Only the revision-specific reading-flow-native.json receipt is written.
"""

from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import numpy as np
import torch


ROOT = Path(__file__).resolve().parents[1]
PROGRAM = ROOT / "public/learn-code/depthwise-separable-dilated-convolutions/separable-convolution.py"
LIBRARY_PROGRAM = PROGRAM.with_name("separable-library-parity.py")
RECEIPT = ROOT / "docs/teaching/deep-learning-beginner/depthwise-separable-dilated-convolutions/reading-flow-native.json"
spec = importlib.util.spec_from_file_location("separable_convolution", PROGRAM)
reference = importlib.util.module_from_spec(spec)
sys.dont_write_bytecode = True  # Public assets must never gain import caches.
spec.loader.exec_module(reference)
torch.set_num_threads(1)


def max_error(left, right):
    right = right.detach().numpy() if isinstance(right, torch.Tensor) else right
    error = float(np.max(np.abs(left - right)))
    np.testing.assert_allclose(left, right, rtol=2e-11, atol=2e-11)
    return error


def torch_case(x, D, P, b, gradient, geometry):
    """Map [C,m,kh,kw] to grouped weights and [O,C,m] to 1x1 weights."""
    channels, multiplier, kh, kw = D.shape
    depth = torch.nn.Conv2d(channels, channels * multiplier, (kh, kw),
                           groups=channels, bias=False, dtype=torch.float64, **geometry)
    point = torch.nn.Conv2d(channels * multiplier, P.shape[0], 1,
                           bias=True, dtype=torch.float64)
    with torch.no_grad():
        depth.weight.copy_(torch.from_numpy(D.reshape(channels * multiplier, 1, kh, kw)))
        point.weight.copy_(torch.from_numpy(P.reshape(P.shape[0], channels * multiplier, 1, 1)))
        point.bias.copy_(torch.from_numpy(b))
    input_tensor = torch.tensor(x, dtype=torch.float64, requires_grad=True)
    y = point(depth(input_tensor))
    y.backward(torch.from_numpy(gradient))
    derivatives = (input_tensor.grad, depth.weight.grad.reshape(D.shape),
                   point.weight.grad.reshape(P.shape), point.bias.grad)
    return y, derivatives, depth, point, input_tensor


def matched_cases():
    rng = np.random.default_rng(48211)
    configurations = [
        (1, 1, 1, 1, 1, 1, 1, 1, 0),
        (1, 2, 1, 1, 3, 1, 2, 1, 0),
        (2, 3, 1, 6, 7, 3, 2, 1, 0),
        (2, 2, 2, 7, 8, 3, 3, 1, 1),
        (1, 3, 3, 8, 7, 2, 3, 2, 2),
        (2, 2, 2, 9, 10, 3, 2, 2, 0),
        (1, 2, 3, 5, 6, 3, 2, 3, 3),
        (1, 1, 2, 1, 1, 3, 3, 2, 2),
        (2, 2, 1, 3, 4, 1, 1, 3, 0),
    ]
    results = []
    for index, (n, c, m, h, w, kh, kw, dilation, padding) in enumerate(configurations):
        stride = 2 if index in (4, 5, 6, 8) else 1
        x = rng.normal(size=(n, c, h, w))
        if index == 5:
            x = x[:, :, ::-1, ::-1]  # Same contract for non-contiguous input arrays.
        D = rng.normal(size=(c, m, kh, kw))
        P = rng.normal(size=(4 if index > 1 else 1, c, m))
        b = rng.normal(size=P.shape[0])
        geometry = dict(stride=stride, dilation=dilation, padding=padding)
        y, cache = reference.forward(x, D, P, b, **geometry)
        gradient = rng.normal(size=y.shape)
        derivatives = reference.backward(gradient, cache)
        ty, tderivatives, depth, point, tx = torch_case(x.copy(), D, P, b, gradient, geometry)
        errors = {"forward": max_error(y, ty)}
        for name, actual, expected in zip(("dx", "dD", "dP", "db"), derivatives, tderivatives):
            errors[name] = max_error(actual, expected)
        next_y, _ = reference.forward(x, D - 0.01 * derivatives[1],
                                      P - 0.01 * derivatives[2], b - 0.01 * derivatives[3], **geometry)
        with torch.no_grad():
            for parameter in (depth.weight, point.weight, point.bias):
                parameter -= 0.01 * parameter.grad
            torch_updated = point(depth(tx))
        errors["simultaneous_update"] = max_error(next_y, torch_updated)
        assert not cache[0].flags.writeable, "Patch windows must be read-only."
        assert np.shares_memory(cache[0], cache[0].base), "Patch extraction must be a view."
        results.append({"case": index + 1, "inputShape": list(x.shape), "depthwiseShape": list(D.shape),
                        "pointwiseShape": list(P.shape), "geometry": geometry,
                        "outputShape": list(y.shape), "maximumAbsoluteErrors": errors})
    return results


def finite_differences():
    rng = np.random.default_rng(707)
    arrays = [rng.normal(size=(1, 2, 4, 5)), rng.normal(size=(2, 2, 2, 3)),
              rng.normal(size=(3, 2, 2)), rng.normal(size=3)]
    geometry = dict(stride=1, dilation=2, padding=2)
    y, cache = reference.forward(*arrays, **geometry)
    gradient = rng.normal(size=y.shape)
    derivatives = reference.backward(gradient, cache)
    errors, count = {}, 0
    for name, array, derivative in zip(("x", "D", "P", "b"), arrays, derivatives):
        errors[name] = 0.
        for flat_index in np.unique(np.linspace(0, array.size - 1, min(8, array.size), dtype=int)):
            coordinate = np.unravel_index(flat_index, array.shape)
            original, epsilon = array[coordinate], 1e-6
            array[coordinate] = original + epsilon
            plus, _ = reference.forward(*arrays, **geometry)
            array[coordinate] = original - epsilon
            minus, _ = reference.forward(*arrays, **geometry)
            array[coordinate] = original
            numerical = ((plus - minus) * gradient).sum() / (2 * epsilon)
            expected = derivative[coordinate]
            np.testing.assert_allclose(numerical, expected, atol=3e-8, rtol=3e-8)
            errors[name] = max(errors[name], float(abs(numerical - expected)))
            count += 1
    return {"coordinatesChecked": count, "step": 1e-6, "maximumAbsoluteErrors": errors}


def boundary_checks():
    x, D, P, b = np.ones((1, 1, 2, 2)), np.ones((1, 1, 2, 2)), np.ones((1, 1, 1)), np.zeros(1)
    y, cache = reference.forward(x, D, P, b, padding=1)
    dx, _, _, _ = reference.backward(np.ones_like(y), cache)
    np.testing.assert_array_equal(dx, np.full_like(x, 4.))
    expected_derivatives = reference.backward(np.ones_like(y), cache)
    D[:] = 17.
    P[:] = -9.
    for actual, expected in zip(reference.backward(np.ones_like(y), cache), expected_derivatives):
        np.testing.assert_array_equal(actual, expected)
    D[:] = 1.
    P[:] = 1.
    failing = [
        lambda: reference.forward(x, D, P, b, stride=0),
        lambda: reference.forward(x, D, P, b, stride=True),
        lambda: reference.forward(x, D, P, b, dilation=0),
        lambda: reference.forward(x, D, P, b, padding=-1),
        lambda: reference.forward(x, np.ones((2, 1, 2, 2)), P, b),
        lambda: reference.forward(x, D, np.ones((1, 1, 2)), b),
        lambda: reference.forward(x, D, P, np.zeros(2)),
        lambda: reference.forward(x, np.ones((1, 1, 5, 5)), P, b),
        lambda: reference.forward(x * np.nan, D, P, b),
        lambda: reference.backward(np.ones((1, 1, 1, 1)), cache),
        lambda: reference.backward(np.full_like(y, np.inf), cache),
    ]
    for action in failing:
        try:
            action()
        except ValueError:
            continue
        raise AssertionError("Invalid public input did not fail.")
    return {"overlapScatterAdd": "passed: four contributions per input pixel",
            "forwardParameterSnapshot": "passed", "invalidInputCases": len(failing)}


def fixture_check():
    x = np.array([[[[1., 2., 3.]], [[2., 0., 1.]]]])
    D = np.array([[[[1., -1.]]], [[[0.5, 1.]]]])
    P = np.array([[[2.], [-1.]]])
    b = np.zeros(1)
    y, cache = reference.forward(x, D, P, b)
    gradient = np.zeros_like(y)
    gradient[0, 0, 0, 0] = -4.
    dx, dD, dP, db = reference.backward(gradient, cache)
    np.testing.assert_array_equal(y.ravel(), [-3., -3.])
    np.testing.assert_array_equal(dD.ravel(), [-8., -16., 8., 0.])
    np.testing.assert_array_equal(dP.ravel(), [4., -4.])
    np.testing.assert_array_equal(db, [-4.])
    fixed, _ = reference.forward(x, D - .01 * dD, P - .01 * dP, b)
    trained, _ = reference.forward(x, D - .01 * dD, P - .01 * dP, b - .01 * db)
    np.testing.assert_allclose(fixed[0, 0, 0, 0], -1.9824, atol=1e-12)
    np.testing.assert_allclose(trained[0, 0, 0, 0], -1.9424, atol=1e-12)
    execution = subprocess.run([sys.executable, str(PROGRAM)], capture_output=True, text=True, check=True)
    return {"firstOutput": -3., "halfSquaredError": 8., "learningRate": .01,
            "updatedFirstOutputWithFixedBias": float(fixed[0, 0, 0, 0]),
            "updatedFirstOutputWithTrainedBias": float(trained[0, 0, 0, 0]),
            "stdout": execution.stdout.rstrip()}


def main():
    parity_execution = subprocess.run([sys.executable, str(LIBRARY_PROGRAM)],
                                      capture_output=True, text=True, check=True)
    assert "updated first output, trained bias: -1.9424" in parity_execution.stdout
    receipt = {
        "schemaVersion": 1, "topic": "depthwise-separable-dilated-convolutions", "revision": 5,
        "checkedAt": datetime.now(timezone.utc).isoformat(), "status": "passed",
        "command": "scratch/lesson-tools/Scripts/python.exe scripts/verify-depthwise-flow-native.py",
        "versions": {"python": sys.version.split()[0], "numpy": np.__version__, "torch": torch.__version__},
        "sourceHashes": {str(path.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(path.read_bytes()).hexdigest()
                         for path in (PROGRAM, LIBRARY_PROGRAM, Path(__file__).resolve())},
        "tolerances": {"torchAbsolute": 2e-11, "torchRelative": 2e-11,
                       "finiteDifferenceAbsolute": 3e-8, "finiteDifferenceRelative": 3e-8},
        "matchedTorchCases": matched_cases(), "finiteDifferences": finite_differences(),
        "boundaries": boundary_checks(), "runningExample": fixture_check(),
        "learnerLibraryParity": {"status": "passed", "stdout": parity_execution.stdout.rstrip()},
        "limits": ["Float64 CPU numerical equivalence; no hardware throughput measurement.",
                   "Scalar stride/dilation and symmetric zero padding; no depthwise bias."]
    }
    RECEIPT.parent.mkdir(parents=True, exist_ok=True)
    RECEIPT.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(f"Passed {len(receipt['matchedTorchCases'])} PyTorch cases; "
          f"{receipt['finiteDifferences']['coordinatesChecked']} finite-difference coordinates; "
          f"{receipt['boundaries']['invalidInputCases']} invalid-input cases; overlap/snapshot/fixture checks.")
    print(str(RECEIPT.relative_to(ROOT)))


if __name__ == "__main__":
    main()
