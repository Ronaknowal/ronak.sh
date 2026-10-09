from fractions import Fraction
from itertools import product
from math import log2

p = Fraction(9, 10)
h = -float(p) * log2(float(p)) - float(1 - p) * log2(float(1 - p))
for n in (1, 2, 4, 8):
    expected_length, kraft = Fraction(0), Fraction(0)
    for sequence in product((0, 1), repeat=n):
        probability = p ** sum(sequence) * (1 - p) ** (n - sum(sequence))
        length = 0
        while Fraction(1, 2**length) > probability:
            length += 1
        expected_length += probability * length
        kraft += Fraction(1, 2**length)
    rate = float(expected_length) / n
    assert kraft <= 1
    assert h <= rate < h + 1 / n
    print(f"n={n}: rate={rate:.6f}, H={h:.6f}, upper={h+1/n:.6f}")