"""One new scratch/ordinary SVD++ construction, with full saved parameters.

Run: python recommender-history-library.py
Place recommender-history-core.py beside this file. Requires NumPy, pandas,
scikit-surprise 1.1.5. The imported core's guarded main does not execute.
"""
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import surprise
from surprise import Dataset, Reader, SVDpp


def load_core():
    path = Path(__file__).with_name('recommender-history-core.py')
    specification = importlib.util.spec_from_file_location('recommender_history_core', path)
    if specification is None or specification.loader is None:
        raise ImportError('cannot load the complete sibling history core')
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


def ordinary_forward(model, train, raw_user, raw_item):
    try:
        user = train.to_inner_uid(raw_user)
    except ValueError:
        user = None
    try:
        item = train.to_inner_iid(raw_item)
    except ValueError:
        item = None
    result = float(train.global_mean)
    if user is not None:
        result += float(model.bu[user])
    if item is not None:
        result += float(model.bi[item])
    occurrences = [pair[0] for pair in train.ur[user]] if user is not None else []
    history = (model.yj[occurrences].sum(axis=0)/math.sqrt(len(occurrences))
               if occurrences else np.zeros(model.n_factors))
    if user is not None and item is not None:
        result += float(model.qi[item] @ (model.pu[user]+history))
    prediction = model.predict(raw_user, raw_item, clip=False)
    return {'rawUser': raw_user, 'rawItem': raw_item, 'innerUser': user, 'innerItem': item,
            'historyOccurrences': occurrences, 'historyVector': history,
            'manual': result, 'ordinary': prediction.est,
            'absoluteDifference': abs(result-prediction.est), 'details': prediction.details}


def serialize(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(type(value).__name__)


def main():
    if surprise.__version__ != '1.1.5':
        raise RuntimeError('this complete example locks scikit-surprise 1.1.5')
    core = load_core()
    events = [(0, 0, 4.), (0, 1, 2.), (1, 1, 5.), (1, 2, 1.),
              (2, 0, 2.), (2, 2, 4.), (2, 3, 3.), (0, 2, 3.)]
    scratch = core.train(events, 3, 4, dimensions=2, seed=23, mean=3., rate=.03, penalty=.1, epochs=10)
    table = pd.DataFrame([(f'U{u}', f'I{i}', rating) for u, i, rating in events],
                         columns=['user', 'item', 'rating'])
    train = Dataset.load_from_df(table, Reader(rating_scale=(1, 5))).build_full_trainset()
    model = SVDpp(n_factors=2, n_epochs=10, lr_all=.03, reg_all=.1, random_state=23)
    model.fit(train)
    forwards = [ordinary_forward(model, train, f'U{u}', f'I{i}') for u in range(3) for i in range(4)]
    forwards += [ordinary_forward(model, train, 'new-user', 'I0'),
                 ordinary_forward(model, train, 'U0', 'new-item'),
                 ordinary_forward(model, train, 'new-user', 'new-item')]
    if max(row['absoluteDifference'] for row in forwards) > 1e-12:
        raise AssertionError('actual saved-array ordinary forward exceeds declared tolerance')
    user = train.to_inner_uid('U0')
    history = [pair[0] for pair in train.ur[user]]
    canonical_history = sorted(set(history))
    duplicate_history = history+[history[0]]
    unique_vector = model.yj[canonical_history].sum(axis=0)/math.sqrt(len(canonical_history))
    duplicate_vector = model.yj[duplicate_history].sum(axis=0)/math.sqrt(len(duplicate_history))
    report = {'sourceEventOrder': events, 'constructedFits': {'scratch': 1, 'ordinarySVDpp': 1},
              'scratch': scratch,
              'scratchAllScores': [[core.predict(scratch['state'], u, i) for i in range(4)] for u in range(3)],
              'ordinaryVersion': surprise.__version__, 'ordinaryGlobalMean': float(train.global_mean),
              'ordinaryP': model.pu, 'ordinaryQ': model.qi, 'ordinaryY': model.yj,
              'ordinaryUserBias': model.bu, 'ordinaryItemBias': model.bi,
              'userIDMap': {f'U{u}': train.to_inner_uid(f'U{u}') for u in range(3)},
              'itemIDMap': {f'I{i}': train.to_inner_iid(f'I{i}') for i in range(4)},
              'ordinaryForward': forwards,
              'duplicateOnlyForward': {'history': history, 'duplicateHistory': duplicate_history,
                                       'uniqueVector': unique_vector, 'occurrenceVector': duplicate_vector,
                                       'additionalFits': 0},
              'correspondenceLimit': 'Scratch uses canonical unique history and incidence-distributed once-entity penalty. Surprise uses trainset occurrence history, local regularization and another initializer; equal hyperparameter names do not imply equal fitted scores.'}
    print(json.dumps(report, indent=2, default=serialize, allow_nan=False))


if __name__ == '__main__':
    main()
