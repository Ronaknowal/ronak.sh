"""Inspect likelihood coordinates on new tiny fixtures, not classifier tuning."""
import json
import numpy as np
from scipy.special import logsumexp, softmax
from scipy.optimize import minimize


def token_objective(z_free, counts):
    counts = np.asarray(counts, dtype=float)
    z_free = np.asarray(z_free, dtype=float)
    if (counts.ndim != 1 or len(counts) < 2 or z_free.shape != (len(counts) - 1,)
            or not np.isfinite(counts).all() or (counts < 0).any() or counts.sum() <= 0
            or not np.isfinite(z_free).all()):
        raise ValueError("Use nonnegative counts and K-1 finite logits; last logit is fixed at zero")
    z = np.r_[z_free, 0.]
    theta = softmax(z)
    value = counts.sum() * logsumexp(z) - counts @ z
    gradient = (counts.sum() * theta - counts)[:-1]
    return float(value), gradient


def gaussian_objective(parameters, readings):
    readings = np.asarray(readings, dtype=float)
    parameters = np.asarray(parameters, dtype=float)
    if (readings.ndim != 1 or not len(readings) or not np.isfinite(readings).all()
            or (np.abs(readings) > 1e6).any() or parameters.shape != (2,)
            or not np.isfinite(parameters).all() or not -50 <= parameters[1] <= 50):
        raise ValueError("Use finite bounded readings and (mean, log-variance) with eta in [-50,50]")
    mu, eta = parameters
    variance = np.exp(eta)
    residual = readings - mu
    squares = residual @ residual
    value = .5 * (len(readings) * (np.log(2 * np.pi) + eta) + squares / variance)
    gradient = np.array([-residual.sum() / variance, len(readings) / 2 - squares / (2 * variance)])
    if not np.isfinite(value) or not np.isfinite(gradient).all():
        raise ValueError("Likelihood exceeds arithmetic range")
    return float(value), gradient


def central_difference(function, point, h=1e-5):
    point = np.asarray(point, dtype=float)
    basis = np.eye(len(point)) * h
    return np.array([(function(point + step)[0] - function(point - step)[0]) / (2 * h)
                     for step in basis])


def summary(result):
    return {"success": bool(result.success), "status": int(result.status),
            "iterations": int(result.nit), "parameters": result.x.tolist(),
            "objective": float(result.fun), "gradient_norm": float(np.linalg.norm(result.jac)),
            "message": str(result.message)}


def main():
    counts = np.array([2., 1., 1.])
    token = lambda z: token_objective(z, counts)
    start = np.array([.2, -.1])
    analytic = token(start)[1]
    numeric = central_difference(token, start)
    assert np.allclose(analytic, numeric, atol=1e-9)
    fit = minimize(token, start, jac=True, method="BFGS", options={"gtol": 1e-10, "maxiter": 200})
    readings = np.array([1., 2., 3.])
    gaussian = lambda p: gaussian_objective(p, readings)
    point = np.array([1.5, .2])
    g_numeric = central_difference(gaussian, point)
    assert np.allclose(gaussian(point)[1], g_numeric, atol=1e-9)
    gfit = minimize(gaussian, point, jac=True, method="L-BFGS-B", bounds=[(None, None), (-50, 50)],
                    options={"gtol": 1e-10, "ftol": 1e-15, "maxiter": 200})
    capped = minimize(token, start, jac=True, method="BFGS", options={"maxiter": 1})
    z = np.r_[start, 0.]
    gauge_value = lambda v: counts.sum() * logsumexp(v) - counts @ v
    print(json.dumps({"counts": counts.tolist(), "token_start": start.tolist(),
                     "token_gradient": analytic.tolist(), "token_finite_difference": numeric.tolist(),
                     "common_shift_objective_difference": float(gauge_value(z + 7) - gauge_value(z)),
                     "token_fit": summary(fit), "token_theta": softmax(np.r_[fit.x, 0.]).tolist(),
                     "closed_form_theta": (counts / counts.sum()).tolist(),
                     "smoothed_mean_alpha_1": ((counts + 1) / (counts.sum() + 3)).tolist(),
                     "gaussian_gradient": gaussian(point)[1].tolist(),
                     "gaussian_finite_difference": g_numeric.tolist(), "gaussian_fit": summary(gfit),
                     "closed_form_mean_variance": [float(readings.mean()), float(readings.var())],
                     "capped_token_fit": summary(capped)}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
