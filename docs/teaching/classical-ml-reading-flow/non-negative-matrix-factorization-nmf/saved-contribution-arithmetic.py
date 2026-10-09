"""New descriptive calculation on the already-saved fitted arrays; never refit."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[4]
OWNER = Path(__file__).resolve().parent
text = (ROOT / "src/learn/data/nmf-data.js").read_text(encoding="utf-8")
dig = json.loads(re.search(r"export const NMF_DIGITS = (\{.*\});", text).group(1))
H = dig["dictionary"]
rows = []
for i in (0, 1):
    observed = dig["test"][i]
    w = dig["activations"][i]
    contribution = [[amount * value for value in h] for amount, h in zip(w, H)]
    totals = [sum(row) for row in contribution]
    recon = [sum(column) for column in zip(*contribution)]
    rows.append({"index": i, "observedKeys": list(observed), "sourceRow": observed.get("sourceRow"),
                 "largestCoefficientOneBased": 1+max(range(len(w)), key=w.__getitem__),
                 "largestTotalContributionOneBased": 1+max(range(len(w)), key=totals.__getitem__),
                 "coefficient": w, "contributionSum": totals, "reconstructedMaximum": max(recon)})
disagreements = sum(max(range(8), key=w.__getitem__) != max(range(8), key=lambda r: w[r]*sum(H[r]))
                    for w in dig["activations"])
result = {"scope": "Saved H/W multiplication and sums only, no fit or transform",
          "rows": rows, "coefficientVsContributionDisagreements": disagreements,
          "ofRows": len(dig["activations"])}
destination = OWNER / "saved-contribution-arithmetic.json"
assert not destination.exists()
destination.write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
print(json.dumps(result))
