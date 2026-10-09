from fractions import Fraction as F

# name, population share, treatment under encouragement0/1, outcome risk under treatment0/1
types = [
    ('always', F(1, 5), [1, 1], [F(1, 10), F(1, 10)]),
    ('complier', F(3, 5), [0, 1], [F(1, 10), F(2, 5)]),
    ('never', F(1, 5), [0, 0], [F(1, 10), F(9, 10)]),
]
# Encouragement Z is randomized, so each Z group retains these type proportions.
treatment_rates = [sum(share*received[z] for _, share, received, _ in types) for z in [0, 1]]
outcome_rates = [sum(share*risk[received[z]] for _, share, received, risk in types) for z in [0, 1]]
first_stage = treatment_rates[1]-treatment_rates[0]
assignment_effect = outcome_rates[1]-outcome_rates[0]
population_ate = sum(share*(risk[1]-risk[0]) for _, share, _, risk in types)
print('treatment rates:', list(map(str, treatment_rates)))
print('outcome rates:', list(map(str, outcome_rates)))
print('assignment effect:', assignment_effect, '| first stage:', first_stage)
print('Wald ratio / complier effect:', assignment_effect / first_stage)
print('population ATE in this fully known model:', population_ate)
assert assignment_effect / first_stage == F(3, 10)
assert population_ate == F(17, 50)
