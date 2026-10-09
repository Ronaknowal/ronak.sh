"""N3: training-only scaling and the metric that PCA sees."""

from dataclasses import dataclass
import numpy as np

from centered_pca import CenteredPCA, real_table


@dataclass(frozen=True)
class PopulationScaler:
    mean: np.ndarray
    scale: np.ndarray
    constant: np.ndarray

    @classmethod
    def fit(cls, values):
        x = real_table(values)
        if x.shape[0] == 0:
            raise ValueError("At least one training row is required")
        mean = x.mean(axis=0)
        centered = x - mean
        # Center first: E[X**2] - E[X]**2 loses small spreads at large offsets.
        variance = np.mean(centered**2, axis=0)
        if not np.isfinite(mean).all() or not np.isfinite(variance).all():
            raise ValueError("Scaling overflowed; rescale the measurements")
        constant = variance == 0
        scale = np.sqrt(variance)
        scale[constant] = 1.0
        for array in (mean, scale, constant):
            array.setflags(write=False)
        return cls(mean, scale, constant)

    def transform(self, values):
        x = real_table(values, self.mean.size)
        result = (x - self.mean) / self.scale
        if not np.isfinite(result).all():
            raise ValueError("Scaling the query overflowed")
        return result

    def inverse_transform(self, values):
        z = real_table(values, self.mean.size)
        result = z * self.scale + self.mean
        if not np.isfinite(result).all():
            raise ValueError("Restoring original units overflowed")
        return result


def metric_coordinates(values, weights):
    x = real_table(values)
    w = np.asarray(weights, dtype=float)
    if w.shape != (x.shape[1],) or not np.isfinite(w).all() or np.any(w <= 0):
        raise ValueError("Use one finite positive weight per retained feature")
    result = x * np.sqrt(w)
    if not np.isfinite(result).all():
        raise ValueError("Weighted coordinates overflowed")
    return result


def restore_metric(coordinates, weights):
    # Reuse the same contract, including the positive-weight requirement.
    x = real_table(coordinates)
    metric_coordinates(np.zeros_like(x), weights)
    return x / np.sqrt(np.asarray(weights, dtype=float))


def axis_status(energies):
    gap = abs(float(energies[0] - energies[1]))
    if gap <= 1e-12 * max(abs(float(energies[0])), abs(float(energies[1]))):
        return "tied"
    return "horizontal" if energies[0] > energies[1] else "vertical"


def main():
    from sklearn.decomposition import PCA
    from sklearn.impute import SimpleImputer
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler

    np.set_printoptions(precision=6, suppress=True)
    rectangle = np.array([[-2, -1], [-2, 1], [2, -1], [2, 1]], dtype=float)
    for multiplier in (1.0, 2.0, 10.0):
        raw = rectangle * [1.0, multiplier]
        scaler = PopulationScaler.fit(raw)
        standardized = scaler.transform(raw)
        raw_energy = np.sum(raw**2, axis=0)
        scaled_energy = np.sum(standardized**2, axis=0)
        print("multiplier", multiplier)
        print(
            "raw_energy_axis_share",
            raw_energy,
            axis_status(raw_energy),
            raw_energy.max() / raw_energy.sum(),
        )
        print(
            "standardized_energy_axis_share",
            scaled_energy,
            axis_status(scaled_energy),
            scaled_energy.max() / scaled_energy.sum(),
        )
        ordinary_scaler = StandardScaler().fit(raw)
        print(
            "scaler_library_equal",
            np.allclose(standardized, ordinary_scaler.transform(raw)),
        )
        scratch = CenteredPCA.fit(standardized, 1)
        ordinary = PCA(n_components=1, svd_solver="full").fit(standardized)
        # This square is tied: compare optimal loss, not arbitrary chosen axes.
        scratch_loss = np.sum(
            (standardized - scratch.inverse_transform(scratch.transform(standardized)))
            ** 2
        )
        ordinary_loss = np.sum(
            (
                standardized
                - ordinary.inverse_transform(ordinary.transform(standardized))
            )
            ** 2
        )
        print("tied_optimal_losses", scratch_loss, ordinary_loss)
    print(
        "population_sample_variance",
        np.var(rectangle, axis=0, ddof=0),
        np.var(rectangle, axis=0, ddof=1),
    )
    constant_table = np.column_stack((rectangle[:, 0], np.full(4, 7.0)))
    scaler = PopulationScaler.fit(constant_table)
    query = np.array([[3.0, 9.0]])
    print("constant_scale_and_mask", scaler.scale, scaler.constant)
    print(
        "query_scaled_and_restored",
        scaler.transform(query),
        scaler.inverse_transform(scaler.transform(query)),
    )
    residual = np.array([[1.0, -2.0]])
    weights = np.array([0.5, 3.0])
    print(
        "weighted_loss_two_routes",
        np.sum(metric_coordinates(residual, weights) ** 2),
        np.sum(weights * residual**2),
    )
    missing_training = np.array([[1.0, 2.0], [2.0, np.nan], [4.0, 6.0], [5.0, 8.0]])
    pipeline = make_pipeline(
        SimpleImputer(strategy="mean"),
        StandardScaler(),
        PCA(n_components=1, svd_solver="full"),
    )
    pipeline.fit(missing_training)
    missing_query = np.array([[3.0, np.nan]])
    print(
        "imputer_training_statistics", pipeline.named_steps["simpleimputer"].statistics_
    )
    print("missing_query_score", pipeline.transform(missing_query))


if __name__ == "__main__":
    main()
