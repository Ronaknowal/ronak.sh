import numpy as np

x = np.array([-2., -1., 1., 2.])
weights = np.array([0.5, 0.5])
means = np.array([-1., 1.])
variances = np.array([1., 1.])
variance_floor = 0.05

def expectation(x, weights, means, variances):
    log_joint = np.log(weights) - 0.5 * (
        np.log(2 * np.pi * variances)
        + (x[:, None] - means) ** 2 / variances
    )
    row_max = log_joint.max(axis=1, keepdims=True)
    log_density = row_max[:, 0] + np.log(
        np.exp(log_joint - row_max).sum(axis=1)
    )
    responsibility = np.exp(log_joint - log_density[:, None])
    return responsibility, log_density.sum()

responsibility, previous = expectation(x, weights, means, variances)
print(f"initial log-likelihood {previous:.6f}")
for iteration in range(1, 51):
    count = responsibility.sum(axis=0)
    weights = count / len(x)
    means = (responsibility.T @ x) / count
    scatter = (responsibility * (x[:, None] - means) ** 2).sum(axis=0)
    variances = np.maximum(scatter / count, variance_floor)
    responsibility, current = expectation(x, weights, means, variances)
    print(iteration, f"{current:.6f}")
    gain = (current - previous) / len(x)
    if abs(gain) < 1e-8:
        break
    previous = current

print("means", np.round(means, 6))
print("variances", np.round(variances, 6))
print("row sums", responsibility.sum(axis=1))