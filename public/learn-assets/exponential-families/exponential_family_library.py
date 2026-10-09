import math
import numpy as np
from scipy.special import logsumexp
from scipy.stats import beta, gamma, norm, poisson

x = np.array([-1.0, 0.0, 1.0])
h = np.array([1.0, 2.0, 1.0])
print("eta A p_minus p_zero p_plus mean variance")
for eta in (-1000.0, -0.7, 0.0, 0.7, 1000.0):
    logs = np.log(h) + eta * x
    A = float(logsumexp(logs))
    probabilities = np.exp(logs - A)
    mean = float(probabilities @ x)
    variance = float(probabilities @ ((x - mean) ** 2))
    shifted = logs - float(np.max(logs))
    scratch = np.exp(shifted)
    scratch /= float(np.sum(scratch))
    assert np.allclose(probabilities, scratch, rtol=0, atol=2e-14)
    assert math.isclose(float(np.sum(probabilities)), 1, rel_tol=0, abs_tol=2e-14)
    print(eta, *(f"{v:.12g}" for v in (A, *probabilities, mean, variance)))

print("normal_x logpdf")
for value in (-1.0, 0.0, 2.0):
    library = float(norm.logpdf(value, loc=1.5, scale=math.sqrt(2.0)))
    scratch = -0.5 * math.log(4 * math.pi) - (value - 1.5) ** 2 / 4
    assert math.isclose(library, scratch, rel_tol=0, abs_tol=2e-14)
    print(value, f"{library:.12g}")

print("count exposure_hours poisson_mean logpmf")
for count, exposure in ((3, 1.0), (1, 0.5), (8, 2.0)):
    mean = 2.0 * exposure
    library = float(poisson.logpmf(count, mu=mean))
    scratch = count * math.log(mean) - mean - math.lgamma(count + 1)
    assert math.isclose(library, scratch, rel_tol=0, abs_tol=2e-14)
    print(count, exposure, mean, f"{library:.12g}")

gamma_mean = float(gamma.mean(a=14, scale=1 / 4.5))
assert math.isclose(gamma_mean, 28 / 9, rel_tol=0, abs_tol=2e-14)
print("gamma_shape gamma_rate gamma_mean")
print(14, 4.5, f"{gamma_mean:.12g}")
print("beta_p pdf")
for p in (0.2, 0.5, 0.8):
    density = float(beta.pdf(p, a=2, b=3))
    assert math.isclose(density, 12 * p * (1 - p) ** 2, rel_tol=0, abs_tol=2e-14)
    print(p, f"{density:.12g}")
interval = float(beta.cdf(0.75, a=2, b=3) - beta.cdf(0.25, a=2, b=3))
assert math.isclose(interval, 11 / 16, rel_tol=0, abs_tol=2e-14)
print("beta_lower beta_upper mass")
print(0.25, 0.75, f"{interval:.12g}")
