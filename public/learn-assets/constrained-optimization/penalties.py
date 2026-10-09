import math

# Objective: (x-center)^2 / 2. Hard constraint: x <= bound.
def softened_optima(center, bound, strength):
    if not all(math.isfinite(v) for v in (center, bound, strength)):
        raise ValueError("Inputs must be finite")
    if center <= bound or strength <= 0:
        raise ValueError("This formula assumes center > bound and strength > 0")
    gap = center - bound
    quadratic = bound + gap / (1 + strength)
    hinge = max(bound, center - strength)
    # Stable positive root of d^2 + gap*d - strength = 0.
    d = 2 * strength / (math.sqrt(gap * gap + 4 * strength) + gap)
    barrier = bound - d
    return quadratic, hinge, barrier

for strength in (1, 2, 10):
    values = softened_optima(3, 1, strength)
    print(strength, [round(x, 6) for x in values])