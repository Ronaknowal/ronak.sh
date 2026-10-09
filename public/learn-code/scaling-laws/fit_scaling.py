"""Fit a released conditional curve and a separately constructed joint grid.
Run: python fit_scaling.py --output fit-results.json
Requires NumPy and SciPy; keep repetition-curve.csv beside this file.
"""
import argparse
import csv
import json
from pathlib import Path
import numpy as np
from scipy.optimize import least_squares


def predict_and_jacobian(theta, x):
    """Positive coefficients/exponents via logs; raw-loss residual objective."""
    positive = np.exp(theta)
    if len(theta) == 3:
        floor, amplitude, exponent = positive
        term = amplitude * x[:, 0] ** -exponent
        prediction = floor + term
        jacobian = np.column_stack([np.full(len(x), floor), term, -term * exponent * np.log(x[:, 0])])
    else:
        floor, a, b, alpha, beta = positive
        n_term = a * x[:, 0] ** -alpha
        d_term = b * x[:, 1] ** -beta
        prediction = floor + n_term + d_term
        jacobian = np.column_stack([np.full(len(x), floor), n_term, d_term,
                                   -n_term * alpha * np.log(x[:, 0]), -d_term * beta * np.log(x[:, 1])])
    return prediction, jacobian


def fit_scratch(x, y, start, iterations=1000):
    """Damped Gauss-Newton: linearize predictions, solve, accept only improvement."""
    theta = np.log(np.asarray(start, dtype=float))
    damping = 1e-3
    for step in range(iterations):
        prediction, jacobian = predict_and_jacobian(theta, x)
        residual = prediction - y
        gradient = jacobian.T @ residual
        if np.linalg.norm(gradient, ord=np.inf) < 1e-10:
            break
        matrix = jacobian.T @ jacobian + damping * np.eye(len(theta))
        direction = np.linalg.solve(matrix, -gradient)
        proposed = np.clip(theta + direction, -12, 12)
        next_residual = predict_and_jacobian(proposed, x)[0] - y
        if next_residual @ next_residual < residual @ residual:
            theta = proposed
            damping = max(1e-12, damping / 3)
        else:
            damping = min(1e12, damping * 5)
    prediction, jacobian = predict_and_jacobian(theta, x)
    return {"parameters": np.exp(theta).tolist(), "theta": theta,
            "sse": float(np.sum((prediction - y) ** 2)), "steps": step + 1,
            "jacobian_singular_values": np.linalg.svd(jacobian, compute_uv=False).tolist()}


def fit_library(x, y, start):
    result = least_squares(lambda theta: predict_and_jacobian(theta, x)[0] - y,
                           np.log(start), jac=lambda theta: predict_and_jacobian(theta, x)[1],
                           bounds=(-12, 12), xtol=1e-12, ftol=1e-12, gtol=1e-12, max_nfev=2000)
    if not result.success:
        raise RuntimeError(result.message)
    return result.x


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    with Path(__file__).with_name("repetition-curve.csv").open(encoding="utf-8", newline="") as stream:
        rows = list(csv.DictReader(stream))
    x = np.array([[float(row["tokens"]) / float(row["unique_tokens"])] for row in rows])
    y = np.array([float(row["validation_nats"]) for row in rows])
    fit = np.array([row["role"] == "fit" for row in rows])
    starts = [[2, 1, .5], [1, 2, .2], [2.5, .8, 1]]
    trials = [fit_scratch(x[fit], y[fit], start) for start in starts]
    best = min(trials, key=lambda item: item["sse"])
    library = fit_library(x[fit], y[fit], starts[0])
    predicted = predict_and_jacobian(best["theta"], x)[0]
    ordinary = predict_and_jacobian(library, x)[0]
    np.testing.assert_allclose(predicted, ordinary, atol=1e-6)

    # A known synthetic factorial grid checks the separate five-parameter mechanism.
    grid = np.array([(n, d) for n in [1, 2, 4, 8, 16, 32] for d in [1, 2, 4, 8, 16, 32]], dtype=float)
    known = [1, 2, 3, .5, .25]
    synthetic_y = predict_and_jacobian(np.log(known), grid)[0]
    synthetic = fit_scratch(grid, synthetic_y, [.8, 1.5, 2.5, .4, .3])
    synthetic_library = fit_library(grid, synthetic_y, [.8, 1.5, 2.5, .4, .3])
    np.testing.assert_allclose(synthetic["parameters"], known, rtol=1e-5)
    np.testing.assert_allclose(np.exp(synthetic_library), known, rtol=1e-5)
    fixed_n = grid[grid[:, 0] == 1]
    fixed_jac = predict_and_jacobian(np.log(known), fixed_n)[1]
    fixed_rank = int(np.linalg.matrix_rank(fixed_jac))
    assert fixed_rank < 5
    result = {
        "real_curve": {"parameters_E_A_beta": best["parameters"], "fit_sse": best["sse"],
                       "heldout_mae": float(np.mean(np.abs(predicted[~fit] - y[~fit]))),
                       "scipy_parameters": np.exp(library).tolist(),
                       "trials": [{k: v for k, v in trial.items() if k != "theta"} for trial in trials],
                       "observations": [{**row, "predicted": float(p), "residual": float(p - actual)}
                                        for row, p, actual in zip(rows, predicted, y)]},
        "synthetic_grid": {"known": known, "recovered": synthetic["parameters"],
                           "scipy_recovered": np.exp(synthetic_library).tolist(),
                           "full_rank": int(np.linalg.matrix_rank(predict_and_jacobian(np.log(known), grid)[1])),
                           "fixed_N_rank": fixed_rank, "rows": len(grid)},
    }
    text = json.dumps(result, indent=2)
    if args.output:
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
