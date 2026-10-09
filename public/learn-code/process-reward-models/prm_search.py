"""Complete fixed-pool ranking, beam search and generic UCT on a finite tree.

python prm_search.py --output search.json
No LLM API or fit is involved. Local scores and terminal checker rewards are
deliberately different. This is generic UCT, not the full ReST-MCTS* algorithm.
"""

import argparse
from collections import defaultdict
from dataclasses import dataclass, field
import heapq
import json
import math
from pathlib import Path
import random

from prm_contracts import aggregate, first_error, localization_metrics, selective_accuracy

POOL = [
    {"id": "A", "answer": "3", "steps": ["2x=6", "x=3"],
     "scores": [0.9, 0.9], "correct": True},
    {"id": "B", "answer": "3", "steps": ["2x+2=8", "2x=6", "x=3"],
     "scores": [0.98, 0.95, 0.94], "correct": True},
    {"id": "C", "answer": "4", "steps": ["2x=8", "x=4"],
     "scores": [0.99, 0.98], "correct": False},
    {"id": "D", "answer": "3.5", "steps": ["2x=7", "x=3.5"],
     "scores": [0.6, 0.8], "correct": False},
    {"id": "E", "answer": "4", "steps": ["answer 4"],
     "scores": [0.75], "correct": False},
    {"id": "F", "answer": "3", "steps": ["2(x+1)=8 so x+1=4", "x=3"],
     "scores": [0.9, 0.9], "correct": True},
]


def vote_masses(scores, method):
    """Map ranking coordinates to nonnegative weights before answer addition.

    Log-product ranking is monotone in product, but summing log scores would
    multiply path masses within an answer group. Subtract one common maximum
    and exponentiate instead. The common factor preserves the winning answer
    while avoiding underflow of every long path's unscaled product.
    """
    if method != "log_product":
        return list(scores)
    finite = [score for score in scores if math.isfinite(score)]
    if not finite:
        return [0.0 for _ in scores]
    maximum = max(finite)
    return [math.exp(score - maximum) if math.isfinite(score) else 0.0
            for score in scores]


def rank_pool(count, method="product"):
    if count < 0:
        raise ValueError("Candidate budget cannot be negative")
    available = POOL[:count]
    scored = [{**item, "score": aggregate(item["scores"], method), "index": index}
              for index, item in enumerate(available)]
    ordered = sorted(scored, key=lambda item: (-item["score"], item["index"]))
    votes = defaultdict(float)
    first_seen = {}
    masses = vote_masses([item["score"] for item in scored], method)
    for item, mass in zip(scored, masses):
        # Fixture answers are already normalized. Real mathematical equivalence
        # needs its own parser; whitespace removal is not a proof checker.
        votes[item["answer"]] += mass
        first_seen.setdefault(item["answer"], item["index"])
    has_mass = any(weight > 0 for weight in votes.values())
    voted = min(votes, key=lambda answer: (-votes[answer], first_seen[answer])) if has_mass else None
    return {"requested_candidates": count, "scored_candidates": len(scored),
            "ordered": ordered, "selected": ordered[0] if ordered else None,
            "weighted_vote": voted, "answer_weights": dict(votes),
            "vote_weight_convention": "relative_product_mass" if method == "log_product" else method,
            "oracle_any_correct": any(item["correct"] for item in available) if available else None}


@dataclass
class Node:
    name: str
    local: float
    predicted_value: float
    terminal_reward: float | None = None
    children: list = field(default_factory=list)
    step: str = ""


def fixture_tree():
    # At width1, high-scored B prunes A before its correct completion is visible.
    return Node("root", 1, 0.5, children=[
        Node("A", 0.6, 0.8, children=[
            Node("A1", 0.95, 1.0, 1, step="x=3"),
            Node("A2", 0.4, 0.0, 0, step="x=6")], step="2x=6"),
        Node("B", 0.9, 0.2, children=[
            Node("B1", 0.5, 0.0, 0, step="x=4"),
            Node("B2", 0.4, 0.0, 0, step="x=8")], step="2x=8"),
    ], step="2(x+1)=8")


def beam(width=1, depth=2, score_family="product"):
    if width < 1 or depth < 0:
        raise ValueError("Width must be positive and depth nonnegative")
    frontier = [(fixture_tree(), [], [])]
    layers = []
    completed = []
    scored_count = 0
    for level in range(depth):
        expanded = []
        for node, path, scores in frontier:
            if node.terminal_reward is not None:
                completed.append((node, path, scores))
                continue
            for child in node.children:
                child_scores = [*scores, child.local]
                score = (child.predicted_value if score_family == "value" else
                         aggregate(child_scores, score_family))
                expanded.append((child, [*path, child.name], child_scores, score))
        scored_count += len(expanded)
        # heapq.nsmallest applies the same declared name tie-break as full sorting.
        kept = heapq.nsmallest(width, expanded, key=lambda item: (-item[3], item[0].name))
        kept_names = {item[0].name for item in kept}
        layers.append({"depth": level + 1,
                       "scored": [{"node": item[0].name, "step": item[0].step,
                                   "path": item[1], "score": item[3]}
                                  for item in expanded],
                       "kept": [item[0].name for item in kept],
                       "pruned": [item[0].name for item in expanded if item[0].name not in kept_names]})
        frontier = [(node, path, scores) for node, path, scores, _ in kept]
        if not frontier:
            break
    completed.extend(item for item in frontier if item[0].terminal_reward is not None)
    scored_completed = [{"node": node.name, "path": path, "reward": node.terminal_reward,
                         "step": node.step,
                         "score": node.predicted_value if score_family == "value" else aggregate(scores, score_family)}
                        for node, path, scores in completed]
    scored_completed.sort(key=lambda item: (-item["score"], item["node"]))
    return {"width": width, "depth_budget": depth, "score_family": score_family,
            "generated_scored_nodes": scored_count, "layers": layers,
            "completed": scored_completed,
            "selected": scored_completed[0] if scored_completed else None}


def uct(simulations=8, exploration=math.sqrt(2), seed=19):
    if simulations < 0 or exploration < 0:
        raise ValueError("Negative search budget or exploration coefficient")
    root = fixture_tree()
    rng = random.Random(seed)
    visits, returns = defaultdict(int), defaultdict(float)
    expanded = set()
    traces = []
    for simulation in range(simulations):
        node, path = root, [root]
        while node.terminal_reward is None and node.name in expanded:
            unvisited = [child for child in node.children if visits[child.name] == 0]
            if unvisited:
                node = sorted(unvisited, key=lambda child: child.name)[0]
            else:
                def priority(child):
                    n = visits[child.name]
                    return returns[child.name] / n + exploration * math.sqrt(math.log(visits[node.name]) / n)
                node = min(node.children, key=lambda child: (-priority(child), child.name))
            path.append(node)
        if node.terminal_reward is None:
            expanded.add(node.name)
        # A rollout begins at the selected/expanded node. Its random continuation
        # is not itself added to the search tree's backed-up selection path.
        rollout_node = node
        rollout = []
        while rollout_node.terminal_reward is None:
            rollout_node = rng.choice(rollout_node.children)
            rollout.append(rollout_node.name)
        reward = rollout_node.terminal_reward
        for ancestor in path:
            visits[ancestor.name] += 1
            returns[ancestor.name] += reward
        traces.append({"simulation": simulation + 1, "selection_path": [n.name for n in path],
                       "rollout": rollout, "reward": reward,
                       "visits_after": dict(visits), "return_sums_after": dict(returns)})
    children = sorted(root.children, key=lambda child: (-visits[child.name], child.name))
    return {"simulations": simulations, "exploration": exploration, "seed": seed,
            "traces": traces, "visits": dict(visits), "return_sums": dict(returns),
            "expanded_nodes": sorted(expanded),
            "selected_root_child": children[0].name if simulations else None,
            "neural_weight_updates": 0}


def verify():
    checks = []
    b1, b2 = beam(1), beam(2)
    assert b1["selected"]["reward"] == 0
    assert b2["selected"]["reward"] == 1
    assert b1["generated_scored_nodes"] == 4
    assert b2["generated_scored_nodes"] == 6
    checks.append("actual beam ancestry and prune counterexample")
    assert beam(1, 0)["selected"] is None
    assert beam(1, 2, "value")["selected"]["node"] == "A1"
    checks.append("zero-depth unknown and different scorer target")
    ranked = rank_pool(6)
    assert all(len(item["steps"]) == len(item["scores"]) for item in POOL)
    assert ranked["selected"]["id"] == "C"
    assert ranked["weighted_vote"] == "3"
    assert ranked["oracle_any_correct"]
    assert rank_pool(0)["selected"] is None
    assert rank_pool(100)["scored_candidates"] == 6
    assert rank_pool(6)["ordered"].index(next(x for x in ranked["ordered"] if x["id"] == "A")) < ranked["ordered"].index(next(x for x in ranked["ordered"] if x["id"] == "F"))
    checks.append("fixed pool, voting, oracle and stable ties")
    logged = rank_pool(6, "log_product")
    assert logged["weighted_vote"] == ranked["weighted_vote"]
    assert [item["id"] for item in logged["ordered"]] == [item["id"] for item in ranked["ordered"]]
    assert vote_masses([float("-inf"), -1000.0, -1001.0], "log_product") == [0.0, 1.0, math.exp(-1)]
    assert vote_masses([float("-inf"), float("-inf")], "log_product") == [0.0, 0.0]
    assert rank_pool(0, "log_product")["weighted_vote"] is None
    checks.append("log-invariant ranking, equivalent relative-mass voting and zero masses")
    visits = uct(8)
    assert visits["visits"]["root"] == 8
    for trace in visits["traces"]:
        assert trace["selection_path"][0] == "root"
        assert trace["visits_after"]["root"] == trace["simulation"]
    assert uct(0)["selected_root_child"] is None
    checks.append("UCT actual root backups and zero budget")
    predictions = [first_error(scores, 0.5) for scores in
                   ([0.2, 0.9], [0.9, 0.2], [0.9, 0.9, 0.2], [0.9], [0.9], [0.9], [0.2])]
    targets = [0, 1, 2, 3, -1, -1, -1]
    metrics = localization_metrics(predictions, targets)
    assert abs(metrics["harmonic"] - 12 / 17) < 1e-12
    assert selective_accuracy([0.9, 0.8], [True, False], 1)["accuracy"] is None
    checks.append("separate localization and abstention denominators")
    return {"checks": checks, "passed": len(checks), "pool": POOL,
            "ranked": ranked, "ranked_log_product": logged,
            "beam1": b1, "beam2": b2, "uct": visits,
            "localization": metrics,
            "scope": "Constructed finite search fixtures; no large-model reproduction"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    text = json.dumps(verify(), indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf8")
    print(text)


if __name__ == "__main__":
    main()
