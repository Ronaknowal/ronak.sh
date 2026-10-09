"""NumPy PCA on the identical offline UCI rows, plus an explicit units change.
Install NumPy 2.3.5; keep the scratch programs and CSV beside this file.
"""
from pathlib import Path
import numpy as np
from iris_pca_scratch import read_features, fit_pca

rows = read_features(Path(__file__).with_name('iris-corrected.csv'))
x = np.array(rows)
mean = x.mean(axis=0)
centered = x - mean
covariance = centered.T @ centered / (len(x) - 1)
values, q = np.linalg.eigh(covariance)
order = np.argsort(values)[::-1]
values, q = values[order], q[:, order]
directions = q[:, :2]
scores = centered @ directions
reconstructed = scores @ directions.T
sse = np.sum((centered - reconstructed) ** 2)
scratch = fit_pca(rows)
scratch_directions = np.array(scratch['directions'])
print('raw values cm squared', np.round(values, 6).tolist())
print('scratch covariance agreement', np.allclose(covariance, scratch['covariance'], atol=1e-12))
print('scratch values agreement', np.allclose(values, scratch['values'], atol=1e-10))
print('leading projector agreement', np.linalg.norm(directions @ directions.T
      - scratch_directions @ scratch_directions.T) < 1e-10)
print('raw residual SSE cm squared', round(float(sse), 6))
_, singular_values, vt = np.linalg.svd(centered, full_matrices=False)
print('SVD values agreement', np.allclose(values, singular_values ** 2 / (len(x) - 1)))
print('SVD leading projector agreement', np.linalg.norm(directions @ directions.T
      - vt[:2].T @ vt[:2]) < 1e-10)

# Sample feature deviations use ddof=1, matching covariance's N-1 divisor.
# Every feature now has unit variance. This changes the optimization metric.
sample_std = centered.std(axis=0, ddof=1)
standardized = centered / sample_std
unit_covariance = standardized.T @ standardized / (len(x) - 1)
unit_values, unit_q = np.linalg.eigh(unit_covariance)
unit_values, unit_q = unit_values[::-1], unit_q[:, ::-1]
unit_scores = standardized @ unit_q[:, :2]
unit_reconstructed = unit_scores @ unit_q[:, :2].T
unit_sse = np.sum((standardized - unit_reconstructed) ** 2)
print('sample feature deviations cm', np.round(sample_std, 6).tolist())
print('standardized values dimensionless', np.round(unit_values, 6).tolist())
print('standardized retained fraction', round(float(unit_values[:2].sum() / unit_values.sum()), 6))
print('standardized residual SSE dimensionless', round(float(unit_sse), 6))
print('standardized discarded-spectrum agreement', np.isclose(unit_sse, (len(x) - 1) * unit_values[2:].sum()))
