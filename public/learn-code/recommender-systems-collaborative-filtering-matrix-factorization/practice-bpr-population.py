"""Changed occurrence/eligibility objective; no sampling, updates or fit.

Keep this file beside recommender-bpr-training.py, or pass --sources DIRECTORY.
Run: python practice-bpr-population.py
"""
import argparse
import importlib.util
import json
import math
from pathlib import Path


def load_bpr(directory):
    path = directory / 'recommender-bpr-training.py'
    spec = importlib.util.spec_from_file_location('practice_bpr_reference', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # Its guarded main is not called.
    return module


def population_summary(module, binary, occurrences, eligible, convention):
    population = module.occurrence_population(binary, occurrences, eligible)
    triples = population['triples']
    distribution = module.sampler_distribution(triples, convention)
    if not distribution['available']:
        return {'available': False, 'records': population['records']}
    # Fixed one-coordinate factors make this a population/objective calculation.
    # I3 has a large coordinate but is outside the declared eligible set.
    users, items = [[1.], [2.], [3.]], [[0.], [1.], [2.], [100.]]
    losses = [module.local_objective(users[u], items[i], items[j], 0.)
              for u, i, j in triples]
    weighted_loss = math.fsum(weight * loss for weight, loss in
                              zip(distribution['tripleProbabilities'], losses))
    return {'available': True, 'triples': triples, 'records': population['records'],
            'userMass': distribution['userProbabilities'],
            'probabilities': distribution['tripleProbabilities'], 'loss': weighted_loss}


def main(directory):
    module = load_bpr(directory)
    binary = [[1, 0, 1, 0], [0, 1, 0, 0], [1, 1, 0, 0]]
    occurrences = [{'id': name, 'user': user, 'item': item} for name, user, item in
                   [('a', 0, 0), ('b', 0, 2), ('c', 1, 1),
                    ('d', 2, 0), ('e', 2, 1), ('f', 0, 0)]]
    eligible = [1, 1, 1, 0]
    triples = population_summary(module, binary, occurrences, eligible, 'uniform-triple')
    users = population_summary(module, binary, occurrences, eligible, 'uniform-user')
    expected = [(0, 0, 1), (0, 2, 1), (1, 1, 0), (1, 1, 2),
                (2, 0, 2), (2, 1, 2), (0, 0, 1)]
    assert triples['triples'] == expected
    assert [row['positiveOccurrenceID'] for row in triples['records']] == ['a', 'b', 'c', 'c', 'd', 'e', 'f']
    assert all(abs(triples['userMass'][u] - wanted) < 1e-14
               for u, wanted in enumerate([3/7, 2/7, 2/7]))
    assert all(abs(users['userMass'][u] - 1/3) < 1e-14 for u in range(3))
    assert all(binary[u][j] == 0 and eligible[i] and eligible[j] for u, i, j in expected)
    # Independent scalar softplus for each of the seven actual score gaps.
    softplus = lambda x: max(0., x) + math.log1p(math.exp(-abs(x)))
    losses = [softplus(x) for x in [1., -1., -2., 2., 6., 3., 1.]]
    assert abs(triples['loss'] - math.fsum(losses)/7) < 1e-14
    expected_user_loss = ((losses[0]+losses[1]+losses[6])/3 +
                          (losses[2]+losses[3])/2 + (losses[4]+losses[5])/2)/3
    assert abs(users['loss'] - expected_user_loss) < 1e-14
    empty = population_summary(module, binary, occurrences, [0, 0, 0, 0], 'uniform-triple')
    assert empty == {'available': False, 'records': []}
    print(json.dumps({'routes': expected, 'uniformTripleUserMass': triples['userMass'],
                      'uniformUserMass': users['userMass'], 'uniformTripleLoss': triples['loss'],
                      'uniformUserLoss': users['loss'], 'emptyAvailable': empty['available']}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, default=Path(__file__).resolve().parent)
    main(parser.parse_args().sources)
