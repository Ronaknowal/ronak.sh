"""N3: immutable population whitening using the exact taught PCA dependencies."""
from dataclasses import dataclass
import numpy as np
from centered_pca import CenteredPCA, real_table
from pca_whitening import WhitenedPCA


def frozen(array):
    result = np.array(array, dtype=float, copy=True)
    if not np.isfinite(result).all():
        raise ValueError("Nonfinite fitted quantity; rescale input")
    result.setflags(write=False)
    return result


@dataclass(frozen=True)
class PopulationWhitening:
    mean: np.ndarray
    K: np.ndarray
    decoder: np.ndarray
    n: int
    numerical_rank: int
    rank_threshold: float

    @classmethod
    def fit(cls, values, k):
        x = real_table(values)
        if isinstance(k, bool) or not isinstance(k, (int, np.integer)) or k < 1:
            raise ValueError("ICA requires a positive integer retained count")
        base = CenteredPCA.fit(x, k)
        if k > base.numerical_rank:
            raise ValueError("Retained count exceeds positive numerical rank")
        sample = WhitenedPCA.from_fitted(base)
        conversion = np.sqrt(base.n / (base.n - 1))
        K = conversion * base.directions / sample.factors[:, None]
        decoder = base.directions.T * sample.factors[None, :] / conversion
        return cls(frozen(base.mean), frozen(K), frozen(decoder), base.n,
                   base.numerical_rank, base.rank_threshold)

    def transform(self, values):
        x = real_table(values, self.mean.size)
        z = (x - self.mean) @ self.K.T
        if not np.isfinite(z).all():
            raise ValueError("Whitening query overflowed")
        return z

    def inverse_transform(self, values):
        z = real_table(values, len(self.K))
        result = z @ self.decoder.T + self.mean
        if not np.isfinite(result).all():
            raise ValueError("Whitening inverse overflowed")
        return result


def main():
    from mixing_and_ambiguity import S, A
    x = S @ A.T + [10., -3.]
    model = PopulationWhitening.fit(x, 2)
    z = model.transform(x)
    sample = WhitenedPCA.fit(x, 2).transform(x)
    print("training_mean", model.mean, "K", model.K, "decoder", model.decoder)
    print("population_covariance", z.T @ z / len(z))
    print("sample_adapter_population_variance", np.var(sample, axis=0))
    query = [[11., -4.]]
    print("query_white", model.transform(query), "query_roundtrip", model.inverse_transform(model.transform(query)))
    plane = np.column_stack([S, np.zeros(4)])
    fitted_plane = PopulationWhitening.fit(plane, 2)
    print("plane_query_retained", fitted_plane.inverse_transform(fitted_plane.transform([[1., -1., 1.]])))
    for label, values, k in [("rank", plane, 3), ("zero_count", x, 0), ("constant", np.ones((4, 2)), 1)]:
        try:
            PopulationWhitening.fit(values, k)
        except ValueError as error:
            print("refused", label, str(error))


if __name__ == "__main__":
    main()
