"""Current weighted programme checks; never writes historical receipts."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import runpy
import sys
from datetime import datetime, timezone

sys.path.append(str(Path("scratch/lesson-tools/Lib/site-packages").resolve()))
import numpy as np
import sklearn

programme = Path("public/learn-code/linear-logistic-regression/weighted-least-squares.py")
source_hash = hashlib.sha256(programme.read_bytes()).hexdigest()
module = runpy.run_path(str(programme))
fit = module["weighted_least_squares"]
output = io.StringIO()
with contextlib.redirect_stdout(output):
    module["main"]()

x = np.arange(4, dtype=float)
y = np.array([1., 2., 2., 4.])
rows = []
for final_weight in [0., .25, 1.]:
    importance = np.array([1., 1., 1., final_weight])
    coefficients, mse, rank = fit(x, y, importance)
    design = np.column_stack((np.ones(4), x))
    gradient_balance = design.T @ (importance * (y - design @ coefficients))
    np.testing.assert_allclose(gradient_balance, 0, atol=2e-12)
    rows.append({"importanceD": final_weight, "coefficients": coefficients.tolist(),
                 "weightedMSE": float(mse), "rank": int(rank),
                 "maximumNormalBalance": float(np.max(np.abs(gradient_balance)))})
invalid_cases = [
    ("zero weights", x, y, np.zeros(4)),
    ("negative weight", x, y, [1., 1., -1., 1.]),
    ("shape mismatch", x, y[:3], np.ones(4)),
    ("not finite", [0., 1., np.inf, 3.], y, np.ones(4)),
    ("rank two target", x, y[:, None], np.ones(4)),
]
rejections = []
for name, inputs, targets, weights in invalid_cases:
    try:
        fit(inputs, targets, weights)
    except ValueError:
        rejections.append(name)
    else:
        raise AssertionError("Invalid case was accepted: " + name)
try:
    fit([0., 0.], [1e308, -1e308], [1., 1.])
except (FloatingPointError, np.linalg.LinAlgError):
    rejections.append("finite inputs with unrepresentable squared residual objective")
else:
    raise AssertionError("Unrepresentable residual objective was accepted")
assert hashlib.sha256(programme.read_bytes()).hexdigest() == source_hash
receipt = {
    "checkedAt": datetime.now(timezone.utc).isoformat(),
    "scope": "Author actual CPU execution of the new complete weighted fit; no fits or rewritten receipts for unchanged original programmes",
    "source": str(programme).replace("\\", "/"), "sha256": source_hash,
    "versions": {"python": sys.version.split()[0], "numpy": np.__version__,
                 "sklearn": sklearn.__version__},
    "stdout": output.getvalue(), "weightedCases": rows, "rejectedCases": rejections,
    "programmeMain": "scratch/library parity, all-one null, zero-row weight, common-scale including 1e308, rank-deficient prediction checks passed",
}
folder = Path("docs/teaching/classical-ml-reading-flow/linear-logistic-regression")
suffix = sys.argv[1] if len(sys.argv) > 1 else receipt["checkedAt"].replace(":", "-")
path = folder / ("reading-flow-weighted-native-" + suffix + ".json")
path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"weightedCases": len(rows), "rejectedCases": len(rejections),
                  "programmeMain": "passed"}))
