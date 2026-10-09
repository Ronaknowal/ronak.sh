"""One matched ordinary cycle, then one separately declared public toy fit."""
import warnings
import numpy as np
from sklearn.exceptions import ConvergenceWarning
from sklearn.mixture import GaussianMixture
from gaussian_em import block_update, toy_rows, toy_state


def ordinary_model(max_iter):
    return GaussianMixture(n_components=2, covariance_type="full", weights_init=np.array([.5, .5]),
                           means_init=np.array([[-1, 0], [1, 0]]), precisions_init=np.array([np.eye(2), np.eye(2)]),
                           n_init=1, random_state=16, reg_covar=.05, tol=1e-8, max_iter=max_iter)


def main():
    rows = toy_rows()
    scratch = block_update(rows, toy_state(), block_size=2, regularization=.05)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always", ConvergenceWarning)
        one = ordinary_model(1).fit(rows)
    print("one-cycle convergence", bool(one.converged_))
    print("one-cycle convergence-warning count", sum(isinstance(w.message, ConvergenceWarning) for w in caught))
    print("one-cycle mean max error", float(np.max(np.abs(scratch.means - one.means_))))
    print("one-cycle covariance max error", float(np.max(np.abs(scratch.covariances - one.covariances_))))
    print("one-cycle current score", one.score(rows))
    print("one-cycle recorded lower bound", float(one.lower_bound_))
    print("one-cycle posterior max error", float(np.max(np.abs(scratch.predict_proba(rows) - one.predict_proba(rows)))))
    final = ordinary_model(50).fit(rows)
    print("ordinary full toy convergence", bool(final.converged_), "iterations", int(final.n_iter_))
    print("ordinary full toy means", final.means_.tolist())
    print("ordinary full toy covariance", final.covariances_.tolist())
    print("ordinary full toy current score", final.score(rows))
    print("ordinary query scores", final.score_samples([[0, 0], [.5, 0], [3, 1]]).tolist())
    print("ordinary query responsibilities", final.predict_proba([[0, 0], [.5, 0], [3, 1]]).tolist())


if __name__ == "__main__":
    main()
