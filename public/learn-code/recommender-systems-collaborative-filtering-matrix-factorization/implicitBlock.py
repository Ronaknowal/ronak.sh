import numpy as np

items = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
counts = np.array([2.0, 0.0, 1.0])
alpha, penalty = 2.0, 1.0
target = (counts > 0).astype(float)
confidence = 1.0 + alpha * counts
normal = items.T @ (confidence[:, None] * items) + penalty * np.eye(2)
right = items.T @ (confidence * target)
dense = np.linalg.solve(normal, right)
selected = counts > 0
q = items[selected]
sparse_normal = (
    items.T @ items
    + q.T @ ((confidence[selected] - 1)[:, None] * q)
    + penalty * np.eye(2)
)
sparse_right = q.T @ confidence[selected]
cached = np.linalg.solve(sparse_normal, sparse_right)
augmented = np.vstack(
    (np.sqrt(confidence)[:, None] * items, np.sqrt(penalty) * np.eye(2))
)
augmented_target = np.r_[np.sqrt(confidence) * target, [0.0, 0.0]]
independent = np.linalg.lstsq(augmented, augmented_target, rcond=None)[0]
assert np.allclose(dense, cached) and np.allclose(dense, independent)
print("normal:", normal.tolist(), "right:", right.tolist())
print("user factors:", np.round(dense, 6).tolist())
print("all item scores:", np.round(items @ dense, 6).tolist())
observed_only = np.linalg.solve(
    q.T @ (confidence[selected, None] * q) + penalty * np.eye(2),
    q.T @ confidence[selected],
)
print("if missing terms are removed:", np.round(observed_only, 6).tolist())
empty = np.linalg.solve(items.T @ items + penalty * np.eye(2), np.zeros(2))
print("empty-user factors:", empty.tolist())