"""Check complete manuscript coverage and numbers against retained actual outputs."""

import ast
import hashlib
import json
from pathlib import Path
import re
import zipfile


ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
PUBLIC = ROOT / "public/learn/examples/rlaif-methods"
EVIDENCE = TOPIC / "native-evidence"
manuscript_path = TOPIC / "lesson.md"
manuscript = manuscript_path.read_text(encoding="utf-8")
checks = []


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(condition, name):
    assert condition, name
    checks.append(name)


def load(name):
    return json.loads((EVIDENCE / name).read_text(encoding="utf-8"))


check(re.findall(r"^## (\d+)\.", manuscript, re.M) == [str(x) for x in range(1, 16)], "all fifteen complete sections")
drawings = re.findall(r"<!-- D(\d+) ([A-Za-z]+):", manuscript)
check([int(number) for number, name in drawings] == list(range(1, 36)), "all thirty-five ordered drawing placements")
programs = re.findall(r"<!-- PROGRAM ([a-z_]+\.py):", manuscript)
check(len(programs) == 9 and len(set(programs)) == 9, "all nine whole program placements")
practice = re.split(r"^## 13\.", manuscript, flags=re.M)[1]
practice = re.split(r"^## 14\.", practice, flags=re.M)[0]
check(re.findall(r"^### (\d+)\.", practice, re.M) == [str(x) for x in range(1, 15)], "all fourteen independent practices")
check(practice.count("**Hint:**") == 14 and practice.count("**Solution:**") == 14, "fourteen complete hints and reasoned solutions")
for program in programs:
    path = PUBLIC / program
    tree = ast.parse(path.read_text(encoding="utf-8"))
    check(any(isinstance(node, ast.FunctionDef) and node.name == "main" for node in tree.body), program + " complete main")
    check('if __name__ == "__main__":' in path.read_text(encoding="utf-8"), program + " executable entry")

freeze = load("prospective-freeze.json")
for name, expected in freeze["files"].items():
    path = EVIDENCE / name if name in ["prepared-inputs.json", "judge-prepared.json"] else PUBLIC / name
    check(digest(path) == expected["sha256"], name + " scientific input conserved")

judge = load("judge-results.json")
for row in judge["comparisons"]:
    index = row["id"].split(":")[1]
    values = row["mapped_chosen"] + [row["target_chosen"], row["order_gap"]]
    line = "| " + index + " | " + " | ".join(f"{x:.6f}"[1:] for x in values) + " |"
    check(line in manuscript, index + " all four judge table values source-bound")
check(sum(row["target_chosen"] > .5 for row in judge["comparisons"]) == 2, "actual two of four supplied-label agreements")
for row in judge["ratings"]:
    check(f"{row['expected_rating']:.6f}" in manuscript, row["response"] + " expected rating in prose")
    check(f"{row['mapped_reward']:.6f}".replace("-0.", "−.") in manuscript, row["response"] + " mapped signed reward in prose")

feedback = load("feedback-results.json")
last = feedback["history"][-1]
for key in ["gap", "probability_a", "loss"]:
    check(f"{last[key]:.6f}"[1:] in manuscript, "actual terminal reward-head " + key)
loop = load("loop-results.json")
for route, rows in loop["histories"].items():
    check(f"{rows[-1]['probabilities'][0]:.6f}"[1:] in manuscript, route + " actual terminal probability in prose")

training = load("training-results.json")
for seed in training["seeds"]:
    method_rows = seed["methods"]
    warm = method_rows["SFT"]["checkpoints"][0]["heldout"]["token_weighted_chosen_NLL"]
    line = f"| {seed['seed']} | {warm:.6f} | " + " | ".join(
        f"{method_rows[name]['checkpoints'][-1]['heldout']['token_weighted_chosen_NLL']:.6f} / "
        f"{method_rows[name]['checkpoints'][-1]['heldout']['word_punctuation_EOS_PPL']:.2f}"
        for name in ["SFT", "DPO", "IPO", "ORPO"]) + " |"
    check(line in manuscript, str(seed["seed"]) + " all measured NLL/PPL table entries")
    rank_line = f"| {seed['seed']} | " + " | ".join(
        f"{method_rows[name]['checkpoints'][-1]['heldout']['ranks']['mean_rank']['positive']} / "
        f"{method_rows[name]['checkpoints'][-1]['heldout']['ranks']['relative_mean_rank']['positive']}"
        for name in ["SFT", "DPO", "IPO", "ORPO"]) + " |"
    check(rank_line in manuscript, str(seed["seed"]) + " all paired rank counts in prose")
    for name, method in method_rows.items():
        final = method["checkpoints"][-1]["heldout"]
        check(final["pairs"] == 12 and final["ranks"]["sum_rank"]["positive"] == 5,
              str(seed["seed"]) + name + " actual sum wins denominator")
        check(all(metric["ties"] == 0 for metric in final["ranks"].values()), str(seed["seed"]) + name + " terminal no ties")
        check(sum(row["chosen_unknowns"] for row in final["records"]) == 166 and final["chosen_targets"] == 594,
              str(seed["seed"]) + name + " exact unknown/target denominator")
        work = method["work"]
        check(work["policy_train_sequences"] == (480 if name == "SFT" else 960), name + " actual forwarded sequences")
        check(work["policy_train_visible_positions"] == (44260 if name == "SFT" else 87760), name + " actual visible positions")
        check(work["policy_train_response_targets"] == (30000 if name == "SFT" else 59240), name + " actual targets")
        check(work["policy_eval_batches"] == 66 and work["policy_eval_sequences"] == 792, name + " separate evaluation batches")
        check(work["policy_eval_visible_positions"] == 70059 and work["policy_eval_padded_positions"] == 114180,
              name + " separate evaluation positions")
    reference = seed["warm_and_cache_work"]
    check(reference["reference_batches"] == 6 and reference["reference_sequences"] == 72 and reference["reference_visible_positions"] == 6369,
          str(seed["seed"]) + " shared cache work")
check(f"{training['wall_seconds']:.2f}" in manuscript, "measured CPU time correctly rounded")

native = load("native-results.json")
orpo = native["results"][1]
for key in ["native_loss", "explicit_loss"]:
    check(f"{orpo[key]:.9f}" in manuscript, "ORPO exact displayed " + key)
for key in ["full_prompt_chosen_nll", "response_only_equal_response_nll"]:
    check(f"{orpo['details'][key]:.6f}" in manuscript, "ORPO mask contrast " + key)
check(orpo["details"]["full_prompt_target_count"] == 137 and orpo["details"]["response_target_count"] == 74,
      "native imitation target count contrast")
selection = json.loads((PUBLIC / "selection.json").read_text(encoding="utf-8"))
for split, expected in [("train_prefs", {"length_budget": 272, "tied_or_inverted_source_scores": 4}),
                        ("test_prefs", {"length_budget": 182, "tied_or_inverted_source_scores": 3})]:
    from collections import Counter
    check(Counter(row["reason"] for row in selection["audit"][split]["rejected"]) == expected,
          split + " all exclusion counts in prose")

manifest = json.loads((PUBLIC / "download-manifest.json").read_text(encoding="utf-8"))
with zipfile.ZipFile(PUBLIC / "rlaif-methods-programs.zip") as bundle:
    for entry in manifest["files"]:
        path = PUBLIC / entry["path"]
        check(digest(path) == entry["sha256"] and path.stat().st_size == entry["bytes"], entry["path"] + " actual manifest bytes")
        check(bundle.read(entry["path"]) == path.read_bytes(), entry["path"] + " exact archive bytes")
for path in PUBLIC.rglob("*"):
    check(path.name != "__pycache__" and path.suffix not in [".pt", ".bin", ".safetensors", ".pyc"], "no public cache/weight " + path.name)
for target in re.findall(r"\]\((/learn/examples/[^)]+)\)", manuscript):
    check((ROOT / "public" / target.lstrip("/")).is_file(), "actual clickable asset " + target)
published = ROOT / "src/learn/data/topics/rlaif-ipo-orpo.jsx"
original = TOPIC / "original/rlaif-ipo-orpo.jsx"
check(published.read_bytes() == original.read_bytes(), "published original conserved; staged content only")
check(not (ROOT / "src/learn/data/rlaif-methods-models.js").exists(), "runtime pure model not started before different content review")

output = {"status": "passed", "passed": len(checks), "scientific_reexecution": False,
          "manuscript_sha256": digest(manuscript_path), "manuscript_bytes": manuscript_path.stat().st_size,
          "words": len(manuscript.split()), "lines": len(manuscript.splitlines()),
          "sections": 15, "drawings": drawings, "programs": programs,
          "practice_solutions": 14, "checks": checks}
(TOPIC / "author-content-checks.json").write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k, v in output.items() if k not in ["checks", "drawings", "programs"]}, indent=2))
