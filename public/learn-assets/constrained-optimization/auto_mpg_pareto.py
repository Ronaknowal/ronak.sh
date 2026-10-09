"""Compare recorded 1982 Auto MPG rows, not future cars or predictions.

Save the unchanged UCI auto-mpg.data file beside this script.
Run: python auto_mpg_pareto.py
Dependency: numpy==2.3.5. No network access, fitting or random sampling.
Scratch all-pairs dominance costs O(n^2 m) time and O(nm) input storage.
NumPy broadcasting has the same work and O(n^2 m) temporary storage.
The finite catalogue, chosen metrics and requirements define every answer.
"""
from pathlib import Path
import hashlib
import json
import math
import shlex
import numpy as np


def read_records(path):
    """Preserve one-based source row identity; '?' horsepower is missing."""
    rows = []
    for row_id, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        fields = shlex.split(line)
        if len(fields) != 9:
            raise ValueError(f"Row {row_id}: expected eight attributes and a quoted name")
        mpg, cylinders = float(fields[0]), int(fields[1])
        hp = None if fields[3] == "?" else float(fields[3])
        if not math.isfinite(mpg) or mpg <= 0 or (hp is not None and (not math.isfinite(hp) or hp <= 0)):
            raise ValueError(f"Row {row_id}: positive finite observed objectives required")
        rows.append(dict(row_id=row_id, name=fields[8], model_year=int(fields[6]),
                         cylinders=cylinders, mpg=mpg, horsepower=hp))
    return rows


def checked_points(points):
    points = [tuple(p) for p in points]
    if points and (not points[0] or any(len(p) != len(points[0]) for p in points)
                   or any(not math.isfinite(x) for p in points for x in p)):
        raise ValueError("Objectives must be finite, nonempty, equally sized vectors")
    return points


def scratch_front(points):
    """Minimization; a strict improvement is required, so duplicates survive."""
    points = checked_points(points)
    return [j for j, p in enumerate(points)
            if not any(all(a <= b for a, b in zip(q, p)) and
                       any(a < b for a, b in zip(q, p)) for q in points)]


def numpy_front(points):
    """The first broadcast index is a proposed dominator; second is its target."""
    points = checked_points(points)
    if not points:
        return []
    values = np.asarray(points, dtype=float)
    no_worse = (values[:, None, :] <= values[None, :, :]).all(axis=2)
    better = (values[:, None, :] < values[None, :, :]).any(axis=2)
    dominated = (no_worse & better).any(axis=0)
    return np.flatnonzero(~dominated).tolist()


def decision(rows, cylinder_limit=4, minimum_mpg=30):
    """Explicit preference: highest hp, then mpg, then smallest source row ID."""
    if cylinder_limit not in (3, 4, 5, 6, 8) or not math.isfinite(minimum_mpg) or minimum_mpg < 0:
        raise ValueError("Choose a recorded cylinder limit and nonnegative finite mpg floor")
    observed = [r for r in rows if r["model_year"] == 82 and r["horsepower"] is not None]
    feasible = [r for r in observed if r["cylinders"] <= cylinder_limit and r["mpg"] >= minimum_mpg]
    # Larger mpg/hp is preferred. Negating both converts to the taught minimization rule.
    points = [(-r["mpg"], -r["horsepower"]) for r in feasible]
    front = scratch_front(points)
    if front != numpy_front(points):
        raise AssertionError("Scratch and NumPy dominance disagree")
    selected = min(feasible, key=lambda r: (-r["horsepower"], -r["mpg"], r["row_id"]), default=None)
    return dict(cylinder_limit=cylinder_limit, minimum_mpg=minimum_mpg,
                feasible_ids=[r["row_id"] for r in feasible],
                frontier_ids=[feasible[i]["row_id"] for i in front], selected=selected)


def main():
    path = Path(__file__).with_name("auto-mpg.data")
    rows = read_records(path)
    cohort = [r for r in rows if r["model_year"] == 82]
    missing = [r["row_id"] for r in cohort if r["horsepower"] is None]
    assert len(rows) == 398 and len(cohort) == 31 and missing == [375]
    assert scratch_front([]) == numpy_front([]) == []
    assert scratch_front([(1, 1), (1, 1), (2, 2)]) == numpy_front([(1, 1), (1, 1), (2, 2)]) == [0, 1]
    print("UCI Auto MPG: 398 rows; year 82: 31; missing horsepower excluded:", missing)
    for limit, floor in [(4, 30), (8, 30), (4, 40), (4, 50)]:
        state = decision(rows, limit, floor)
        print("cylinders <=", limit, "mpg >=", floor, "feasible", len(state["feasible_ids"]),
              "frontier", state["frontier_ids"])
        chosen = state["selected"]
        print("selected", None if chosen is None else
              (chosen["row_id"], chosen["name"], chosen["mpg"], chosen["horsepower"]))
    # Every integer floor in the proposed live domain, for every recorded count option.
    states = [decision(rows, limit, floor) for limit in (3, 4, 5, 6, 8) for floor in range(51)]
    for state in states:
        chosen = state["selected"]
        assert chosen is None or chosen["row_id"] in state["frontier_ids"]
    invalid = 0
    for points in [[(float("nan"),)], [(1,), (1, 2)], [()]]:
        for route in (scratch_front, numpy_front):
            try:
                route(points)
            except ValueError:
                invalid += 1
    assert invalid == 6
    report = dict(source_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                  script_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  versions=dict(numpy=np.__version__), rows=398, cohort=cohort,
                  missing_ids=missing, states=states, invalid_cases=invalid,
                  scope="Recorded catalogue; no fit, generalization claim or invented measurement.")
    Path(__file__).with_name("auto_mpg_pareto.results.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("Matched scratch/NumPy states:", len(states), "invalid checks:", invalid)


if __name__ == "__main__":
    main()
