from math import inf

# Minimize x with 1-x <= 0, retaining domain x in all real numbers.
def dual(multiplier):
    if multiplier < 0:
        raise ValueError("Inequality multipliers must be nonnegative")
    return 1.0 if multiplier == 1 else -inf

for multiplier in [0.0, 0.5, 1.0, 2.0]:
    slope = 1 - multiplier
    print("lambda", multiplier, "slope in x", slope, "q", dual(multiplier))
print("primal optimum", 1.0, "attained dual maximum", dual(1.0))