"""Candidate grammars, sampling modes and exact coverage probabilities."""
from itertools import product
from math import comb, exp, expm1, log, log1p, isfinite
from fractions import Fraction
import random


def cartesian_grid(parameters):
    names = sorted(parameters)
    if any(not parameters[name] for name in names):
        raise ValueError("Every supplied parameter needs a nonempty list.")
    return [dict(zip(names, values)) for values in product(*(parameters[name] for name in names))]


def conditional_grid(branches):
    return [candidate for branch in branches for candidate in cartesian_grid(branch)]


def independent_hit(mass, draws):
    if not 0 <= mass <= 1 or type(draws) is not int or draws < 0:
        raise ValueError("Need a probability and a nonnegative integer draw count.")
    if draws == 0 or mass == 0:
        return 0.0
    if mass == 1:
        return 1.0
    return -expm1(draws * log1p(-mass))


def finite_hit(size, acceptable, draws):
    if any(type(value) is not int for value in (size, acceptable, draws)) or not 0 <= acceptable <= size or not 0 <= draws <= size:
        raise ValueError("Need integer 0 <= acceptable <= size and 0 <= draws <= size.")
    misses = comb(size - acceptable, draws) if draws <= size - acceptable else 0
    return 1 - Fraction(misses, comb(size, draws))


def log_uniform(u, low, high):
    if not all(isfinite(value) for value in (u, low, high)) or not 0 <= u <= 1 or not 0 < low < high:
        raise ValueError("Need a unit coordinate and positive increasing endpoints.")
    return exp(log(low) + u * (log(high) - log(low)))


def main():
    grid = {"k": [3, 5, 11], "scaler": ["standard", "robust"]}
    branches = [{"kernel": ["linear"], "C": [1, 10]},
                {"kernel": ["rbf"], "C": [1, 10], "gamma": [.1, 1]}]
    print("six candidates", cartesian_grid(grid))
    print("conditional candidates", conditional_grid(branches))
    rng = random.Random(19)
    print("replacement draws", [rng.randrange(6) for _ in range(3)])
    print("without replacement draws", rng.sample(range(6), 3))
    print("finite hit", str(finite_hit(6, 2, 3)), "independent exact", str(1 - Fraction(4, 6)**3))
    print("independent60", independent_hit(.05, 60), independent_hit(.01, 60))
    print("decade boundaries", [round(log_uniform(i / 6, .001, 1000), 8) for i in range(7)])
    print("branch per-setting mass", [str(Fraction(1, 2) / size) for size in [2, 8]])
    grid2d = list(product([0., .5, 1.], repeat=2))
    samples = [(rng.random(), rng.random()) for _ in range(9)]
    print("grid2d", grid2d)
    print("random2d", [[round(value, 8) for value in row] for row in samples])
    print("distinct first coordinates", len(set(row[0] for row in grid2d)), len(set(row[0] for row in samples)))
    from sklearn.model_selection import ParameterGrid, ParameterSampler, RandomizedSearchCV
    from sklearn.neighbors import KNeighborsClassifier
    from scipy.stats import loguniform
    print("ordinary grid agrees", list(ParameterGrid(grid)) == cartesian_grid(grid))
    print("ordinary conditional agrees", list(ParameterGrid(branches)) == conditional_grid(branches))
    print("ordinary all-list sampler", list(ParameterSampler(grid, n_iter=3, random_state=19)))
    distribution = {"n_neighbors": [1, 3], "p": loguniform(1, 2)}
    print("ordinary distribution sampler", list(ParameterSampler(distribution, n_iter=3, random_state=19)))
    # Configuration only: candidate sampling does not require fitting data.
    search = RandomizedSearchCV(KNeighborsClassifier(), {"n_neighbors": [1, 3, 5]},
                                n_iter=2, cv=3, random_state=19, n_jobs=1, error_score="raise")
    print("search configured", search.n_iter, search.param_distributions, "fit performed", False)


if __name__ == "__main__":
    main()
