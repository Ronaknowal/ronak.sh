import numpy as np

# Synthetic training items: columns are two metadata features.
features = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [2.0, 1.0]])
item_factors = np.array([[0.8, 0.1], [0.1, 0.9], [0.9, 0.8], [1.7, 0.8]])
penalty = 0.2
mapping = np.linalg.solve(
    features.T @ features + penalty * np.eye(2), features.T @ item_factors
)
augmented = np.vstack((features, np.sqrt(penalty) * np.eye(2)))
targets = np.vstack((item_factors, np.zeros((2, 2))))
assert np.allclose(mapping, np.linalg.lstsq(augmented, targets, rcond=None)[0])
user, new_features = np.array([0.4, 0.7]), np.array([1.0, 0.5])
new_factor = new_features @ mapping
print("mapping:", np.round(mapping, 6).tolist())
print("new item factor:", np.round(new_factor, 6).tolist())
print("personalized dot score:", round(float(user @ new_factor), 6))
rotation = np.array([[0.0, -1.0], [1.0, 0.0]])
assert np.allclose(user @ new_factor, (user @ rotation) @ (new_factor @ rotation))
print("joint factor rotation preserves the score; factor axes are not unique.")