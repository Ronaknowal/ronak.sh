"""The explicit RGB palette/index payload, including a zero-bit k=1 stream."""
import numpy as np


def pack_indices(indices, palette_count):
    indices = np.asarray(indices)
    if not isinstance(palette_count, int) or palette_count < 1:
        raise ValueError("palette_count must be a positive integer.")
    if (indices.ndim != 1 or not np.issubdtype(indices.dtype, np.integer)
            or (indices < 0).any() or (indices >= palette_count).any()):
        raise ValueError("Every index must address an actual palette entry.")
    width = (palette_count - 1).bit_length()
    return "" if width == 0 else "".join(format(int(index), f"0{width}b") for index in indices)


def decode_palette(palette, stream, pixel_count):
    palette = np.asarray(palette)
    if (palette.ndim != 2 or palette.shape[1] != 3 or len(palette) == 0
            or palette.dtype != np.uint8):
        raise ValueError("Supply a nonempty byte RGB palette.")
    if not isinstance(pixel_count, int) or pixel_count < 0:
        raise ValueError("pixel_count must be a nonnegative integer.")
    if not isinstance(stream, str) or set(stream) - {"0", "1"}:
        raise ValueError("The logical stream must contain only bit characters.")
    width = (len(palette) - 1).bit_length()
    if len(stream) != pixel_count * width:
        raise ValueError("Stream length differs from the declared image size and index width.")
    indices = (np.zeros(pixel_count, dtype=int) if width == 0
               else np.array([int(stream[start:start + width], 2)
                              for start in range(0, len(stream), width)], dtype=int))
    if (indices >= len(palette)).any():
        raise ValueError("A bit code addresses an unused palette slot.")
    return palette[indices], indices
