from fractions import Fraction
from itertools import product

datasets = list(product((0, 1), repeat=4))
fiber = [data for data in datasets if sum(data) == 2]
for p in (Fraction(1, 5), Fraction(4, 5)):
    weights = [p ** sum(data) * (1 - p) ** (4 - sum(data)) for data in fiber]
    total = sum(weights)
    conditional = {weight / total for weight in weights}
    print('p =', p, '| group size =', len(fiber), '| conditional masses =',
          ', '.join(str(value) for value in sorted(conditional)))
print('1001 belongs:', (1, 0, 0, 1) in fiber)