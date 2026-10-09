"""Supplied log-joint/q decomposition and one explained E/M cycle, no trainer."""
import numpy as np
from gaussian_mixture import GaussianMixtureState, logsumexp_rows
from fractional_gaussian_update import scalar_step


def bound_parts(log_joint, q):
    log_joint = np.asarray(log_joint, dtype=float)
    q = np.asarray(q, dtype=float)
    if q.shape != log_joint.shape or q.ndim != 2 or not np.isfinite(q).all() or np.any(q < 0) or not np.allclose(q.sum(axis=1), 1, rtol=0, atol=1e-12):
        raise ValueError("same-shaped log joint and normalized nonnegative q rows required")
    normalizer = logsumexp_rows(log_joint)
    positive = q > 0
    entropy = -float(np.sum(q[positive] * np.log(q[positive])))
    expected_joint = float(np.sum(q[positive] * log_joint[positive]))
    log_posterior = log_joint - normalizer[:, None]
    kl = float(np.sum(q[positive] * (np.log(q[positive]) - log_posterior[positive])))
    return {"Q": expected_joint, "H": entropy, "F": expected_joint + entropy,
            "L": float(normalizer.sum()), "KL": kl,
            "status": "unsupported q term" if np.isneginf(expected_joint) else "finite"}


def main():
    joint = np.log([[.3, .1]])
    for shares in [[.5, .5], [.75, .25], [0, 1]]:
        print("one-row decomposition", bound_parts(joint, [shares]))
    print("support mismatch", bound_parts([[np.log(.3), -np.inf]], [[.5, .5]]))
    rows = np.array([-2, -1, 1, 2])[:, None]
    old = GaussianMixtureState([.5, .5], [[-1], [1]], [[[1]], [[1]]])
    q = old.predict_proba(rows)
    weights, means, variance, raw = scalar_step(rows[:, 0], q)
    new = GaussianMixtureState(weights, means[:, None], variance[:, None, None])
    print("old touching bound", bound_parts(old.log_joint(rows), q))
    print("new bound with old q", bound_parts(new.log_joint(rows), q))
    print("new touching bound", bound_parts(new.log_joint(rows), new.predict_proba(rows)))


if __name__ == "__main__":
    main()
