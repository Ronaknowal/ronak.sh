"""Retain exact primary research bytes; no model training or installations."""
import hashlib
import json
import pathlib
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods/research/primary"
DEST.mkdir(parents=True, exist_ok=True)
SOURCES = {
    "ipo-aistats-2024.pdf": "https://proceedings.mlr.press/v238/gheshlaghi-azar24a/gheshlaghi-azar24a.pdf",
    "orpo-emnlp-2024.pdf": "https://aclanthology.org/2024.emnlp-main.626.pdf",
    "rlaif-v2.html": "https://arxiv.org/html/2309.00267v2",
    "trl-v1.14.2-dpo-trainer.py": "https://raw.githubusercontent.com/huggingface/trl/v1.14.2/trl/trainer/dpo_trainer.py",
    "trl-v1.14.2-dpo-config.py": "https://raw.githubusercontent.com/huggingface/trl/v1.14.2/trl/trainer/dpo_config.py",
    "trl-v1.14.2-orpo-trainer.py": "https://raw.githubusercontent.com/huggingface/trl/v1.14.2/trl/experimental/orpo/orpo_trainer.py",
    "trl-v1.14.2-orpo-config.py": "https://raw.githubusercontent.com/huggingface/trl/v1.14.2/trl/experimental/orpo/orpo_config.py",
}
records = []
for name, url in SOURCES.items():
    target = DEST / name
    if target.exists():
        raise RuntimeError(f"Preserve retained source: {target}")
    request = urllib.request.Request(url, headers={"User-Agent": "lesson-authoring-primary-research/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            body = response.read()
            status = response.status
            content_type = response.headers.get("Content-Type")
        target.write_bytes(body)
        records.append({"name": name, "url": url, "status": status, "contentType": content_type, "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()})
    except (urllib.error.URLError, TimeoutError) as error:
        records.append({"name": name, "url": url, "error": str(error), "retained": False})
receipt = DEST / "retrieval.json"
if receipt.exists():
    raise RuntimeError("Preserve original retrieval receipt")
receipt.write_text(json.dumps({"sources": records, "scope": "Exact primary bytes; downloading does not certify reading."}, indent=2) + "\n", encoding="utf-8")
print(receipt.read_text(encoding="utf-8"))
