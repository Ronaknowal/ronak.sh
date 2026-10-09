from fractions import Fraction as F

# Y~Bernoulli(1/2), Z=Y, W=Z: graph Y -> Z -> W.
def distribution(forced_z=None):
    return [(y, y if forced_z is None else forced_z, F(1, 2)) for y in [0, 1]]

def risk_given_w_one(rows):
    selected = [(y, mass) for y, w, mass in rows if w == 1]
    return sum(y*mass for y, mass in selected) / sum(mass for _, mass in selected)

print('unconditional P(Y=1):', F(1, 2))
print('unconditional P(Y=1 | do(Z=1)):', F(1, 2))
print('P(Y=1 | W=1):', risk_given_w_one(distribution()))
print('P(Y=1 | do(Z=1), W=1):', risk_given_w_one(distribution(1)))
