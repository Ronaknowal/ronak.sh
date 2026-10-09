"""A two-coordinate, one-shift DPFP contrast; no sampling or training.

Run with NumPy: python deterministic-product-features.py
The output order is (++), (-+), (--), (+-). These are features of a
different kernel, not estimates of the exponential dot-product kernel.
"""

import numpy as np


def deterministic_product_features(coordinates):
    """Map finite (..., 2) coordinates to nonnegative (..., 4) features.

    Keep positive parts of [k1, k2, -k1, -k2], then multiply each entry by
    its next cyclic neighbor. Reject overflow rather than returning a
    misleading finite-memory state. Zero features remain valid features;
    a normalized read still requires positive query/key overlap.
    """
    if np.iscomplexobj(coordinates):
        raise ValueError("Expected real coordinates, not complex coordinates.")
    x = np.asarray(coordinates, dtype=np.float64)
    if x.ndim == 0 or x.shape[-1] != 2 or not np.isfinite(x).all():
        raise ValueError("Expected finite coordinates with final width two.")
    signed_parts = np.maximum(np.concatenate((x, -x), axis=-1), 0.0)
    with np.errstate(over="ignore", invalid="ignore"):
        features = signed_parts * np.roll(signed_parts, -1, axis=-1)
    if not np.isfinite(features).all():
        raise ValueError("Coordinate products overflowed the feature dtype.")
    return features


def main():
    keys = np.array([[1., 1.], [-1., 1.], [-1., -1.], [1., -1.]])
    features = deterministic_product_features(keys)
    np.testing.assert_array_equal(features, np.eye(4))
    np.testing.assert_array_equal(features @ features.T, np.eye(4))
    # Enlarging the feature width does not make every original key distinct.
    np.testing.assert_array_equal(
        deterministic_product_features([2., .5]), features[0])
    zero_query = deterministic_product_features([1., 0.])
    np.testing.assert_array_equal(zero_query, np.zeros(4))
    assert float(zero_query @ features.sum(axis=0)) == 0.0
    # This zero denominator is undefined: do not silently divide by epsilon.
    values = np.array([2., -1., 3., 4.])
    memory = features.T @ values
    normalizer = features.sum(axis=0)
    query = deterministic_product_features([1., -1.])
    assert float(query @ memory / (query @ normalizer)) == 4.0
    # Same-quadrant keys collide and their messages combine in this state.
    duplicate_keys = deterministic_product_features([[1., 1.], [2., .5]])
    amount = features[0] @ duplicate_keys.T
    assert float(amount @ [2., 6.] / amount.sum()) == 4.0
    for invalid in ([1.], [np.nan, 0.], [1e308, 1e308], np.array([1 + 1j, 0])):
        try:
            deterministic_product_features(invalid)
        except ValueError:
            continue
        raise AssertionError("Expected invalid shape, real/finite value or overflow rejection.")
    print("PASS: four distinct directions, collision, zero support, reads and validation")


if __name__ == "__main__":
    main()
