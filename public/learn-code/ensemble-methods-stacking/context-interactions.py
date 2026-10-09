import numpy as np

# Synthetic honest model outputs; no base fit uses these outcome rows.
rows = np.array(
    [
        [a, b, context]
        for context in [0.0, 1.0]
        for a, b in [(0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0)]
    ]
)
a, b, context = rows.T
target = (1 - context) * a + context * b
ordinary = np.column_stack([np.ones(len(rows)), a, b, context])
interactions = np.column_stack([(1 - context) * a, context * b])
first = np.linalg.lstsq(ordinary, target, rcond=None)[0]
second = np.linalg.lstsq(interactions, target, rcond=None)[0]
print("constant-slope coefficients:", np.round(first, 6).tolist())
print(f"constant-slope training MSE: {np.mean((ordinary@first-target)**2):.6f}")
print("interaction coefficients:", np.round(second, 6).tolist())
print(f"interaction training MSE: {np.mean((interactions@second-target)**2):.6f}")
new = np.array([[0.2, 0.8, 0.0], [0.2, 0.8, 1.0], [0.2, 0.8, 0.25]])
na, nb, nc = new.T
prediction = np.column_stack([(1 - nc) * na, nc * nb]) @ second
print("changed new-row predictions:", np.round(prediction, 6).tolist())
print("This exact constructed relation is not evidence of deployment improvement.")
