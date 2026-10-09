"""N5: complete dense FastICA assembly; a failed candidate is never a usable fit.

The maintained SVD/eigh kernels are reused; fixed-point updates, deflation,
population normalization, state boundaries, and component operations are explicit.
"""
from dataclasses import dataclass
import numpy as np
from centered_pca import real_table
from population_whitening import PopulationWhitening, frozen
from projection_contrasts import nonlinearities


class FitRefused(RuntimeError):
    def __init__(self, message, metadata):
        super().__init__(message)
        self.metadata = metadata


def unit(vector):
    v = np.asarray(vector, float)
    norm = np.linalg.norm(v)
    if not np.isfinite(v).all() or not np.isfinite(norm) or norm <= np.finfo(float).eps * max(1., np.max(np.abs(v), initial=0.)) * max(1, v.size):
        raise ValueError("Zero, numerically unresolved, or nonfinite direction")
    return v / norm


def polar(rows):
    w = real_table(rows)
    if w.shape[0] != w.shape[1]:
        raise ValueError("Expected a square row operator")
    gram = w @ w.T
    if not np.isfinite(gram).all():
        raise ValueError("Gram matrix overflowed")
    eigenvalues, vectors = np.linalg.eigh(gram)
    threshold = np.finfo(float).eps * max(1, len(w)) * eigenvalues[-1]
    if eigenvalues[0] <= threshold:
        raise ValueError("Rows are numerically dependent; polar inverse square root is undefined")
    result = (vectors / np.sqrt(eigenvalues)) @ vectors.T @ w
    if not np.isfinite(result).all():
        raise ValueError("Polar normalization overflowed")
    return result


def line_movement(new, old):
    return float(np.clip(1. - abs(new @ old), 0., 1.))


@dataclass(frozen=True)
class FastICAFit:
    whitener: PopulationWhitening
    W: np.ndarray
    B: np.ndarray
    decoder: np.ndarray
    algorithm: str
    contrast: str
    seed: int
    iterations: tuple
    movements: tuple
    converged: bool = True

    @classmethod
    def fit(cls, values, n_components, algorithm="parallel", contrast="logcosh", seed=7,
            tol=1e-5, max_iter=1000, w_init=None):
        if algorithm not in {"deflation", "parallel"} or contrast not in {"cubic", "logcosh", "exp"}:
            raise ValueError("Unsupported algorithm or contrast")
        if isinstance(seed, bool) or not isinstance(seed, (int, np.integer)) or seed < 0:
            raise ValueError("Seed must be a nonnegative integer")
        if not np.isfinite(tol) or not 0 < tol < 1 or isinstance(max_iter, bool) or not isinstance(max_iter, (int, np.integer)) or max_iter < 1:
            raise ValueError("Expected 0<tol<1 and a positive integer iteration budget")
        whitener = PopulationWhitening.fit(values, n_components)
        z = whitener.transform(values)
        n, k = z.shape
        initial = np.random.default_rng(seed).normal(size=(k, k)) if w_init is None else real_table(w_init, k)
        if initial.shape != (k, k):
            raise ValueError("Initial rows must have shape k-by-k")
        initial = polar(initial)
        counts, movements = [], []
        if algorithm == "deflation":
            w_rows = np.zeros((k, k))
            for j in range(k):
                old = unit(initial[j] - w_rows[:j].T @ (w_rows[:j] @ initial[j]))
                history = []
                for iteration in range(1, max_iter + 1):
                    y = z @ old
                    g, gp = nonlinearities(y, contrast)
                    raw = z.T @ g / n - gp.mean() * old
                    raw -= w_rows[:j].T @ (w_rows[:j] @ raw)
                    new = unit(raw)
                    movement = line_movement(new, old)
                    history.append(movement)
                    old = new
                    if movement < tol:
                        break
                else:
                    raise FitRefused("Deflation budget exhausted; keep the previous fit", {
                        "algorithm": algorithm, "component": j, "iterations": max_iter,
                        "movements": tuple(history), "converged": False})
                w_rows[j] = old
                counts.append(iteration)
                movements.append(tuple(history))
        else:
            old = initial
            history = []
            for iteration in range(1, max_iter + 1):
                y = z @ old.T
                g, gp = nonlinearities(y, contrast)
                raw = g.T @ z / n - gp.mean(axis=0)[:, None] * old
                new = polar(raw)
                movement = float(np.max(np.clip(1 - np.abs(np.sum(new * old, axis=1)), 0., 1.)))
                history.append(movement)
                old = new
                if movement < tol:
                    break
            else:
                raise FitRefused("Parallel budget exhausted; keep the previous fit", {
                    "algorithm": algorithm, "iterations": max_iter,
                    "movements": tuple(history), "converged": False})
            w_rows = old
            counts.append(iteration)
            movements.append(tuple(history))
        b = w_rows @ whitener.K
        decoder = whitener.decoder @ w_rows.T
        return cls(whitener, frozen(w_rows), frozen(b), frozen(decoder), algorithm,
                   contrast, int(seed), tuple(counts), tuple(movements))

    @property
    def mean(self):
        return self.whitener.mean

    def transform(self, values):
        x = real_table(values, self.mean.size)
        sources = (x - self.mean) @ self.B.T
        if not np.isfinite(sources).all():
            raise ValueError("Source projection overflowed")
        return sources

    def inverse_transform(self, values):
        sources = real_table(values, len(self.W))
        result = sources @ self.decoder.T + self.mean
        if not np.isfinite(result).all():
            raise ValueError("Source decoding overflowed")
        return result

    def contributions(self, values):
        sources = real_table(values, len(self.W))
        result = sources[:, None, :] * self.decoder[None, :, :]
        if not np.isfinite(result).all():
            raise ValueError("Contribution overflowed")
        return result  # q-by-d-by-k, explicitly requested; mean remains separate.

    def remove(self, values, indices):
        sources = self.transform(values)
        selected = list(indices)
        if any(isinstance(i, bool) or not isinstance(i, (int, np.integer)) or not 0 <= i < len(self.W) for i in selected) or len(set(selected)) != len(selected):
            raise ValueError("Removal indices must be unique valid component integers")
        sources[:, selected] = 0.
        return self.inverse_transform(sources)  # No q-by-d-by-k workspace needed.


def main():
    from constructed_sources import constructed_sources
    fixture = constructed_sources()
    for algorithm in ["deflation", "parallel"]:
        fitted = FastICAFit.fit(fixture.observations[fixture.train], 2, algorithm=algorithm)
        query = fixture.observations[fixture.test]
        scores = fitted.transform(query)
        print("fit", algorithm, "iterations", fitted.iterations, "final_movements", [h[-1] for h in fitted.movements])
        print("orthogonality", np.max(np.abs(fitted.W @ fitted.W.T - np.eye(2))),
              "roundtrip_max", np.max(np.abs(fitted.inverse_transform(scores) - query)))
    # Atomic publication: retain this fitted object if a later candidate refuses.
    previous = fitted
    try:
        candidate = FastICAFit.fit(fixture.observations[fixture.train], 2, max_iter=1, tol=1e-15)
    except FitRefused as error:
        print("candidate_refused", error.metadata["converged"], "retained_previous", fitted is previous)
    else:
        fitted = candidate
        print("candidate_converged_within_one_step", fitted.iterations)
    for label, operation in [("linear_zero", lambda: unit(np.zeros(2))),
                             ("duplicate_rows", lambda: polar([[1., 0.], [1., 0.]])),
                             ("parallel_deflation", lambda: unit(np.array([.6, .8]) - np.array([.6, .8])))]:
        try:
            operation()
        except ValueError as error:
            print("refused", label, str(error))


if __name__ == "__main__":
    main()
