"""Repair a tiny saved-state permutation and recalculate its fixed-Q query.

Keep beside recommender-retail-study.py, or pass --sources DIRECTORY.
No archive/data preparation, training sweep or study main runs.
"""
import argparse
import importlib.util
import json
from pathlib import Path

import numpy as np
from scipy.sparse import csr_matrix


def load_query(directory):
    path = directory / 'recommender-retail-study.py'
    spec = importlib.util.spec_from_file_location('practice_saved_query', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.fixed_history_query


def permute_bundle(bundle, order):
    order = list(order)
    if sorted(order) != list(range(len(bundle['ids']))):
        raise ValueError('a complete bijective item permutation is required')
    return {'ids': [bundle['ids'][i] for i in order],
            'Q': bundle['Q'][order].copy(),
            'history': bundle['history'][:, order].copy(),
            'eligible': bundle['eligible'][:, order].copy(),
            'trainingP': bundle['trainingP'].copy(), 'penalty': bundle['penalty']}


def named_query(query, bundle):
    result = query(bundle['history'].toarray(), bundle['Q'], bundle['penalty'])
    named = dict(zip(bundle['ids'], result['scores'][0].tolist()))
    eligible = {item: bool(flag) for item, flag in zip(bundle['ids'], bundle['eligible'][0])}
    order = sorted((item for item in named if eligible[item]), key=lambda item: (-named[item], item))
    return result, named, order


def main(directory):
    query = load_query(directory)
    # This is a new declared analytical fixture, not a fitted Retail state.
    original = {'ids': ['I0', 'I1', 'I2'], 'Q': np.array([[1., 0.], [0., 1.], [1., 1.]]),
                'history': csr_matrix([[1., 0., 2.]]), 'eligible': np.array([[False, True, False]]),
                'trainingP': np.array([[8., 9.]]), 'penalty': 2.}
    before = {key: value.copy() for key, value in original.items() if hasattr(value, 'copy')}
    reference, named, order = named_query(query, original)
    np.testing.assert_allclose(reference['queryA'][0], [[10., 5.], [5., 8.]], rtol=0, atol=1e-14)
    np.testing.assert_allclose(reference['queryB'][0], [8., 5.], rtol=0, atol=1e-14)
    np.testing.assert_allclose(reference['queryP'][0], [39/55, 10/55], rtol=0, atol=1e-14)
    expected = {'I0': 39/55, 'I1': 10/55, 'I2': 49/55}
    assert all(abs(named[item] - score) < 1e-14 for item, score in expected.items())
    assert order == ['I1']
    bad = dict(original, ids=['I2', 'I0', 'I1'])
    _, wrongly_named, _ = named_query(query, bad)
    assert any(abs(wrongly_named[item] - named[item]) > 1e-3 for item in named)
    repaired = permute_bundle(original, [2, 0, 1])
    after, same_named, same_order = named_query(query, repaired)
    np.testing.assert_allclose(after['queryP'], reference['queryP'], rtol=0, atol=1e-14)
    assert all(abs(same_named[item] - named[item]) < 1e-14 for item in named)
    assert same_order == order
    assert repaired['history'].toarray().tolist() == [[2., 1., 0.]]
    empty = query(np.zeros((1, 3)), repaired['Q'], 2.)
    assert np.array_equal(empty['queryP'], np.zeros((1, 2)))
    for key in ['Q', 'eligible', 'trainingP']:
        assert np.array_equal(original[key], before[key])
    assert (original['history'] != before['history']).nnz == 0
    assert not np.allclose(original['trainingP'], reference['queryP'], rtol=0, atol=1e-14)
    print(json.dumps({'queryA': reference['queryA'][0].tolist(), 'queryB': reference['queryB'][0].tolist(),
                      'queryP': reference['queryP'][0].tolist(), 'namedScores': named,
                      'nameOnlyFaultScores': wrongly_named, 'repairedNamedScores': same_named,
                      'eligibleOrder': same_order, 'emptyQueryP': empty['queryP'].tolist()}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, default=Path(__file__).resolve().parent)
    main(parser.parse_args().sources)
