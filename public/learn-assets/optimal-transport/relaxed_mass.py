import math

source_amount, target_amount = 2.0, 8.0
cost, penalty = 1.0, 2.0


def generalized_kl(mass, reference):
    return mass * math.log(mass / reference) - mass + reference if mass else reference


def objective(mass):
    return cost * mass + penalty * (
        generalized_kl(mass, source_amount) + generalized_kl(mass, target_amount)
    )


# Derivative = cost + penalty*log(mass/source_amount)
#                   + penalty*log(mass/target_amount).
optimum = math.sqrt(source_amount * target_amount) * math.exp(-cost / (2 * penalty))
derivative = (
    cost
    + penalty * math.log(optimum / source_amount)
    + penalty * math.log(optimum / target_amount)
)
print("optimal transported amount:", f"{optimum:.6f}")
print("objective:", f"{objective(optimum):.6f}")
print("derivative near zero:", abs(derivative) < 1e-12)
print("source marginal changed:", not math.isclose(optimum, source_amount))
print("target marginal changed:", not math.isclose(optimum, target_amount))
print("curvature is positive:", 2 * penalty / optimum > 0)
# Ordinary balanced transport has no feasible plan here. Normalizing both
# original amounts to1 instead would deliberately discard their total difference.