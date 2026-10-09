"""Finite categorical population dynamics, not a language-model experiment.
Run: python synthetic_recursive.py   Requires NumPy.
"""
import json
import numpy as np


def heterozygosity(q):
    q = np.asarray(q)
    return 1 - np.square(q).sum(axis=-1)


def trajectory(rule="replace", population=10, generations=20, seed=17, alpha=.5):
    q0 = np.array([.6, .3, .1])
    q = q0.copy()
    rng = np.random.default_rng(seed)
    rows = [{"generation": 0, "distribution": q.tolist(), "H": float(heterozygosity(q))}]
    for generation in range(generations):
        # fresh draws are from the external population; other draws are self-generated.
        counts = rng.multinomial(population, q0 if rule == "fresh" else q)
        empirical = counts / population
        if rule in ("replace", "fresh"):
            q = empirical
        elif rule == "anchor":
            q = (1 - alpha) * q0 + alpha * empirical
        elif rule == "accumulate":
            weight = 1 / (generation + 2)
            q = (1 - weight) * q + weight * empirical
        else:
            raise ValueError("Unknown sampling rule")
        # An anchored corpus retains the original pool and the latest draw.
        stored = ((generation + 2) * population if rule == "accumulate" else
                  2 * population if rule == "anchor" else population)
        rows.append({"generation": generation + 1, "sample_counts": counts.tolist(),
                     "distribution": q.tolist(), "H": float(heterozygosity(q)),
                     "stored_population": stored})
    return rows


def expected_h(rule, population, generations):
    h, values = .54, [.54]
    for g in range(generations):
        if rule == "replace": h *= 1 - 1 / population
        elif rule == "accumulate": h *= 1 - 1 / (population * (g + 2)**2)
        else: raise ValueError("Formula supplied only for replacement/accumulation")
        values.append(h)
    return values


def main():
    paths = {rule: trajectory(rule) for rule in ("replace", "anchor", "accumulate", "fresh")}
    trials = np.array([[row["H"] for row in trajectory(seed=seed)] for seed in range(2000)])
    print(json.dumps({"paths": paths, "replacement_mean_H": trials.mean(0).tolist(),
                      "replacement_expected_H": expected_h("replace", 10, 20),
                      "accumulation_expected_H": expected_h("accumulate", 10, 20),
                      "rare_extinction_one_step": .9**10}, indent=2))


if __name__ == "__main__":
    main()
