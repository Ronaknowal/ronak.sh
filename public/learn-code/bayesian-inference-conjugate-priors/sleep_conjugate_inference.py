"""Paired sleep differences under an illustrative proper conjugate model.

Run beside conjugate_normal_scratch.py. Pass the canonical sleep-pairs.csv
and unchanged paired_t_scratch.py from the prerequisite's download index:
python sleep_conjugate_inference.py sleep-pairs.csv paired_t_scratch.py
Requires SciPy. Data are the ten R sleep patient pairs, in hours. The mean
model is exchangeable normal differences; the prior m=0,kappa=1,alpha=2,
beta=2 hours**2 is illustrative. No random sampling or causal protocol is
established by this calculation. Canonical data retain R's GPL-2-or-later
carrier/provenance. Student scratch accuracy here uses df14 and CI90–99%,
inside the prerequisite's tested domain, not arbitrary extreme tails.
"""
import csv
import importlib.util
import sys
from math import isclose, sqrt
from pathlib import Path
from scipy.stats import t
from conjugate_normal_scratch import NormalInverseGamma, Summary


def load_pairs(path):
    with Path(path).open(newline='', encoding='utf-8') as stream:
        rows = list(csv.DictReader(stream))
    if len(rows) != 10 or [int(row['id']) for row in rows] != list(range(1, 11)):
        raise ValueError('expected the ten canonical R sleep IDs in order')
    return [(int(row['id']), float(row['drug1_extra_hours']),
             float(row['drug2_extra_hours'])) for row in rows]


def load_student(path):
    spec = importlib.util.spec_from_file_location('canonical_student_scratch', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main(csv_path, student_path):
    pairs = load_pairs(csv_path)
    differences = [second - first for _, first, second in pairs]
    summary = Summary.from_values(differences)
    prior = NormalInverseGamma(0.0, 1.0, 2.0, 2.0)
    posterior = prior.update(summary)
    student = load_student(student_path)
    print('differences hours:', ', '.join(f'{x:.1f}' for x in differences))
    print(f'n={summary.n} mean={summary.mean:.6f} SSE={summary.sse:.6f}')
    print(f'posterior m={posterior.mean:.6f} kappa={posterior.kappa:.6f} alpha={posterior.alpha:.6f} beta={posterior.beta:.6f}')
    for future, label in [(False, 'mean'), (True, 'future difference')]:
        df, location, scale = posterior.student_parameters(future)
        critical = student.student_critical(.95, int(df))
        scratch = (location - critical * scale, location + critical * scale)
        library = t.interval(.95, df, loc=location, scale=scale)
        assert all(isclose(a, b, abs_tol=1e-9) for a, b in zip(scratch, library))
        sd = scale * sqrt(df / (df - 2))
        print(f'{label}: df={df:.0f} scale={scale:.6f} SD={sd:.6f} CI95=[{scratch[0]:.6f}, {scratch[1]:.6f}]')
        print(f'{label}: P(above zero)={t.sf(0, df, loc=location, scale=scale):.6f}')
    print(f'expected variance hours^2={posterior.expected_variance():.6f}')
    # Reversing the contrast negates its mean and swaps its probability region.
    reversed_posterior = prior.update(Summary.from_values([-d for d in differences]))
    assert isclose(reversed_posterior.mean, -posterior.mean)
    assert isclose(reversed_posterior.beta, posterior.beta)
    # Converting both the data and prior from hours to minutes preserves probabilities.
    minute_prior = NormalInverseGamma(0.0, 1.0, 2.0, 2.0 * 60**2)
    minute_posterior = minute_prior.update(Summary.from_values([60*d for d in differences]))
    df, location, scale = minute_posterior.student_parameters()
    print(f'minute mean={location:.6f} scale={scale:.6f} P(above zero)={t.sf(0, df, loc=location, scale=scale):.6f}')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('usage: python sleep_conjugate_inference.py sleep-pairs.csv paired_t_scratch.py')
    main(sys.argv[1], sys.argv[2])
