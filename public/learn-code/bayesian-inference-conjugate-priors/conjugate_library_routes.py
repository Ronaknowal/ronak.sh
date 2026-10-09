"""Ordinary SciPy distributions after explicitly computed conjugate updates.

Requires NumPy/SciPy; run beside conjugate_normal_scratch.py. Distribution
constructors evaluate an already specified posterior; .fit would instead
estimate a distribution from observations and does not perform these updates.
Gamma uses scale=1/rate, Negative Binomial counts events with p=b/(b+t),
and normal/Student-t constructors take SD/horizontal scale respectively.
"""
from math import sqrt
import numpy as np
from scipy.stats import beta, betabinom, binom, dirichlet, gamma, nbinom, norm, t
from conjugate_normal_scratch import NormalInverseGamma, Summary


a, b = 2 + 8, 2 + 2
posterior_rate = beta(a, b)
print('Beta mean/CI95/P(theta>.7):',
      round(posterior_rate.mean(), 6),
      tuple(round(float(x), 6) for x in posterior_rate.interval(.95)),
      round(posterior_rate.sf(.7), 6))
future_count = betabinom(10, a, b)
plug_in = binom(10, posterior_rate.mean())
print('batch variance integrated/plugin:',
      round(future_count.var(), 6), round(plug_in.var(), 6))
print('P(at least 9) integrated/plugin:',
      round(future_count.sf(8), 6), round(plug_in.sf(8), 6))

shape, rate, future_hours = 2 + 9, 1 + 2.5, 1.0
posterior_event_rate = gamma(shape, scale=1 / rate)
future_events = nbinom(shape, rate / (rate + future_hours))
print('Gamma events/hour mean:', round(posterior_event_rate.mean(), 6))
print('next-hour count mean/variance/P(zero):',
      round(future_events.mean(), 6), round(future_events.var(), 6),
      round(future_events.pmf(0), 6))

category_posterior = dirichlet(np.array([1, 1, 1]) + [6, 3, 1])
print('Dirichlet mean:', tuple(round(float(x), 6) for x in category_posterior.mean()))
print('Dirichlet Var(A)/Cov(A,B):',
      round(category_posterior.var()[0], 6), round(category_posterior.cov()[0, 1], 6))

prior_precision, data_precision = 1.0, 4 / 4.0
mean_variance = 1 / (prior_precision + data_precision)
mean = mean_variance * (0 * prior_precision + 4.0 * data_precision)
mean_distribution = norm(mean, sqrt(mean_variance))
future_distribution = norm(mean, sqrt(4 + mean_variance))
print('known-noise mean/future SD:',
      round(mean_distribution.std(), 6), round(future_distribution.std(), 6))

prior = NormalInverseGamma(0.0, 1.0, 2.0, 2.0)
posterior = prior.update(Summary.from_values([2.0, 3.0, 4.0, 7.0]))
for future, label in [(False, 'unknown-noise mean'), (True, 'unknown-noise future')]:
    df, location, scale = posterior.student_parameters(future)
    distribution = t(df, loc=location, scale=scale)
    print(label, 'scale/SD/CI95:', round(scale, 6), round(distribution.std(), 6),
          tuple(round(float(x), 6) for x in distribution.interval(.95)))
