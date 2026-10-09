"""Typed observation likelihood and a matched scalar optimizer comparison."""

import json
from math import exp, log
from scipy.optimize import minimize_scalar
from survival_likelihoods import Observation, prepare_observations, typed_exponential_terms, fit_typed_exponential


def main():
    rows = [Observation('exact', 2.), Observation('right', 5.),
            Observation('interval', 1., 3.), Observation('left', 0., 2.)]
    data = prepare_observations(rows)
    scratch = fit_typed_exponential(data)
    # The library optimizer receives the identical complete local likelihood.
    # Log-rate bounds are declared for this FINITE witness, not all possible data.
    objective = lambda eta: -typed_exponential_terms(exp(eta), data)['log_likelihood']
    ordinary = minimize_scalar(objective, bounds=(-8., 4.), method='bounded', options={'xatol': 1e-12})
    if not ordinary.success or not -8. < ordinary.x < 4.:
        raise ArithmeticError('Ordinary optimizer did not certify the declared interior witness.')
    print(json.dumps({'typed_finite_witness': scratch, 'scipy_success': bool(ordinary.success),
                      'scipy_rate': exp(ordinary.x), 'same_likelihood_difference': scratch['log_likelihood'] + ordinary.fun,
                      'supplied_rate_point1': typed_exponential_terms(.1, data)}, sort_keys=True))
    changed = prepare_observations([Observation('interval', 4., 4.000001, entry=2.)])
    print(json.dumps({'tiny_interval_conditional_entry': typed_exponential_terms(.1, changed),
                      'all_right': fit_typed_exponential(prepare_observations([Observation('right', 5.)])),
                      'left_only': fit_typed_exponential(prepare_observations([Observation('left', 0., 2.)])),
                      'entry_no_residual': fit_typed_exponential(prepare_observations([Observation('right', 2., entry=2.)])),
                      'impossible_entry': fit_typed_exponential(prepare_observations([Observation('interval', 1., 2., entry=3.)]))}, sort_keys=True))


if __name__ == '__main__':
    main()
