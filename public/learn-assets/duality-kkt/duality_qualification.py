from math import inf

# Convex but degenerate: minimize x subject to x*x <= 0.
def degenerate_dual(multiplier):
    if multiplier < 0:
        raise ValueError("Use a nonnegative multiplier")
    return -1 / (4 * multiplier) if multiplier > 0 else -inf

for multiplier in [0, 1, 10, 100]:
    print("lambda", multiplier, "q", degenerate_dual(multiplier))
print("primal at x=0", 0, "Lagrangian derivative there", 1)
print("affine reformulation x=0: nu=-1 makes L identically zero")

# Nonconvex equality: minimize x with -x<=0 and x*x=1. Only x=1 is feasible.
def nonconvex_dual(lam, nu):
    if lam < 0:
        raise ValueError("lambda must be nonnegative")
    if nu > 0:
        return -nu - (1 - lam)**2 / (4 * nu)
    return 0.0 if nu == 0 and lam == 1 else -inf

print("nonconvex primal", 1.0, "dual optimum", nonconvex_dual(1, 0), "gap", 1.0)