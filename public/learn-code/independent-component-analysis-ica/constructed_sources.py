"""Declared new finite fixture; independent generators are not exact sample moments."""
from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class ConstructedSources:
    sources: np.ndarray
    observations: np.ndarray
    operator: np.ndarray
    offset: np.ndarray
    train: slice
    calibration: slice
    test: slice


def constructed_sources():
    s = np.column_stack([np.random.default_rng(17).laplace(0., 1/np.sqrt(2), 4000),
                         np.random.default_rng(23).uniform(-np.sqrt(3), np.sqrt(3), 4000)])
    a = np.array([[1., .5], [-.25, 2.]])
    offset = np.array([3., -2.])
    x = s @ a.T + offset
    for array in [s, a, offset, x]:
        array.setflags(write=False)
    return ConstructedSources(s, x, a, offset, slice(0, 2400), slice(2400, 3200), slice(3200, 4000))
