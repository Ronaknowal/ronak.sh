"""Complete positive-rank whitening adapter after its mechanism in §10.3."""

from dataclasses import dataclass
import numpy as np
from centered_pca import CenteredPCA, real_table


@dataclass(frozen=True)
class WhitenedPCA:
    base: CenteredPCA
    factors: np.ndarray

    @classmethod
    def from_fitted(cls, base):
        k = base.directions.shape[0]
        if np.any(base.singular_values[:k] <= base.rank_threshold):
            raise ValueError("Whitening a numerically zero retained direction is undefined")
        factors = np.sqrt(base.variances[:k]).copy()
        if not np.isfinite(factors).all() or np.any(factors <= 0):
            raise ValueError("Whitening needs finite positive retained variance")
        factors.setflags(write=False)
        return cls(base, factors)

    @classmethod
    def fit(cls, values, k):
        return cls.from_fitted(CenteredPCA.fit(values, k))

    def transform(self, values):
        scores = self.base.transform(values) / self.factors
        if not np.isfinite(scores).all():
            raise ValueError("Whitening overflowed; rescale the query")
        return scores

    def inverse_transform(self, values):
        k = self.base.directions.shape[0]
        scores = real_table(values, k) if k else np.asarray(values, dtype=float)
        if scores.ndim != 2 or scores.shape[1] != k or not np.isfinite(scores).all():
            raise ValueError("Expected finite query-by-kept-count whitened coordinates")
        return self.base.inverse_transform(scores * self.factors)


def main():
    x = np.array([[1, 1], [2, 0], [4, 4], [5, 3]], dtype=float)
    white = WhitenedPCA.fit(x, 2)
    print("whitened_sample_variance", np.var(white.transform(x), axis=0, ddof=1))
    print("whitened_population_variance", np.var(white.transform(x), axis=0, ddof=0))


if __name__ == "__main__":
    main()
