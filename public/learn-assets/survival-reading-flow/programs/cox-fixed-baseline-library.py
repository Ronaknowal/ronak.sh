"""Lower-level scikit-survival baseline at supplied risk scores; no Cox fit."""

from math import log

import numpy as np
from sksurv.linear_model.coxph import BreslowEstimator


def main():
    times = np.array([1, 2, 2, 3, 4, 5], dtype=float)
    events = np.array([True, True, True, False, True, False])
    features = np.array([-1, 0, 1, -1, 0, 1], dtype=float)
    beta = log(2)
    estimator = BreslowEstimator().fit(features * beta, events, times)
    print(f"supplied-beta library reference H(4): {estimator.cum_baseline_hazard_(4):.12f}")
    curves = estimator.get_survival_function(np.array([-1, 0, 1], dtype=float) * beta)
    print("supplied-beta library S(4), x=-1,0,1:",
          np.round([curve(4) for curve in curves], 12).tolist())


if __name__ == "__main__":
    main()
