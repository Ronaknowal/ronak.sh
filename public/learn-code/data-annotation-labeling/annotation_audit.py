"""Inspect independent labels and convert reviewed Label Studio exports.

Run: python annotation_audit.py
Requires scikit-learn only for the independent kappa comparison in main().
"""
from collections import Counter
from math import isclose


def agreement(left, right):
    """Nominal two-rater agreement; None means missing, not another class."""
    if len(left) != len(right):
        raise ValueError("Raters must refer to the same ordered items")
    a_counts, b_counts = Counter(), Counter()
    n, matches = 0, 0
    for a, b in zip(left, right):
        if a is None or b is None:
            continue
        a_counts[a] += 1
        b_counts[b] += 1
        n += 1
        matches += a == b
    if not n:
        return {"n": 0, "observed": None, "expected": None, "kappa": None}
    observed = matches / n
    expected = sum(a_counts[k] * b_counts[k]
                   for k in a_counts.keys() | b_counts.keys()) / (n * n)
    return {"n": n, "observed": observed, "expected": expected,
            "kappa": (observed - expected) / (1 - expected)
            if expected < 1 else None}


def majority(labels):
    """Strict majority among submitted labels; abstention stays missing."""
    counts = Counter(label for label in labels if label is not None)
    submitted = sum(counts.values())
    if not submitted:
        return None
    label, count = counts.most_common(1)[0]
    return label if count * 2 > submitted else None


def reviewed_rows(tasks, approved_annotation_ids, allowed=("Urgent", "Routine")):
    """Explicit external adjudication approves one final annotation per task.

    An ordinary export's annotations are not implicitly reviewed. Preserve source
    identifiers; never use array position or the model's predictions as the label.
    """
    rows, seen = [], set()
    for task in tasks:
        task_id = task["id"]
        if task_id in seen:
            raise ValueError("Duplicate task ID")
        seen.add(task_id)
        approved = [a for a in task.get("annotations", [])
                    if a["id"] in approved_annotation_ids
                    and not a.get("was_cancelled", False)]
        if len(approved) != 1:
            raise ValueError("Each released task needs exactly one approved annotation")
        annotation = approved[0]
        results = [r for r in annotation["result"]
                   if r.get("from_name") == "urgency"
                   and r.get("to_name") == "message"
                   and r.get("type") == "choices"]
        if len(results) != 1:
            raise ValueError("Expected one urgency result")
        choices = results[0]["value"]["choices"]
        if len(choices) != 1 or choices[0] not in allowed:
            raise ValueError("Expected one supported label")
        rows.append({"id": task_id, "text": task["data"]["text"],
                     "label": choices[0], "annotation_id": annotation["id"]})
    return rows


def main():
    from sklearn.metrics import cohen_kappa_score
    left = ["U", "U", "R", "R", "U", "R"]
    right = ["U", "R", "R", "R", "U", "U"]
    result = agreement(left, right)
    assert isclose(result["kappa"], cohen_kappa_score(left, right))
    assert isclose(result["kappa"], 1 / 3)
    assert majority(["U", "R", None]) is None
    assert agreement(["R"] * 4, ["R"] * 4)["kappa"] is None
    export = [{"id": 17, "data": {"text": "Payments fail for all users."},
               "annotations": [{"id": 71, "was_cancelled": False, "result": [
                   {"from_name": "urgency", "to_name": "message", "type": "choices",
                    "value": {"choices": ["Urgent"]}}]}]}]
    print("agreement:", result)
    print("released:", reviewed_rows(export, {71}))


if __name__ == "__main__":
    main()
