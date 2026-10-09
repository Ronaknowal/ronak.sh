"""Public finite-prior ordinary toy route and explicit finite-stick conventions."""
import numpy as np
from sklearn.mixture import BayesianGaussianMixture
from gaussian_em import toy_rows


def stick_masses(breaks, final_residual=False):
    breaks = np.asarray(breaks, dtype=float)
    if breaks.ndim != 1 or len(breaks) == 0 or not np.isfinite(breaks).all() or np.any((breaks < 0) | (breaks > 1)):
        raise ValueError("finite unit-interval break vector required")
    breaks = breaks.copy()
    if final_residual:
        breaks[-1] = 1
    remaining = 1.0
    masses = []
    for fraction in breaks:
        masses.append(remaining * fraction)
        remaining *= 1 - fraction
    masses = np.array(masses)
    normalized = masses / masses.sum() if masses.sum() > 0 else None
    return masses, remaining, normalized


def main():
    model = BayesianGaussianMixture(n_components=2, covariance_type="full",
                                    weight_concentration_prior_type="dirichlet_distribution",
                                    weight_concentration_prior=1, mean_precision_prior=1,
                                    mean_prior=np.zeros(2), degrees_of_freedom_prior=3,
                                    covariance_prior=np.eye(2), reg_covar=0,
                                    init_params="kmeans", n_init=1, random_state=16,
                                    max_iter=50, tol=1e-8).fit(toy_rows())
    print("ordinary finite convergence", bool(model.converged_), "iterations", int(model.n_iter_))
    print("ordinary finite concentrations", model.weight_concentration_.tolist())
    print("ordinary finite mean precision", model.mean_precision_.tolist())
    print("ordinary finite means", model.means_.tolist())
    print("ordinary finite degrees", model.degrees_of_freedom_.tolist())
    print("ordinary covariance representation", model.covariances_.tolist())
    print("ordinary expected-log scores", model.score_samples([[0, 0], [.5, 0], [3, 1]]).tolist())
    print("ordinary assignments", model.predict_proba([[0, 0], [.5, 0], [3, 1]]).tolist())
    samples, ids = model.sample(4)
    print("ordinary plug-in sample IDs", ids.tolist())
    print("ordinary plug-in samples", samples.tolist())
    for convention in [False, True]:
        masses, leftover, normalized = stick_masses([.5] * 6, convention)
        print("stick final-residual", convention, "emitted", masses.tolist(), "leftover", leftover, "normalized", normalized.tolist())


if __name__ == "__main__":
    main()
