"""Stable independent-unit comparisons. Python 3.12+; standard library.
Run: python variance_reduction.py
Each squared-function estimator uses exactly 2000 h evaluations, seed 7.
"""
from math import sqrt
from random import Random
from dataclasses import dataclass


@dataclass
class Moments:
    count: int = 0
    mean: float = 0.0
    m2: float = 0.0

    def add(self, value):
        self.count += 1
        delta = value - self.mean
        self.mean += delta / self.count
        self.m2 += delta * (value - self.mean)

    def variance(self):
        if self.count < 2:
            raise ValueError('sample variance needs at least two independent units')
        return self.m2 / (self.count - 1)


def summarize(name, values, exact_mean, exact_unit_variance, evaluations):
    moments = Moments()
    for value in values:
        moments.add(value)
    print(f'{name}: units={moments.count}; h_evaluations={evaluations}; '
          f'mean={moments.mean:.8f}; exact_mean={exact_mean:.8f}; '
          f'unit_variance={moments.variance():.8f}; '
          f'exact_unit_variance={exact_unit_variance:.8f}; '
          f'iid_MCSE={sqrt(moments.variance()/moments.count):.8f}')


def main():
    budget = 2000
    iid_rng, pair_rng, control_rng = Random(7), Random(7), Random(7)
    iid = [iid_rng.random() ** 2 for _ in range(budget)]
    pairs = []
    for _ in range(budget // 2):
        u = pair_rng.random()
        pairs.append((u*u + (1-u)*(1-u)) / 2)
    controls = []
    for _ in range(budget):
        u = control_rng.random()
        controls.append(u*u - (u - .5))
    summarize('iid squares', iid, 1/3, 4/45, budget)
    summarize('antithetic pair means', pairs, 1/3, 1/180, budget)
    summarize('fixed control c=1', controls, 1/3, 1/180, budget)
    print(f'exact_estimator_variance_ratio_iid_to_pairs={8}; '
          f'exact_estimator_variance_ratio_iid_to_control={16}')

    event_rng = Random(7)
    raw, conditional = [], []
    for _ in range(budget):
        u, v = event_rng.random(), event_rng.random()
        raw.append(float(u + v > 1))
        conditional.append(u)
    summarize('triangle indicator', raw, .5, .25, budget)
    summarize('conditional triangle contribution', conditional, .5, 1/12, budget)
    print(f'raw_uniform_draws={2*budget}; conditional_required_draws={budget}; '
          f'control_subtractions={budget}')

    reject_rng = Random(7)
    accepted = []
    attempts = 0
    while len(accepted) < budget:
        x, u = reject_rng.random(), reject_rng.random()
        attempts += 1
        if u <= x:  # envelope 2: accept 2*u <= 2*x
            accepted.append(x)
    summarize('Beta(2,1) rejection', accepted, 2/3, 1/18, attempts)
    print(f'attempts={attempts}; accepted={len(accepted)}; '
          f'acceptance={len(accepted)/attempts:.8f}; exact_acceptance={.5}')
    print(f'invalid_M1_clamped_acceptance={3/4}; invalid_M1_clamped_mean={11/18:.8f}')


if __name__ == '__main__':
    main()
