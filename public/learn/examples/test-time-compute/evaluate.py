"""Evaluate retained outputs after selection; no model calls or parameter tuning.

python evaluate.py --data data --observations observations --output summary.json
All-question accuracy retains invalids. Bootstrap resamples whole paired questions.
"""
from pathlib import Path
from collections import defaultdict
import argparse
import hashlib
import json
import random
import statistics
from selection import Candidate, canonical_answer, select
from probability import pass_at_k


def gold_answer(row):
    # Commas in the dataset's final answer are thousands separators, not prose.
    raw = row["answer"].rsplit("####", 1)[-1].strip().replace(",", "")
    answer = canonical_answer(raw)
    if answer is None:
        raise ValueError(f"Invalid source answer: {row['id']}")
    return answer


def percentile(values, q):
    ordered = sorted(values)
    position = (len(ordered) - 1) * q
    left = int(position)
    return ordered[left] + (ordered[min(left + 1, len(ordered) - 1)] - ordered[left]) * (position - left)


def bootstrap(question_rows, methods, draws=2000, seed=101):
    rng = random.Random(seed)
    estimates = {method: [] for method in methods}
    # Reuse the same sampled question indices across all methods in each draw.
    for _ in range(draws):
        sampled = [rng.randrange(len(question_rows)) for _ in question_rows]
        for method in methods:
            estimates[method].append(statistics.mean(question_rows[i][method] for i in sampled))
    return {method: [percentile(values, .025), percentile(values, .975)]
            for method, values in estimates.items()}


def evaluate(data, observations):
    records = json.loads((data / "selected.json").read_text(encoding="utf8"))
    complete = json.loads((observations / "complete.json").read_text(encoding="utf8"))
    raw = (observations / "generations.jsonl").read_bytes()
    if hashlib.sha256(raw).hexdigest() != complete["generations_sha256"]:
        raise ValueError("Generation journal has changed")
    generations = [json.loads(line) for line in raw.decode("utf8").splitlines()]
    if len(generations) != 300:
        raise ValueError("Expected the complete prespecified 300-output journal")
    index = defaultdict(list)
    for row in generations:
        index[(row["question_id"], row["arm"], row["seed"])].append(row)
    detail, question_rows = [], []
    for question in records:
        truth = gold_answer(question)
        per_question = {"id": question["id"]}
        greedy = index[(question["id"], "greedy", None)]
        if len(greedy) != 1:
            raise ValueError("Exactly one greedy record required")
        prediction = canonical_answer(greedy[0]["text"])
        per_question["greedy"] = int(prediction == truth)
        detail.append({"question_id": question["id"], "method": "greedy", "seed": None,
                       "answer": prediction, "gold": truth, "correct": int(prediction == truth),
                       "coverage": int(prediction is not None), "oracle": int(prediction == truth),
                       "tokens": greedy[0]["generated_tokens"], "pass_estimator": int(prediction == truth),
                       "cpu_seconds": greedy[0]["cpu_seconds"], "candidates": greedy})
        for n in (1, 4, 8):
            outcomes = []
            for seed in (17, 29, 43):
                pool = sorted(index[(question["id"], "sample", seed)], key=lambda r: r["sample"])
                if [r["sample"] for r in pool] != list(range(8)):
                    raise ValueError("Each question/seed requires exactly samples0..7")
                selected_pool = pool[:n]
                # Only text/identity enters this selector. Gold is joined afterward.
                selection = select([Candidate(str(r["sample"]), r["text"]) for r in selected_pool])
                parsed = [canonical_answer(r["text"]) for r in pool]
                correct = int(selection["answer"] == truth)
                outcomes.append(correct)
                detail.append({"question_id": question["id"], "method": f"vote{n}", "seed": seed,
                    "answer": selection["answer"], "gold": truth, "correct": correct,
                    "coverage": int(selection["answer"] is not None), "selection": selection,
                    "oracle": int(truth in parsed[:n]), "pass_estimator": pass_at_k(8, parsed.count(truth), n),
                    "tokens": sum(r["generated_tokens"] for r in selected_pool),
                    "cpu_seconds": sum(r["cpu_seconds"] for r in selected_pool), "candidates": selected_pool})
            per_question[f"vote{n}"] = statistics.mean(outcomes)
        question_rows.append(per_question)
    methods = ("greedy", "vote1", "vote4", "vote8")
    intervals = bootstrap(question_rows, methods)
    summaries = []
    for method in methods:
        rows = [row for row in detail if row["method"] == method]
        summaries.append({"method": method, "questions": len(records), "question_seed_rows": len(rows),
            **{key: statistics.mean(row[key] for row in rows) for key in
               ("correct", "coverage", "oracle", "pass_estimator", "tokens", "cpu_seconds")},
            "question_bootstrap95": intervals[method]})
    return {"scope": "12 convenience GSM8K rows, fixed Flan-T5-small; no full benchmark claim",
            "bootstrap": {"seed": 101, "draws": 2000, "unit": "whole question with all methods/seeds"},
            "summary": summaries, "questions": question_rows, "detail": detail}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=Path(__file__).parent / "data")
    parser.add_argument("--observations", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = evaluate(args.data, args.observations)
    with args.output.open("x", encoding="utf8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
    print(json.dumps(result["summary"], indent=2))
