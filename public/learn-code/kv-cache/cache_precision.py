"""Actual affine 4/8-bit group packing and dequantized attention error.

Run: python cache_precision.py
NumPy+PyTorch CPU reference. Each supplied array is one flattened group,
not KIVI's asymmetric key/value grouping or a fused quantized-attention kernel.
"""
import json
import math
import numpy as np
import torch
from torch.nn.functional import scaled_dot_product_attention


def pack_codes(codes, bits=4):
    codes = np.asarray(codes)
    if bits not in (4, 8) or not np.issubdtype(codes.dtype, np.integer):
        raise ValueError("Use integer codes and 4 or 8 bits")
    if np.any(codes < 0) or np.any(codes > (1 << bits)-1):
        raise ValueError("A code is outside its bit range")
    flat = codes.astype(np.uint8).ravel()
    if bits == 8:
        return flat.copy()
    if len(flat) % 2:
        flat = np.pad(flat, (0, 1))
    return flat[::2] | (flat[1::2] << 4)


def unpack_codes(payload, count, bits=4):
    payload = np.asarray(payload, dtype=np.uint8)
    if bits not in (4, 8) or count < 0 or len(payload) != (count*bits+7)//8:
        raise ValueError("Payload size does not match the code count")
    if bits == 8:
        return payload[:count].copy()
    result = np.empty(len(payload)*2, dtype=np.uint8)
    result[::2], result[1::2] = payload & 15, payload >> 4
    return result[:count]


def quantize_group(values, bits=4):
    values = np.asarray(values, dtype=np.float32)
    if values.size == 0 or not np.isfinite(values).all() or bits not in (4, 8):
        raise ValueError("Need a finite nonempty group and 4 or 8 bits")
    offset = np.float32(values.min())
    span = np.float32(values.max()-offset)
    # A constant group uses code zero, scale zero, and reconstructs the offset.
    scale = np.float32(span/((1 << bits)-1))
    codes = (np.zeros(values.shape, dtype=np.uint8) if scale == 0 else
             np.clip(np.rint((values-offset)/scale), 0, (1 << bits)-1).astype(np.uint8))
    return {"payload": pack_codes(codes, bits), "scale": scale, "offset": offset,
            "shape": values.shape, "count": values.size, "bits": bits}


def dequantize_group(group):
    codes = unpack_codes(group["payload"], group["count"], group["bits"])
    return (codes.astype(np.float32)*group["scale"]+group["offset"]).reshape(group["shape"])


def storage_bytes(groups, residual):
    # Each group stores one FP32 scale and one FP32 offset. Shape/index metadata
    # is separate; Python dictionary size is not tensor payload.
    return {"packed": sum(g["payload"].nbytes for g in groups),
            "scales_offsets": len(groups)*8, "residual": np.asarray(residual).nbytes}


def attention(query, keys, values):
    scores = query @ keys.T / math.sqrt(keys.shape[1])
    exp = np.exp(scores-scores.max(axis=-1, keepdims=True))
    weights = exp/exp.sum(axis=-1, keepdims=True)
    return weights @ values, weights


def examples():
    codes = np.array([0, 15, 7, 8, 3], dtype=np.uint8)
    packed = pack_codes(codes)
    np.testing.assert_array_equal(packed, [240, 135, 3])
    np.testing.assert_array_equal(unpack_codes(packed, 5), codes)
    constant = quantize_group(np.full(5, 2.5))
    np.testing.assert_array_equal(dequantize_group(constant), np.full(5, 2.5))
    for bits in (4, 8):
        all_codes = np.arange(1 << bits, dtype=np.uint8)
        np.testing.assert_array_equal(unpack_codes(pack_codes(all_codes, bits), len(all_codes), bits), all_codes)
    q = np.array([[0.7, -0.4]], dtype=np.float32)
    k = np.array([[0, 0.3], [1, -0.7], [0.47, 0.12]], dtype=np.float32)
    v = np.array([[0.12, 1], [-0.4, 0.7], [0.6, -0.2]], dtype=np.float32)
    kg, vg = [quantize_group(a) for a in (k, v)]
    kd, vd = [dequantize_group(a) for a in (kg, vg)]
    exact, weights = attention(q, k, v)
    variants = {}
    for name, keys, values in (("keys_only", kd, v), ("values_only", k, vd), ("both", kd, vd)):
        output, current_weights = attention(q, keys, values)
        native = scaled_dot_product_attention(*[torch.from_numpy(a[None, None].copy())
                                                for a in (q, keys, values)], dropout_p=0)
        np.testing.assert_allclose(native.numpy()[0, 0], output, atol=1e-6, rtol=1e-6)
        variants[name] = {"output": output.tolist(), "weights": current_weights.tolist(),
                          "output_max_error": float(np.max(np.abs(output-exact)))}
    # Small reconstruction error can cross a deliberately close decision bound.
    # This constructed witness demonstrates sensitivity, not measured LM quality.
    close = np.array([0, 0.49, 1], dtype=np.float32)
    close_d = dequantize_group(quantize_group(close))
    threshold = 0.48
    assert bool(close[1] > threshold) and not bool(close_d[1] > threshold)
    equal_v = np.full_like(v, 0.75)
    np.testing.assert_allclose(attention(q, kd, equal_v)[0], [[0.75, 0.75]], atol=1e-6)
    return {"packed_codes": packed.tolist(), "five_code_payload_bytes": packed.nbytes,
            "five_code_with_metadata_bytes": packed.nbytes+8, "five_fp16_bytes": 10,
            "constant_scale": float(constant["scale"]), "exact_output": exact.tolist(),
            "exact_weights": weights.tolist(), "variants": variants,
            "storage": storage_bytes([kg, vg], np.empty((2, 2), dtype=np.float16)),
            "threshold_witness": {"before": close.tolist(), "after": close_d.tolist(),
                                  "rmse": float(np.sqrt(np.mean((close-close_d)**2))), "threshold": threshold}}


if __name__ == "__main__":
    print(json.dumps(examples(), indent=2))
