import math
import numpy as np
from sklearn.cluster import KMeans

colors = np.array(
    [
        [240, 20, 20],
        [250, 30, 15],
        [230, 15, 25],
        [20, 230, 20],
        [30, 240, 15],
        [15, 220, 30],
        [20, 20, 230],
        [30, 25, 240],
    ],
    dtype=float,
)
counts = np.array([30, 12, 10, 25, 8, 10, 20, 13])
pixels = np.repeat(colors, counts, axis=0)
initial = colors[[0, 3, 6]].copy()  # Same starting centers in both representations.
weighted = KMeans(
    n_clusters=3, init=initial, n_init=1, tol=0, algorithm="lloyd", random_state=0
).fit(colors, sample_weight=counts)
repeated = KMeans(
    n_clusters=3, init=initial, n_init=1, tol=0, algorithm="lloyd", random_state=0
).fit(pixels)
print("pixels / distinct rows:", len(pixels), len(colors))
print(
    "weighted versus repeated SSE:",
    round(weighted.inertia_, 6),
    round(repeated.inertia_, 6),
)
print(
    "same floating palette:",
    bool(np.allclose(weighted.cluster_centers_, repeated.cluster_centers_)),
)

palette = np.clip(np.rint(weighted.cluster_centers_), 0, 255).astype(np.uint8)
# Subtract in floating point: uint8 subtraction would wrap.
distances = ((pixels[:, None, :] - palette.astype(float)[None, :, :]) ** 2).sum(axis=2)
indices = distances.argmin(axis=1)
bits_per_index = math.ceil(math.log2(len(palette)))
bitstream = "".join(format(int(index), f"0{bits_per_index}b") for index in indices)
decoded_indices = np.array(
    [
        int(bitstream[start : start + bits_per_index], 2)
        for start in range(0, len(bitstream), bits_per_index)
    ]
)
decoded = palette[decoded_indices].astype(float)
deployed_sse = float(np.sum((pixels - decoded) ** 2))
raw_bits = len(pixels) * 3 * 8
palette_bits = palette.size * 8
payload_bits = palette_bits + len(bitstream)
print("integer RGB palette:", palette.tolist())
print(
    "decoded matches palette assignment:",
    bool(np.array_equal(decoded_indices, indices)),
)
print(
    "floating / decoded squared RGB error per pixel:",
    round(weighted.inertia_ / len(pixels), 6),
    round(deployed_sse / len(pixels), 6),
)
print(
    "raw / palette / index / total payload bits:",
    raw_bits,
    palette_bits,
    len(bitstream),
    payload_bits,
)