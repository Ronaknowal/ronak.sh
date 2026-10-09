"""Independent full held-out parity fixture, reusing stored arrays without fitting."""
import hashlib
import json
from pathlib import Path
import sys
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public/learn-code/process-reward-models"
DOCS = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm"
sys.path.insert(0, str(PUBLIC))
from prm_classifier import features, signed_features, softmax, LEXEMES
from prm_search import beam, rank_pool
from prm_rollouts_rewards import policy_leaves, binomial

model = json.loads((PUBLIC / "study/model.json").read_text())
weights, bias = np.array(model["weights"]), np.array(model["bias"])
examples = [json.loads(line) for line in (PUBLIC / "data/test.jsonl").read_text(encoding="utf8").splitlines()]
rows = []
for example in examples:
    vector = features(example)
    rows.append({"example": example, "nonzero": [[i, float(value)] for i, value in enumerate(vector) if value],
                 "probabilities": softmax(vector @ weights + bias).tolist()})
strings = ["a b", "b a", "", "α² + β=٣.٢", "naïve café x_1", "𝟙Ⅳ÷２", "token\nspace"]
report = {
    "fits": 0, "heldout": rows,
    "lexemes": [{"text": text, "tokens": LEXEMES.findall(text), "nonzero": [[i, float(v)] for i, v in enumerate(signed_features(text)) if v]} for text in strings],
    "beam": [beam(width, depth, method) for width in (1, 2) for depth in (0, 1, 2) for method in ("product", "value")],
    "ranking": [rank_pool(count, method) for count in range(10) for method in ("minimum", "mean", "product", "log_product")],
    "policies": [policy_leaves(q, a, b, baseline) for q in (.05, .5, .95) for a, b in ((.1, .9), (.8, .2), (.5, .5)) for baseline in (False, True)],
    "binomial": [{"value": value, "budget": budget, "output": binomial(value, budget)} for value in (0, .1, .5, 1) for budget in (0, 1, 8, 16)],
    "model_sha256": hashlib.sha256((PUBLIC / "study/model.json").read_bytes()).hexdigest(),
}
(DOCS / "runtime-parity-fixture.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
print(json.dumps({"fits": 0, "heldout": len(rows), "lexical_edge_cases": len(strings), "path": "runtime-parity-fixture.json"}))
