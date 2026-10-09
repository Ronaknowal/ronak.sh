"""N6: direct and externally whitened ordinary APIs on the same new fixture."""
import warnings
import numpy as np
from sklearn.decomposition import FastICA
from sklearn.exceptions import ConvergenceWarning
from constructed_sources import constructed_sources
from population_whitening import PopulationWhitening
from align_and_evaluate import Alignment, evaluate


def fit_status(model, values):
    with warnings.catch_warnings(record=True) as captured:
        warnings.simplefilter("always", ConvergenceWarning)
        model.fit(values)
    converged = not any(issubclass(item.category, ConvergenceWarning) for item in captured)
    return model, converged, [str(item.message) for item in captured]


def main():
    f = constructed_sources()
    training = f.observations[f.train]
    common = dict(algorithm="parallel", fun="logcosh", fun_args={"alpha": 1.},
                  max_iter=1000, tol=1e-5, random_state=7)
    direct, direct_ok, messages = fit_status(FastICA(n_components=2, whiten="unit-variance", whiten_solver="svd", **common), training)
    white = PopulationWhitening.fit(training, 2)
    external, external_ok, external_messages = fit_status(FastICA(n_components=None, whiten=False, **common), white.transform(training))
    print("direct_converged", direct_ok, "warnings", messages, "iterations", direct.n_iter_)
    print("external_converged", external_ok, "warnings", external_messages, "iterations", external.n_iter_)
    if not direct_ok or not external_ok:
        print("evaluation_available", False)
        return
    raw_B = external.components_ @ white.K
    raw_decoder = white.decoder @ external.mixing_
    print("direct_attributes", "mean", direct.mean_, "components", direct.components_, "mixing", direct.mixing_)
    print("external_W", external.components_, "composed_raw_B", raw_B,
          "has_mean", hasattr(external, "mean_"), "has_whitening", hasattr(external, "whitening_"))
    query = f.observations[f.test]
    direct_scores = direct.transform(query)
    external_scores = external.transform(white.transform(query))
    print("direct_roundtrip_max", np.max(np.abs(direct.inverse_transform(direct_scores) - query)))
    print("external_roundtrip_max", np.max(np.abs(external_scores @ raw_decoder.T + white.mean - query)))
    print("raw_composition_equal", np.allclose(external_scores, (query - white.mean) @ raw_B.T))
    projector_direct = direct.mixing_ @ direct.components_
    projector_external = raw_decoder @ raw_B
    print("retained_projectors_equal", np.allclose(projector_direct, projector_external))
    for name, scores, calibration_scores in [
        ("direct", direct_scores, direct.transform(f.observations[f.calibration])),
        ("external", external_scores, external.transform(white.transform(f.observations[f.calibration])))]:
        mapping = Alignment.fit(f.sources[f.calibration], calibration_scores)
        print(name, "calibration_columns", mapping.columns, "unique", mapping.assignment_unique,
              "test", evaluate(f.sources[f.test], mapping.transform(scores)))


if __name__ == "__main__":
    main()
