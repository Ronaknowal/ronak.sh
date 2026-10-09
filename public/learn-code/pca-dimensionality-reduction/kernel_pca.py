"""N7: PSD kernel PCA with training-owned centering for future queries."""

from dataclasses import dataclass
import numpy as np


def kernel_table(x, y, kind, gamma=1.0, degree=2, offset=0.0):
    if kind == "linear":
        return x @ y.T
    if kind == "polynomial":
        return (gamma * (x @ y.T) + offset) ** degree
    if kind == "rbf":
        # Accumulate over features: no n-by-n-by-d temporary and no
        # subtraction of two almost equal squared norms.
        distance = np.zeros((x.shape[0], y.shape[0]))
        for feature in range(x.shape[1]):
            difference = x[:, feature, None] - y[None, :, feature]
            distance += difference**2
        return np.exp(-gamma * distance)
    raise ValueError("Choose linear, polynomial or rbf kernel")


@dataclass(frozen=True)
class KernelPCAState:
    training: np.ndarray
    column_mean: np.ndarray
    grand_mean: float
    eigenvalues: np.ndarray
    eigenvectors: np.ndarray
    kind: str
    gamma: float
    degree: int
    offset: float

    @classmethod
    def fit(cls, values, k, kind="linear", gamma=1.0, degree=2, offset=0.0):
        x = np.array(values, dtype=float, copy=True)
        if x.ndim != 2 or x.shape[0] < 2 or not np.isfinite(x).all():
            raise ValueError("Use a finite training table with at least two rows")
        n = x.shape[0]
        if (
            isinstance(k, bool)
            or not isinstance(k, (int, np.integer))
            or not 0 <= k <= n
        ):
            raise ValueError("Use integer 0<=k<=n")
        if (
            not np.isfinite(gamma)
            or gamma <= 0
            or not np.isfinite(offset)
            or offset < 0
        ):
            raise ValueError(
                "Positive finite gamma and nonnegative finite offset are required"
            )
        if (
            isinstance(degree, bool)
            or not isinstance(degree, (int, np.integer))
            or degree < 1
        ):
            raise ValueError("Polynomial degree must be a positive integer")
        gram = (
            x
            if kind == "precomputed"
            else kernel_table(x, x, kind, gamma, degree, offset)
        )
        if (
            gram.shape != (n, n)
            or not np.isfinite(gram).all()
            or not np.allclose(gram, gram.T, rtol=1e-12, atol=1e-14)
        ):
            raise ValueError("Training Gram table must be finite, square and symmetric")
        gram = (gram + gram.T) / 2
        # Validate the original Gram, not only the centered one.
        original_eigenvalues = np.linalg.eigvalsh(gram)
        original_floor = (
            np.finfo(float).eps * n * float(np.max(np.abs(original_eigenvalues)))
        )
        if original_eigenvalues.min() < -original_floor:
            raise ValueError("Training Gram table is materially indefinite")
        column_mean = gram.mean(axis=0)
        grand_mean = float(column_mean.mean())
        centered = gram - column_mean[None, :] - column_mean[:, None] + grand_mean
        centered = (centered + centered.T) / 2
        eigenvalues, eigenvectors = np.linalg.eigh(centered)
        order = np.argsort(eigenvalues)[::-1]
        eigenvalues = eigenvalues[order]
        eigenvectors = eigenvectors[:, order]
        floor = np.finfo(float).eps * n * max(float(eigenvalues[0]), original_floor)
        if eigenvalues.min() < -original_floor:
            raise ValueError("Centered Gram table is materially indefinite")
        kept = min(k, int(np.count_nonzero(eigenvalues > floor)))
        eigenvalues = eigenvalues[:kept].copy()
        eigenvectors = eigenvectors[:, :kept].copy()
        for j in range(kept):
            nonzero = np.flatnonzero(np.abs(eigenvectors[:, j]) > 1e-12)
            if nonzero.size and eigenvectors[nonzero[0], j] < 0:
                eigenvectors[:, j] *= -1
        for array in (x, column_mean, eigenvalues, eigenvectors):
            array.setflags(write=False)
        return cls(
            x,
            column_mean,
            grand_mean,
            eigenvalues,
            eigenvectors,
            kind,
            gamma,
            degree,
            offset,
        )

    @property
    def training_scores(self):
        return self.eigenvectors * np.sqrt(self.eigenvalues)

    def transform(self, values):
        rows = np.asarray(values, dtype=float)
        columns = (
            self.training.shape[0]
            if self.kind == "precomputed"
            else self.training.shape[1]
        )
        if rows.ndim != 2 or rows.shape[1] != columns or not np.isfinite(rows).all():
            raise ValueError(
                "Query table has the wrong finite feature/Gram-row contract"
            )
        gram = (
            rows
            if self.kind == "precomputed"
            else kernel_table(
                rows, self.training, self.kind, self.gamma, self.degree, self.offset
            )
        )
        # Each query owns its row mean; every query reuses the training column means.
        centered = (
            gram - self.column_mean + self.grand_mean - gram.mean(axis=1, keepdims=True)
        )
        return centered @ (self.eigenvectors / np.sqrt(self.eigenvalues))


def main():
    from sklearn.decomposition import KernelPCA, PCA

    np.set_printoptions(precision=6, suppress=True)
    training = np.array([[-1.0], [0.0], [1.0]])
    state = KernelPCAState.fit(
        training, 1, kind="polynomial", degree=2, offset=0, gamma=1
    )
    queries = np.array([[-2.0], [0.0], [1.0], [2.0]])
    print("square_lift_training_scores", state.training_scores)
    print("stored_column_and_grand_means", state.column_mean, state.grand_mean)
    print("square_lift_query_scores", state.transform(queries))
    ordinary = KernelPCA(
        n_components=1,
        kernel="poly",
        degree=2,
        gamma=1,
        coef0=0,
        eigen_solver="dense",
        remove_zero_eig=True,
        fit_inverse_transform=False,
    )
    library_scores = ordinary.fit_transform(training)
    print(
        "ordinary_training_score_gram_equal",
        np.allclose(
            state.training_scores @ state.training_scores.T,
            library_scores @ library_scores.T,
        ),
    )
    sign = np.sign(state.training_scores[0, 0] * library_scores[0, 0])
    print(
        "ordinary_query_equal_up_to_same_sign",
        np.allclose(state.transform(queries), ordinary.transform(queries) * sign),
    )
    x = np.array([[1, 1], [2, 0], [4, 4], [5, 3]], dtype=float)
    linear = KernelPCAState.fit(x, 2)
    pca = PCA(n_components=2, svd_solver="full").fit(x)
    scores = pca.transform(x)
    print(
        "linear_kernel_pca_score_gram_equal",
        np.allclose(
            linear.training_scores @ linear.training_scores.T, scores @ scores.T
        ),
    )
    repeated = KernelPCAState.fit([[1], [1], [1]], 1)
    print(
        "repeated_input_score_shapes",
        repeated.training_scores.shape,
        repeated.transform([[2], [3]]).shape,
    )
    gram = training**2 @ (training**2).T
    precomputed = KernelPCAState.fit(gram, 1, kind="precomputed")
    print(
        "precomputed_external_query", precomputed.transform(np.array([[4.0, 0.0, 4.0]]))
    )


if __name__ == "__main__":
    main()
