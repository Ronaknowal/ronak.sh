"""Ordinary NumPy route for the same stipulated loss, not a policy estimator."""

import numpy as np
from reliability_decision import inspection_decision


def expected_losses(probabilities, inspection_cost, *, failure_cost=100., effectiveness):
    """One supplied probability per profile; common declared cost/effectiveness.

    Scalar helper validates the shared consequence inputs. Vector operations
    take O(a) work/state for a profiles, returning two a-length loss arrays.
    """
    shared=inspection_decision(0.,inspection_cost,failure_cost=failure_cost,effectiveness=effectiveness)
    if shared['status']!='stipulated':
        raise ValueError('The array route requires a specified consequence model.')
    p=np.asarray(probabilities,dtype=float)
    if p.ndim!=1 or not len(p) or not np.isfinite(p).all() or ((p<0)|(p>1)).any():
        raise ValueError('Supply a nonempty vector of finite probabilities in [0,1].')
    without=float(failure_cost)*p
    with_action=float(inspection_cost)+(1-float(effectiveness))*without
    if not np.isfinite(with_action).all():
        raise FloatingPointError('Expected losses exceed the floating range.')
    return without,with_action
