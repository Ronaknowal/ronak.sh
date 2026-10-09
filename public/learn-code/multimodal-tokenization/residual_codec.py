"""Residual vector quantization, serialization and payload arithmetic.

Run: python residual_codec.py  (requires numpy).
Every stage quantizes the residual left by the preceding stages. IDs are
stage-local: (stage, ID), not one shared vocabulary. Decode sums selected
vectors. This example uses squared-error SUM over coordinates. A greedy
stage reduces that error only if its available vectors permit improvement;
a zero candidate guarantees a non-increasing error under exact selection.
This is a latent-space mechanism, not a trained waveform codec.
"""

import json
import math
import numpy as np


def corners(magnitude):
    return magnitude * np.array([[-1., -1.], [1., -1.],
                                  [-1., 1.], [1., 1.]])


def encode(vector, codebooks):
    residual = np.asarray(vector, dtype=np.float64).copy()
    ids, errors = [], []
    for codebook in codebooks:
        distances = np.sum((codebook - residual) ** 2, axis=1)
        index = int(np.argmin(distances))  # First index wins an exact tie.
        ids.append(index)
        residual -= codebook[index]
        errors.append(float(residual @ residual))
    return np.array(ids), errors


def decode(ids, codebooks):
    return np.sum([book[index] for book, index in zip(codebooks, ids)], axis=0)


def serialize(ids_time_stage, order):
    """Caller retains [time, stage] shape and order alongside the payload."""
    matrix = np.asarray(ids_time_stage)
    if order == "time-major":
        return matrix.reshape(-1)
    if order == "level-major":
        return matrix.T.reshape(-1)
    raise ValueError("order must be time-major or level-major")


def deserialize(payload, frames, stages, order):
    if order == "time-major":
        return np.asarray(payload).reshape(frames, stages)
    if order == "level-major":
        return np.asarray(payload).reshape(stages, frames).T
    raise ValueError("order must be time-major or level-major")


def payload_rate(sample_rate, stride, stages, codebook_size):
    """Fixed-width ID payload only; excludes headers, scales and entropy coding."""
    frames_per_second = sample_rate / stride
    bits_per_id = math.ceil(math.log2(codebook_size))
    return {"frames_per_second": frames_per_second,
            "ids_per_second": frames_per_second * stages,
            "bits_per_id": bits_per_id,
            "bits_per_second": frames_per_second * stages * bits_per_id}


def main():
    vector = np.array([0.8, 0.6])
    codebooks = [corners(1), corners(0.5), corners(0.25)]
    ids, errors = encode(vector, codebooks)
    reconstructed = decode(ids, codebooks)
    stream = np.stack([ids, encode([-0.8, 0.6], codebooks)[0]])
    serializations = {}
    for order in ["time-major", "level-major"]:
        payload = serialize(stream, order)
        assert np.array_equal(deserialize(payload, 2, 3, order), stream)
        serializations[order] = payload.tolist()
    # Residual .1 is much closer to zero than to the only candidate, 1.
    _, worsening = encode([0.1, 0.], [np.array([[1., 0.]])])
    print(json.dumps({
        "input": vector.tolist(), "stage_ids": ids.tolist(),
        "squared_error_sums": errors,
        "decoded_sum": reconstructed.tolist(),
        "final_residual": (vector - reconstructed).tolist(),
        "stage_namespaced_ids": [[stage, int(index)]
                                 for stage, index in enumerate(ids)],
        "ids_time_stage": stream.tolist(), "serializations": serializations,
        "malformed_stage_error_before": 0.01,
        "malformed_stage_error_after": worsening[0],
        "payload": payload_rate(24000, 320, 8, 1024),
    }, indent=2))


if __name__ == "__main__":
    main()
