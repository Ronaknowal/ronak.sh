"""Protect the first content packet, then bind one bounded review successor."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm"
SUCCESSOR = BASE / "content-successor"
EXPECTED = "6ddcd718881f1373898c6075cd16b671a8d68680a739adffcd666163237fff00"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("preserve", "freeze"))
    args = parser.parse_args()
    original = BASE / "content-inputs.json"
    if sha(original) != EXPECTED:
        raise ValueError("Original whole-review packet changed")
    prior = json.loads(original.read_text(encoding="utf8"))
    if args.mode == "preserve":
        if SUCCESSOR.exists():
            raise FileExistsError("Preserve an existing correction boundary")
        SUCCESSOR.mkdir()
        shutil.copyfile(original, SUCCESSOR / "predecessor-inputs.json")
        for relative, expected in prior["files"].items():
            source = ROOT / relative
            if sha(source) != expected:
                raise ValueError(f"Predecessor binding mismatch: {relative}")
            destination = SUCCESSOR / "predecessor" / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
        print(json.dumps({"preserved": len(prior["files"]), "original_packet": EXPECTED}))
        return
    destination = SUCCESSOR / "inputs.json"
    if destination.exists():
        raise FileExistsError("Preserve accepted successor")
    changed = {}
    current = {}
    for relative, expected in prior["files"].items():
        if sha(SUCCESSOR / "predecessor" / relative) != expected:
            raise ValueError(f"Protected original mismatch: {relative}")
        actual = sha(ROOT / relative)
        current[relative] = actual
        if actual != expected:
            changed[relative] = {"before": expected, "after": actual}
    additions = [SUCCESSOR / name for name in ("author-corrections.md", "checks.json")]
    additions.extend(ROOT / "scripts" / name for name in ("freeze-prm-correction.py", "verify-prm-correction.py"))
    additions.append(BASE / "native/search-vote-closure.json")
    additions.append(BASE / "native/search-vote-closure.stdout.json")
    for path in additions:
        current[str(path.relative_to(ROOT)).replace("\\", "/")] = sha(path)
    report = {"author": "multimodal_reviewer", "frozen_at": datetime.now(timezone.utc).isoformat(),
              "scope": "R1–R3 bounded content successor; no scientific fit, runtime or publication",
              "predecessor_packet_sha256": EXPECTED, "predecessor_count": len(prior["files"]),
              "changed": changed, "conserved_count": len(prior["files"]) - len(changed), "files": current}
    destination.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"packet_sha256": sha(destination), "changed": changed, "inputs": len(current)}, indent=2))


if __name__ == "__main__":
    main()
