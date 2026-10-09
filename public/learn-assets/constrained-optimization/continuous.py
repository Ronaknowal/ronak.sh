import math

def weighted_choice(alpha):
    if not math.isfinite(alpha) or not 0 <= alpha <= 1:
        raise ValueError("alpha must be between zero and one")
    return 2 * (1 - alpha)

def epsilon_choice(epsilon):
    if not math.isfinite(epsilon) or not 0 <= epsilon <= 4:
        raise ValueError("This example accepts epsilon from zero to four")
    return max(0, 2 - math.sqrt(epsilon))

for alpha in (0, 0.25, 0.5, 1):
    x = weighted_choice(alpha)
    print("alpha", alpha, "x", x, "objectives", (x*x, (x-2)**2))
for epsilon in (0, 0.25, 4):
    x = epsilon_choice(epsilon)
    print("epsilon", epsilon, "x", x, "objectives", (x*x, (x-2)**2))