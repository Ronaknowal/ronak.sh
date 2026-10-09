"""Extract seven declared measurements; never execute the source notebook."""
import ast
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "scratch/scaling-laws/contours-pinned.ipynb"
raw = source.read_bytes()
expected = "3a8681f105ea1ac1e4063b54e63a901078c5ce12b36947fd96aa24f80ca6bd14"
assert hashlib.sha256(raw).hexdigest() == expected
notebook = json.loads(raw)
values = {}
for cell in notebook["cells"]:
    if cell["cell_type"] != "code":
        continue
    text = "".join(cell["source"])
    if "NAMES_TO_VAL_LOSSES =" not in text:
        continue
    for node in ast.parse(text).body:
        if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
            name = node.targets[0].id
            if name in {"NAMES_TO_VAL_LOSSES", "PARAMS_MAP", "TOKENS_MAP"}:
                values[name] = ast.literal_eval(node.value)

directory = ROOT / "public/learn-code/scaling-laws"
directory.mkdir(parents=True, exist_ok=True)
rows = []
for index, billions in enumerate([4, 8, 12, 16, 24, 32, 40]):
    name = f"2b8{billions}b4b"
    rows.append({"run": name, "parameters": int(values["PARAMS_MAP"]["2b8"]),
                 "tokens": int(billions * 1e9), "unique_tokens": 4000000000,
                 "validation_nats": values["NAMES_TO_VAL_LOSSES"][name],
                 "role": "fit" if index < 5 else "heldout"})
csv_path = directory / "repetition-curve.csv"
with csv_path.open("w", encoding="utf-8", newline="") as stream:
    writer = csv.DictWriter(stream, fieldnames=rows[0].keys(), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
provenance = {
    "authors": "Muennighoff et al., Scaling Data-Constrained Language Models",
    "paper": "https://arxiv.org/abs/2305.16264",
    "source": "https://github.com/huggingface/datablations/blob/13701315b163f1c54642b94ad237b2699187c3ee/plotstables/contours.ipynb",
    "commit": "13701315b163f1c54642b94ad237b2699187c3ee",
    "source_sha256": expected, "repository_license": "Apache-2.0",
    "source_note": "Authors' literal validation losses copied from released-model TensorBoard logs; zero marks unfinished runs.",
    "selection": "All seven plain-name 2b8 models with 4B unique tokens and 4,8,12,16,24,32,40B presentations. No seed/dedup/optimized variants.",
    "parameter_convention": "Exact PARAMS_MAP value 2.81B, not the rounded run-name number.",
    "extraction": "AST literal dictionaries only; downloaded notebook code never executed.",
    "split": "Fit first five token budgets through24B; hold out32B and40B. One fixed model size and unique-data budget cannot identify a joint N,D surface.",
    "csv_sha256": hashlib.sha256(csv_path.read_bytes()).hexdigest(),
}
(directory / "data-provenance.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"rows": rows, "csv_sha256": provenance["csv_sha256"]}, indent=2))
