import numpy as np

# First two tags repeat together; a third rare tag is orthogonal after centering.
common = np.tile([0.0, 1.0], 100)
rare = np.zeros(200)
rare[[0, 1]] = 1
Y = np.c_[common, common, rare]
mean = Y.mean(axis=0)
centered = Y - mean
_, singular, right = np.linalg.svd(centered, full_matrices=False)
basis = right[:1].T
reconstructed = centered @ basis @ basis.T + mean
prediction = reconstructed >= 0.5
print(
    "Retained centered energy:", round(float(singular[0] ** 2 / (singular**2).sum()), 6)
)
print(
    "Rare reconstructed range:",
    np.round([reconstructed[:, 2].min(), reconstructed[:, 2].max()], 6).tolist(),
)
print("Rare recall:", float(prediction[rare == 1, 2].mean()))
print("Uniform single-positive conditional mean:", (np.ones(5) / 5).tolist())
