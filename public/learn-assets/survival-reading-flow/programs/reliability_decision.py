"""Stipulated one-horizon consequences, separate from survival estimation."""

from math import isfinite


def inspection_decision(probability, inspection_cost, *, failure_cost=100., effectiveness=None):
    """Costs share one unit; effectiveness is stipulated prevented-event fraction.

    No discounting, action harm, capacity constraint or competing endpoints.
    A missing consequence assumption means no warranted decision. Equality
    has equal expected loss. Constant work/state per supplied probability.
    """
    probability,inspection_cost,failure_cost=map(float,(probability,inspection_cost,failure_cost))
    if not all(isfinite(v) for v in (probability,inspection_cost,failure_cost)) or not 0<=probability<=1 or inspection_cost<0 or failure_cost<=0:
        raise ValueError('Require a probability, nonnegative inspection cost and positive failure cost.')
    if effectiveness is None:
        return {'status':'consequence-model-missing','action':None}
    effectiveness=float(effectiveness)
    if not isfinite(effectiveness) or not 0<=effectiveness<=1:
        raise ValueError('Stipulated prevented-event fraction must lie in [0,1].')
    without=probability*failure_cost
    with_action=inspection_cost+probability*(1-effectiveness)*failure_cost
    threshold=None if effectiveness==0 else inspection_cost/(effectiveness*failure_cost)
    action='equal-loss' if with_action==without else ('inspect' if with_action<without else 'do-not-inspect')
    return {'status':'stipulated','threshold':threshold,'without_action_loss':without,
            'with_action_loss':with_action,'expected_loss_difference':without-with_action,'action':action}
