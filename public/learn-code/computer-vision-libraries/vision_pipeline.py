"""Coordinate, pixel and annotation contracts, from scratch and via libraries.
Run: python vision_pipeline.py. No image or model download.
"""
import numpy as np


def correlate_valid(image, kernel):
    """2-D cross-correlation, no padding, O(H W kh kw) arithmetic.

    A sliding-window view avoids copying a patch tensor. einsum performs the
    multiply-sum; it does not choose the neighborhood or reverse the kernel.
    """
    image, kernel = np.asarray(image, dtype=np.float64), np.asarray(kernel, dtype=np.float64)
    if image.ndim != 2 or kernel.ndim != 2 or min(kernel.shape) < 1:
        raise ValueError("Expected a 2-D image and nonempty 2-D kernel")
    if any(k > n for k, n in zip(kernel.shape, image.shape)):
        raise ValueError("Kernel does not fit")
    windows = np.lib.stride_tricks.sliding_window_view(image, kernel.shape)
    return np.einsum("ijuv,uv->ij", windows, kernel, optimize=True)


def crop_flip_box(box, left, top, width, height, flip=False):
    """XYXY pixel-edge box, exclusive upper edges; return None if empty."""
    if width <= 0 or height <= 0:
        raise ValueError("Crop dimensions must be positive")
    x1, y1, x2, y2 = box
    if x2 <= x1 or y2 <= y1:
        raise ValueError("Box must have positive area")
    x1, x2 = np.clip([x1 - left, x2 - left], 0, width)
    y1, y2 = np.clip([y1 - top, y2 - top], 0, height)
    if x2 <= x1 or y2 <= y1:
        return None
    if flip:
        x1, x2 = width - x2, width - x1
    return np.array([x1, y1, x2, y2], dtype=np.float64)


def main():
    import cv2
    from PIL import Image, ImageOps
    import torch
    from torchvision import tv_tensors
    from torchvision.transforms import v2
    torch.set_num_threads(1)
    rgb = np.zeros((4, 6, 3), dtype=np.uint8)
    rgb[1:3, 1:4] = [255, 64, 0]
    box = np.array([1, 1, 4, 3], dtype=np.float64)
    pil = Image.fromarray(rgb)
    pil = ImageOps.exif_transpose(pil).convert("RGB")
    bgr = cv2.cvtColor(np.asarray(pil), cv2.COLOR_RGB2BGR)
    assert bgr[1, 1].tolist() == [0, 64, 255]
    image = tv_tensors.Image(torch.from_numpy(np.asarray(pil).copy()).permute(2, 0, 1))
    boxes = tv_tensors.BoundingBoxes([box.tolist()], format="XYXY", canvas_size=(4, 6))
    flipped_image, flipped_boxes = v2.RandomHorizontalFlip(p=1)(image, boxes)
    expected = crop_flip_box(box, 0, 0, 6, 4, flip=True)
    np.testing.assert_allclose(flipped_boxes[0].numpy(), expected)
    np.testing.assert_array_equal(flipped_image.numpy(), image.numpy()[:, :, ::-1])
    normalized = v2.ToDtype(torch.float32, scale=True)(image)
    assert normalized.shape == (3, 4, 6)
    np.testing.assert_allclose(normalized[:, 1, 1].numpy(), [1, 64 / 255, 0])
    gray = np.arange(16, dtype=float).reshape(4, 4)
    kernel = np.ones((3, 3)) / 9
    scratch = correlate_valid(gray, kernel)
    reference = cv2.filter2D(gray, cv2.CV_64F, kernel, borderType=cv2.BORDER_CONSTANT)[1:-1, 1:-1]
    np.testing.assert_allclose(scratch, reference)
    print("RGB / BGR:", rgb[1, 1].tolist(), bgr[1, 1].tolist())
    print("float CHW:", list(normalized.shape), normalized[:, 1, 1].tolist())
    print("flipped box:", expected.tolist())
    print("valid mean filter:", scratch.tolist())
    print("cropped box:", crop_flip_box(box, 2, 0, 3, 4).tolist())


if __name__ == "__main__":
    main()
