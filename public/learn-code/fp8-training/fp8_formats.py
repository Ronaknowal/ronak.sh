"""Finite FP8 reference: python fp8_formats.py. Requires NumPy."""
from collections import deque
from dataclasses import dataclass
import json
import numpy as np


@dataclass(frozen=True)
class Format:
    fraction_bits: int
    bias: int
    last_finite_code: int


FORMATS = {"e4m3": Format(3, 7, 126), "e5m2": Format(2, 15, 123)}


def positive_grid(name):
    """Finite nonnegative magnitudes in increasing byte-code order."""
    f = FORMATS[name]
    code = np.arange(f.last_finite_code + 1)
    exponent, fraction = code >> f.fraction_bits, code % (1 << f.fraction_bits)
    significand = fraction / (1 << f.fraction_bits)
    return np.where(exponent == 0,
                    significand * 2.0 ** (1 - f.bias),
                    (1 + significand) * 2.0 ** (exponent - f.bias))


GRIDS = {name: positive_grid(name) for name in FORMATS}


def encode(values, name="e4m3"):
    """Finite values -> saturated bytes, nearest with ties to even; signed zero kept."""
    x = np.asarray(values, dtype=np.float64)
    if not np.all(np.isfinite(x)):
        raise ValueError("This encoder accepts finite values only")
    grid = GRIDS[name]
    magnitude = np.minimum(np.abs(x), grid[-1])
    hi = np.clip(np.searchsorted(grid, magnitude), 1, len(grid) - 1)
    lo = hi - 1
    low_error, high_error = magnitude - grid[lo], grid[hi] - magnitude
    choose_hi = (high_error < low_error) | ((high_error == low_error) & (hi % 2 == 0))
    code = np.where(choose_hi, hi, lo).astype(np.uint8)
    return code | (np.signbit(x).astype(np.uint8) << 7)


def decode(codes, name="e4m3"):
    """Decode all 256 byte patterns, including signed zeros, infinities and NaNs."""
    codes = np.asarray(codes, dtype=np.uint8)
    magnitude = codes & 127
    grid = GRIDS[name]
    value = grid[np.minimum(magnitude, len(grid) - 1)]
    value = np.where(magnitude >= len(grid), np.nan, value)
    if name == "e5m2":
        value = np.where(magnitude == 124, np.inf, value)
    return np.copysign(value, np.where(codes & 128, -1.0, 1.0))


def quantize(values, name="e4m3"):
    return decode(encode(values, name), name)


def current_scale(values, name="e4m3", axis=None, power_of_two=False):
    """Reconstruction scale s: xhat=s*q. Nonempty finite input, positive scale."""
    x = np.asarray(values, dtype=np.float64)
    if x.size == 0 or not np.all(np.isfinite(x)):
        raise ValueError("Scaling requires a nonempty finite tensor")
    amax = np.max(np.abs(x), axis=axis, keepdims=True)
    s = np.where(amax == 0, 1.0, amax / GRIDS[name][-1])
    if power_of_two:
        s = 2.0 ** np.ceil(np.log2(s))
    return s


def scaled(values, name="e4m3", axis=None, power_of_two=False):
    x = np.asarray(values, dtype=np.float64)
    s = current_scale(x, name, axis, power_of_two)
    return encode(x / s, name), s


def roundtrip(values, name="e4m3", axis=None, power_of_two=False):
    q, s = scaled(values, name, axis, power_of_two)
    return decode(q, name) * s


def grouped_roundtrip(matrix, block=(2, 2), name="e4m3", power_of_two=False):
    """Nonoverlapping rectangular groups; matrix dimensions must divide block shape."""
    x = np.asarray(matrix, dtype=np.float64)
    rows, cols = x.shape
    br, bc = block
    if br < 1 or bc < 1 or rows % br or cols % bc:
        raise ValueError("Block dimensions must divide the matrix")
    groups = x.reshape(rows // br, br, cols // bc, bc).transpose(0, 2, 1, 3)
    q, s = scaled(groups, name, axis=(-2, -1), power_of_two=power_of_two)
    restored = (decode(q, name) * s).transpose(0, 2, 1, 3).reshape(x.shape)
    return restored, s[..., 0, 0]


class DelayedScale:
    """Transparent history envelope; first call bootstraps from current amax."""
    def __init__(self, window=3, margin=0, name="e4m3"):
        if window < 1 or margin < 0:
            raise ValueError("Use a positive window and nonnegative margin")
        self.window, self.margin, self.name = window, margin, name
        self.history = deque(maxlen=window)

    def step(self, values):
        x = np.asarray(values, dtype=np.float64)
        if x.size == 0 or not np.all(np.isfinite(x)):
            raise ValueError("Use a nonempty finite tensor")
        amax = float(np.max(np.abs(x)))
        reference = max(self.history) if self.history else amax
        s = (2.0 ** self.margin * reference / GRIDS[self.name][-1]) if reference else 1.0
        q = encode(x / s, self.name)
        result = {"amax": amax, "history_before": list(self.history), "scale": s,
                  "clipped": int(np.sum(np.abs(x / s) > GRIDS[self.name][-1]))}
        self.history.append(amax)
        return decode(q, self.name) * s, result

    def state(self):
        return {"window": self.window, "margin": self.margin, "name": self.name,
                "history": list(self.history)}

    @classmethod
    def restore(cls, state):
        obj = cls(state["window"], state["margin"], state["name"])
        obj.history.extend(state["history"])
        return obj


def matmul(a, b, name_a="e4m3", name_b="e4m3"):
    """Quantized operands, dequantized before a float32 CPU product."""
    ah = roundtrip(a, name_a).astype(np.float32)
    bh = roundtrip(b, name_b).astype(np.float32)
    return ah @ bh


def block_matmul(a, b, group_size=2):
    """Each row/column K-group has its own scale; compensate each partial sum."""
    a, b = np.asarray(a), np.asarray(b)
    if a.shape[1] != b.shape[0] or a.shape[1] % group_size:
        raise ValueError("Matching K must be divisible by group_size")
    out = np.zeros((a.shape[0], b.shape[1]), dtype=np.float32)
    for start in range(0, a.shape[1], group_size):
        aq, sa = scaled(a[:, start:start + group_size], axis=1)
        bq, sb = scaled(b[start:start + group_size], axis=0)
        partial = decode(aq).astype(np.float32) @ decode(bq).astype(np.float32)
        out += partial * (sa * sb).astype(np.float32)
    return out


def update_trace(update=0.01, steps=12):
    """Hold the incoming update fixed: isolate storage, not training feedback."""
    master, low = np.float32(1.0), np.float32(1.0)
    rows = [{"step": 0, "master": float(master), "copy": 1.0, "stored_fp8": 1.0}]
    for step in range(1, steps + 1):
        master = np.float32(master - np.float32(update))
        low = np.float32(quantize(np.float32(low - np.float32(update))))
        rows.append({"step": step, "master": float(master),
                     "copy": float(quantize(master)), "stored_fp8": float(low)})
    return rows


def loss_scale_example(gradient=1e-8, multiplier=1024.0):
    """A scalar FP16 storage example; unscale in FP32 before clipping/updating."""
    if multiplier <= 0 or not np.isfinite(multiplier):
        raise ValueError("Loss multiplier must be finite and positive")
    direct = np.float16(gradient)
    scaled_gradient = np.float16(gradient * multiplier)
    recovered = np.float32(scaled_gradient) / np.float32(multiplier)
    return {"direct_fp16": float(direct), "scaled_fp16": float(scaled_gradient),
            "unscaled_fp32": float(recovered)}


def step_cost(matmul_fraction=0.8, kernel_speedup=2.0, cast_overhead=0.05):
    """Assumed fraction of the ORIGINAL step; no measured hardware performance."""
    if not (0 <= matmul_fraction <= 1 and kernel_speedup > 0 and cast_overhead >= 0):
        raise ValueError("Require fraction in [0,1], positive speedup, nonnegative overhead")
    ratio = 1 - matmul_fraction + matmul_fraction / kernel_speedup + cast_overhead
    return {"new_time_over_old": ratio, "speedup": 1 / ratio}


def main():
    x = np.array([1.0625, 1.1875, -1.1875, 2.0 ** -10, 500.0])
    print("codes", encode(x).tolist())
    print("rounded", quantize(x).tolist())
    tiny = np.array([0.0, 0.001, 0.002, 0.004])
    q, s = scaled(tiny)
    print("scale", float(s.squeeze()), "recovered", (decode(q) * s).tolist())
    delay = DelayedScale(window=3)
    for amax in [1, 1, 1, 8, 1, 1, 1, 1]:
        _, row = delay.step(np.array([amax, amax / 10]))
        print(json.dumps(row))
    print("updates", json.dumps(update_trace()[:5]))
    print("loss scale", json.dumps(loss_scale_example()))
    print("assumed step", json.dumps(step_cost()))


if __name__ == "__main__":
    main()
