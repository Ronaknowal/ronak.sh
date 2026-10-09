"""N9: constructed pixels, two anomaly coordinates, time order and noise targets."""

import json
from pathlib import Path
import numpy as np


def pixel_patterns():
    mean = np.full((3, 3), 0.5)
    first = np.zeros((3, 3))
    second = np.zeros((3, 3))
    first[0, :2] = [1 / np.sqrt(2), -1 / np.sqrt(2)]
    second[2, :2] = [1 / np.sqrt(2), -1 / np.sqrt(2)]
    return mean, first, second


def decode_pixels(a, b, k):
    if k not in (1, 2) or not np.isfinite([a, b]).all() or max(abs(a), abs(b)) > 0.5:
        raise ValueError("Use weights in [-.5,.5] and kept count1 or2")
    mean, first, second = pixel_patterns()
    target = mean + a * first + b * second
    retained = mean + a * first + (b * second if k == 2 else 0)
    return target, retained, float(np.sum((target - retained) ** 2))


def score_and_residual(point):
    x = np.asarray(point, dtype=float)
    if x.shape != (2,) or not np.isfinite(x).all():
        raise ValueError("Use one finite two-coordinate point")
    direction = np.ones(2) / np.sqrt(2)
    score = float(x @ direction)
    foot = score * direction
    return score**2, float(np.sum((x - foot) ** 2)), foot


def noise_targets(magnitude, perpendicular=True):
    if not np.isfinite(magnitude) or magnitude < 0:
        raise ValueError("Use a finite nonnegative noise magnitude")
    clean = np.array([2.0, 2.0])
    noise = magnitude * np.array([1.0, -1.0 if perpendicular else 1.0])
    noisy = clean + noise
    _, _, decoded = score_and_residual(noisy)
    return (
        noisy,
        decoded,
        float(np.sum((clean - decoded) ** 2)),
        float(np.sum((noisy - decoded) ** 2)),
    )


def main():
    from sklearn.decomposition import PCA

    np.set_printoptions(precision=6, suppress=True)
    mean, first, second = pixel_patterns()
    # Row-major flattening preserves each pixel's named location.
    images = np.array(
        [
            (mean + a * first + b * second).reshape(-1)
            for a, b in ((-0.4, -0.2), (-0.4, 0.2), (0.4, -0.2), (0.4, 0.2))
        ]
    )
    fitted = PCA(n_components=1, svd_solver="full").fit(images)
    target, retained, loss = decode_pixels(0.3, -0.2, 1)
    ordinary = fitted.inverse_transform(
        fitted.transform(target.reshape(1, -1))
    ).reshape(3, 3)
    print("pixel_target", target)
    print("pixel_retained_and_loss", retained, loss)
    print("pixel_ordinary_decoder_equal", np.allclose(retained, ordinary))
    print("pixel_full_kept_loss", decode_pixels(0.3, -0.2, 2)[2])
    for name, point in (("P", [3, 3]), ("Q", [3, -3])):
        print("alarm_score2_residual2_foot", name, score_and_residual(point))
    for perpendicular in (True, False):
        print(
            "noise_perpendicular_noisy_decoded_cleanloss_inputloss",
            perpendicular,
            noise_targets(1, perpendicular),
        )
    chronological = np.array([[0, 0], [1, 1], [2, -1], [3, 0]], dtype=float)
    permutation = [0, 2, 1, 3]
    reordered = chronological[permutation]
    print("chronological_and_permuted_rows", chronological, reordered)
    print(
        "covariance_permutation_equal",
        np.allclose(np.cov(chronological.T), np.cov(reordered.T)),
    )
    print(
        "path_squared_steps",
        np.sum(np.diff(chronological, axis=0) ** 2),
        np.sum(np.diff(reordered, axis=0) ** 2),
    )
    saved = json.loads(
        (Path(__file__).parent / "pca_saved_state.json").read_text(encoding="utf-8")
    )
    print(
        "saved_gaussian_first_two_and_population",
        sum(saved["gaussianSpectrum"]["ratios"][:2]),
        0.1,
    )


if __name__ == "__main__":
    main()
