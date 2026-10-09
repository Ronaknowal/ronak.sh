"""Normal-mixture confidence sequence for independent common-mean [0,1] data.

rho is fixed before reading data. V_t=t/4 is the Hoeffding variance proxy,
not the sample variance. Updates need only count and sum, O(1) working state.
"""
from math import exp, log, log1p, sqrt
from random import Random
from scipy.integrate import quad


def mixture_radius(count, delta=.05, rho=25):
    v = count / 4
    return sqrt((v + rho) * (log1p(v / rho) + 2 * log(1 / delta))) / count


def log_mixture(centered_sum, count, rho=25):
    v = count / 4
    return -.5 * log1p(v / rho) + centered_sum**2 / (2 * (v + rho))


def bernoulli_stream(count, p, seed):
    rng = Random(seed)
    for _ in range(count):
        yield int(rng.random() < p)


def crossing_probability(horizon, p, radius):
    alive, crossed = [1.0], 0.0
    for t in range(1, horizon + 1):
        next_alive = [0.0] * (t + 1)
        for k, probability in enumerate(alive):
            for increment, weight in [(0, 1 - p), (1, p)]:
                mass, successes = probability * weight, k + increment
                if abs(successes / t - p) >= radius(t):
                    crossed += mass
                else:
                    next_alive[successes] += mass
        alive = next_alive
    return crossed


if __name__ == '__main__':
    delta, rho = .05, 25
    total = 0
    for count, observation in enumerate(bernoulli_stream(1000, .2, 1729), 1):
        total += observation
        if count in [100, 1000]:
            average, radius = total / count, mixture_radius(count, delta, rho)
            print('simulated count/mean/interval:', count, f'{average:.8f}',
                  f'{max(0, average - radius):.8f}', f'{min(1, average + radius):.8f}')
    for count in [100, 1000]:
        radius = mixture_radius(count, delta, rho)
        union = sqrt(log(2 * count * (count + 1) / delta) / (2 * count))
        print('count/mixture/union radii:', count, f'{radius:.8f}', f'{union:.8f}')
        s, v = count * radius, count / 4
        # Integrate the completed square after shifting to its Gaussian centre.
        centre, precision = s / (v + rho), v + rho
        integral = quad(lambda z: exp(-precision * z * z / 2), -float('inf'), float('inf'))[0]
        normalizer = sqrt(rho / (2 * 3.141592653589793)) * exp(s * s / (2 * (v + rho)))
        print('boundary log mixture/integrated mixture:', f'{log_mixture(s, count, rho):.8f}',
              f'{normalizer * integral:.8f}')
    for p in [.02, .2, .5]:
        probability = crossing_probability(400, p, lambda t: mixture_radius(t, delta, rho))
        print('finite400 crossing:', p, f'{probability:.8f}')
