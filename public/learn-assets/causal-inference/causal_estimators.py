from fractions import Fraction as F
from itertools import product

e = [F(1, 5), F(4, 5)]
mu = [[F(1, 10), F(1, 5)], [F(3, 10), F(2, 5)]]

def expected_score(estimated_e, estimated_mu):
    total = F(0)
    for z, x, y in product([0, 1], repeat=3):
        mass = F(1, 2) * (e[z] if x else 1-e[z]) * (mu[z][x] if y else 1-mu[z][x])
        m0, m1 = estimated_mu[z]
        value = m1-m0 + x*(y-m1)/estimated_e[z] - (1-x)*(y-m0)/(1-estimated_e[z])
        total += mass*value
    return total

wrong_e = [F(1, 2), F(1, 2)]
wrong_mu = [[F(3, 20), F(3, 20)], [F(1, 5), F(1, 5)]]
for label, propensity, outcome in [('both correct', e, mu), ('only propensity correct', e, wrong_mu),
                                  ('only outcomes correct', wrong_e, mu), ('both wrong', wrong_e, wrong_mu)]:
    value = expected_score(propensity, outcome)
    print(label + ':', value)
    if label != 'both wrong':
        assert value == F(1, 10)
