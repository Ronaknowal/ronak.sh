"""Different-review scalar, corpus and saved-result checks; no training replay."""
import hashlib
import json
from pathlib import Path
import sys
import numpy as np

root = Path(__file__).resolve().parents[1]
programs = root / "public/learn-code/fp8-training"
folder = root / "docs/teaching/llm-architecture-training/fp8-training-low-precision-pre-training"
sys.path.insert(0, str(programs))
import fp8_formats as f

checks = []
assert float(f.decode([0b10111011])[0]) == -1.375
assert f.encode([-1.1875]).tolist() == [186]
np.testing.assert_array_equal(f.quantize([1.0625, 1.1875, 2**-10]), [1, 1.25, 0])
checks.append("Signed encoding and both midpoint parities agree with stated examples")
x = np.array([[1., 2., 3.]])
w = np.array([[2., -1., .5], [0., 1., 1.]])
g = np.array([[.1, -.2]])
np.testing.assert_allclose(g @ w, [[.2, -.3, -.15]])
np.testing.assert_allclose(g.T @ x, [[.1, .2, .3], [-.2, -.4, -.6]])
checks.append("Independently recomputed both displayed backward products")
assert 3*.25 + (-2)*4 == -7.25
np.testing.assert_allclose(1 / (.2+.8/2+.05), 1/.65)
np.testing.assert_allclose(1 / (.6+.4/2+.25), 1/1.05)
assert round(7689.5/6150, 2) == 1.25
checks.append("Block contributions, speedup/slowdown and external-table ratio recomputed")
train = (programs / "alice-train.txt").read_text(encoding="utf-8")
test = (programs / "alice-heldout.txt").read_text(encoding="utf-8")
vocab = set(train)
assert len(vocab) == 63 and len(train)-4 == 8527
assert sum(c in vocab for c in test[4:]) == 1912
assert sum(c not in vocab for c in test[4:]) == 1
checks.append("Actual text independently reproduces vocabulary, target and exclusion counts")
study = json.loads((folder / "cpu-study.json").read_text(encoding="utf-8"))
expected = {(17, "fp32"): [2.232713,2.350832,2.350832],
            (17, "custom"): [2.233724,2.349077,2.351113],
            (29, "fp32"): [2.232558,2.377852,2.377852],
            (29, "custom"): [2.234081,2.376666,2.377815]}
for key, values in expected.items():
    row = next(r for r in study["records"] if (r["seed"],r["mode"]) == key)
    endpoint = row["curve"][-1]
    np.testing.assert_allclose([endpoint[k] for k in ["train_nll","heldout_nll","heldout_fp32_nll"]], values, rtol=0, atol=.00000051)
for seed in [17,29]:
    rows = {r["mode"]:r for r in study["records"] if r["seed"] == seed}
    assert rows["custom"]["curve"] == rows["torchao"]["curve"]
checks.append("All displayed study endpoints reproduce saved measurements; custom/library curves equal")
paths = list(programs.glob("*")) + [folder / "fp8-training.jsx", folder / "cpu-study.json", Path(__file__)]
result = {"reviewer":"root", "checks":checks,
          "hashes":{str(p.relative_to(root)).replace("\\","/"):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths if p.is_file()},
          "limits":"Independent scalar/corpus/result audit, not a second training run or GPU execution. Runtime and actual paint remain pending."}
with (folder / "root-content-checks.json").open("x", encoding="utf-8") as out:
    json.dump(result,out,indent=2)
print(json.dumps({"passed":len(checks),"limits":result["limits"]}))
