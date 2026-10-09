from fractions import Fraction
from itertools import product

n = 4
records = list(product((0, 1), repeat=n))
fibres = {s: [x for x in records if sum(x) == s] for s in range(n + 1)}

print("s count conditional_mean")
for s, fibre in fibres.items():
    conditional_mean = sum(Fraction(x[0]) for x in fibre) / len(fibre)
    assert conditional_mean == Fraction(s, n)
    print(s, len(fibre), conditional_mean)

print("p record s mass conditional_mass")
for p in (Fraction(1, 5), Fraction(1, 2), Fraction(4, 5)):
    masses = {x: p ** sum(x) * (1 - p) ** (n - sum(x)) for x in records}
    fibre_mass = {s: sum(masses[x] for x in fibre) for s, fibre in fibres.items()}
    assert sum(masses.values()) == 1
    for x in records:
        s = sum(x)
        conditional = masses[x] / fibre_mass[s]
        assert conditional == Fraction(1, len(fibres[s]))
        print(p, "".join(map(str, x)), s, masses[x], conditional)
    raw_mean = sum(masses[x] * x[0] for x in records)
    summary_mean = sum(masses[x] * Fraction(sum(x), n) for x in records)
    raw_variance = sum(masses[x] * (x[0] - raw_mean) ** 2 for x in records)
    summary_variance = sum(masses[x] * (Fraction(sum(x), n) - summary_mean) ** 2 for x in records)
    residual = sum(masses[x] * (x[0] - Fraction(sum(x), n)) ** 2 for x in records)
    assert raw_mean == summary_mean == p
    assert raw_variance == p * (1 - p)
    assert summary_variance == raw_variance / n
    assert residual + summary_variance == raw_variance
    print("p mean_raw mean_summary var_raw var_summary residual")
    print(p, raw_mean, summary_mean, raw_variance, summary_variance, residual)
