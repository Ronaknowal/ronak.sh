"""Bounded R1–R3 no-fit closure; conserve the complete previous scientific study."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import shlex
import sys
import zipfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm"
PUBLIC = ROOT / "public/learn-code/process-reward-models"
SUCCESSOR = BASE / "content-successor"
sys.path.insert(0, str(PUBLIC))
import prm_search


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    target = SUCCESSOR / "checks.json"
    if target.exists():
        raise FileExistsError("Preserve previous correction checks")
    conditions = []

    def check(condition, name):
        if not condition:
            raise AssertionError(name)
        conditions.append(name)

    prior = json.loads((BASE / "content-inputs.json").read_text())
    allowed = {
        "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm/lesson.md",
        "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm/visual-specifications.md",
        "public/learn-code/process-reward-models/prm_search.py",
        "public/learn-code/process-reward-models/download-manifest.json",
        "public/learn-code/process-reward-models/prm-programs-data.zip",
    }
    changed = {}
    for relative, expected in prior["files"].items():
        check(sha(SUCCESSOR / "predecessor" / relative) == expected, f"Protected predecessor: {relative}")
        actual = sha(ROOT / relative)
        if actual != expected:
            check(relative in allowed, f"Authorized bounded delta: {relative}")
            changed[relative] = {"before": expected, "after": actual}
        else:
            check(actual == expected, f"Conserved original binding: {relative}")
    check(set(changed) == allowed, "Exactly five predecessor files changed")

    for count in range(10):
        product = prm_search.rank_pool(count, "product")
        logged = prm_search.rank_pool(count, "log_product")
        check([row["id"] for row in product["ordered"]] == [row["id"] for row in logged["ordered"]], f"Ranking order conserved for count {count}")
        check(product["weighted_vote"] == logged["weighted_vote"], f"Equivalent mass vote for count {count}")
        if count:
            maximum = max(row["score"] for row in product["ordered"])
            for answer, mass in product["answer_weights"].items():
                check(math.isclose(logged["answer_weights"][answer], mass / maximum, abs_tol=1e-12), f"One common scale for {count}/{answer}")
    six = prm_search.rank_pool(6)
    check(six["selected"]["id"] == "C" and six["weighted_vote"] == "3", "Literal wrong individual winner versus correct vote")
    check(math.isclose(six["answer_weights"]["3"], 2.49514, abs_tol=1e-12), "Visible product mass for answer 3")
    check(math.isclose(six["answer_weights"]["4"], 1.7202, abs_tol=1e-12), "Visible product mass for answer 4")
    check(prm_search.vote_masses([-1000.0, -1001.0, -math.inf], "log_product") == [1.0, math.exp(-1), 0.0], "Stable long-path weights and exact zero")
    check(prm_search.vote_masses([-math.inf, -math.inf], "log_product") == [0.0, 0.0], "All impossible paths have zero mass")
    original_pool = prm_search.POOL
    try:
        prm_search.POOL = [{**row, "scores": [0.0]} for row in original_pool]
        for method in ("product", "log_product", "minimum", "mean"):
            result = prm_search.rank_pool(6, method)
            check(result["weighted_vote"] is None, f"All-zero vote unknown for {method}")
            check(all(mass == 0 for mass in result["answer_weights"].values()), f"No invented mass for {method}")
    finally:
        prm_search.POOL = original_pool

    previous = json.loads((BASE / "native/search-literal.json").read_text())
    current = json.loads((BASE / "native/search-vote-closure.json").read_text())
    for name in ("pool", "beam1", "beam2", "uct", "localization"):
        check(current[name] == previous[name], f"Unchanged finite mechanism: {name}")
    for name, value in previous["ranked"].items():
        check(current["ranked"][name] == value, f"Unchanged default ranking/vote field: {name}")
    check(current["passed"] == 6, "Actual current main's six numerical groups")

    manuscript = (BASE / "lesson.md").read_text(encoding="utf8")
    line = next(line for line in manuscript.splitlines() if line.startswith("python prm_records.py --train"))
    argv = shlex.split(line)
    check(argv == ["python", "prm_records.py", "--train", "sources/phase2_train.jsonl.prefix", "--test", "sources/phase2_test.jsonl.prefix", "--out", "extracted-data"], "Visible extraction argv follows bundle paths")
    check("reasonable, understandable attempts" in manuscript and "suboptimal" in manuscript and "does not guarantee future success or a positive" in manuscript, "Positive human rubric distinct from guaranteed advantage")
    check("python -m pip install -r" in manuscript and "`sources/`" in manuscript and "`data/`" in manuscript and "`study/`" in manuscript, "Visible setup and file-index route")
    check(len(re.findall(r"^## ", manuscript, re.M)) == 13 and len(re.findall(r"^### \d+\.", manuscript, re.M)) == 14, "Entire 13-section/14-solution coverage preserved")
    manifest = json.loads((PUBLIC / "download-manifest.json").read_text())
    with zipfile.ZipFile(PUBLIC / "prm-programs-data.zip") as archive:
        check(len(archive.namelist()) == 23, "Complete 23-entry learner archive")
        for name, info in manifest["files"].items():
            content = archive.read(name)
            check(content == (PUBLIC / name).read_bytes(), f"Archive/current equality: {name}")
            check(hashlib.sha256(content).hexdigest() == info["sha256"], f"Download identity: {name}")
        check(archive.read("download-manifest.json") == (PUBLIC / "download-manifest.json").read_bytes(), "Archived manifest exact")
        for name in (argv[3], argv[5]):
            check(name in archive.namelist(), f"Actual extraction input included: {name}")
    report = {"passed": len(conditions), "scientific_fits": 0, "pretrained_inference": False,
              "changed": changed, "script_sha256": sha(Path(__file__)), "conditions": conditions,
              "scope": "Bounded R1–R3 source/conservation/arithmetic/archive checks; no runtime or paint claim"}
    target.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"passed": len(conditions), "receipt_sha256": sha(target), "changed": len(changed)}, indent=2))


if __name__ == "__main__":
    main()
