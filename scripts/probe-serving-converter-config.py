"""One config-only compatibility probe after reviewed private dependency setup."""
import hashlib
import json
import sys
import traceback
from pathlib import Path

root = Path(__file__).resolve().parents[1]
base = root / "scratch/inference-engines-research"
topic = root / "docs/teaching/llm-architecture-training/inference-engines-serving"
sys.path[:0] = [str(base / "converter-hf457"), str(base / "converter-dependencies"),
               str(root / "scratch/inference-serving-tools")]
report = {"scope": "config only; no model weights or inference"}
try:
    identity = json.loads((topic / "programs/model-source-report.json").read_text())
    checkpoint = root / "scratch/sft-research/pythia-14m"
    for item in identity["files"]:
        data = (checkpoint / item["name"]).read_bytes()
        assert len(data) == item["bytes"]
        assert hashlib.sha256(data).hexdigest() == item["sha256"]
    import transformers
    import tokenizers
    import huggingface_hub
    from transformers import AutoConfig

    report["versions"] = {"transformers": transformers.__version__,
                          "tokenizers": tokenizers.__version__,
                          "huggingface_hub": huggingface_hub.__version__}
    assert report["versions"] == {"transformers": "4.57.6", "tokenizers": "0.22.2",
                                  "huggingface_hub": "0.36.2"}
    config = AutoConfig.from_pretrained(checkpoint, local_files_only=True,
                                        trust_remote_code=False).to_dict()
    report["config"] = config
    expected = {"rotary_pct": 0.25, "hidden_size": 128, "num_attention_heads": 4,
                "num_hidden_layers": 6, "intermediate_size": 512,
                "use_parallel_residual": True, "layer_norm_eps": 1e-5}
    report["expected"] = expected
    assert all(config[key] == value for key, value in expected.items())
    report["status"] = "passed"
except Exception:
    report["status"] = "failed"
    report["error"] = traceback.format_exc()
target = base / "preflight/config-hf457.json"
with target.open("x", encoding="utf8") as handle:
    json.dump(report, handle, indent=2)
    handle.write("\n")
print(json.dumps({key: value for key, value in report.items() if key != "config"}, indent=2))
raise SystemExit(0 if report["status"] == "passed" else 1)
