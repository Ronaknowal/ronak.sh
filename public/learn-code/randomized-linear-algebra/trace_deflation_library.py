"""Trace deflation with NumPy and an operator callback: the Hutch++ mechanism.

Run: python trace_deflation_library.py
Install: python -m pip install numpy
Tested with Python3.12/NumPy2.3.5. apply(vector) is a fixed real linear square
operator. Its linearity/PSD status are caller assumptions, not inferred from a
few queries. n is1..512; s is an integer1..min(n,128); finite returned n-vectors
are checked. The sampled skinny block is orthogonalized with NumPy's small SVD,
dropping numerical null directions at eps*max(shape)*largest singular value.

Two independently spawned streams produce Gaussian range probes and random
sign residual probes. For fixed Q, residual estimation is unbiased. Relative
Hutch++ guarantees require the original PSD/probability/query assumptions;
neither the seed nor one observed improvement supplies such a guarantee.
The finite dense matrix and exact trace below are verification fixtures only.
Matrix storage and exact-trace reading are outside operator query counts.
"""
import numpy as np


def trace_deflation(apply, n, s, seed=7):
    if not isinstance(n, int) or isinstance(n, bool) or not 1 <= n <= 512:
        raise ValueError('n must be an integer1..512.')
    if not isinstance(s, int) or isinstance(s, bool) or not 1 <= s <= min(n, 128):
        raise ValueError('s must be an integer1..min(n,128).')
    if not isinstance(seed, int) or isinstance(seed, bool) or seed < 0:
        raise ValueError('seed must be a nonnegative integer.')
    streams = np.random.SeedSequence(seed).spawn(2)
    range_rng, residual_rng = [np.random.default_rng(stream) for stream in streams]
    queries = 0

    def products(block):
        nonlocal queries
        outputs = []
        for column in block.T:
            raw = apply(column)
            if np.iscomplexobj(raw):
                raise ValueError('apply must return a real vector.')
            output = np.asarray(raw, dtype=float)
            if output.shape != (n,) or not np.isfinite(output).all():
                raise ValueError('apply must return a finite vector of length n.')
            outputs.append(output)
            queries += 1
        return np.column_stack(outputs) if outputs else np.zeros((n, 0))

    omega = range_rng.normal(size=(n, s))
    y = products(omega)
    u, singular, _ = np.linalg.svd(y, full_matrices=False)
    threshold = np.finfo(float).eps * max(y.shape) * singular[0]
    q = u[:, singular > threshold]
    aq = products(q)
    captured = float(np.sum(q * aq))  # trace(Q.T A Q), one diagonal per column
    signs = residual_rng.choice([-1., 1.], size=(n, s))
    residual_inputs = signs - q @ (q.T @ signs)
    residual_outputs = products(residual_inputs)
    samples = np.sum(residual_inputs * residual_outputs, axis=0)
    residual_estimate = float(samples.mean())
    return {'estimate': captured + residual_estimate, 'captured': captured,
            'residual_estimate': residual_estimate, 'samples': samples,
            'queries': queries, 'q': q, 'omega': omega, 'signs': signs,
            'residual_inputs': residual_inputs}


def direct_sign_trace(apply, n, count, seed=11):
    """Ordinary sign average at the same actual positive query count."""
    if not isinstance(count, int) or isinstance(count, bool) or count < 1:
        raise ValueError('count must be a positive integer.')
    signs = np.random.default_rng(seed).choice([-1., 1.], size=(n, count))
    return float(np.mean([z @ apply(z) for z in signs.T]))


def main():
    matrix = np.array([[9., 2., 0., 0.], [2., 4., 1., 0.],
                       [0., 1., 2., .5], [0., 0., .5, 1.]])
    for name, a in [('coupled PSD', matrix), ('zero', np.zeros((4, 4))),
                    ('rank one', np.outer([1., 2., -1., 0.], [1., 2., -1., 0.])),
                    ('signed zero trace', np.diag([2., -2., 0., 0.]))]:
        result = trace_deflation(lambda z: a @ z, 4, 1)
        direct = direct_sign_trace(lambda z: a @ z, 4, result['queries'])
        print(name, 'basis columns:', result['q'].shape[1], 'queries:', result['queries'])
        print('captured / residual / estimate:',
              f"{result['captured']:.9f}", f"{result['residual_estimate']:.9f}",
              f"{result['estimate']:.9f}")
        print('same-query direct / exact:', f'{direct:.9f}', f'{np.trace(a):.9f}')


if __name__ == '__main__':
    main()
