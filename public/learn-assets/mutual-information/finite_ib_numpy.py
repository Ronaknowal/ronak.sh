"""Array IB updates, exact scratch comparison, and one fixed-auxiliary row solve."""
import math
import numpy as np
from scipy.optimize import minimize
import finite_ib_reference as scratch

PX = np.array(scratch.PX, dtype=np.float64)
LABEL = np.array(scratch.LABEL, dtype=np.float64)
LN2 = math.log(2)


def information(joint):
    px, py = joint.sum(axis=1), joint.sum(axis=0)
    i, j = np.nonzero(joint > 0)
    return float(np.sum(joint[i, j]*(np.log(joint[i, j])-np.log(px[i])-np.log(py[j])))/LN2)


def state(q, beta):
    pxz = PX[:, None]*q
    pzy = pxz.T @ LABEL
    pz = pzy.sum(axis=1)
    if np.any(pz <= 0):
        raise ValueError('this positive-support demonstration requires occupied codewords')
    decoder = pzy/pz[:, None]
    rate, relevance = information(pxz), information(pzy)
    return rate, relevance, rate-beta*relevance, pz, decoder


def distortions(decoder):
    # Axes are input A, codeword K, label B. This fixture has positive label laws.
    return np.sum(LABEL[:, None, :]*(np.log(LABEL[:, None, :])-np.log(decoder[None, :, :])), axis=2)


def update(q, beta):
    _, _, _, pz, decoder = state(q, beta)
    logits = np.log(pz)[None, :]-beta*distortions(decoder)
    weights = np.exp(logits-logits.max(axis=1, keepdims=True))
    return weights/weights.sum(axis=1, keepdims=True)


def free_energy(q, r, w, beta):
    return float(np.sum(PX[:, None]*q*(np.log(q)-np.log(r)[None, :]+beta*distortions(w)))/LN2)


def main():
    beta = 3.
    ix_y = information(PX[:, None]*LABEL)
    for name, initial in [
        ('informative', [[.8, .2], [.6, .4], [.3, .7], [.2, .8]]),
        ('symmetric', [[.5, .5]]*4),
    ]:
        q, reference = np.array(initial), [row[:] for row in initial]
        previous = math.inf
        for step in range(41):
            rate, relevance, objective, pz, decoder = state(q, beta)
            scalar = scratch.state(reference, beta)
            np.testing.assert_allclose(q, reference, atol=2e-12, rtol=0)
            np.testing.assert_allclose([rate,relevance,objective], scalar[:3], atol=2e-12, rtol=0)
            np.testing.assert_allclose(pz, scalar[3], atol=2e-12, rtol=0)
            np.testing.assert_allclose(decoder, scalar[4], atol=2e-12, rtol=0)
            energy = free_energy(q, pz, decoder, beta)
            assert abs(energy-objective-beta*ix_y) < 2e-12
            assert objective <= previous + 2e-12
            previous = objective
            if step in (0,1,4,40):
                print(name, step, 'R T J F bits', *[f'{v:.9f}' for v in [rate,relevance,objective,energy]])
            if step < 40:
                q = update(q, beta)
                reference = scratch.update(reference, beta)
        print(name, 'P(Z=1|X)', *[f'{v:.9f}' for v in q[:, 1]])
    # The optimizer below solves only one row with fixed auxiliary r and D.
    r, d, row_beta = np.array([.25, .75]), np.array([0., LN2]), 2.
    def row_objective(row):
        return float(np.sum(row*(np.log(row)-np.log(r)+row_beta*d)))
    def row_gradient(row):
        return np.log(row)-np.log(r)+1+row_beta*d
    result = minimize(row_objective, np.array([.5,.5]), jac=row_gradient,
                      bounds=[(1e-12,1)]*2,
                      constraints={'type':'eq','fun':lambda v:v.sum()-1,
                                   'jac':lambda v:np.ones(2)},
                      method='SLSQP', options={'ftol':1e-12,'maxiter':100})
    exact = r*np.exp(-row_beta*d)
    exact /= exact.sum()
    assert result.success
    np.testing.assert_allclose(result.x, exact, atol=2e-7, rtol=0)
    print('fixed-row Gibbs', *[f'{v:.9f}' for v in exact])
    print('fixed-row SLSQP', *[f'{v:.9f}' for v in result.x])
    print('fixed-row objective nats', f'{row_objective(result.x):.9f}')


if __name__ == '__main__':
    main()
