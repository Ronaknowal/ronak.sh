"""Source-bound FP8 numerical checks. Run with pinned torchao on PYTHONPATH."""
import ast
import hashlib
import json
from pathlib import Path
import sys
import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[1]
PROGRAMS = ROOT / "public/learn-code/fp8-training"
DOCS = ROOT / "docs/teaching/llm-architecture-training/fp8-training-low-precision-pre-training"
sys.path.insert(0, str(PROGRAMS))
import fp8_formats as f
import fp8_linear as linear

checks = []
for path in PROGRAMS.glob("*.py"):
    ast.parse(path.read_text(encoding="utf-8"))
checks.append("All four complete programs parse")
for name, dtype in [("e4m3", torch.float8_e4m3fn), ("e5m2", torch.float8_e5m2)]:
    codes = np.arange(256, dtype=np.uint8)
    actual = torch.from_numpy(codes).view(dtype).float().numpy()
    decoded = f.decode(codes, name)
    np.testing.assert_allclose(decoded, actual, rtol=0, atol=0, equal_nan=True)
    finite = np.isfinite(actual)
    np.testing.assert_array_equal(f.encode(actual[finite], name), codes[finite])
    grid = f.GRIDS[name]
    midpoint = (grid[1:] + grid[:-1]) / 2
    inputs = np.concatenate([midpoint, -midpoint, [0.0, -0.0, grid[-1] * 2, -grid[-1] * 2]])
    native = torch.tensor(inputs).clamp(-grid[-1], grid[-1]).to(dtype).view(torch.uint8).numpy()
    np.testing.assert_array_equal(f.encode(inputs, name), native)
    assert float(f.current_scale(np.zeros(3), name).squeeze()) == 1
    checks.append(name + ": all256 decodes, every finite encode, all signed midpoint ties, zero and saturation")
np.testing.assert_allclose(f.roundtrip([0, .001, .002, .004]), [0, .001, .002, .004], atol=1e-15)
x = np.ones((4, 4)); x[0, 0] = 100000
row, _ = f.grouped_roundtrip(x, (1, 4))
np.testing.assert_allclose(row[1:], 1)
equal, scales = f.grouped_roundtrip(np.ones((4, 4)), (2, 2))
np.testing.assert_allclose(equal, 1)
assert scales.size == 4
checks.append("Current scale exact-tiny/zero; outlier group isolation and equal-value metadata")
values = [1, 1, 1, 8, 1, 1, 1, 1]
d = f.DelayedScale(3)
before = [d.step(np.array([v]))[1] for v in values[:4]]
restored = f.DelayedScale.restore(d.state())
continued = [d.step(np.array([v]))[1] for v in values[4:]]
resumed = [restored.step(np.array([v]))[1] for v in values[4:]]
assert continued == resumed
assert [r["scale"] for r in before + continued] == [1/448]*4 + [8/448]*3 + [1/448]
checks.append("Delayed applied-before-append history and exact checkpoint continuation")
a = np.array([[1., 2., 4., 8.]])
b = np.array([[2.], [1.], [-1.], [.5]])
expected = np.zeros((1, 1), dtype=np.float32)
for k in (0, 2):
    ar = f.roundtrip(a[:, k:k+2], axis=1).astype(np.float32)
    br = f.roundtrip(b[k:k+2], axis=0).astype(np.float32)
    expected += ar @ br
np.testing.assert_allclose(f.block_matmul(a, b), expected, rtol=1e-6)
assert float(f.current_scale([500], power_of_two=True).squeeze()) == 2
checks.append("Grouped-K compensation and upward power-of-two MX-style scale")
trace = f.update_trace()
assert all(row["stored_fp8"] == 1 for row in trace)
assert trace[3]["copy"] == 1 and trace[4]["copy"] == .9375
assert f.loss_scale_example()["direct_fp16"] == 0 and f.loss_scale_example()["unscaled_fp32"] > 0
np.testing.assert_allclose(f.step_cost()["new_time_over_old"], .65)
np.testing.assert_allclose(f.step_cost(.4, 2, .25)["speedup"], 1/1.05)
checks.append("Same-update master trace, loss-scale recovery, speedup and slowdown")
bridge = linear.bridge()
assert all(value < 1e-6 for value in bridge["max_absolute_differences"].values())
checks.append("Actual full NumPy/custom-Torch/official-torchao forward, gradients and SGD bridge")
study = json.loads((DOCS / "cpu-study.json").read_text())
for name, digest in study["hashes"].items():
    assert hashlib.sha256((PROGRAMS / name).read_bytes()).hexdigest() == digest
for seed in study["seeds"]:
    custom, ordinary = [r for mode in ["custom", "torchao"] for r in study["records"] if r["seed"] == seed and r["mode"] == mode]
    assert custom["curve"] == ordinary["curve"]
checks.append("Conserved study exact source/data hashes and two-seed custom/official equality; no retraining")
paths = list(PROGRAMS.glob("*.py")) + [Path(__file__), DOCS / "fp8-training.jsx", DOCS / "cpu-study.json"]
result = {"checks": checks, "torch": torch.__version__, "numpy": np.__version__, "cuda_available": torch.cuda.is_available(),
          "bridge": bridge, "hashes": {str(p.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths},
          "limits": "CPU emulation only. Transformer Engine GPU program parsed and official API inspected, not executed."}
(DOCS / "native-verification.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result, indent=2))
