"""Supplied-coefficient history rosters, baseline and path calculations."""

import json
from math import log
import numpy as np
from cox_history import (prepare_history, active_rows, history_terms,
                         history_baseline, history_path_survival)
from history_observation import entry_kaplan_meier, landmark_rows


def main():
    entry = entry_kaplan_meier([0, 1, 2, 0], [3, 4, 5, 6], [True, False, True, False])
    data = prepare_history(['A', 'A', 'B'], [0, 3, 1], [3, 5, 6],
                           [False, True, False], [[0], [1], [0]])
    beta = np.array([log(2.)])
    rosters = {str(t): [{'id': data.ids[i], 'maintained': float(data.features[i, 0] + data.origin[0])}
                       for i in active_rows(data, t)] for t in (3., 3.5, 5.)}
    terms = history_terms(beta, data, trace=True)
    baseline = history_baseline(beta, data, feature_names=('maintained',), reference=[0.])
    path = history_path_survival(baseline, [0, 3], [3, 6], [[0], [1]], [5], feature_names=('maintained',))
    # Separate table exposes entrant=C at the exact day3 failure.
    changed = entry_kaplan_meier([0, 1, 3, 0], [3, 4, 5, 6], [True, False, True, False])
    print(json.dumps({'original_entry_steps': entry, 'history_rosters': rosters,
                      'supplied_beta': beta.tolist(), 'history_log_likelihood': terms.log_likelihood,
                      'history_score': terms.score.tolist(), 'history_information': terms.information.tolist(),
                      'reference_breslow_increment': np.exp(baseline.log_increments).tolist(),
                      'prescribed_path_S5': path['survival'].tolist(), 'changed_entry_steps': changed}, sort_keys=True))
    # Landmark example: maintenance at3, no maintenance, failure2,
    # observation ending4, maintenance5 respectively. Every feature is dated.
    rows = landmark_rows(['A','B','C','D','E'], [5,6,2,4,8],
                         [True,False,True,False,True], [3,np.inf,np.inf,np.inf,5], 3.)
    print(json.dumps({'landmark_day': 3., 'known_survivors': rows}, sort_keys=True))


if __name__ == '__main__':
    main()
