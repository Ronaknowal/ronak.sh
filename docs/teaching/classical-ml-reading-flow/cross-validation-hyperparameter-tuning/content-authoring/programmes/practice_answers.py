"""Optional worked numerical answers to the thirteen added transfer tasks.

Imports only displayed, guarded new helpers. Does not run the old experiments.
"""
from fractions import Fraction as F
from math import comb
import json
import numpy as np
from fold_fitted_pipeline import fit_prepare, transform
from split_information_contracts import source_positions
from search_results_and_refit import constructed_table, select_table
from bootstrap_the_whole_statistic import whole_statistic, wrong_occurrence_split_accuracy
from resource_tournaments import hyperband_brackets


def f1(tp, fn, fp, tn):
    denominator = 2 * tp + fp + fn
    return F(2 * tp, denominator) if denominator else F(0)


def answers():
    state = fit_prepare([[0], [2], [None], [4]])
    first = transform(state, [[10], [None]])[:, 0]
    changed = transform(state, [[100], [None]])[:, 0]
    result = {"N1": {"median": state.medians, "mean": state.means, "variance": state.variances,
                     "held": first.tolist(), "changed_held": changed.tolist(),
                     "state_unchanged_by_transform": state == fit_prepare([[0], [2], [None], [4]])}}
    confusion = [(1, 1, 0, 0), (0, 0, 1, 1)]
    result["N2"] = {"fold_F1": [str(f1(*row)) for row in confusion],
                    "mean": str(sum(f1(*row) for row in confusion) / 2),
                    "pooled": str(f1(*(sum(row[i] for row in confusion) for i in range(4))))}
    result["N3"] = {"row_accuracy": str(F(4, 5)), "person_accuracy": str((F(4, 4) + F(0, 1)) / 2)}
    events = [0, 1, 2, 5, 8, 9]
    result["N4"] = {str(delay): [i for i, event in enumerate(events) if event < 5 and event + delay <= 5]
                    for delay in [3, 4]}
    result["N5"] = {"source_IDs": source_positions([1, 3, 5, 7, 9, 11, 13, 15], [0, 2, 4, 6])}
    result["N6"] = {"without_replacement": str(1 - F(comb(4, 3), comb(6, 3))),
                    "independent_replacement": str(1 - F(4, 6)**3)}
    result["N7"] = {"small_branch_per_setting": str(F(1, 2) / 2), "large_branch_per_setting": str(F(1, 2) / 8)}
    table = constructed_table()
    choices = {}
    for cap in [5, 2, 10]:
        try:
            choices[str(cap)] = select_table(table, cap)
        except ValueError as error:
            choices[str(cap)] = {"refusal": str(error)}
    table[0]["accuracy"] = [.90, .95, .85]
    choices["changed_A_cap10"] = select_table(table, 10)
    result["N8"] = choices
    result["N9"] = {"mean_variance": str(F(1, 5) + F(4, 5) / 5), "independent": str(F(1, 5))}
    masses, held_means = [F(1, 4), F(1, 2), F(1, 4)], [F(0), F(1, 2), F(1)]
    discrepancy = sum(p * (F(1, 4) - h)**2 for p, h in zip(masses, held_means))
    holdout_variance = sum(p * (h - F(1, 2))**2 for p, h in zip(masses, held_means))
    result["N10"] = {"discrepancy": str(discrepancy), "held_variance": str(holdout_variance),
                     "MSE": str(discrepancy - holdout_variance), "single_outcome_subtraction": str(F(1, 16) - F(1, 8))}
    initial, changed_boot = whole_statistic([0, 0, 2, 2]), whole_statistic([0, 1, 2, 3])
    result["N11"] = {"default_grouped_accuracy": initial["candidates"][0]["pooled"],
                     "wrong_occurrence_accuracy": wrong_occurrence_split_accuracy([0, 0, 2, 2]),
                     "default_T": initial["T"], "changed_T": changed_boot["T"],
                     "changed_k1_correct": [row["correct"] for row in changed_boot["candidates"][0]["folds"]],
                     "undefined_mass": str(F(4, 4**4)), "conditional_defined_denominator": 252}
    smax, allowance, brackets = hyperband_brackets(9, 3)
    result["N12"] = {"smax": smax, "B": allowance, "brackets": brackets,
                     "fresh_total": str(sum(row["fresh"] for row in brackets)),
                     "continuation_total_if_real": str(sum(row["continuation_if_real"] for row in brackets))}
    result["N13"] = {"preserved_row_protocol": "340/344 pooled; separate final selection/refit; new-island/next-season unestablished",
                     "required_new_evidence": "Feasible representative island/time units, label availability and a predeclared protected assessment"}
    # Independent hand values guard the answers; no unchanged historical fit runs.
    assert np.allclose(first, [4 * np.sqrt(2), 0]) and np.allclose(changed, [49 * np.sqrt(2), 0])
    assert result["N2"]["mean"] == "1/3" and result["N2"]["pooled"] == "1/2"
    assert result["N5"]["source_IDs"] == [1, 5, 9, 13]
    assert result["N6"] == {"without_replacement": "4/5", "independent_replacement": "19/27"}
    assert discrepancy == F(3, 16) and holdout_variance == F(1, 8)
    assert initial["T"] == 1 and changed_boot["T"] == 0
    assert result["N12"]["fresh_total"] == "78" and result["N12"]["continuation_total_if_real"] == "69"
    return result


def main():
    for task, answer in answers().items():
        print(task, json.dumps(answer, default=str))


if __name__ == "__main__":
    main()
