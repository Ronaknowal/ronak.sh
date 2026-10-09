"""Graph-weighted squared radius and complete source-only densMAP route.

Run scratch example: python local_density_radius.py (NumPy).
The densmap_route function requires the supplied CSV and umap-learn; no fit
is run by this main. Its returned radii follow the package convention.
"""
from pathlib import Path
import numpy as np


def radius(distances, weights, epsilon=1e-8):
    distances, weights = np.asarray(distances, float), np.asarray(weights, float)
    if (distances.ndim != 1 or weights.shape != distances.shape
            or not np.isfinite(distances).all() or not np.isfinite(weights).all()
            or np.any(distances < 0) or np.any(weights < 0)
            or weights.sum() <= 0 or not np.isfinite(epsilon) or epsilon <= 0):
        raise ValueError("Finite nonnegative distances/weights, positive total and epsilon required")
    products = weights * distances ** 2
    mean_squared = float(products.sum() / weights.sum())
    return dict(products=products, weight_sum=float(weights.sum()),
                mean_squared=mean_squared, log_radius_squared=float(np.log(epsilon + mean_squared)))


def densmap_route(csv_path):
    from umap import UMAP
    data = np.loadtxt(Path(csv_path), delimiter=",", skiprows=1)
    x = data[:, 2:] / 16.0
    model = UMAP(n_neighbors=15, n_components=2, min_dist=0.1, spread=1.0,
                 metric="euclidean", init="spectral", random_state=7,
                 transform_seed=7, n_jobs=1, densmap=True, dens_lambda=2.0,
                 dens_frac=0.3, dens_var_shift=0.1, output_dens=True)
    coordinates, input_log_radius, map_log_radius = model.fit_transform(x)
    return model, coordinates, input_log_radius, map_log_radius


if __name__ == "__main__":
    original = radius([1, 3], [1, 0.5])
    enlarged = radius([2, 6], [1, 0.5])
    print("original", {key: value.tolist() if isinstance(value, np.ndarray) else value for key, value in original.items()})
    print("enlarged", {key: value.tolist() if isinstance(value, np.ndarray) else value for key, value in enlarged.items()})
    print("log shift", enlarged["log_radius_squared"] - original["log_radius_squared"])
