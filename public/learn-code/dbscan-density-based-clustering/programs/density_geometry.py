"""Copied transformations, explicit fitted state, and changed distance rules."""
from dataclasses import dataclass
import math
import numpy as np
from density_neighbourhoods import Neighbourhoods
from dbscan_on_demand import dbscan


def finite_table(rows):
    values = np.asarray(rows, dtype=float)
    if values.ndim != 2 or values.shape[0] == 0 or values.shape[1] == 0:
        raise ValueError("supply a nonempty row-by-feature table")
    if not np.isfinite(values).all():
        raise ValueError("features must be finite")
    return values.copy()


@dataclass(frozen=True)
class ScaleState:
    mean: tuple
    scale: tuple


def fit_standardizer(training_rows):
    rows = finite_table(training_rows)
    mean, scale = rows.mean(axis=0), rows.std(axis=0, ddof=0)
    if not np.isfinite(mean).all() or not np.isfinite(scale).all():
        raise ValueError("fitted moments exceed finite floating-point range")
    # A constant training column is centered, with scale1 rather than division0.
    scale = np.where(scale == 0, 1.0, scale)
    return ScaleState(tuple(map(float, mean)), tuple(map(float, scale)))


def transform(rows, state):
    values = finite_table(rows)
    mean, scale = np.asarray(state.mean), np.asarray(state.scale)
    if mean.shape != (values.shape[1],) or scale.shape != mean.shape:
        raise ValueError("fitted state must match the feature order and width")
    if not np.isfinite(mean).all() or not np.isfinite(scale).all() or np.any(scale <= 0):
        raise ValueError("fitted means must be finite and scales positive")
    result = (values - mean) / scale
    if not np.isfinite(result).all():
        raise ValueError("transformed values exceed finite floating-point range")
    return result


def uniform_conversion(provider, eps, factor):
    if isinstance(factor, bool) or not math.isfinite(factor) or factor <= 0:
        raise ValueError("unit factor must be positive and finite")
    if provider.metric != "euclidean":
        raise ValueError("uniform coordinate scaling here uses Euclidean lengths")
    converted = Neighbourhoods(tuple(tuple(factor*x for x in row) for row in provider.rows), provider.ids)
    return converted, eps * factor


def anisotropic_distance(vertical_scale):
    if not math.isfinite(vertical_scale) or vertical_scale <= 0:
        raise ValueError("vertical scale must be positive and finite")
    return math.hypot(1, vertical_scale)


def main():
    from sklearn.preprocessing import StandardScaler
    np.set_printoptions(precision=6, suppress=True)
    provider = Neighbourhoods(((0,0),(.5,0),(1,0),(1,0),(3,0)), tuple("ABCDE"))
    original = dbscan(provider, .5, 3)
    converted, converted_eps = uniform_conversion(provider, .5, 1000)
    assert dbscan(converted, converted_eps, 3).labels == original.labels
    print("uniform factor", 1000, "radius", converted_eps, "same labels", original.labels)
    print("anisotropic distance at scale1", anisotropic_distance(1))
    print("anisotropic distance at scale10", anisotropic_distance(10))
    training = np.array([[1,10],[2,20],[4,40],[5,50]], dtype=float)
    query = np.array([[3,90]], dtype=float)
    state = fit_standardizer(training)
    ordinary = StandardScaler().fit(training)  # Query never contributes moments.
    scratch_train, scratch_query = transform(training, state), transform(query, state)
    np.testing.assert_allclose(scratch_train, ordinary.transform(training), rtol=1e-13, atol=1e-13)
    np.testing.assert_allclose(scratch_query, ordinary.transform(query), rtol=1e-13, atol=1e-13)
    print("training IDs", ("T0","T1","T2","T3"))
    print("mean", np.asarray(state.mean))
    print("scale", np.asarray(state.scale))
    print("transformed training", scratch_train)
    print("held-out Q", scratch_query)
    print("constant-column scale", fit_standardizer([[2,1],[2,3]]).scale)


if __name__ == "__main__":
    main()
