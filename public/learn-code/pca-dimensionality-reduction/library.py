# Continue the NumPy program above: X, mean and directions are already defined.
from sklearn.decomposition import PCA

pca = PCA(n_components=1, svd_solver="full")
scores = pca.fit_transform(X)
reconstructed = pca.inverse_transform(scores)

new_observation = np.array([[6., 4.]])
new_scores = pca.transform(new_observation)
new_reconstruction = pca.inverse_transform(new_scores)

print(pca.components_.shape, scores.shape)
print(np.round(new_reconstruction, 4))
