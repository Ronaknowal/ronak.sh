"""Exact entry-observation risk enumeration, distinct from action-policy IPS.

Run: python recommender-propensity-risk.py
Only Python's standard library is needed. Fractions remain exact throughout.
"""
from fractions import Fraction
from itertools import product
import json
import math


def exact(value):
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError('all supplied values must be finite')
        return Fraction(str(value))
    return Fraction(value)


def observation_problem(losses, propensities, target_weights=None):
    losses = [exact(value) for value in losses]
    propensities = [exact(value) for value in propensities]
    if not losses or len(losses) != len(propensities):
        raise ValueError('one observation probability is required for each entry')
    if any(value < 0 for value in losses):
        raise ValueError('this example declares nonnegative entry losses')
    if any(value < 0 or value > 1 for value in propensities):
        raise ValueError('observation probabilities must lie in [0,1]')
    weights = ([Fraction(1, len(losses))] * len(losses) if target_weights is None
               else [exact(value) for value in target_weights])
    if len(weights) != len(losses) or any(value < 0 for value in weights) or sum(weights) != 1:
        raise ValueError('target weights must be nonnegative and sum exactly to 1')
    return losses, propensities, weights


def estimates(mask, losses, propensities, weights):
    if len(mask) != len(losses) or any(value not in (0, 1) for value in mask):
        raise ValueError('mask must have one binary indicator per entry')
    unsupported = [index for index, (weight, probability) in enumerate(zip(weights, propensities))
                   if weight > 0 and probability == 0]
    count = sum(mask)
    naive = (sum(value * present for value, present in zip(losses, mask)) / count
             if count else None)
    if unsupported:
        return {'naiveObservedMean': naive, 'IPS': None, 'SNIPS': None,
                'unsupportedTargetEntries': unsupported}
    # A target 0/propensity 0 cell contributes 0; it never evaluates 0/0.
    weighted = [weight * present / probability if probability else Fraction(0)
                for present, probability, weight in zip(mask, propensities, weights)]
    ips = sum(weight * value for weight, value in zip(weighted, losses))
    denominator = sum(weighted)
    return {'naiveObservedMean': naive, 'IPS': ips,
            'SNIPS': ips / denominator if denominator else None,
            'SNIPSDenominator': denominator,
            'unsupportedTargetEntries': []}


def enumerate_independent_masks(losses, propensities, target_weights=None):
    """Independence is declared here, not inferred from the observed entries."""
    losses, propensities, weights = observation_problem(losses, propensities, target_weights)
    if len(losses) > 20:
        raise ValueError('exact 2^N enumeration is bounded to 20 teaching entries')
    rows = []
    for mask in product((0, 1), repeat=len(losses)):
        probability = math.prod(p if present else 1-p for present, p in zip(mask, propensities))
        rows.append({'mask': list(mask), 'probability': probability,
                     **estimates(mask, losses, propensities, weights)})
    if sum(row['probability'] for row in rows) != 1:
        raise AssertionError('full independent mask distribution must sum to 1')
    summary = {'knownConstructionTarget': sum(weight * loss for weight, loss in zip(weights, losses)),
               'entries': len(losses), 'enumeratedMasks': len(rows),
               'positiveProbabilityMasks': sum(row['probability'] > 0 for row in rows)}
    for name in ['naiveObservedMean', 'IPS', 'SNIPS']:
        defined = [row for row in rows if row['probability'] and row[name] is not None]
        defined_mass = sum(row['probability'] for row in defined)
        total = sum(row['probability'] * row[name] for row in defined)
        summary[name] = {
            'definedProbability': defined_mass,
            'unconditionalExpectation': total if defined_mass == 1 else None,
            'expectationConditionalOnDefined': total / defined_mass if defined_mass else None,
        }
    return {'losses': losses, 'propensities': propensities, 'targetWeights': weights,
            'summary': summary, 'masks': rows}


def policy_paths(logging, target, rewards):
    """Separate request-action unit; rewards are Bernoulli conditional chances."""
    logging, target, rewards = [[exact(value) for value in vector]
                                for vector in (logging, target, rewards)]
    if len(logging) != len(target) or len(logging) != len(rewards) or not logging:
        raise ValueError('one target/logging/reward value per action is required')
    if sum(logging) != 1 or sum(target) != 1:
        raise ValueError('each policy must sum exactly to 1')
    if any(value < 0 or value > 1 for vector in (logging, target, rewards) for value in vector):
        raise ValueError('policy/reward probabilities must lie in [0,1]')
    unsupported = [action for action, (p, t) in enumerate(zip(logging, target)) if t > 0 and p == 0]
    rows = []
    for action, y in product(range(len(logging)), (0, 1)):
        ratio = target[action] / logging[action] if logging[action] else (Fraction(0) if target[action] == 0 else None)
        rows.append({'action': action, 'reward': y,
                     'probability': logging[action] * (rewards[action] if y else 1-rewards[action]),
                     'ratio': ratio, 'weightedReward': ratio*y if ratio is not None else None})
    return {'unsupportedActions': unsupported, 'paths': rows,
            'knownConstructionTarget': sum(p*r for p, r in zip(target, rewards)),
            'loggedExpectation': sum(p*r for p, r in zip(logging, rewards)),
            'IPSExpectation': None if unsupported else sum(row['probability']*row['weightedReward'] for row in rows)}


def serialize(value):
    if isinstance(value, Fraction):
        return {'exact': str(value), 'decimal': float(value)}
    raise TypeError(type(value).__name__)


def main():
    risk = enumerate_independent_masks([1, 4, 2, 3], [1, '1/2', '1/4', 1])
    summary = risk['summary']
    if summary['IPS']['unconditionalExpectation'] != Fraction(5, 2):
        raise AssertionError('positive-support IPS expectation must equal the fixed full-grid mean')
    if summary['naiveObservedMean']['unconditionalExpectation'] != Fraction(37, 16):
        raise AssertionError('different observation population must retain its actual naive mean')
    if risk['masks'][-1]['IPS'] != 5:
        raise AssertionError('the all-observed realized IPS exceeds the individual loss range')
    report = {
        'entryRisk': risk,
        'emptyPossible': enumerate_independent_masks([1, 4], ['1/2', '1/4']),
        'unsupportedEntry': enumerate_independent_masks([1, 4], [1, 0]),
        'zeroTargetZeroObservation': enumerate_independent_masks([1, 4], [1, 0], [1, 0]),
        'separateKnownPolicy': policy_paths(['4/5', '1/5'], ['1/2', '1/2'], ['2/5', '4/5']),
        'unsupportedPolicy': policy_paths([1, 0], ['1/2', '1/2'], ['2/5', '4/5']),
        'limits': 'Supplied independent probabilities are known construction inputs. Retail absence provides neither exposure propensities nor causal identification.',
    }
    print(json.dumps(report, indent=2, default=serialize))


if __name__ == '__main__':
    main()
