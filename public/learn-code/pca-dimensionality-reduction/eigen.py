# Continue the four-point NumPy example in section 4.
covariance = centered.T @ centered / (len(X) - 1)
eigenvalues, eigenvectors = np.linalg.eigh(covariance)
leading = eigenvectors[:, -1:]
eigen_reconstruction = (centered @ leading) @ leading.T + mean

print(np.round(eigenvalues[::-1], 4))
print(np.allclose(eigen_reconstruction, reconstructed))
print(round(float(np.sum(singular_values[1:]**2)), 4))
