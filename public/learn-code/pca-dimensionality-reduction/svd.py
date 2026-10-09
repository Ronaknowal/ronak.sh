import numpy as np

X = np.array([[1., 1.], [2., 0.], [4., 4.], [5., 3.]])
mean = X.mean(axis=0)
centered = X - mean
_, singular_values, directions = np.linalg.svd(centered, full_matrices=False)

k = 1
kept_directions = directions[:k]       # shape: (k, d)
scores = centered @ kept_directions.T # shape: (n, k)
reconstructed = scores @ kept_directions + mean
variances = singular_values**2 / (len(X) - 1)

print(np.round(variances, 4))
print(np.round(variances / variances.sum(), 4))
print(np.round(reconstructed, 4))
print(round(np.mean((X - reconstructed)**2), 4))
