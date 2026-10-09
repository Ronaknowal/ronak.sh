"""Read saved NMF arrays and decoded programs; no imports of models or fitting."""
from pathlib import Path
import hashlib
import json
import math
import re

ROOT = Path(__file__).resolve().parents[4]
OWNER = Path(__file__).resolve().parent

def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def shape(value):
    if not isinstance(value, list):
        return type(value).__name__
    return [len(value)] + (shape(value[0]) if value and isinstance(value[0], list) else [])

example_text = (ROOT / "src/learn/data/nmf-examples.js").read_text(encoding="utf-8")
examples = json.loads(example_text[example_text.index("{", example_text.index("export const")):].rstrip().removesuffix(";"))
old_native = json.loads((ROOT / "docs/teaching/evidence/nmf-native.json").read_text(encoding="utf-8"))
programs = {}
for key, item in examples.items():
    prior = old_native["programs"][key]
    programs[key] = {"file": item["file"], "decodedCodeSha256": digest(item["code"]),
                     "decodedExpectedSha256": digest(item["expected"]),
                     "oldDecodedCodeExact": digest(item["code"]) == prior["codeHash"],
                     "oldDecodedOutputExact": item["expected"] == prior["stdout"]}

data_text = (ROOT / "src/learn/data/nmf-data.js").read_text(encoding="utf-8")
exports = {name: json.loads(raw) for name, raw in re.findall(r"export const (\w+) = (\{.*\});", data_text)}
dig = exports["NMF_DIGITS"]
report = {"programs": programs, "savedExportKeys": {key: list(value) for key, value in exports.items()},
          "digitArrayRoles": {key: shape(value) for key, value in dig.items()},
          "limits": "Pure saved-array inspection only; no scientific main, fit, transform or historical checker executed."}

# Locate arrays by their actual saved keys, rather than guessing another source schema.
report["digitNestedRoles"] = {key: {inner: shape(value) for inner, value in entry.items()}
                              for key, entry in dig.items() if isinstance(entry, dict)}
# Independent small new scalars: constrained versus clipped least squares, missing versus measured zero.
report["newSuppliedArithmetic"] = {
    "clipUnconstrained": {"H": [[1, 0], [1, 1]], "x": [0, 1], "unconstrained": [-1, 1],
                          "clipped": [0, 1], "clippedHalfLoss": .5,
                          "nnls": [0, .5], "nnlsHalfLoss": .25},
    "missingVersusZero": {"H": [1, 1], "x": [2, 0], "measuredZeroAmount": 1,
                          "measuredZeroHalfLoss": 1, "secondMissingAmount": 2,
                          "secondMissingMaskedHalfLoss": 0},
    "gain3": {"frobeniusScale": 9, "klScale": 3, "isScale": 1},
}
assert all(v["oldDecodedCodeExact"] and v["oldDecodedOutputExact"] for v in programs.values())
out = OWNER / "saved-input-inspection.json"
assert not out.exists(), "Preserve first inspection receipt"
out.write_text(json.dumps(report, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False))
