"""The finite probability operations used by exact speculative sampling.

python speculative_math.py
Requires NumPy; no model, training or downloaded data. Tokens are integer IDs.
The verification routine is separate from importing these reusable functions.
"""

import json
import math
import numpy as np


def distribution(values):
    """Validate an already normalized row, correcting only summation roundoff."""
    row = np.asarray(values, dtype=np.float64)
    if row.ndim != 1 or not row.size or not np.isfinite(row).all() or (row < 0).any():
        raise ValueError("Use a nonempty finite nonnegative probability row.")
    total = math.fsum(row.tolist())
    if total <= 0 or abs(total - 1.0) > 1e-12:
        raise ValueError("The declared probability row must sum to one.")
    return row / total


def uniform_value(value):
    value = float(value)
    if not math.isfinite(value) or not 0 <= value < 1:
        raise ValueError("A uniform variate must be in the half-open interval [0,1).")
    return value


def categorical(values, uniform):
    """Half-open inverse CDF, with the final interval on positive support only."""
    row = distribution(values)
    uniform = uniform_value(uniform)
    support = np.flatnonzero(row > 0)
    cumulative = np.cumsum(row[support])
    cumulative[-1] = 1.0
    return int(support[np.searchsorted(cumulative, uniform, side="right")])


def paired(target, proposal):
    p, q = distribution(target), distribution(proposal)
    if p.shape != q.shape:
        raise ValueError("Target and proposal use the same vocabulary.")
    return p, q


def residual(target, proposal):
    """Return normalized positive deficit, or None if rejection is unreachable."""
    p, q = paired(target, proposal)
    deficit = np.maximum(p - q, 0.0)
    mass = math.fsum(deficit.tolist())
    return None if mass == 0 else deficit / mass


def acceptance(target, proposal, token):
    p, q = paired(target, proposal)
    if not isinstance(token, (int, np.integer)) or not 0 <= token < len(p):
        raise ValueError("Token must be a vocabulary index.")
    if q[token] == 0:
        raise ValueError("A zero-probability token cannot be proposed from q.")
    return min(1.0, float(p[token] / q[token]))


def verify_proposal(target, proposal, token, uniform):
    """Strict comparison preserves the p=0,u=0 rejection boundary."""
    threshold = acceptance(target, proposal, token)
    return uniform_value(uniform) < threshold


def one_step(target, proposal, proposal_uniform, accept_uniform, repair_uniform):
    p, q = paired(target, proposal)
    token = categorical(q, proposal_uniform)
    threshold = acceptance(p, q, token)
    accepted = verify_proposal(p, q, token, accept_uniform)
    repair = residual(p, q)
    if accepted:
        emitted = token
    else:
        if repair is None:
            raise ArithmeticError("A rejection cannot have an empty residual.")
        emitted = categorical(repair, repair_uniform)
    return {"proposal": token, "threshold": threshold, "accepted": accepted,
            "emitted": emitted, "repair": None if repair is None else repair.tolist()}


def mass_table(target, proposal):
    p, q = paired(target, proposal)
    common = np.minimum(p, q)
    repaired = np.maximum(p - q, 0)
    return {"target": p.tolist(), "proposal": q.tolist(),
            "accepted_mass": common.tolist(), "repaired_mass": repaired.tolist(),
            "final_mass": (common + repaired).tolist(),
            "overlap": float(common.sum()), "tv": float(np.abs(p - q).sum() / 2),
            "rejection_mass": float(np.maximum(q - p, 0).sum())}


def expected_tokens(alpha, lookahead):
    if not math.isfinite(alpha) or not 0 <= alpha <= 1:
        raise ValueError("Independent common acceptance alpha must be in [0,1].")
    if not isinstance(lookahead, int) or lookahead < 0:
        raise ValueError("Lookahead is a nonnegative integer.")
    accepted = sum(alpha ** j for j in range(1, lookahead + 1))
    return {"accepted": accepted, "emitted": 1 + accepted,
            "scope": "Independent common-alpha model without EOS or output cap."}


def verify():
    rows = [([.2,.5,.3],[.5,.3,.2]), ([.4,.6],[.4,.6]), ([1.,0],[0,1.]),
            ([.3,.2,.5],[0,.6,.4])]
    for p, q in rows:
        table = mass_table(p,q)
        np.testing.assert_allclose(table["final_mass"], p, atol=1e-15, rtol=0)
        assert abs(table["overlap"] + table["tv"] - 1) < 1e-14
    assert categorical([.16384036919468925,.8361596308053106,0], np.nextafter(1.,0.)) == 1
    assert categorical([0,.5,0,.5,0],0) == 1
    assert categorical([0,.5,0,.5,0],.5) == 3
    assert not verify_proposal([0,1],[1,0],0,0)
    assert residual([.5,.5],[.5,.5]) is None
    for bad in [[], [0,0], [1,-1], [np.nan,1], [np.inf,0], [.1,.2]]:
        try:
            distribution(bad)
            raise AssertionError("Invalid row accepted.")
        except ValueError:
            pass
    assert abs(expected_tokens(.7,4)["emitted"] - 2.7731) < 1e-14
    return {"passed": True, "worked": mass_table(*rows[0]),
            "repair": residual(*rows[0]).tolist(), "cost_model": expected_tokens(.7,4)}


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
