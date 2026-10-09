from fractions import Fraction
import numpy as np
from sksurv.nonparametric import cumulative_incidence_competing_risks
from lifelines import KaplanMeierFitter

times = np.array([1, 2, 3, 4, 5, 6], dtype=float)
status = np.array([2, 1, 0, 2, 1, 0])
survival, first, second = Fraction(1), Fraction(0), Fraction(0)
for at in sorted(set(times)):
    risk = int(np.sum(times >= at))
    d1 = int(np.sum((times == at) & (status == 1)))
    d2 = int(np.sum((times == at) & (status == 2)))
    first += survival * Fraction(d1, risk)
    second += survival * Fraction(d2, risk)
    survival *= Fraction(risk - d1 - d2, risk)
    assert first + second + survival == 1
    print("day / event-free / cause1 / cause2:", int(at), survival, first, second)
grid, cif = cumulative_incidence_competing_risks(status, times)
print("library final CIF:", np.round(cif[1:, -1], 6).tolist())
net = KaplanMeierFitter().fit(times, status == 1)
print("naive one-minus-KM cause1:", round(1 - float(net.predict(6)), 6))
hazard1, hazard2, horizon = 0.1, 0.3, 5
actual = hazard1 / (hazard1 + hazard2) * (-np.expm1(-(hazard1 + hazard2) * horizon))
print(
    "constant-hazard actual CIF / net quantity:",
    round(actual, 6),
    round(-np.expm1(-hazard1 * horizon), 6),
)