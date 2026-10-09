"""Run: python -B weighted-subdistribution.py; NumPy plus local core files."""

from math import log
import numpy as np
from fine_gray_risk import contribution_weights, prepare_fine_gray, fine_gray_terms


def main():
    # A motor2, B seal1, C observationend3. Fixed feature values0,1,2.
    times = np.array([2., 1., 3.])
    causes = np.array([1, 2, 0])
    features = np.array([[0.], [1.], [2.]])
    log_g = lambda time: -log(2) * np.asarray(time)
    physical, retained, weights = contribution_weights(2., times, causes, 1, log_g)
    terms = fine_gray_terms(np.array([0.]), prepare_fine_gray(times, causes, features, 1, log_g))
    step = terms.steps[0]
    print("physical [A,B,C]:", physical)
    print("retained [A,B,C]:", retained)
    print("contribution weights [A,B,C]:", weights)
    print("weighted denominator:", round(np.exp(step.log_denominator), 6))
    print("weighted feature mean:", step.mean)
    print("log likelihood:", round(terms.log_likelihood, 6))
    print("score and information:", terms.score, terms.information)
    print("baseline increment:", round(np.exp(step.log_baseline_increment), 6))


if __name__ == "__main__":
    main()
