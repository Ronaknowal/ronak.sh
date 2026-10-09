"""N9: a source score times a decoder column is a channel contribution."""
import numpy as np
from sklearn.decomposition import FastICA
from constructed_sources import constructed_sources
from fastica_scratch import FastICAFit
from fastica_library import fit_status


def main():
    a, source = np.array([[3., 1.], [1., 1.]]), np.array([3., -4.])
    pieces = a * source[None, :]
    print("manual_contributions", pieces, "sum", pieces.sum(1), "remove_first", pieces[:, 1])
    print("compensated_first", (-2*source[0]) * (a[:, 0]/-2))
    q, b = 2., -3.
    leakage = .2
    first_column = np.array([2., -1.])
    print("unwanted_removed", leakage*q*first_column, "clean_error", -leakage*q*first_column,
          "mixed_component", b + leakage*q)
    f = constructed_sources()
    fitted = FastICAFit.fit(f.observations[f.train], 2)
    query = f.observations[f.test][:3]
    scores = fitted.transform(query)
    pieces = fitted.contributions(scores)
    print("learned_shape_q_d_k", pieces.shape,
          "sum_plus_mean_equal_inverse", np.allclose(pieces.sum(axis=2) + fitted.mean, fitted.inverse_transform(scores)))
    ordinary, ok, warnings = fit_status(FastICA(n_components=2, whiten="unit-variance", random_state=7,
                                              max_iter=1000, tol=1e-5, whiten_solver="svd"), f.observations[f.train])
    print("library_converged", ok, "warnings", warnings)
    if ok:
        ordinary_scores = ordinary.transform(query)
        ordinary_pieces = ordinary_scores[:, None, :] * ordinary.mixing_[None, :, :]
        print("ordinary_same_fit_inverse", np.allclose(ordinary_pieces.sum(2)+ordinary.mean_, ordinary.inverse_transform(ordinary_scores)))
    print("remove_first", fitted.remove(query, [0]))
    from population_whitening import PopulationWhitening
    plane = np.column_stack([f.observations[f.train], np.zeros(2400)])
    reduced = PopulationWhitening.fit(plane, 2)
    query3 = np.array([[1., 2., 3.]])
    projected = reduced.inverse_transform(reduced.transform(query3))
    print("retained_projection", projected, "residual", query3-projected,
          "restore_residual_policy", projected+(query3-projected))
    try:
        fitted.remove(query, [0, 0])
    except ValueError as error:
        print("refused", str(error))


if __name__ == "__main__":
    main()
