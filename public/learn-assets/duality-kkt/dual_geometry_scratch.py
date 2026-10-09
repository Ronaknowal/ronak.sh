"""Exact residual/cost geometry for a fixed two-variable quadratic.

Standard-library Fraction arithmetic, not a general optimization solver.
All quantities are in the constructed lesson's coordinate and cost units.
"""
from fractions import Fraction as F


def fixed_geometry(price):
    """Return the global Lagrangian minimizer, contact and dual intercept."""
    if not isinstance(price, F) or price < 0:
        raise ValueError("Use a nonnegative Fraction price")
    point = (F(3) - price / 2, F(4) - price / 2)
    residual = sum(point) - 5
    cost = sum((z - t) ** 2 for z, t in zip(point, (3, 4)))
    lower = 2 * price - price ** 2 / 2
    assert cost + price * residual == lower
    return point, residual, cost, lower


def frontier(residual):
    """Least cost at EXACT residual; all greater costs are achievable."""
    return (residual - 2) ** 2 / 2


def relaxed_value(allowed_residual):
    """Least cost when residual may be AT MOST allowed_residual."""
    return max(F(0), F(2) - allowed_residual) ** 2 / 2


def main():
    print("price contact_residual contact_cost intercept")
    for price in map(F, (0, 1, 2, 3, 4)):
        point, residual, cost, lower = fixed_geometry(price)
        assert frontier(residual) == cost
        assert lower <= 2  # exact feasible optimum (2, 3) costs 2
        print(price, residual, cost, lower)
        for u in map(F, (-2, 0, 1, 2, 3)):
            # Completing the square proves this for every real u, not only this grid.
            difference = frontier(u) - (lower - price * u)
            assert difference == (u - residual) ** 2 / 2
            assert relaxed_value(u) >= lower - price * u
    print("allowed_residual exact_residual_frontier relaxed_value")
    for u in map(F, (-2, 0, 1, 2, 3)):
        print(u, frontier(u), relaxed_value(u))
    candidate = (F(2), F(2))
    price = F(1)
    minimizer, _, _, lower = fixed_geometry(price)
    cost = sum((z - t) ** 2 for z, t in zip(candidate, (3, 4)))
    slack = 5 - sum(candidate)
    displacement = sum((z - m) ** 2 for z, m in zip(candidate, minimizer))
    complementarity = price * slack
    assert slack >= 0 and cost - lower == displacement + complementarity
    print("candidate_cost lower gap displacement_squared price_times_slack")
    print(cost, lower, cost - lower, displacement, complementarity)
    try:
        fixed_geometry(F(-1))
    except ValueError:
        print("negative_price rejected")
    else:
        raise AssertionError("negative price accepted")


if __name__ == "__main__":
    main()
