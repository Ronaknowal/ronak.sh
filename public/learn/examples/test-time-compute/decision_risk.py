"""Minimum estimated risk on an explicit action/reference domain.

python decision_risk.py
Reference values and weights are model beliefs, not evaluation truth.
"""
from fractions import Fraction
import json


def minimum_risk(actions, references, weights, loss):
    if not actions or not references or len(references) != len(weights):
        raise ValueError("Nonempty actions and paired references/weights required")
    weights = [Fraction(str(w)) for w in weights]
    if any(w < 0 for w in weights) or sum(weights) == 0:
        raise ValueError("Need nonnegative weights with positive total")
    weights = [w / sum(weights) for w in weights]
    matrix = [[Fraction(loss(action, reference)) for reference in references]
              for action in actions]
    risks = [sum(value * weight for value, weight in zip(row, weights))
             for row in matrix]
    chosen = min(range(len(actions)), key=lambda i: (risks[i], i))
    return {"action": actions[chosen], "risks": [float(x) for x in risks],
            "loss_matrix": [[float(x) for x in row] for row in matrix],
            "utility_evaluations": len(actions) * len(references)}


if __name__ == "__main__":
    actions = [0, 2, 10]
    print(json.dumps({"exact_match": minimum_risk(actions, actions, [.4, .35, .25],
                                                  lambda a, y: int(a != y)),
                     "absolute": minimum_risk(actions, actions, [.4, .35, .25],
                                               lambda a, y: abs(a - y))}, indent=2))
