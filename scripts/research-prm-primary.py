"""Retrieve bounded primary research bytes; no package install or model fit."""
import base64
import hashlib
import json
from pathlib import Path
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm/research/primary"
OUT.mkdir(parents=True, exist_ok=True)
records = []


def save_records():
    (OUT / "retrieval-progress.json").write_text(json.dumps({"retrieved": "2026-10-07", "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), "records": records}, indent=2) + "\n", encoding="utf8")


def fetch(url, filename, headers=None):
    target = OUT / filename
    if target.exists():
        data = target.read_bytes()
        records.append({"url": url, "path": filename, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "scope": "Retained exact bytes from earlier successful retrieval; original HTTP headers were not retained before the later source-path failure"})
        save_records()
        return data
    request = urllib.request.Request(url, headers={"User-Agent": "Portfolio-lesson-research", **(headers or {})})
    with urllib.request.urlopen(request, timeout=30) as response:
        data = response.read()
        status = response.status
        final_url = response.url
    target.write_bytes(data)
    records.append({"url": url, "resolved_url": final_url, "status": status, "path": filename, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    save_records()
    print(json.dumps({"saved": filename, "bytes": len(data)}), flush=True)
    return data


commit = json.loads(fetch("https://api.github.com/repos/openai/prm800k/commits/main", "prm800k-commit.json"))["sha"]
for name in ["LICENSE", "README.md"]:
    fetch(f"https://raw.githubusercontent.com/openai/prm800k/{commit}/{name}", "prm800k-" + name)
files = json.loads(fetch(f"https://api.github.com/repos/openai/prm800k/contents/prm800k/data?ref={commit}", "prm800k-data-files.json"))
for item in files:
    if item["name"] in ["phase2_train.jsonl", "phase2_test.jsonl"]:
        pointer = fetch(item["download_url"], "prm800k-" + item["name"] + ".lfs")
        # Request a bounded byte range. If a host ignores Range, stop after the
        # bound anyway; no claim is made to have validated the whole LFS blob.
        url = f"https://media.githubusercontent.com/media/openai/prm800k/{commit}/prm800k/data/{item['name']}"
        request = urllib.request.Request(url, headers={"User-Agent": "Portfolio-lesson-research", "Range": "bytes=0-2097151"})
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read(2097152)
            status = response.status
            content_range = response.headers.get("Content-Range")
        complete_lines = data[:data.rfind(b"\n") + 1]
        target = "prm800k-" + item["name"] + ".prefix"
        target_path = OUT / target
        if target_path.exists():
            assert target_path.read_bytes() == complete_lines, "Changed pinned prefix bytes"
        else:
            target_path.write_bytes(complete_lines)
        records.append({"url": url, "path": target, "status": status, "content_range": content_range, "bytes": len(complete_lines), "complete_rows": len(complete_lines.splitlines()), "sha256": hashlib.sha256(complete_lines).hexdigest(), "scope": "Only complete JSONL rows within the first 2 MiB; full remote LFS hash is metadata, not independently validated"})
        save_records()
        print(json.dumps({"saved": target, "rows": len(complete_lines.splitlines())}), flush=True)
instructions = json.loads(fetch(f"https://api.github.com/repos/openai/prm800k/contents/prm800k/instructions?ref={commit}", "prm800k-instruction-files.json"))
for item in instructions:
    if item["name"].endswith((".md", ".txt", ".pdf")):
        fetch(item["download_url"], "prm800k-instructions-" + item["name"])
release = json.loads(fetch("https://api.github.com/repos/huggingface/trl/releases/latest", "trl-latest-release.json"))
tag = release["tag_name"]
tree = json.loads(fetch(f"https://api.github.com/repos/huggingface/trl/git/trees/{tag}?recursive=1", "trl-" + tag + "-tree.json"))
prm_paths = [item["path"] for item in tree["tree"] if item["path"].endswith(("prm_trainer.py", "prm_config.py"))]
for name in prm_paths:
    fetch(f"https://raw.githubusercontent.com/huggingface/trl/{tag}/{name}", "trl-" + tag + "-" + Path(name).name)
print(json.dumps({"trl_release": tag, "actual_prm_source_paths": prm_paths}), flush=True)
fetch("https://huggingface.co/datasets/Qwen/ProcessBench/raw/main/README.md", "processbench-README.md")
(OUT / "retrieval.json").write_text(json.dumps({"retrieved": "2026-10-07", "prm800k_commit": commit, "trl_release": tag, "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), "records": records}, indent=2) + "\n", encoding="utf8")
