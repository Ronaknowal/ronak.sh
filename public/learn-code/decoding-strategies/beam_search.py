"""A complete beam with separate alive, completed and capped hypotheses.

python beam_search.py
All EOS children are eligible for the finished pool: this deliberate teaching
variant differs from native rank-limited EOS admission. Beam width1 therefore
need not equal greedy decoding. No model fitting is performed by the default.
"""

import json
import math
import numpy as np
from sampling import probabilities, log_probabilities


def final_score(item, alpha):
    return item["log_p"] / len(item["ids"]) ** alpha


def beam_search(logits_function, prompt_ids, width=2, max_new_tokens=32,
                eos_id=0, alpha=0.0):
    if width < 1 or max_new_tokens < 1 or alpha < 0:
        raise ValueError("Positive width/horizon and nonnegative length exponent required")
    alive = [{"ids": [], "log_p": 0.0, "ancestry": []}]
    finished, capped, trace = [], [], []
    reason = "cap"
    for depth in range(max_new_tokens):
        children = []
        new_finished = []
        scored_cells = 0
        for parent_index, parent in enumerate(alive):
            log_p = log_probabilities(logits_function([*prompt_ids, *parent["ids"]]))
            scored_cells += len(log_p)
            for token in np.flatnonzero(np.isfinite(log_p)):
                child = {"ids": [*parent["ids"], int(token)],
                         "log_p": parent["log_p"] + float(log_p[token]),
                         "ancestry": [*parent["ancestry"], parent_index]}
                if token == eos_id:
                    new_finished.append(child)
                else:
                    children.append(child)
        finished = sorted([*finished, *new_finished],
                          key=lambda row: (-final_score(row, alpha), row["ids"]))[:width]
        children.sort(key=lambda row: (-row["log_p"], row["ids"]))
        alive = children[:width]
        best_bound = max((row["log_p"] / max_new_tokens ** alpha for row in alive),
                         default=-math.inf)
        record = {"depth": depth + 1, "scored_cells": scored_cells,
                  "candidate_count": len(children) + len(new_finished),
                  "kept": alive, "finished": finished,
                  "pruned_count": max(0, len(children) - width),
                  "alive_upper_bound": best_bound if alive else None}
        trace.append(record)
        if finished and final_score(finished[0], alpha) >= best_bound:
            reason = "retained_frontier_bound"
            break
        if not alive:
            reason = "no_alive_prefix"
            break
    else:
        capped = sorted(alive, key=lambda row: (-final_score(row, alpha), row["ids"]))
    # Report a genuine completion when available, otherwise a visibly capped prefix.
    selected = finished[0] if finished else (capped[0] if capped else None)
    return {"selected": selected, "selected_status": "eos" if finished else "cap",
            "search_stop_reason": reason, "finished": finished, "capped": capped,
            "trace": trace, "alpha": alpha, "width": width}


def finite_logits(prefix):
    """IDs: EOS0,A1,B2,X3,Y4. All complete path mass sums to1."""
    if not prefix:
        p = [.05, .6, .35, 0, 0]
    elif prefix[-1] == 1:
        p = [.15, 0, 0, .45, .4]
    elif prefix[-1] == 2:
        p = [.1, 0, 0, .9, 0]
    else:
        p = [1, 0, 0, 0, 0]
    result = np.full(5, -np.inf)
    positive = np.asarray(p) > 0
    result[positive] = np.log(np.asarray(p)[positive])
    return result


def exhaustive(logits_function, max_new_tokens=3, eos_id=0):
    complete = []
    def visit(ids, score):
        if ids and ids[-1] == eos_id:
            complete.append({"ids": ids, "log_p": score})
            return
        if len(ids) == max_new_tokens:
            return
        for token, probability in enumerate(probabilities(logits_function(ids))):
            if probability > 0:
                visit([*ids, token], score + math.log(float(probability)))
    visit([], 0.0)
    return sorted(complete, key=lambda row: (-row["log_p"], row["ids"]))


def main():
    print(json.dumps({"beam": beam_search(finite_logits, [], max_new_tokens=3),
                      "exhaustive": exhaustive(finite_logits)}, indent=2))


if __name__ == "__main__":
    main()
