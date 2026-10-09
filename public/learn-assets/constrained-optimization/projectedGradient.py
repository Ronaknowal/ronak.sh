import numpy as np

def project(v):
    t = np.clip((v[0] - v[1] + 1) / 2, 0, 1)
    return np.array([t, 1 - t])

def gradient(x):
    return np.array([x[0] - 2, 4 * (x[1] - 0.5)])

eta = 0.2
x = np.array([0.5, 0.5])
for _ in range(30):
    x = project(x - eta * gradient(x))
g = gradient(x)
mapping = (x - project(x - eta * g)) / eta
print("Decision:", np.round(x, 6).tolist())
print("Ordinary gradient:", np.round(g, 6).tolist())
print("Mapping norm < 1e-8:", bool(np.linalg.norm(mapping) < 1e-8))
print("Feasible:", bool(x.min() >= 0 and abs(x.sum() - 1) < 1e-12))