"""Trace temperature, nucleus selection and inverse-CDF sampling.
Run: python synthetic_sampling.py   Requires NumPy.
"""
import json
import numpy as np


def distribution(logits, temperature=1.0, top_p=1.0):
    """Finite 1-D logits; positive temperature; 0 < top_p <= 1."""
    logits = np.asarray(logits, dtype=np.float64)
    if logits.ndim != 1 or not logits.size or not np.isfinite(logits).all():
        raise ValueError("Expected a nonempty finite vector")
    if not np.isfinite(temperature) or temperature <= 0 or not 0 < top_p <= 1:
        raise ValueError("Invalid temperature or nucleus mass")
    # Subtraction before division prevents positive overflow at small T.
    with np.errstate(over="ignore", under="ignore"):
        weights = np.exp((logits - logits.max()) / temperature)
    probabilities = weights / weights.sum()
    order = np.argsort(-probabilities, kind="stable")
    cumulative = probabilities[order].cumsum()
    stop = min(len(order), np.searchsorted(cumulative, top_p, side="left") + 1)
    kept = order[:stop]
    nucleus = np.zeros_like(probabilities)
    nucleus[kept] = probabilities[kept] / probabilities[kept].sum()
    return {"probabilities": probabilities, "order": order, "kept": kept,
            "nucleus": nucleus, "ordered_cumulative": cumulative}


def inverse_cdf(probabilities, uniform):
    """Intervals are [left,right); zero-mass entries cannot be drawn."""
    probabilities = np.asarray(probabilities, dtype=np.float64)
    if not 0 <= uniform < 1:
        raise ValueError("Uniform draw must lie in [0,1)")
    if probabilities.ndim != 1 or not probabilities.size or (probabilities < 0).any() or not np.isfinite(probabilities).all() or not np.isclose(probabilities.sum(), 1):
        raise ValueError("Expected a normalized probability vector")
    # Build intervals only for positive mass, preserving original token IDs.
    # Renormalize accepted rounding error before forcing the positive endpoint.
    support = np.flatnonzero(probabilities > 0)
    cumulative = probabilities[support].cumsum()
    cumulative /= cumulative[-1]
    cumulative[-1] = 1.0
    return int(support[np.searchsorted(cumulative, uniform, side="right")])


def trace_sequence(draws, top_p=.9):
    """An authored lookup generator, not a neural model; EOS is token 3."""
    tables = np.array([[.55, .25, .15, .05], [.1, .2, .1, .6],
                       [.15, .1, .05, .7], [.05, .05, .1, .8]])
    previous, records = 0, []
    for step, uniform in enumerate(draws):
        state = distribution(np.log(tables[previous]), top_p=top_p)
        token = inverse_cdf(state["nucleus"], uniform)
        records.append({"step": step, "previous": previous, "uniform": uniform,
                        "distribution": state["nucleus"].tolist(), "token": token})
        previous = token
        if token == 3:
            return {"steps": records, "termination": "EOS"}
    return {"steps": records, "termination": "length cap"}


def main():
    state = distribution(np.log([.55, .25, .15, .05]), top_p=.8)
    print(json.dumps({"single_step": {k: v.tolist() for k, v in state.items()},
                      "sequence": trace_sequence([.8, .8, .9])}, indent=2))


if __name__ == "__main__":
    main()
