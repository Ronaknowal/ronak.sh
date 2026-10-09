"""Run: python -B competing-incidence.py (NumPy, scikit-survival 0.28.0)."""

from math import expm1
import numpy as np
from sksurv.nonparametric import cumulative_incidence_competing_risks
from competing_event_mass import aalen_johansen, constant_first_event


def main():
    times = np.arange(1, 7, dtype=float)
    status = np.array([2, 1, 0, 2, 1, 0], dtype=int)
    curve = aalen_johansen(times, status, n_causes=2)
    for point in curve.points:
        print(
            f"day {point.time:g}: risk={point.at_risk}; "
            f"S={point.survival:.6f}; "
            f"motor={point.incidence[0]:.6f}; seal={point.incidence[1]:.6f}"
        )
    library_times, library_mass = cumulative_incidence_competing_risks(status, times)
    scratch_mass = np.array([point.incidence for point in curve.points]).T
    print("endpoint max difference:", np.max(np.abs(library_times - times)))
    print("cause mass max difference:", np.max(np.abs(library_mass[1:] - scratch_mass)))
    print("any-event max difference:", np.max(np.abs(library_mass[0] - scratch_mass.sum(axis=0))))
    print("constant [event-free, motor, seal]:", np.round(constant_first_event([.1, .3], 5), 6))
    print("isolated motor net:", round(-expm1(-.1 * 5), 6))


if __name__ == "__main__":
    main()
