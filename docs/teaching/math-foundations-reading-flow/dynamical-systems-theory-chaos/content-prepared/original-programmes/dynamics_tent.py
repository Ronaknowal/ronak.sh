from fractions import Fraction
import math


def tent(value):
    if not 0 <= value <= 1:
        raise ValueError("Use a coordinate in [0,1].")
    return 2 * value if value <= Fraction(1, 2) else 2 * (1 - value)


def inverse_word(word):
    if not 1 <= len(word) <= 10 or any(symbol not in "LR" for symbol in word):
        raise ValueError("Use one to ten L/R symbols.")
    slope, intercept = Fraction(1), Fraction(0)
    for branch in word:
        if branch == "R":
            intercept += slope
        slope *= Fraction(1 if branch == "L" else -1, 2)
    point = intercept / (1 - slope)
    return sorted((intercept, intercept + slope)), point


interval, periodic = inverse_word("LR")
print(
    "LR interval", [str(value) for value in interval], "periodic point", str(periodic)
)
print("two tent steps:", str(tent(tent(periodic))))
value = Fraction(51, 256)
quantized = []
for _ in range(10):
    quantized.append(str(value))
    value = tent(value)
print("finite binary-grid orbit:", quantized)
for boundary in (0.25, 0.75, 1):
    probability = 2 / math.pi * math.asin(math.sqrt(boundary))
    print(f"logistic-4 invariant mass below {boundary}: {probability:.6f}")
print("This invariant law is not a uniform distribution of logistic coordinates.")
