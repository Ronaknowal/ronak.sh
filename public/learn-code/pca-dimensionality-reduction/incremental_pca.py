"""N6: mean-corrected dense row batches with separately retained total scatter."""

from dataclasses import dataclass, field
import numpy as np


@dataclass
class IncrementalCenteredPCA:
    k: int
    n: int = 0
    mean: np.ndarray | None = None
    singular_values: np.ndarray = field(default_factory=lambda: np.empty(0))
    directions: np.ndarray | None = None
    feature_scatter: np.ndarray | None = None

    def partial_fit(self, values):
        batch = np.array(values, dtype=float, copy=True)
        if (
            batch.ndim != 2
            or batch.shape[0] == 0
            or batch.shape[1] == 0
            or not np.isfinite(batch).all()
        ):
            raise ValueError("Use a nonempty finite dense row batch")
        b, d = batch.shape
        if (
            isinstance(self.k, bool)
            or not isinstance(self.k, (int, np.integer))
            or not 0 <= self.k <= d
        ):
            raise ValueError("Use an integer kept count between zero and d")
        if self.n == 0 and b < max(2, self.k):
            raise ValueError("The first batch needs at least max(2,k) rows")
        if self.n and d != self.mean.size:
            raise ValueError("Feature count changed between batches")
        batch_mean = batch.mean(axis=0)
        centered = batch - batch_mean
        batch_scatter = np.sum(centered**2, axis=0)
        if self.n == 0:
            stack = centered
            next_mean = batch_mean
            next_scatter = batch_scatter
        else:
            difference = self.mean - batch_mean
            weight = self.n * b / (self.n + b)
            correction = np.sqrt(weight) * difference
            old_factor = self.singular_values[:, None] * self.directions
            stack = np.vstack((old_factor, centered, correction))
            next_mean = self.mean + b / (self.n + b) * (batch_mean - self.mean)
            next_scatter = self.feature_scatter + batch_scatter + weight * difference**2
        if not np.isfinite(stack).all() or not np.isfinite(next_scatter).all():
            raise ValueError("Scatter update overflowed; rescale the measurements")
        _, singular_values, vh = np.linalg.svd(stack, full_matrices=False)
        self.singular_values = singular_values[: self.k].copy()
        self.directions = vh[: self.k].copy()
        self.mean = next_mean
        self.feature_scatter = next_scatter
        self.n += b
        return self

    @property
    def variances(self):
        if self.n < 2:
            raise ValueError("No fitted sample variance")
        return self.singular_values**2 / (self.n - 1)

    @property
    def variance_ratios(self):
        total = np.sum(self.feature_scatter) if self.n else 0.0
        return None if total == 0 else self.singular_values**2 / total

    def transform(self, values):
        if self.n == 0:
            raise ValueError("Fit a training batch first")
        rows = np.asarray(values, dtype=float)
        if (
            rows.ndim != 2
            or rows.shape[1] != self.mean.size
            or not np.isfinite(rows).all()
        ):
            raise ValueError("Use finite query rows in the fitted feature order")
        return (rows - self.mean) @ self.directions.T

    def inverse_transform(self, scores):
        if self.n == 0:
            raise ValueError("Fit a training batch first")
        z = np.asarray(scores, dtype=float)
        if z.ndim != 2 or z.shape[1] != self.k or not np.isfinite(z).all():
            raise ValueError("Use a finite query-by-k score table")
        return z @ self.directions + self.mean


def main():
    from sklearn.decomposition import IncrementalPCA, PCA

    np.set_printoptions(precision=6, suppress=True)
    opposite = IncrementalCenteredPCA(1)
    opposite.partial_fit([[-2], [-2]]).partial_fit([[2], [2]])
    print(
        "opposite_means_mean_singular_variance",
        opposite.mean,
        opposite.singular_values,
        opposite.variances,
    )
    x = np.array([[0, 0], [2, 0], [0, 2], [1, 1]], dtype=float)
    scratch = IncrementalCenteredPCA(2).partial_fit(x[:3]).partial_fit(x[3:])
    ordinary = IncrementalPCA(n_components=2)
    ordinary.partial_fit(x[:3])
    ordinary.partial_fit(x[3:])
    exact = PCA(n_components=2, svd_solver="full").fit(x)
    print("smaller_tail_rows", x[3:].shape[0])
    print(
        "full_history_variance_equal",
        np.allclose(scratch.variances, exact.explained_variance_),
    )
    print(
        "ordinary_mean_variance_equal",
        np.allclose(scratch.mean, ordinary.mean_),
        np.allclose(scratch.variances, ordinary.explained_variance_),
    )
    print(
        "full_history_roundtrip",
        np.allclose(scratch.inverse_transform(scratch.transform(x)), x),
    )
    horizontal = np.array([[-np.sqrt(6), 0], [np.sqrt(6), 0]])
    vertical = np.array([[0, -2], [0, 2]], dtype=float)
    all_rows = np.vstack((horizontal, vertical, vertical))
    for name, batches in (
        ("horizontal_first", (horizontal, vertical, vertical)),
        ("vertical_first", (vertical, vertical, horizontal)),
    ):
        state = IncrementalCenteredPCA(1)
        library = IncrementalPCA(n_components=1)
        for batch in batches:
            state.partial_fit(batch)
            library.partial_fit(batch)
        print(name + "_projector", state.directions.T @ state.directions)
        print(
            name + "_retained_total_energy",
            state.singular_values**2,
            np.sum(state.feature_scatter),
        )
        print(
            name + "_global_loss",
            np.sum(
                (all_rows - state.inverse_transform(state.transform(all_rows))) ** 2
            ),
        )
        print(
            name + "_ordinary_projector_equal",
            np.allclose(
                state.directions.T @ state.directions,
                library.components_.T @ library.components_,
            ),
        )


if __name__ == "__main__":
    main()
