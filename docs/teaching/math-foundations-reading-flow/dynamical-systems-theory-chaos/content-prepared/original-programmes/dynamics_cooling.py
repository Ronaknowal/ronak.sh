import math


def cooling_comparison(decay, initial, horizon, step):
    if not all(math.isfinite(value) for value in (decay, initial, horizon, step)):
        raise ValueError("Use finite inputs.")
    if (
        not 0 <= decay <= 4
        or abs(initial) > 100
        or not 0 <= horizon <= 30
        or not 1e-4 <= step <= 30
    ):
        raise ValueError(
            "Use decay in [0,4], |initial| <= 100, horizon in [0,30] and step in [1e-4,30]."
        )
    count = round(horizon / step)
    if not math.isclose(count * step, horizon, rel_tol=1e-12, abs_tol=1e-12):
        raise ValueError("Choose a step that divides the stated horizon.")
    if count > 10000:
        raise ValueError("This example supports at most 10000 updates.")
    value = initial
    for _ in range(count):
        value += step * (-decay * value)
        if not math.isfinite(value):
            raise ValueError("The numerical update exceeded the arithmetic range.")
    exact = initial * math.exp(-decay * horizon)
    return count, value, exact


for step in (0.25, 0.75, 1.5):
    count, numerical, exact = cooling_comparison(2, 8, 3, step)
    print(f"h={step:.2f}: {count} steps, Euler={numerical:.6f}, exact={exact:.6f}")
print("All three runs end at time 3. Their update multipliers are different.")
