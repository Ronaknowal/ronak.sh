"""Local/global Gaussian VI with exact finite minibatch proposals.

Requires Python 3, NumPy and SciPy. All Normal parameters use variance.
The four observations are synthetic; no observational dataset is implied.
"""
from fractions import Fraction as F
from itertools import combinations
import math
import numpy as np
from scipy.linalg import solve

y = [F(1), F(2), F(4), F(5)]
n = len(y)
precision = F(n + 1)
rho = F(1, 4)
initial_mean = F(1)
selected_ids = (0, 2)

# mu~N(0,1), zi|mu~N(mu,1), yi|zi~N(zi,1).
def optimize_locals(mean):
    return [(value + mean) / 2 for value in y]

locals_initial = optimize_locals(initial_mean)
batches = list(combinations(range(n), 2))
proposals = [F(n, 2) * sum(locals_initial[i] for i in ids)
             for ids in batches]
full_h = sum(locals_initial)
initial_h = precision * initial_mean

print("synthetic observed y", [float(value) for value in y])
print("initial optimized local means", [float(v) for v in locals_initial])
print("local variance", .5, "global product variance", float(1 / precision))
for ids, h in zip(batches, proposals):
    stepped = (1-rho)*initial_h + rho*h
    print("batch", list(ids), "h", float(h), "proposed mean",
          float(h/precision), "quarter-step mean", float(stepped/precision))
assert sum(proposals) / len(proposals) == full_h
selected_h = proposals[batches.index(selected_ids)]
assert selected_h == 7
assert ((1-rho)*initial_h+rho*selected_h)/precision == F(11, 10)
assert ((1-rho)*initial_h+rho*full_h)/precision == F(23, 20)
print("full-data/mean-batch reference h", float(full_h), "proposed mean",
      float(full_h/precision), "quarter-step mean",
      float(((1-rho)*initial_h+rho*full_h)/precision))
print("selected default IDs", list(selected_ids))
print("global prior precision once", float(precision),
      "incorrect scaled-prior precision", float(F(n, 2)*(1+2)))

# Independent library reference for the full five-dimensional Gaussian.
P = np.diag([float(precision)] + [2.] * n)
P[0, 1:] = -1
P[1:, 0] = -1
natural = np.array([0.] + [float(value) for value in y])
exact_mean = solve(P, natural, assume_a="pos")
exact_covariance = solve(P, np.eye(n+1), assume_a="pos")
product_covariance = np.diag([float(1/precision)] + [.5]*n)
logdet_exact = np.linalg.slogdet(exact_covariance)[1]
logdet_product = np.linalg.slogdet(product_covariance)[1]

def joint_kl(mean, local_means):
    delta = np.array([float(mean)] + [float(v) for v in local_means])-exact_mean
    return .5*(np.trace(P@product_covariance) + delta@P@delta
               -(n+1) + logdet_exact-logdet_product)

family_gap = .5*math.log(5/3)
assert np.allclose(exact_mean, [2, 1.5, 2, 3, 3.5])
assert math.isclose(exact_covariance[0, 0], 1/3, abs_tol=1e-14)
assert math.isclose(joint_kl(F(2), optimize_locals(F(2))), family_gap,
                    abs_tol=1e-14)
print("true joint mean", exact_mean.tolist())
print("true global variance", format(exact_covariance[0, 0], ".12f"),
      "product global variance", .2, "family KL", format(family_gap, ".12f"))

# Ordered CAVI: optimize all locals, then the global factor. This is separate
# from the single selected stochastic natural-parameter step printed above.
mean = initial_mean
local_means = locals_initial
previous_kl = joint_kl(mean, local_means)
print("CAVI", 0, "mu", float(mean), "locals", [float(v) for v in local_means],
      "joint KL", format(previous_kl, ".12f"))
for sweep in range(1, 11):
    local_means = optimize_locals(mean)
    mean = sum(local_means)/precision
    assert mean == 2 + (initial_mean-2)*F(2, 5)**sweep
    kl = joint_kl(mean, local_means)
    assert kl <= previous_kl + 1e-12
    print("CAVI", sweep, "mu", float(mean), "locals",
          [float(v) for v in local_means], "joint KL", format(kl, ".12f"))
    previous_kl = kl
