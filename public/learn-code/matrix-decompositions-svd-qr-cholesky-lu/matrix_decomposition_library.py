"""Ordinary factor/solve routes and an observed calibration dataset.

Run with NumPy and SciPy installed: python matrix_decomposition_library.py
NIST StRD Norris, 36 observations supplied by NIST employee W. Norris.
Question: relate ozone measured by a customer's instrument (y) to NIST's (x).
Original source: https://www.itl.nist.gov/div898/strd/lls/data/LINKS/DATA/Norris.dat
Retrieved 6 October 2026. Acknowledge NIST StRD; no units invented here.
The observations are embedded so this program runs offline.
This reproduces a linear-fit numerical benchmark; it does not certify an
instrument's calibration, explain measurement error, or evaluate deployment.
"""
import numpy as np
from scipy.linalg import lu_factor, lu_solve


# One factorization, several targets. Packed storage holds L below the diagonal
# and U on/above it; L's diagonal ones are implicit. piv records successive swaps.
a = np.array([[2., 1.], [4., 3.]])
factors = lu_factor(a)
packed, piv = factors
l = np.tril(packed, -1) + np.eye(2)
u = np.triu(packed)
row_order = np.arange(2)
for k, exchanged_row in enumerate(piv):
    row_order[[k, exchanged_row]] = row_order[[exchanged_row, k]]
print("LU packed:", packed.tolist())
print("Pivot swaps:", piv.tolist(), "final row order:", row_order.tolist())
print("Permuted A = L U:", bool(np.allclose(a[row_order], l @ u)))
for target in [[5., 11.], [1., 1.], [3., 7.]]:
    b = np.array(target)
    solution = lu_solve(factors, b)
    print("Target:", target, "solution:", solution.tolist(),
          "original residual:", float(np.max(np.abs(a @ solution - b))))

# y, x order is preserved exactly from NIST's certified data file.
observations = np.array([
    [.1, .2], [338.8, 337.4], [118.1, 118.2], [888., 884.6],
    [9.2, 10.1], [228.1, 226.5], [668.5, 666.3], [998.5, 996.3],
    [449.1, 448.6], [778.9, 777.], [559.2, 558.2], [.3, .4],
    [.1, .6], [778.1, 775.5], [668.8, 666.9], [339.3, 338.],
    [448.9, 447.5], [10.8, 11.6], [557.7, 556.], [228.3, 228.1],
    [998., 995.8], [888.8, 887.6], [119.6, 120.2], [.3, .3],
    [.6, .3], [557.6, 556.8], [339.3, 339.1], [888., 887.2],
    [998.5, 999.], [778.9, 779.], [10.2, 11.1], [117.6, 118.3],
    [228.9, 229.2], [668.4, 669.1], [449.2, 448.9], [.2, .5]
])
y, x = observations.T
# Center the predictor during factorization, then restore the original intercept.
# This is a coordinate change in the same prediction space, not changed data.
x_mean = x.mean()
design = np.column_stack([np.ones(len(x)), x - x_mean])
q, r = np.linalg.qr(design, mode="reduced")
centered_coefficients = np.linalg.solve(r, q.T @ y)
coefficients = np.array([centered_coefficients[0] - centered_coefficients[1] * x_mean,
                         centered_coefficients[1]])
prediction = design @ centered_coefficients
residual = y - prediction
reference = np.array([-.262323073774029, 1.00211681802045])
print("Norris observations:", len(x))
print("QR [intercept, slope]:", np.round(coefficients, 12).tolist())
print("Sum squared residuals:", round(float(residual @ residual), 12))
print("Residual standard deviation:", round(float(np.sqrt(residual @ residual / (len(x) - 2))), 12))
print("Matches NIST coefficients:", bool(np.allclose(coefficients, reference, rtol=0, atol=1e-11)))
print("Matches lstsq fitted values:", bool(np.allclose(prediction, design @ np.linalg.lstsq(design, y, rcond=None)[0])))
print("Largest |Q^T residual|:", f"{np.max(np.abs(q.T @ residual)):.3e}")
# Exporting points for a plot preserves provenance: horizontal x is NIST's
# measurement; the residual is customer minus fitted customer, not a time trend.

covariance = np.array([[4., 2.], [2., 2.]])
lower = np.linalg.cholesky(covariance)
print("Cholesky L:", lower.tolist())
print("Cholesky reconstruction:", bool(np.allclose(lower @ lower.T, covariance)))

matrix = np.array([[3., 1.], [1., 3.]])
left, singular, right_transpose = np.linalg.svd(matrix, full_matrices=False)
rank_one = (left[:, :1] * singular[:1]) @ right_transpose[:1]
print("Singular values:", np.round(singular, 6).tolist())
print("Rank-one matrix:", np.round(rank_one, 6).tolist())
print("Frobenius error:", round(float(np.linalg.norm(matrix - rank_one, "fro")), 6))
# Signed singular vectors need not match another valid implementation.
