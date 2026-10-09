"""Fit tuning loss against training mixture, with a fixed simplex gauge.

Requires NumPy and SciPy. Run `python fit_mixture_response.py` for an explicitly
constructed exact-family fixture. The measured study imports these same routines.
We fit c + exp(b + t1*r1 + t2*r2), with r3=1-r1-r2. No extra free amplitude.
"""
import json
import numpy as np
from scipy.optimize import least_squares

LOWER = np.array([0.0, -8.0, -10.0, -10.0])
UPPER = np.array([8.0, 3.0, 10.0, 10.0])
STARTS = [np.array([0., 1., 0., 0.]), np.array([2., 0., 0., 0.]),
          np.array([3., -1., -1., 1.])]


def simplex_grid(divisions=4):
    if not isinstance(divisions, int) or divisions < 1:
        raise ValueError("Positive integer grid divisions required")
    return np.array([[a / divisions, b / divisions, (divisions - a - b) / divisions]
                     for a in range(divisions + 1) for b in range(divisions + 1 - a)])


def response(parameters, mixtures):
    p = np.asarray(parameters, dtype=np.float64)
    r = np.asarray(mixtures, dtype=np.float64)
    if p.shape != (4,) or r.ndim != 2 or r.shape[1] != 3:
        raise ValueError("Four parameters and three mixture coordinates required")
    if not np.isfinite(p).all() or not np.isfinite(r).all() or (r < 0).any() or not np.allclose(r.sum(1), 1):
        raise ValueError("Finite simplex coordinates required")
    return p[0] + np.exp(p[1] + r[:, :2] @ p[2:])


def objective(parameters, mixtures, losses):
    residual = response(parameters, mixtures) - losses
    return float(np.mean(residual * residual))


def coordinate_fit(mixtures, losses, iterations=800):
    """Bounded derivative-free coordinate search, multiple declared starts.

    A transparent small fit, not a globally optimal optimizer. Complexity is
    O(starts * iterations * 4 * n_observations); dimension is fixed here.
    """
    losses = np.asarray(losses, dtype=np.float64)
    if losses.shape != (len(mixtures),) or not np.isfinite(losses).all() or len(losses) < 4:
        raise ValueError("At least four finite tuning observations required")
    candidates = []
    for start in STARTS:
        params = start.copy()
        step = np.array([.5, .25, .5, .5])
        best = objective(params, mixtures, losses)
        for _ in range(iterations):
            improved = False
            for coordinate in range(4):
                for sign in (-1, 1):
                    proposed = params.copy()
                    proposed[coordinate] = np.clip(params[coordinate] + sign * step[coordinate],
                                                    LOWER[coordinate], UPPER[coordinate])
                    value = objective(proposed, mixtures, losses)
                    if value < best:
                        params, best, improved = proposed, value, True
            if not improved:
                step *= .5
            if step.max() < 1e-7:
                break
        candidates.append((best, params))
    best, params = min(candidates, key=lambda item: item[0])
    return params, best


def library_fit(mixtures, losses):
    candidates = []
    for start in STARTS:
        result = least_squares(lambda p: response(p, mixtures) - losses, start,
                               bounds=(LOWER, UPPER), max_nfev=3000,
                               xtol=1e-11, ftol=1e-11, gtol=1e-11)
        candidates.append((objective(result.x, mixtures, losses), result.x, bool(result.success)))
    error, params, success = min(candidates, key=lambda item: item[0])
    return params, error, success


def fit_domains(mixtures, tuning_losses):
    r = np.asarray(mixtures)
    losses = np.asarray(tuning_losses)
    held_coordinates = np.array([[0, .5, .5], [.5, 0, .5], [.5, .5, 0]])
    held = np.array([any(np.allclose(row, x) for x in held_coordinates) for row in r])
    if held.sum() != 3 or (~held).sum() != 12 or losses.shape != (15, 3):
        raise ValueError("The locked study uses15mixtures,12fit and3held-out coordinates")
    models = []
    for domain in range(3):
        scratch, scratch_error = coordinate_fit(r[~held], losses[~held, domain])
        native, native_error, success = library_fit(r[~held], losses[~held, domain])
        models.append({"scratch_parameters": scratch.tolist(), "scratch_fit_mse": scratch_error,
                       "library_parameters": native.tolist(), "library_fit_mse": native_error,
                       "library_success": success,
                       "held_mse": objective(native, r[held], losses[held, domain]),
                       "held_predictions": response(native, r[held]).tolist(),
                       "held_observed": losses[held, domain].tolist()})
    candidates = simplex_grid(20)
    predictions = np.stack([response(m["library_parameters"], candidates) for m in models], axis=1)
    index = int(np.argmin(predictions.mean(axis=1)))
    return {"fit_mask": (~held).tolist(), "models": models,
            "evaluation_shares": [1 / 3] * 3, "candidate_grid_divisions": 20,
            "selected": candidates[index].tolist(),
            "predicted_tuning_mean": float(predictions[index].mean())}


def main():
    mixtures = simplex_grid(4)
    known = np.array([2., .5, -.4, .3])
    observations = response(known, mixtures)
    scratch, scratch_error = coordinate_fit(mixtures, observations)
    library, library_error, success = library_fit(mixtures, observations)
    print(json.dumps({"kind": "constructed exact-family fixture, not measured training",
                      "scratch_parameters": scratch.tolist(), "scratch_mse": scratch_error,
                      "library_parameters": library.tolist(), "library_mse": library_error,
                      "library_success": success}, indent=2))


if __name__ == "__main__":
    main()
