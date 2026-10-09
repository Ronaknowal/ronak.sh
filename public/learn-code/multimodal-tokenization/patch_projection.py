"""Patch vectors and an exactly matched strided convolution.

Run: python patch_projection.py  (requires numpy and torch).
Download digits_subset.csv beside this program for its second, real-data case.
The image is HWC. Each vector flattens patch-row, patch-column, channel in
that order. Patchify is a lossless reshape/permutation; projection need not
be invertible. NumPy uses [patch, feature] @ [feature, output]; Conv2d uses
[output, channel, patch-row, patch-column], so copying weights requires a
permutation. Cost: O(HWC) patch construction, O(N * P²C * D) projection.
"""

import json
from pathlib import Path
import numpy as np
import torch


def patchify(image, patch_size):
    """Return [number_of_patches, patch_size² * channels] in row-major order."""
    height, width, channels = image.shape
    if height % patch_size or width % patch_size:
        raise ValueError("Image dimensions must be divisible by patch_size")
    return (image.reshape(height // patch_size, patch_size,
                          width // patch_size, patch_size, channels)
            .transpose(0, 2, 1, 3, 4)
            .reshape(-1, patch_size * patch_size * channels))


def unpatchify(patches, image_shape, patch_size):
    """Inverse the patch ordering before any lossy projection."""
    height, width, channels = image_shape
    return (patches.reshape(height // patch_size, width // patch_size,
                            patch_size, patch_size, channels)
            .transpose(0, 2, 1, 3, 4).reshape(image_shape))


def main():
    image = np.arange(4 * 6 * 2, dtype=np.float64).reshape(4, 6, 2) / 10
    patch_size, output_width = 2, 3
    patches = patchify(image, patch_size)
    weights = np.arange(patches.shape[1] * output_width, dtype=np.float64)
    weights = weights.reshape(patches.shape[1], output_width) / 100
    bias = np.array([0.1, -0.2, 0.3])
    projected = patches @ weights + bias

    convolution = torch.nn.Conv2d(2, output_width, patch_size,
                                   stride=patch_size, bias=True).double()
    # HWC feature order -> O,C,H,W convolution kernel order.
    kernel = weights.reshape(patch_size, patch_size, 2, output_width)
    kernel = kernel.transpose(3, 2, 0, 1).copy()
    with torch.no_grad():
        convolution.weight.copy_(torch.from_numpy(kernel))
        convolution.bias.copy_(torch.from_numpy(bias))
        image_chw = torch.from_numpy(image.transpose(2, 0, 1).copy())[None]
        convolution_grid = convolution(image_chw)
    matched = convolution_grid[0].permute(1, 2, 0).reshape(-1, output_width)
    matched = matched.numpy()
    assert np.array_equal(unpatchify(patches, image.shape, patch_size), image)
    np.testing.assert_allclose(matched, projected, rtol=1e-12, atol=1e-12)
    # First retained optical digit: original pixel counts /16, one channel.
    rows = np.genfromtxt(Path(__file__).with_name("digits_subset.csv"),
                        delimiter=",", names=True, dtype=None, encoding="utf8")
    digit = np.array([rows[0][f"p{i}"] for i in range(64)], dtype=np.float64)
    digit = digit.reshape(8, 8, 1) / 16
    digit_patches = patchify(digit, 2)
    digit_weights = np.array([[1., 0.], [0., 1.], [1., 0.], [0., 1.]])
    digit_projected = digit_patches @ digit_weights
    digit_conv = torch.nn.Conv2d(1, 2, 2, stride=2, bias=False).double()
    with torch.no_grad():
        digit_kernel = digit_weights.reshape(2, 2, 1, 2).transpose(3, 2, 0, 1).copy()
        digit_conv.weight.copy_(torch.from_numpy(digit_kernel))
        digit_output = digit_conv(torch.from_numpy(digit.transpose(2, 0, 1).copy())[None])
    digit_matched = digit_output[0].permute(1, 2, 0).reshape(-1, 2).numpy()
    np.testing.assert_allclose(digit_matched, digit_projected, rtol=1e-12, atol=1e-12)
    assert np.array_equal(unpatchify(digit_patches, digit.shape, 2), digit)
    print(json.dumps({
        "image_hwc": list(image.shape), "patches": list(patches.shape),
        "first_patch": patches[0].tolist(),
        "first_projection": projected[0].tolist(),
        "conv_nchw": list(convolution_grid.shape),
        "max_abs_difference": float(np.abs(matched - projected).max()),
        "unpatchify_exact": True,
        "real_digit": {
            "source_index": int(rows[0]["source_index"]), "label": int(rows[0]["label"]),
            "image_hwc": list(digit.shape), "patches": list(digit_patches.shape),
            "patch_index": 1, "patch_vector": digit_patches[1].tolist(),
            "projection": digit_projected[1].tolist(), "unpatchify_exact": True,
            "conv_max_abs_difference": float(np.abs(digit_matched - digit_projected).max()),
        },
    }, indent=2))


if __name__ == "__main__":
    main()
