"""Reuse the PRM lesson's exact beam/UCT and expose its work boundary.

python search_budget.py --prm-dir prerequisite
Both prerequisite files are supplied unchanged. No neural generation or fitting.
"""
from pathlib import Path
import argparse
import importlib
import json
import sys


def inspect(prm_dir):
    sys.path.insert(0, str(prm_dir.resolve()))
    search = importlib.import_module("prm_search")
    narrow = search.beam(width=1)
    wider = search.beam(width=2)
    zero = search.beam(width=1, depth=0)
    # These are independent traversals of a constructed tree. They do not create
    # independent neural samples or reproduce DVTS's stochastic branch diversity.
    subtrees = [search.beam(width=1, score_family=family) for family in ("product", "value")]
    return {"scope": "Exact finite PRM prerequisite; work/schedule inspection only",
            "beam1": narrow, "beam2": wider, "depth0": zero,
            "independent_branch_policies": subtrees,
            "total_scored_nodes": sum(row["generated_scored_nodes"] for row in subtrees),
            "lookahead_accounting": {"candidate_steps": 4, "extra_steps_per_candidate": 2,
                                     "total_step_work": 4 * (1 + 2)},
            "uct": search.uct(8)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prm-dir", type=Path, default=Path(__file__).parent / "prerequisite")
    args = parser.parse_args()
    print(json.dumps(inspect(args.prm_dir), indent=2))
