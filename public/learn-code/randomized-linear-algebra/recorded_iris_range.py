"""A recorded 150-by-4 covariance/PCA range study, without a fitted classifier.

Python 3.12, NumPy 2.3.5 and scikit-learn 1.9.1. Download the corrected Iris CSV
and its provenance note from the Eigenvalues lesson; pass its path with --data.
The first four columns are measurements in centimetres. Species is excluded.
This is a small exact-reference error comparison, not a timing benchmark.
The earlier QR/SVD lessons explain the library primitives used below.
"""

import argparse
import hashlib
from pathlib import Path

import numpy as np
from sklearn.utils.extmath import randomized_svd


def two_pass_factor(A, omega, k, power_rounds=0):
    """Return final factors and Q for a bounded real tall full-rank fixture.

    k<=omega.shape[1]<=min(A.shape); power_rounds is nonnegative integer.
    QR after each A/A.T action avoids explicitly forming odd matrix powers.
    This ordinary library mechanism is not a general rank-revealing owner.
    """
    Q = np.linalg.qr(A @ omega, mode="reduced")[0]
    for _ in range(power_rounds):
        Z = np.linalg.qr(A.T @ Q, mode="reduced")[0]
        Q = np.linalg.qr(A @ Z, mode="reduced")[0]
    small = Q.T @ A
    u, s, vt = np.linalg.svd(small, full_matrices=False)
    return Q @ u[:, :k], s[:k], vt[:k], Q


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, type=Path)
    args = parser.parse_args()
    raw = args.data.read_bytes()
    expected_sha = "5a8853b2e82f9d021e5843af7d647339e359b25e037ec6e87e23ca9e91507821"
    if hashlib.sha256(raw).hexdigest() != expected_sha:
        raise ValueError("use the exact corrected Eigenvalues Iris CSV and provenance note")
    rows = np.loadtxt(args.data, delimiter=",", skiprows=1, usecols=(0, 1, 2, 3))
    assert rows.shape == (150, 4) and np.isfinite(rows).all()
    A = rows - rows.mean(axis=0)
    singular = np.linalg.svd(A, compute_uv=False)
    k, ell, seed = 1, 2, 7
    floor_squared = float(np.sum(singular[k:] ** 2))
    omega = np.random.RandomState(seed).standard_normal((4, ell))
    print("recorded rows / numeric columns / k / probe columns:", 150, 4, k, ell)
    print("column means (cm):", np.round(rows.mean(axis=0), 6).tolist())
    print("exact best-rank-one Frobenius floor (cm):", round(np.sqrt(floor_squared), 9))
    for q in (0, 1):
        u, s, vt, Q = two_pass_factor(A, omega, k, q)
        factor = (u * s) @ vt
        projection = Q @ (Q.T @ A)
        range_squared = float(np.linalg.norm(A - projection, "fro") ** 2)
        trunc_squared = float(np.linalg.norm(projection - factor, "fro") ** 2)
        total_squared = float(np.linalg.norm(A - factor, "fro") ** 2)
        assert np.isclose(total_squared, range_squared + trunc_squared, atol=1e-9)
        assert total_squared + 1e-9 >= floor_squared
        refu, refs, refvt = randomized_svd(
            A, n_components=k, n_oversamples=ell-k, n_iter=q,
            power_iteration_normalizer="QR", transpose=False, flip_sign=False,
            random_state=seed,
        )
        # Factors have sign freedom; compare their actual reconstruction.
        assert np.allclose(factor, (refu * refs) @ refvt, atol=1e-10)
        print("q / range squared / truncation squared / final squared (cm^2):",
              q, *(round(x, 9) for x in (range_squared, trunc_squared, total_squared)))
    print("seed and normalization:", seed, "same probe, intermediate QR")
