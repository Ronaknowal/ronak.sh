import numpy as np

GEOMETRIES = {
    "bowl": ([2, 2], lambda x,y: x*x + y*y),
    "cap": ([-2, -2], lambda x,y: -x*x - y*y),
    "saddle": ([2, -2], lambda x,y: x*x - y*y),
    "quartic minimum": ([0, 0], lambda x,y: x**4 + y**4),
    "quartic saddle": ([0, 0], lambda x,y: x**4 - y**4),
    "flat valley": ([2, 0], lambda x,y: x*x),
}
for name, (diagonal, function) in GEOMETRIES.items():
    eigenvalues = np.linalg.eigvalsh(np.diag(diagonal))
    changes = [function(0.2, 0), function(0, 0.2)]
    print(name, "eigenvalues", eigenvalues.astype(int).tolist(),
          "axis changes", [round(value, 4) for value in changes])
# Sampling two axes supplies counterexamples, not a general minimum proof.
# For the quartic minimum, the proof is x**4 + y**4 > 0 off the origin.