"""Centered PCA assembly using a maintained dense SVD primitive, N1."""

from dataclasses import dataclass
import numpy as np


def real_table(values, features=None):
    raw = np.asarray(values)
    if raw.ndim != 2 or np.iscomplexobj(raw) or not np.issubdtype(raw.dtype, np.number):
        raise ValueError("Expected a real numerical row-by-feature table")
    table = np.array(raw, dtype=np.float64, copy=True)
    if not np.isfinite(table).all() or table.shape[1] == 0:
        raise ValueError("Expected finite values and at least one feature")
    if features is not None and table.shape[1] != features:
        raise ValueError("Query feature count differs from the fitted table")
    return table


@dataclass(frozen=True)
class CenteredPCA:
    mean: np.ndarray
    directions: np.ndarray
    singular_values: np.ndarray
    variances: np.ndarray
    total_energy: float
    numerical_rank: int
    rank_threshold: float
    n: int

    @classmethod
    def fit(cls, values, k):
        x = real_table(values)
        n, d = x.shape
        if (
            n < 2
            or isinstance(k, bool)
            or not isinstance(k, (int, np.integer))
            or not 0 <= k <= min(n, d)
        ):
            raise ValueError("Need n>=2 and integer 0<=k<=min(n,d)")
        mean = x.mean(axis=0)
        centered = x - mean
        if not np.isfinite(centered).all():
            raise ValueError("Centering overflowed; rescale the input")
        _, singular_values, vh = np.linalg.svd(centered, full_matrices=False)
        variances = singular_values**2 / (n - 1)
        energy = float(np.sum(centered * centered))
        if not np.isfinite(variances).all() or not np.isfinite(energy):
            raise ValueError("Squared energy overflowed; rescale the input")
        threshold = np.finfo(float).eps * max(n, d) * singular_values[0]
        rank = int(np.count_nonzero(singular_values > threshold))
        directions = vh[:k].copy()
        # Orient signs only for readable output; reconstructing is sign-invariant.
        for direction in directions:
            pivot = np.argmax(np.abs(direction))
            if direction[pivot] < 0:
                direction *= -1
        for array in (mean, directions, singular_values, variances):
            array.setflags(write=False)
        return cls(
            mean,
            directions,
            singular_values,
            variances,
            energy,
            rank,
            threshold,
            n,
        )

    @property
    def variance_ratios(self):
        if self.total_energy == 0:
            return None
        return self.singular_values**2 / self.total_energy

    def transform(self, values):
        x = real_table(values, self.mean.size)
        scores = (x - self.mean) @ self.directions.T
        if not np.isfinite(scores).all():
            raise ValueError("Projection overflowed; rescale the query")
        return scores

    def inverse_transform(self, values):
        scores = (
            real_table(values, self.directions.shape[0])
            if self.directions.shape[0]
            else np.asarray(values, dtype=float)
        )
        if (
            scores.ndim != 2
            or scores.shape[1] != self.directions.shape[0]
            or not np.isfinite(scores).all()
        ):
            raise ValueError("Expected finite q-by-k scores, including q-by-0 when k=0")
        recovered = scores @ self.directions + self.mean
        if not np.isfinite(recovered).all():
            raise ValueError("Decoding overflowed; rescale the scores")
        return recovered

    def projector(self):
        return self.directions.T @ self.directions


def main():
    from sklearn.decomposition import PCA

    np.set_printoptions(precision=6, suppress=True)
    x = np.array([[1, 1], [2, 0], [4, 4], [5, 3]], dtype=float)
    fitted = CenteredPCA.fit(x, 1)
    scores = fitted.transform(x)
    recovered = fitted.inverse_transform(scores)
    print("mean", fitted.mean)
    print("directions", fitted.directions)
    print("variances", fitted.variances)
    print("variance_ratios", fitted.variance_ratios)
    print("scores", scores)
    print("reconstructed", recovered)
    print("entry_mse", np.mean((x - recovered) ** 2))
    queries = np.array([[6, 4], [8, 4], [3, 2]], dtype=float)
    print("queries_reconstructed", fitted.inverse_transform(fitted.transform(queries)))
    ordinary = PCA(n_components=1, svd_solver="full").fit(x)
    print(
        "library_reconstruction_equal",
        np.allclose(recovered, ordinary.inverse_transform(ordinary.transform(x))),
    )
    full = CenteredPCA.fit(x, 2)
    print("k2_roundtrip", np.allclose(full.inverse_transform(full.transform(x)), x))
    mean_only = CenteredPCA.fit(x, 0)
    print("k0_scores_shape", mean_only.transform(x).shape)
    print("k0_reconstructed", mean_only.inverse_transform(mean_only.transform(x)))
    constant = CenteredPCA.fit(np.full((4, 2), 3.0), 0)
    print("constant_rank_and_ratios", constant.numerical_rank, constant.variance_ratios)


if __name__ == "__main__":
    main()
