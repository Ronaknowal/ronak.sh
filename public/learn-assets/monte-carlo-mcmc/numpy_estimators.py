"""Array estimators with explicit independent units. NumPy 2.3.5.
Install: python -m pip install numpy==2.3.5
Run: python numpy_estimators.py
NumPy's generator differs from Python's Random; compare definitions, not draws.
"""
import numpy as np


def summarize(name, units, exact_mean, exact_variance, evaluations):
    values = np.asarray(units, dtype=float)
    if values.ndim != 1 or values.size < 2 or not np.isfinite(values).all():
        raise ValueError('units must be a finite vector of at least two values')
    variance = values.var(ddof=1)
    print(f'{name}: shape={values.shape}; h_evaluations={evaluations}; '
          f'mean={values.mean():.8f}; exact_mean={exact_mean:.8f}; '
          f'unit_variance={variance:.8f}; exact_unit_variance={exact_variance:.8f}; '
          f'iid_MCSE={np.sqrt(variance/values.size):.8f}')


def main():
    budget = 2000
    u = np.random.default_rng(7).random(budget)
    pair_u = np.random.default_rng(7).random(budget // 2)
    paired_evaluations = np.column_stack((pair_u**2, (1-pair_u)**2))
    pair_means = paired_evaluations.mean(axis=1)
    controls = u**2 - (u-.5)
    summarize('iid squares', u**2, 1/3, 4/45, budget)
    summarize('antithetic pair means', pair_means, 1/3, 1/180, budget)
    summarize('fixed control c=1', controls, 1/3, 1/180, budget)
    print(f'pair_evaluation_shape={paired_evaluations.shape}; pair_unit_shape={pair_means.shape}')
    uv = np.random.default_rng(7).random((budget, 2))
    summarize('triangle indicator', (uv.sum(axis=1)>1).astype(float), .5, .25, budget)
    summarize('conditional triangle contribution', uv[:,0], .5, 1/12, budget)
    print(f'raw_uniform_draws={uv.size}; conditional_required_draws={budget}')
    fixture = np.array([.2, .8, .4, .6])
    print('small_fixture_inputs=', fixture.tolist())
    print('small_fixture_squares=', (fixture**2).tolist())
    print('small_fixture_pair_means=', (fixture.reshape(2,2)**2).mean(axis=1).tolist())
    print(f'numpy={np.__version__}')


if __name__ == '__main__':
    main()
