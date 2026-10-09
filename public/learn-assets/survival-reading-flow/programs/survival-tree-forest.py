"""The eight-temperature hand example and a new seven-member scratch forest."""

import json
from math import exp

import numpy as np

from survival_forest_core import SurvivalTree, SurvivalForest
from survival_group_comparison import logrank_two_group
from survival_tree_splits import candidate_splits


def main():
    x = np.arange(8, dtype=float)[:, None]
    times = np.array([8, 9, 7, 6, 4, 3, 2, 5], dtype=float)
    events = np.array([True, False, True, False, True, True, True, False])
    cuts = list(candidate_splits(x, times, events, min_leaf=2))
    tree = SurvivalTree(max_depth=1, min_leaf=2, random_state=41).fit(x, times, events)
    root = tree.nodes[0]
    low = x[:, 0] <= root.threshold
    comparison = logrank_two_group(times[low].tolist(), events[low].tolist(),
                                  times[~low].tolist(), events[~low].tolist())
    prediction = tree.predict_curves([[1.], [6.]], [4., 5., 8.])
    forest = SurvivalForest(n_estimators=7, max_depth=2, min_leaf=2, random_state=41)
    forest.fit(x, times, events)
    ensemble = forest.predict_curves([[1.], [6.]], [4., 5.])
    oob = forest.oob_curves([4., 5.])
    # Explicitly supplied member states, not fitted curves or measured performance.
    member_survival = [.5, 1.]
    member_hazard = [.5, 0.]
    result = {
        "legal_cuts": [{"threshold": c.threshold, "left": c.left_count,
                        "right": c.right_count, "U": c.score, "V": c.variance,
                        "statistic": c.statistic} for c in cuts],
        "chosen_threshold": root.threshold,
        "logrank_steps": [{"day": s.time, "risk_left": s.risk1, "risk_right": s.risk0,
                           "failures_left": s.failures1, "failures_right": s.failures0,
                           "expected_left": s.expected1, "contribution": s.contribution,
                           "variance": s.variance1} for s in comparison.steps],
        "query_temperatures": [1., 6.], "tree_days": [4., 5., 8.],
        "tree_survival": prediction.survival.tolist(),
        "tree_cumulative_hazard": prediction.cumulative_hazard.tolist(),
        "tree_local_support_fraction": prediction.local_support_fraction.tolist(),
        "supplied_member_S": member_survival, "supplied_member_H": member_hazard,
        "mean_member_S": sum(member_survival)/2,
        "exp_negative_mean_member_H": exp(-sum(member_hazard)/2),
        "scratch_forest_members": 7,
        "scratch_forest_days": [4., 5.],
        "scratch_forest_survival": ensemble.survival.tolist(),
        "scratch_forest_hazard": ensemble.cumulative_hazard.tolist(),
        "scratch_forest_support_fraction": ensemble.local_support_fraction.tolist(),
        "bootstrap_subject_ids": [bag.tolist() for bag in forest.bootstrap_indices],
        "oob_member_counts_by_original_subject": oob.members.tolist(),
        "oob_survival": [[None if np.isnan(v) else float(v) for v in row] for row in oob.survival],
        "new_predictive_tree_fits": 8,
    }
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
