"""A complete local affine patch head, matched Linear route and resize check.

The backbone's features are supplied, not trained here. Float32/64 tensors share
dtype/device. Returned arrays are B,C,h,w coarse scores and B,C,H,W fine scores.
No weights/data are downloaded and no files are written.
"""
from numbers import Integral
import torch
from torch import nn
from torch.nn import functional as F


def dense_affine_head(features, weight, bias, output_size):
    """Explicit shared affine map followed by documented bilinear interpolation."""
    if not all(isinstance(value, torch.Tensor) for value in (features, weight, bias)):
        raise TypeError("features, weight and bias must be tensors")
    if features.ndim != 4 or any(size <= 0 for size in features.shape):
        raise ValueError("features must be nonempty B,h,w,d")
    if weight.ndim != 2 or weight.shape[0] <= 0 or weight.shape[1] != features.shape[-1]:
        raise ValueError("weight must be output-by-feature")
    if bias.ndim != 1 or bias.shape[0] != weight.shape[0]:
        raise ValueError("bias must have one value per output")
    if features.dtype not in (torch.float32, torch.float64):
        raise ValueError("this local head requires real float32/float64")
    if any(value.dtype != features.dtype or value.device != features.device for value in (weight, bias)):
        raise ValueError("all operands must share dtype and device")
    if not all(bool(torch.isfinite(value).all()) for value in (features, weight, bias)):
        raise ValueError("all input operands must be finite")
    if not isinstance(output_size, (tuple, list)) or len(output_size) != 2 or any(
        isinstance(size, bool) or not isinstance(size, Integral) or size <= 0 for size in output_size
    ):
        raise ValueError("output_size must contain two positive integer sides")
    rows = features @ weight.T + bias
    if not bool(torch.isfinite(rows).all()):
        raise ValueError("affine scores are not representable")
    coarse = rows.permute(0, 3, 1, 2).contiguous()
    fine = F.interpolate(coarse, size=tuple(output_size), mode="bilinear", align_corners=False)
    if not bool(torch.isfinite(fine).all()):
        raise ValueError("resized scores are not representable")
    return coarse, fine


def main():
    features = torch.tensor([[[[1., 0.], [0., 1.]], [[1., 1.], [0., 0.]]]],
                            dtype=torch.float64, requires_grad=True)
    weight = nn.Parameter(torch.tensor([[2., -1.]], dtype=torch.float64))
    bias = nn.Parameter(torch.tensor([.5], dtype=torch.float64))
    coarse, fine = dense_affine_head(features, weight, bias, (4, 4))
    expected = torch.tensor([[2.5, 1.75, .25, -.5], [2.25, 1.625, .375, -.25],
                             [1.75, 1.375, .625, .25], [1.5, 1.25, .75, .5]], dtype=torch.float64)
    torch.testing.assert_close(fine[0, 0], expected, rtol=0, atol=1e-14)

    ordinary = nn.Linear(2, 1, bias=True, dtype=torch.float64)
    with torch.no_grad():
        ordinary.weight.copy_(weight)
        ordinary.bias.copy_(bias)
    library = F.interpolate(ordinary(features).permute(0, 3, 1, 2), size=(4, 4),
                            mode="bilinear", align_corners=False)
    torch.testing.assert_close(fine, library, rtol=0, atol=1e-14)
    # A fixed nonuniform probe compares all operand gradients, not only shapes.
    probe = torch.arange(16, dtype=torch.float64).reshape(1, 1, 4, 4) / 16
    explicit_gradients = torch.autograd.grad((fine * probe).sum(), (features, weight, bias))
    library_gradients = torch.autograd.grad((library * probe).sum(),
                                          (features, ordinary.weight, ordinary.bias))
    for actual, reference in zip(explicit_gradients, library_gradients):
        torch.testing.assert_close(actual, reference, rtol=0, atol=1e-13)
    print("Coarse scores:", coarse.detach().tolist())
    print("Fine scores:", fine.detach().tolist())
    print("All matched input/weight/bias gradients agree. No task was trained.")


if __name__ == "__main__":
    main()
