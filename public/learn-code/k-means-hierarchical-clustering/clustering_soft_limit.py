"""Fixed isotropic-mixture responsibilities: shifted exponentials and logsumexp."""
import numpy as np
from scipy.special import logsumexp
from clustering_core import points_array, squared_to_center


def logits(points, means, priors, sigma):
    points, means = points_array(points), points_array(means)
    priors = np.asarray(priors, dtype=float)
    if (points.shape[1] != means.shape[1] or priors.shape != (len(means),)
            or not np.isfinite(priors).all() or (priors <= 0).any()):
        raise ValueError("Use matching dimensions and one finite positive prior weight per mean.")
    if not np.isfinite(sigma) or sigma <= 0:
        raise ValueError("sigma must be finite and strictly positive.")
    distances = np.column_stack([squared_to_center(points, mean) for mean in means])
    # Subtract the nearest squared distance before dividing: a common shift
    # leaves normalized probabilities unchanged and keeps at least one finite
    # logit even for a very small positive variance.
    excess = distances - distances.min(axis=1, keepdims=True)
    with np.errstate(over="ignore", under="ignore", divide="ignore"):
        penalties = (excess / sigma) / sigma / 2
    return np.log(priors) - penalties


def responsibilities(points, means, priors, sigma):
    scores = logits(points, means, priors, sigma)
    weights = np.exp(scores - scores.max(axis=1, keepdims=True))
    return weights / weights.sum(axis=1, keepdims=True)


def ordinary_responsibilities(points, means, priors, sigma):
    scores = logits(points, means, priors, sigma)
    return np.exp(scores - logsumexp(scores, axis=1, keepdims=True))


def main():
    means = [[0.0], [2.0]]
    print("scratch / ordinary default:", responsibilities([[0.5]], means, [1, 1], 0.5).tolist(),
          ordinary_responsibilities([[0.5]], means, [1, 1], 0.5).tolist())
    for sigma in [1.0, 0.5, 0.1, 1e-200]:
        print("sigma / unique / tied responsibilities:", sigma,
              responsibilities([[0.5]], means, [3, 1], sigma).tolist(),
              responsibilities([[1.0]], means, [3, 1], sigma).tolist())


if __name__ == "__main__":
    main()
