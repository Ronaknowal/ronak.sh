"""Copy retained observations and complete programs; no model execution."""
import hashlib
import json
import re
import shutil
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
topic = root / "docs/teaching/llm-architecture-training/inference-engines-serving"
study = root / "scratch/inference-engines-research"
public = root / "public/learn/examples/inference-engines"
public.mkdir(parents=True, exist_ok=True)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text(encoding="utf8"))


sources = []
for path in sorted((topic / "programs").iterdir()):
    if path.is_file():
        source = topic / "learner-README.md" if path.name == "README.md" else path
        shutil.copyfile(source, public / path.name)
        sources.append(source)
native = read(study / "study/native/result.json")
finite = read(study / "study/finite/result.json")
conversion = read(study / "study/conversion-hf457/conversion.json")
assert native["status"] == "passed" and native["generation_attempts"] == 4
assert native["owned_process_terminated"] is True
assert finite["status"] == "passed" and len(finite["cases"]) == 146
assert conversion["status"] == "passed"
checks = []
rows = []
for request in native["requests"]:
    result = request["result"]
    raw_path = study / "study/native" / request["id"] / "raw.bin"
    raw = raw_path.read_bytes()
    # Independent raw-record reconstruction of the actual LF-framed native data.
    records = []
    for block in raw.decode("utf8").split("\n\n"):
        if not block.strip():
            continue
        data = "\n".join(line[6:] if line.startswith("data: ") else line[5:]
                         for line in block.splitlines() if line.startswith("data:"))
        records.append(json.loads(data))
    assert records == [event["data"] for event in result["events"]]
    nonterminal = [record for record in records if not record["stop"]]
    terminals = [record for record in records if record["stop"]]
    assert len(nonterminal) == 16 and len(terminals) == 1
    assert all(len(record["tokens"]) == 1 for record in nonterminal)
    ids = [token for record in nonterminal for token in record["tokens"]]
    assert ids == result["nonterminal_token_ids"]
    assert terminals[0]["tokens"] == result["terminal_token_ids"] == []
    assert "".join(record["content"] for record in records) == result["assembled_content"]
    terminal = terminals[0]
    assert terminal["tokens_predicted"] == len(ids) == 16
    assert terminal["stop_type"] == "limit"
    assert terminal["generation_settings"]["samplers"] == ["temperature"]
    assert terminal["generation_settings"]["temperature"] == 0
    assert terminal["generation_settings"]["seed"] == 0
    assert terminal["timings"]["cache_n"] == 0
    input_ids = [entry["id"] for entry in request["tokenization"]["tokens"]]
    assert input_ids == request["payload"]["prompt"]
    assert terminal["tokens_evaluated"] == len(input_ids)
    assert terminal["tokens_cached"] == len(input_ids) + 15
    assert result["first_content_seconds"] <= result["terminal_seconds"] <= result["connection_end_seconds"]
    assert result["raw_bytes"] == len(raw)
    assert not result["partial_event"]
    checks.append({"id": request["id"], "raw_records_exact": True, "ids_exact": True,
                   "settings_exact": True, "clock_order": True, "cached_rows_exact": True})
    rows.append({"id": request["id"], "prompt": request["text"], "input_ids": input_ids,
                 "output_ids": ids, "output": result["assembled_content"],
                 "first_content_seconds": result["first_content_seconds"],
                 "terminal_seconds": result["terminal_seconds"],
                 "connection_end_seconds": result["connection_end_seconds"],
                 "events": result["events"], "terminal": terminal,
                 "raw_bytes": len(raw), "raw_sha256": digest(raw_path)})

observations = {
    "schema": 1, "scope": "One finite campaign and four sequential native functional probes; no quality or performance benchmark.",
    "finite": finite, "native": {"requests": rows, "command": native["command"],
        "platform": native["platform"], "generation_attempts": 4,
        "owned_process_terminated": native["owned_process_terminated"],
        "server_final_exit_code": native["server_final_exit_code"],
        "termination_note": "Windows supervisor termination followed by wait; final code1 is not a claimed graceful engine exit."},
    "conversion": conversion,
    "original_conversion_failure": read(study / "study/conversion/conversion.json"),
    "environment": read(study / "preflight/config-hf457.json"),
    "gguf_inventory": read(study / "preflight/gguf-inventory.json"),
    "native_properties": native["props"],
    "native_models": native["models"],
    "measurement_limits": ["One-byte client instrumentation affects receipt clocks.",
        "Actual events here each carry one ID, but no server production-token timing is inferred.",
        "All terminal token arrays are empty; none is added again.",
        "No native cancellation, concurrency, cache-hit, quality, GPU or tail-latency test."],
}
evidence = public / "evidence"
evidence.mkdir(exist_ok=True)
(evidence / "observations.json").write_text(json.dumps(observations, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
copies = [(study / "study/finite/result.json", "finite-result.json"),
          (study / "study/finite/events.jsonl", "finite-journal.jsonl"),
          (study / "study/conversion/conversion.json", "conversion-failed.json"),
          (study / "study/conversion/stderr.txt", "conversion-failed.stderr.txt"),
          (study / "study/conversion-hf457/conversion.json", "conversion-passed.json"),
          (study / "study/conversion-hf457/stderr.txt", "conversion-passed.stderr.txt"),
          (study / "preflight/config-hf457.json", "config-hf457.json"),
          (study / "preflight/dependency-final.json", "initial-environment.json"),
          (study / "preflight/gguf-inventory.json", "gguf-inventory.json")]
for request in native["requests"]:
    for name in ["raw.bin", "result.json"]:
        copies.append((study / "study/native" / request["id"] / name, f"native-{request['id']}-{name}"))
for source, name in copies:
    if not source.is_file():
        raise FileNotFoundError(source)
    shutil.copyfile(source, evidence / name)
    sources.append(source)
for path in [study / "study/native/result.json", study / "study/conversion-hf457/conversion.json",
             study / "study/finite/result.json", study / "study/conversion/conversion.json",
             study / "preflight/config-hf457.json"]:
    sources.append(path)
receipt = {"script": str(Path(__file__).relative_to(root)).replace("\\", "/"),
           "script_sha256": digest(Path(__file__)), "passed": True,
           "source_files": {str(path.relative_to(root)).replace("\\", "/"): digest(path) for path in sources},
           "independent_reconstruction": checks,
           "observations_sha256": digest(evidence / "observations.json")}
(topic / "content-projection.json").write_text(json.dumps(receipt, indent=2) + "\n")
print(json.dumps({"finite_cases": len(finite["cases"]), "native_rows": len(rows),
                  "observations_bytes": (evidence / "observations.json").stat().st_size}))
