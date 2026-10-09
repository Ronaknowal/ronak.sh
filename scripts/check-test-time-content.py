"""Inspect retained TTC outputs and complete content; no model calls or fits."""
from pathlib import Path
from fractions import Fraction
import hashlib
import json
import math
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/test-time-compute-scaling"
PROGRAMS = TOPIC / "programs"
sys.path.insert(0, str(PROGRAMS))
from allocation import allocate, exhaustive
from probability import plurality


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


checks = []
def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append(name)

protocol = json.loads((TOPIC / "research/native-protocol-r2.json").read_text())
for row in protocol["files"]:
    check("native input unchanged: " + row["path"], sha(ROOT / row["path"]) == row["sha256"])
for name in ("prm_search.py", "prm_contracts.py"):
    check("exact prerequisite " + name, (PROGRAMS / "prerequisite" / name).read_bytes() ==
          (ROOT / "public/learn-code/process-reward-models" / name).read_bytes())
complete = json.loads((PROGRAMS / "observations-r2/complete.json").read_text())
journal = PROGRAMS / "observations-r2/generations.jsonl"
check("journal hash", sha(journal) == complete["generations_sha256"])
rows = [json.loads(line) for line in journal.read_text(encoding="utf8").splitlines()]
check("300 planned outputs", len(rows) == 300)
check("unique generation identities", len({(r['question_id'], r['arm'], r['seed'], r['sample']) for r in rows}) == 300)
for row in rows:
    check("retained token accounting", row["generated_tokens"] == len(row["generated_ids"]))
    check("bounded emission", 1 <= row["generated_tokens"] <= 64)
    check("finite local CPU observation", math.isfinite(row["cpu_seconds"]) and row["cpu_seconds"] >= 0)
summary = json.loads((PROGRAMS / "summary.json").read_text(encoding="utf8"))
expected = {"greedy": (12, 0, 10, 0), "vote1": (36, 1, 33, 1),
            "vote4": (36, 1, 35, 1), "vote8": (36, 1, 35, 1)}
for method, (count, correct, coverage, oracle) in expected.items():
    details = [r for r in summary["detail"] if r["method"] == method]
    totals = (len(details), sum(r["correct"] for r in details), sum(r["coverage"] for r in details), sum(r["oracle"] for r in details))
    check(method + " actual aggregate", totals == (count, correct, coverage, oracle))
    aggregate = next(r for r in summary["summary"] if r["method"] == method)
    for key in ("correct", "coverage", "oracle", "tokens", "cpu_seconds", "pass_estimator"):
        check(method + " retained mean " + key, abs(sum(r[key] for r in details) / count - aggregate[key]) < 1e-12)
case = next(r for r in summary["detail"] if r["question_id"] == "gsm8k-test-1" and r["method"] == "vote8" and r["seed"] == 29)
check("documented successful tie case", [r["text"] for r in case["candidates"]] == ["3", "20", "4", "30", "23", "2", "13", "16"] and case["answer"] == case["gold"] == "3")
check("no sampled selection gain on any question", all(q["vote1"] == q["vote4"] == q["vote8"] for q in summary["questions"]))
check("all-seed successful case already first", all(r["question_id"] == "gsm8k-test-1" and r["seed"] == 29 for r in summary["detail"] if r["correct"]))
changed = [[(0, '.4'), (1, '.7'), (2, '.75')], [(0, '.2'), (1, '.35'), (2, '.4')]]
result = allocate(changed, 3)
check("changed practice13", result["choices"] == [1, 2] and Fraction(result["exact_gain"]) == Fraction(11, 10) and exhaustive(changed, 3) == (Fraction(11,10), (1,2)))
check("practice6 exact risk", [sum(Fraction(str(p)) * abs(a-y) for p,y in zip([.4,.35,.25],[0,2,10])) for a in [0,2,10]] == [Fraction(16,5),Fraction(14,5),Fraction(34,5)])
check("practice1 opportunity", 1-Fraction(7,10)**4 == Fraction(7599,10000))
check("practice2 binary", 3*Fraction(55,100)**2*Fraction(45,100)+Fraction(55,100)**3 == Fraction(57475,100000))
distribution = {str(n): {"correct_mode": plurality([.4,.35,.25],n), "wrong_mode": plurality([.4,.5,.1],n)} for n in [1,3,5,7]}
manuscript = (TOPIC / "lesson.md").read_text(encoding="utf8")
markers = re.findall(r"<!-- (D\d\d) ([A-Za-z]+) -->", manuscript)
check("all20 distinct authored drawings", [x[0] for x in markers] == [f"D{i:02}" for i in range(1,21)])
check("16 fully written practices", manuscript.count("**Hint:**") == manuscript.count("**Solution:**") == 16)
for name in re.findall(r"<!-- CODE ([a-z_]+\.py) -->", manuscript):
    check("whole program supplied: " + name, (PROGRAMS / name).is_file())
check("native cache CLI correspondence", '--cache-dir flan-t5-cache' in manuscript and '--cache flan-t5-cache' in manuscript)
check("preserved negative observation", 'No positive scaling curve' in manuscript)
report = {"status": "pass", "scope": "retained-data arithmetic, publication payload and finite practice only; no model calls/fit/replay", "checks": checks, "count": len(checks), "plurality_display": distribution}
with (TOPIC / "content-author-checks.json").open("x", encoding="utf8") as handle:
    json.dump(report, handle, indent=2)

# Prepared downloadable content only. Keep local runtime config and failed author
# attempts in research evidence, not in a learner's deployed bundle.
paths = list(PROGRAMS.glob("*.py")) + [PROGRAMS / "README.md", PROGRAMS / "requirements.txt", PROGRAMS / "summary.json"]
paths += list((PROGRAMS / "data").glob("*")) + list((PROGRAMS / "prerequisite").glob("*.py"))
paths += [journal, PROGRAMS / "observations-r2/protocol.json"]
with zipfile.ZipFile(TOPIC / "test-time-compute.zip", "x", compression=zipfile.ZIP_DEFLATED) as bundle:
    for path in sorted(paths):
        bundle.write(path, path.relative_to(PROGRAMS).as_posix())
    bundle.writestr("observations-r2/complete.json", json.dumps({"outputs": complete["outputs"], "generations_sha256": complete["generations_sha256"]}, indent=2) + "\n")
with zipfile.ZipFile(TOPIC / "test-time-compute.zip") as bundle:
    for path in paths:
        check("zip exact " + path.relative_to(PROGRAMS).as_posix(), bundle.read(path.relative_to(PROGRAMS).as_posix()) == path.read_bytes())
print(json.dumps({"status": "pass", "source_checks": report["count"], "zip_files": len(paths)+1, "zip_sha256": sha(TOPIC / "test-time-compute.zip")}))
