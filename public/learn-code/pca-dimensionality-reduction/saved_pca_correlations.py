"""Complete fitted-feature correlation calculation after its normalization in §7."""

import numpy as np
from saved_pca_queries import load_state, branch_arrays


def coefficient_correlations(rows, branch, component):
    mean, scale, directions = branch_arrays(branch, component + 1)
    standardized = (np.asarray(rows, dtype=float) - mean) / scale
    score = standardized @ directions[component]
    feature_centered = standardized - standardized.mean(axis=0)
    score_centered = score - score.mean()
    numerator = feature_centered.T @ score_centered
    denominator = np.sqrt(
        np.sum(feature_centered**2, axis=0) * np.sum(score_centered**2)
    )
    correlations = np.full(mean.shape, np.nan)
    np.divide(numerator, denominator, out=correlations, where=denominator > 0)
    # These are derived fitting-collection correlations, not new measured trials.
    return directions[component].copy(), correlations


def main():
    np.set_printoptions(precision=6, suppress=True)
    state = load_state()
    rows = np.asarray(state["wineRows"], dtype=float)
    coefficients, correlations = coefficient_correlations(rows, state["wineFullFit"], 0)
    print("pc1_coefficients", coefficients)
    print("pc1_derived_fitting_correlations", correlations)


if __name__ == "__main__":
    main()
