import math

noise, trust = 0.1, 0.8
joint = {(x, y): 0.5 * (1 - noise if x == y else noise) for x in (0, 1) for y in (0, 1)}
conditional_entropy = conditional_loss = 0.0
for (x, y), mass in joint.items():
    true_conditional = 1 - noise if x == y else noise
    model_conditional = trust if x == y else 1 - trust
    if mass:
        conditional_entropy -= mass * math.log2(true_conditional)
        conditional_loss -= mass * math.log2(model_conditional)
print("P(Y=1):", sum(mass for (x, y), mass in joint.items() if y == 1))
print(f"H(Y|X)={conditional_entropy:.6f} bits")
print(f"Model loss={conditional_loss:.6f} bits")
print(f"Excess={conditional_loss-conditional_entropy:.6f} bits")