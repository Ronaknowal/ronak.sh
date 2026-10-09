import numpy as np

X = np.array([-1.75, -1.5, -1.25, -1, 1, 1.25, 1.5, 1.75, 0, 4])[:, None]
D = np.abs(X - X.T)
core = np.sort(D, axis=1)[:, 3]  # fourth entry, including self
W = np.maximum(np.maximum(core[:, None], core[None, :]), D)
np.fill_diagonal(W, 0)

inside = {0}
edges = []
while len(inside) < len(X):
    weight, source, target = min(
        (W[i, j], i, j)
        for i in inside for j in range(len(X)) if j not in inside
    )
    edges.append((source, target, float(weight)))
    inside.add(target)

print(core.tolist())
print(len(edges))
print(float(W[0, 1]), float(W[3, 8]))