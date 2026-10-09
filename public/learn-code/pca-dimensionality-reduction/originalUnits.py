# Continue the training/validation program above.
k = 8
directions = pca.components_[:k]
scores = (B - pca.mean_) @ directions.T
reconstruction = scores @ directions + pca.mean_
original_units = scaler.inverse_transform(reconstruction)

print(original_units.shape)
