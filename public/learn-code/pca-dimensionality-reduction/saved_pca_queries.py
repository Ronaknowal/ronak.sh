"""N4: legal algebraic queries of saved Wine compression state; no fitting."""

import json
from pathlib import Path
import numpy as np


def load_state(directory=None):
    folder = Path(directory) if directory is not None else Path(__file__).parent
    state = json.loads((folder / "pca_saved_state.json").read_text(encoding="utf-8"))
    csv = np.loadtxt(folder / "wine.csv", delimiter=",", skiprows=1)
    rows = np.asarray(state["wineRows"], dtype=float)
    if csv.shape != (178, 14) or not np.array_equal(csv[:, 1:], rows):
        raise ValueError("Wine CSV measurements differ from the saved state")
    if not np.array_equal(csv[:, 0], state["wineCultivar"]):
        raise ValueError("Wine cultivar mapping differs from the saved state")
    return state


def branch_arrays(branch, k):
    mean = np.asarray(branch["mean"], dtype=float)
    scale = np.asarray(branch["scale"], dtype=float)
    directions = np.asarray(branch["components"], dtype=float)
    if (
        isinstance(k, bool)
        or not isinstance(k, (int, np.integer))
        or not 0 <= k <= directions.shape[0]
    ):
        raise ValueError("Choose an integer kept count within the saved basis")
    if (
        not np.isfinite(mean).all()
        or not np.isfinite(scale).all()
        or np.any(scale <= 0)
    ):
        raise ValueError("Saved means/scales must be finite, with positive scales")
    return mean, scale, directions[:k]


def project_query(values, branch, k):
    mean, scale, directions = branch_arrays(branch, k)
    rows = np.asarray(values, dtype=float)
    if rows.ndim != 2 or rows.shape[1] != mean.size or not np.isfinite(rows).all():
        raise ValueError("Use finite query rows in the saved feature order")
    standardized = (rows - mean) / scale
    # The saved projection convention uses zero post-standardization PCA mean.
    scores = standardized @ directions.T
    return standardized, scores


def decode(scores, branch, k):
    _, _, directions = branch_arrays(branch, k)
    z = np.asarray(scores, dtype=float)
    if z.ndim != 2 or z.shape[1] != k or not np.isfinite(z).all():
        raise ValueError("Scores must be a finite query-by-kept-count table")
    return z @ directions


def inverse_scale(standardized, branch):
    mean, scale, _ = branch_arrays(branch, 0)
    rows = np.asarray(standardized, dtype=float)
    if rows.ndim != 2 or rows.shape[1] != mean.size or not np.isfinite(rows).all():
        raise ValueError("Use finite standardized rows in the saved feature order")
    return rows * scale + mean


def budget_crossing(loss_ratios, budget):
    if not np.isfinite(budget) or budget < 0:
        raise ValueError("Budget must be finite and nonnegative")
    return next((k for k, value in enumerate(loss_ratios) if value <= budget), None)


def main():
    np.set_printoptions(precision=6, suppress=True)
    state = load_state()
    rows = np.asarray(state["wineRows"], dtype=float)
    full = state["wineFullFit"]
    split = state["wineSplit"]
    default_query = rows[[0]].copy()
    changed_query = default_query.copy()
    changed_query[0, 0] += 0.5
    changed_query[0, -1] -= 100.0
    for name, query in (("default", default_query), ("changed", changed_query)):
        standardized, scores = project_query(query, full, 2)
        rebuilt = inverse_scale(decode(scores, full, 2), full)
        print(name + "_full_collection_scores", scores)
        print(name + "_full_collection_reconstruction", rebuilt)
        print(
            name + "_standardized_query_loss",
            np.sum((standardized - decode(scores, full, 2)) ** 2),
        )
    selected_row = split["validation"][0]
    _, scores = project_query(rows[[selected_row]], split, 8)
    print("validation_position0_row_index", selected_row)
    print(
        "training_state_k8_reconstruction",
        inverse_scale(decode(scores, split, 8), split),
    )
    for budget in (0.1, 0.06, 0.0):
        print(
            "saved_budget_crossing",
            budget,
            budget_crossing(split["lossRatios"], budget),
        )
    for k, ratio in enumerate(split["lossRatios"]):
        print("saved_validation_loss", k, ratio, ratio * split["baselineMse"])



if __name__ == "__main__":
    main()
