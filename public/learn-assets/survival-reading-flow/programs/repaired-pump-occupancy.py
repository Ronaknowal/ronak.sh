"""Two declared transition steps; arithmetic only, not a recurrent model fit."""

import json
import numpy as np
from history_observation import transition_from_counts, advance_occupancy


def main():
    # States working, failed/repairing, terminal. Constructed state-specific
    # counts encode the pictured fractions, not a reported observational study.
    first = transition_from_counts([10,0,0], [[0,4,1],[0,0,0],[0,0,0]])
    second = transition_from_counts([5,4,1], [[0,1,0],[2,0,1],[0,0,0]])
    p0 = np.array([1.,0.,0.])
    p1, p2 = advance_occupancy(p0, first), advance_occupancy(advance_occupancy(p0, first), second)
    ordinary = p0 @ first @ second
    first_entry_failure = .4 + .5 * .2
    print(json.dumps({'states': ['working','failed/repairing','terminal'],
                      'first_transition': first.tolist(), 'second_transition': second.tolist(),
                      'after_first': p1.tolist(), 'after_second': p2.tolist(),
                      'numpy_after_second': ordinary.tolist(), 'maximum_difference': float(np.max(np.abs(p2-ordinary))),
                      'ever_failed_by_second': first_entry_failure, 'currently_failed_after_second': float(p2[1])}, sort_keys=True))


if __name__ == '__main__':
    main()
