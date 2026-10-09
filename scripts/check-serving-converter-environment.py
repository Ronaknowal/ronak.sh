"""Inspect dependencies and frozen source identities; never load model weights."""
import hashlib
import json
import sys
import traceback
from pathlib import Path

root = Path(__file__).resolve().parents[1]
base = root / "scratch/inference-engines-research"
acquisition = json.loads((base / "artifacts/acquisition.json").read_text())
source = Path(acquisition["source_root"])
sys.path[:0] = [
    str(base / "converter-dependencies"),
    str(root / "scratch/inference-serving-tools"),
    str(source),
    str(source / "gguf-py"),
]
report = {"scope": "dependency imports only; no model/tokenizer/config loaded"}
try:
    import torch
    import numpy
    import transformers
    import sentencepiece
    import google.protobuf
    import requests
    import yaml
    import tqdm
    from conversion import get_model_class

    model_class = get_model_class("GPTNeoXForCausalLM")
    report["versions"] = {
        "torch": torch.__version__,
        "numpy": numpy.__version__,
        "transformers": transformers.__version__,
        "sentencepiece": sentencepiece.__version__,
        "protobuf": google.protobuf.__version__,
        "requests": requests.__version__,
        "pyyaml": yaml.__version__,
        "tqdm": tqdm.__version__,
    }
    report["class"] = model_class.__name__
    report["status"] = "passed"
except Exception:
    report["status"] = "failed"
    report["error"] = traceback.format_exc()
report["script_sha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
report["qualification"] = (
    "Accepted protocol permits reusing compatible dependencies. This environment "
    "does not claim the converter requirements' exact Torch 2.11.0, NumPy 2.2.x "
    "or Transformers 4.57.6 pins. Successful imports do not establish conversion."
)
target = base / "preflight/dependency-final.json"
with target.open("x", encoding="utf8") as handle:
    json.dump(report, handle, indent=2)
    handle.write("\n")
print(json.dumps(report, indent=2))
raise SystemExit(0 if report["status"] == "passed" else 1)
