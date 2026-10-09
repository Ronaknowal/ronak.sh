"""Scalar two-column projection and exact prerequisite SVD reuse, N2."""

from math import atan2, cos, fsum, hypot, isfinite, sin, sqrt
import numpy as np
from matrix_decomposition_scratch import two_column_svd


def scalar_pca(rows, tie_tolerance=1e-12):
    points = [tuple(map(float, row)) for row in rows]
    if len(points) < 2 or any(
        len(row) != 2 or not all(map(isfinite, row)) for row in points
    ):
        raise ValueError("Expected at least two finite two-coordinate rows")
    if not isfinite(tie_tolerance) or tie_tolerance < 0:
        raise ValueError("Tie tolerance must be finite and nonnegative")
    n = len(points)
    mean = tuple(fsum(row[j] for row in points) / n for j in range(2))
    centered = [(x - mean[0], y - mean[1]) for x, y in points]
    xx = fsum(x * x for x, _ in centered) / (n - 1)
    xy = fsum(x * y for x, y in centered) / (n - 1)
    yy = fsum(y * y for _, y in centered) / (n - 1)
    if not all(map(isfinite, (xx, xy, yy))):
        raise ValueError("Covariance arithmetic overflowed; use a smaller scale")
    gap = hypot(xx - yy, 2 * xy)
    eigenvalues = ((xx + yy + gap) / 2, (xx + yy - gap) / 2)
    zero = xx + yy == 0
    tied = not zero and gap <= tie_tolerance * max(map(abs, eigenvalues))
    # At a tie, this is explicitly one representative, not a preferred axis.
    angle = 0.0 if zero or tied else atan2(2 * xy, xx - yy) / 2
    directions = ((cos(angle), sin(angle)), (-sin(angle), cos(angle)))
    scores = [tuple(x * a + y * b for a, b in directions) for x, y in centered]
    return {
        "mean": mean,
        "centered": centered,
        "covariance": ((xx, xy), (xy, yy)),
        "variances": eigenvalues,
        "directions": directions,
        "scores": scores,
        "status": "zero_energy" if zero else "tied" if tied else "unique_leading_axis",
    }


def reused_svd_pca(rows, orthogonality_tolerance=1e-12, max_rotations=8):
    x = np.asarray(rows, dtype=float)
    if x.ndim != 2 or x.shape[0] < 2 or x.shape[1] != 2 or not np.isfinite(x).all():
        raise ValueError("Expected finite n-by-2 input, n>=2")
    if not isfinite(orthogonality_tolerance) or orthogonality_tolerance < 0:
        raise ValueError("Orthogonality tolerance must be finite and nonnegative")
    if (
        isinstance(max_rotations, bool)
        or not isinstance(max_rotations, int)
        or max_rotations <= 0
    ):
        raise ValueError("Rotation budget must be a positive integer")
    mean = x.mean(axis=0)
    centered = x - mean
    scatter = centered.T @ centered
    if not np.isfinite(centered).all() or not np.isfinite(scatter).all():
        raise ValueError("Helper supports finite representable centered dot sums")
    u, singular, v, rotations = two_column_svd(
        centered.tolist(), orthogonality_tolerance, max_rotations
    )
    u, singular, v = np.array(u), np.array(singular), np.array(v)
    if not all(np.isfinite(array).all() for array in (u, singular, v)):
        raise ValueError("Nonfinite factorization result")
    rank_threshold = np.finfo(float).eps * max(x.shape) * singular[0]
    return {
        "mean": mean,
        "directions": v.T,
        "singular_values": singular,
        "scores": centered @ v,
        "rotations": rotations,
        "rank_threshold": rank_threshold,
        "numerical_rank": int(np.count_nonzero(singular > rank_threshold)),
        "factor_residual": np.linalg.norm(centered - (u * singular) @ v.T),
    }


def square_projection(angle_degrees, kept):
    if (
        not isfinite(angle_degrees)
        or not 0 <= angle_degrees <= 180
        or kept not in (0, 1, 2)
    ):
        raise ValueError("Angle must be in[0,180]; kept count in{0,1,2}")
    angle = angle_degrees * np.pi / 180
    directions = np.array([[cos(angle), sin(angle)], [-sin(angle), cos(angle)]])[:kept]
    square = np.array([[-1, -1], [-1, 1], [1, -1], [1, 1]], dtype=float)
    scores = square @ directions.T
    recovered = scores @ directions
    return (
        directions.T @ directions,
        recovered,
        float(np.sum((square - recovered) ** 2)),
    )


def dependence_moments():
    records = [(-1, 1), (0, 0), (1, 1)]
    eu = fsum(u for u, _ in records) / 3
    ew = fsum(w for _, w in records) / 3
    covariance = fsum(u * w for u, w in records) / 3 - eu * ew
    conditional = sum(u == 0 and w == 0 for u, w in records) / sum(
        w == 0 for _, w in records
    )
    return eu, ew, covariance, conditional, 1 / 3, 1 / 9


def main():
    from sklearn.decomposition import PCA

    np.set_printoptions(precision=6, suppress=True)
    fixtures = {
        "original": [[1, 1], [2, 0], [4, 4], [5, 3]],
        "collinear": [[-2, -2], [-1, -1], [1, 1], [2, 2]],
        "constant": [[3, 2]] * 4,
        "square": [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    }
    for name, rows in fixtures.items():
        scalar = scalar_pca(rows)
        reused = reused_svd_pca(rows)
        print(
            name,
            "status",
            scalar["status"],
            "singular",
            reused["singular_values"],
            "rank",
            reused["numerical_rank"],
        )
        print(name, "factor_residual", reused["factor_residual"])
        if scalar["status"] == "unique_leading_axis":
            direction = np.array(scalar["directions"][0])
            ordinary = PCA(n_components=1, svd_solver="full").fit(rows).components_[0]
            print(
                name,
                "leading_projector_equal",
                np.allclose(
                    np.outer(direction, direction), np.outer(ordinary, ordinary)
                ),
            )
    for angle in (0, 45, 90):
        for kept in (0, 1, 2):
            projector, recovered, loss = square_projection(angle, kept)
            print(
                "square", angle, kept, "loss", round(loss, 12), "projector", projector
            )
    print("dependence_EU_EW_cov_cond_marg_product", dependence_moments())


if __name__ == "__main__":
    main()
