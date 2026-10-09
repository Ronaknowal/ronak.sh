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


from math import exp, log, sqrt

times = [2, 3, 4, 4, 6, 7, 8, 9]
events = [True, False, True, False, True, False, True, False]
rows = km_table(times, events)
print("day risk failures censored survival Greenwood")
for row in rows:
    print(*row)
survival, greenwood = rows[2][4:]
z = 1.959963984540054
transformed = log(-log(float(survival)))
se = sqrt(float(greenwood)) / abs(log(float(survival)))
limits = [exp(-exp(transformed + z * se)), exp(-exp(transformed - z * se))]
print("approximate pointwise 95% limits at 4:", [round(v, 6) for v in limits])
print("S(5), held constant after 4:", step_value(rows, 5))
print("median:", next((r[0] for r in rows if r[4] <= Fraction(1, 2)), "not reached"))
print("RMST through day 9:", restricted_mean(rows, 9))