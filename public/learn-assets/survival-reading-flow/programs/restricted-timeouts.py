from fractions import Fraction


def km_table(times, events):
    survival = Fraction(1)
    greenwood = Fraction(0)
    rows = []
    for at in sorted(set(times)):
        risk = sum(value >= at for value in times)
        failures = sum(value == at and failed for value, failed in zip(times, events))
        censored = sum(
            value == at and not failed for value, failed in zip(times, events)
        )
        survival *= Fraction(risk - failures, risk)
        if failures == risk:
            greenwood = None
        elif greenwood is not None:
            greenwood += Fraction(failures, risk * (risk - failures))
        rows.append((at, risk, failures, censored, survival, greenwood))
    return rows


def step_value(rows, at):
    if at < 0 or at > rows[-1][0]:
        raise ValueError("Requested time is outside the observed support.")
    return next((row[4] for row in reversed(rows) if row[0] <= at), Fraction(1))


def restricted_mean(rows, horizon):
    if not 0 <= horizon <= rows[-1][0]:
        raise ValueError("Choose a supported horizon.")
    left, height, area = 0, Fraction(1), Fraction(0)
    for row in rows:
        right = min(row[0], horizon)
        area += (right - left) * height
        if right == horizon:
            break
        left, height = right, row[4]
    return area


methods = {
    "A": ([1, 2, 5, 5], [True, True, False, False]),
    "B": ([3, 4, 5, 5], [True, True, False, False]),
}
for name, (times, events) in methods.items():
    rows = km_table(times, events)
    print(
        name,
        "success by timeout:",
        1 - step_value(rows, 5),
        "restricted compute:",
        restricted_mean(rows, 5),
    )
print("An unfinished run may finish at 6 or at 600; these observations cannot decide.")
from math import exp

for shape in [1, 2]:
    scale, age, extra = 12, 4, 3
    integrated = ((age + extra) / scale) ** shape - (age / scale) ** shape
    print(
        "shape",
        shape,
        "failure in next 3 days given running at 4:",
        round(1 - exp(-integrated), 6),
    )