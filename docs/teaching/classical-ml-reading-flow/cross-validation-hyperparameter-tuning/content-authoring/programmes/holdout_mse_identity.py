"""A finite conditional holdout identity, not an interval-estimation algorithm."""
from fractions import Fraction as F
from itertools import product
import numpy as np
from math import isfinite


def finite_expectation(values, masses):
    if len(values) != len(masses) or not values or any(not isfinite(value) for value in values + masses) or any(mass < 0 for mass in masses) or sum(masses) != 1:
        raise ValueError("Need aligned finite values and nonnegative exact masses summing to one.")
    return sum(value * mass for value, mass in zip(values, masses))


def holdout_identity(estimate, loss_values, masses, held_size):
    if type(held_size) is not int or not 1 <= held_size <= 8:
        raise ValueError("This exact product demonstration supports 1 through 8 held losses.")
    mean = finite_expectation(loss_values, masses)
    means, joint_masses = [], []
    for indices in product(range(len(loss_values)), repeat=held_size):
        means.append(sum(loss_values[i] for i in indices) / held_size)
        probability = F(1)
        for i in indices:
            probability *= masses[i]
        joint_masses.append(probability)
    discrepancy = finite_expectation([(estimate - value)**2 for value in means], joint_masses)
    holdout_variance = finite_expectation([(mean - value)**2 for value in means], joint_masses)
    return {"means": means, "masses": joint_masses, "true_error": mean,
            "discrepancy": discrepancy, "holdout_variance": holdout_variance,
            "difference": discrepancy - holdout_variance, "target_mse": (estimate - mean)**2}


def main():
    result = holdout_identity(F(1, 4), [F(0), F(1)], [F(1, 2), F(1, 2)], 2)
    print("holdout means", [str(value) for value in result["means"]])
    print("joint masses", [str(value) for value in result["masses"]])
    for key in ["true_error", "discrepancy", "holdout_variance", "difference", "target_mse"]:
        print(key, str(result[key]))
    print("individual subtraction at held mean0", str(F(1, 4)**2 - result["holdout_variance"]))
    values = np.array([float(value) for value in result["means"]])
    weights = np.array([float(value) for value in result["masses"]])
    print("ordinary weighted discrepancy", float(np.dot(weights, (.25 - values)**2)))
    # Perfectly dependent held losses instead have mean 0/1, not 0/.5/1.
    dependent_variance = finite_expectation([F(1, 4), F(1, 4)], [F(1, 2), F(1, 2)])
    print("dependent held variance", str(dependent_variance), "independent variance", str(result["holdout_variance"]))


if __name__ == "__main__":
    main()
