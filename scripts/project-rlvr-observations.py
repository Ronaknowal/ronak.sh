"""Project unchanged recorded observations, without models or scientific replay.

Each run loads only when selected. Repeated prefix IDs are replaced by a record
address; their exact reconstruction is checked for every response. All remaining
fields and every seed/arm/step/evaluation/sample are retained without rounding.
"""
import copy
import hashlib
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards"
OBS = DOC / "scientific-evidence/observations"
OUT = ROOT / "public/learn-assets/rlvr"
OUT.mkdir(parents=True, exist_ok=True)
inputs, outputs = {}, {}


def read(path):
    raw = path.read_bytes()
    inputs[str(path.relative_to(ROOT)).replace("\\", "/")] = hashlib.sha256(raw).hexdigest()
    return json.loads(raw)


def write(name, value):
    raw = (json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
    (OUT / name).write_bytes(raw)
    outputs[name] = {"sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}


records = read(ROOT / "public/learn/examples/rlvr/records.json")
index = {row["id"]: row for split in records.values() for row in split}
write("records.json", records)
tiny = read(OBS / "tiny-study.json")
metrics = read(OBS / "metrics.json")
prefix_checks = 0


def compact_sample(sample):
    global prefix_checks
    prefix = [258, *(
        index[sample["record_id"]]["question"]
        + "\nGive the final numeric answer as #### number.\n"
    ).encode("utf-8"), 259]
    assert sample["prefix_ids"] == prefix
    compact = {key: value for key, value in sample.items() if key != "prefix_ids"}
    reconstructed = dict(compact, prefix_ids=prefix)
    assert reconstructed == sample
    prefix_checks += 1
    return compact


run_index = []
for run in tiny["runs"]:
    address = f"{run['seed']}-{run['arm']}"
    training = copy.deepcopy({key: value for key, value in run.items() if key != "evaluations"})
    for step in training["steps"]:
        step["samples"] = [compact_sample(sample) for sample in step["samples"]]
    evaluations = copy.deepcopy(run["evaluations"])
    for evaluation in evaluations:
        for row in evaluation["records"]:
            row["samples"] = [compact_sample(sample) for sample in row["samples"]]
    write(f"train-{address}.json", training)
    write(f"eval-{address}.json", evaluations)
    run_index.append({key: run[key] for key in ["seed", "arm", "start_sha256", "reference_sha256", "final_sha256", "optimizer_updates"]})
write("study-index.json", {"protocol": tiny["protocol"], "versions": tiny["versions"], "warm_runs": tiny["warm_runs"], "runs": run_index})
write("metrics.json", metrics)
generator = random.Random(11)
# The literal original simulator's 24 × (1 task + 4 Bernoulli) uniform tape.
# No model, fit or scientific run: browser finite edits use this fixed tape.
write("mechanisms.json", {"finiteUniformTape": [generator.random() for _ in range(120)], "math": read(OBS / "math-verify.json"), "groups": read(OBS / "groups.json"), "noise": read(OBS / "noise.json"), "verifier": read(OBS / "verifier.json")})
write("flan.json", read(OBS / "flan.json"))
events = [json.loads(line) for line in (ROOT / "scratch/rlvr/study/trl/events.jsonl").read_text(encoding="utf-8").splitlines()]
event_path = ROOT / "scratch/rlvr/study/trl/events.jsonl"
inputs[str(event_path.relative_to(ROOT)).replace("\\", "/")] = hashlib.sha256(event_path.read_bytes()).hexdigest()
native = {"events": [{"kind": row["kind"], "observation": row["observation"]} for row in events if row["kind"].startswith("native-") or row["kind"] == "stage-failed"],
          "inspection": read(DOC / "scientific-evidence/native-failure-inspection.json"),
          "alignment": read(DOC / "scientific-evidence/native-score-alignment.json"),
          "continuation": read(DOC / "scientific-evidence/native-continuation.json"),
          "protocol": read(ROOT / "public/learn/examples/rlvr/protocol.json")["native"]}
write("native.json", native)
assert prefix_checks == 6912
receipt = {"scope": "Exact JSON projection and repeated-prefix reconstruction only; no scientific computation", "passed": True, "prefix_reconstruction_checks": prefix_checks, "inputs": inputs, "outputs": outputs, "total_runtime_bytes": sum(row["bytes"] for row in outputs.values()), "largest_request_bytes": max(row["bytes"] for row in outputs.values())}
(DOC / "runtime-data-projection.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: receipt[key] for key in ["passed", "prefix_reconstruction_checks", "total_runtime_bytes", "largest_request_bytes"]}))
