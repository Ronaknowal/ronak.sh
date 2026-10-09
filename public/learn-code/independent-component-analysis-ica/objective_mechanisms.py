"""N10: density Jacobian, stable chosen logistic likelihood and local curvature.

This is neither a general likelihood ICA optimizer nor Picard reimplementation.
"""
import numpy as np
from centered_pca import real_table
from joint_probability import summarize


def logistic_log_density(values):
    y = np.asarray(values, dtype=float)
    if not np.isfinite(y).all():
        raise ValueError("Expected finite source coordinates")
    scale = np.sqrt(3) / np.pi  # Logistic variance pi^2 scale^2 / 3 = 1.
    u = y / scale
    result = -np.log(scale) - np.logaddexp(0., u) - np.logaddexp(0., -u)
    if not np.isfinite(result).all():
        raise ValueError("Log density overflowed")
    return result


def log_likelihood(values, B):
    x, b = real_table(values), real_table(B)
    if b.shape != (x.shape[1], x.shape[1]):
        raise ValueError("The Jacobian route needs a square unmixing operator")
    sign, logdet = np.linalg.slogdet(b)
    if sign == 0 or not np.isfinite(logdet):
        raise ValueError("Nonsingular finite determinant required")
    sources = x @ b.T
    terms = logistic_log_density(sources)
    rows = logdet + terms.sum(axis=1)
    total = float(rows.sum())
    if len(x) == 0 or not np.isfinite(total):
        raise ValueError("Need finite nonempty likelihood rows")
    return {"log_absolute_determinant": float(logdet), "row_log_density": rows,
            "dataset_log_likelihood": total, "negative_row_average": -total/len(x)}


def curvature_direction(H, gradient, floor=.1):
    h, g = real_table(H), np.asarray(gradient, float)
    if h.shape[0] != h.shape[1] or g.shape != (len(h),) or not np.isfinite(g).all() or not np.allclose(h, h.T) or not np.isfinite(floor) or floor <= 0:
        raise ValueError("Expected symmetric square curvature, finite gradient and positive floor")
    minimum = np.linalg.eigvalsh(h)[0]
    shift = max(0., floor-minimum)
    shifted = h + shift*np.eye(len(h))
    direction = -np.linalg.solve(shifted, g)
    if not np.isfinite(direction).all():
        raise ValueError("Curvature solve overflowed")
    return direction, shift, np.linalg.eigvalsh(shifted)


def main():
    law = summarize([[0., 1/3], [1/3, 0.], [0., 1/3]], [-1., 0., 1.], [0., 1.])
    print("dependent_finite_MI_nats", law["mi_nats"])
    source_area, source_density = 1., 1.
    area_factors = [
        ("A_source_to_observation", abs(np.linalg.det(np.diag([2., 1.])))),
        ("B_observation_to_source", 1. / abs(np.linalg.det(np.diag([2., 1.]))))]
    for direction, area_factor in area_factors:
        observation_area = source_area * area_factor
        observation_density = source_density / area_factor
        print("Jacobian_density_demo", direction,
              "source_area", source_area, "source_density", source_density,
              "observation_area", observation_area, "observation_density", observation_density,
              "mass", observation_area * observation_density)
    print("chosen_logistic_likelihood", log_likelihood([[.2, -.3], [1., 2.]], [[2., 0.], [0., 1.]]))
    h, v = np.array([[2., 1.], [1., 3.]]), np.array([1., -1.])
    g = h @ v
    direction, shift, eigenvalues = curvature_direction(h, g)
    objective = lambda p: float(p @ h @ p/2)
    print("quadratic_gradient", g, "raw_negative_gradient", -g, "preconditioned", direction,
          "F_start", objective(v), "F_half", objective(v+.5*direction), "F_full", objective(v+direction))
    print("indefinite_shift", curvature_direction([[.5, 1.], [1., .5]], [1., -1.]))
    outlier_rows = np.array([[-3., -3.], [-1., 1.], [1., -1.], [3., 3.], [100., 0.]])
    centered = outlier_rows-outlier_rows.mean(0)
    print("outlier_mean", outlier_rows.mean(0), "sum_outer", centered.T@centered,
          "population_covariance", centered.T@centered/len(centered))
    try:
        log_likelihood([[1., 2., 3.]], [[1., 0., 0.], [0., 1., 0.]])
    except ValueError as error:
        print("refused", str(error))


if __name__ == "__main__":
    main()
