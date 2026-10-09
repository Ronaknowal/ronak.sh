"""Rejected-state witness using a supplied complete hand state, no successful fit."""
import numpy as np
from lof_core import ReferenceLOF


def supplied_reference():
    model = ReferenceLOF(k=2, batch_size=2)
    # These are the fully hand-computed six-row statistics from sections 9-10.
    model.__dict__.update(
        reference=np.array([0., 1., 2., 20., 24., 28.])[:, None],
        feature_order=['level'],
        neighbors=np.array([[1, 2], [0, 2], [1, 0], [4, 5], [3, 5], [4, 3]]),
        distances=np.array([[1., 2.], [1., 1.], [1., 2.], [4., 8.], [4., 4.], [4., 8.]]),
        radius=np.array([2., 1., 2., 8., 4., 8.]),
        reach=np.array([[1., 2.], [2., 2.], [1., 2.], [4., 8.], [8., 8.], [4., 8.]]),
        lrd=np.array([2/3, 1/2, 2/3, 1/6, 1/8, 1/6]),
        training_factor=np.array([7/8, 4/3, 7/8, 7/8, 4/3, 7/8]),
        fitted_k=2, fitted_epsilon=0., fitted_batch_size=2, _fit_valid=True)
    np.testing.assert_allclose(model.reach, np.maximum(model.distances, model.radius[model.neighbors]))
    np.testing.assert_allclose(model.lrd, 1/model.reach.mean(axis=1))
    return model


def rejected(model):
    try:
        model.fit(np.zeros((6, 1)), feature_order=['replacement'])
    except ValueError as error:
        return str(error)
    raise AssertionError('The zero-reach candidate must be refused.')


def main():
    fresh = ReferenceLOF(k=2)
    print('fresh rejected:', rejected(fresh))
    assert not hasattr(fresh, 'reference') and not getattr(fresh, '_fit_valid', False)
    try:
        fresh.inspect_queries([[1.]])
    except ValueError as error:
        print('fresh query:', str(error))
    else:
        raise AssertionError('Fresh rejected state must not be queryable.')
    model = supplied_reference()
    previous = dict(model.__dict__)
    before = model.inspect_queries([[1.]], feature_order=['level'])['factor'][0]
    print('existing rejected:', rejected(model))
    assert set(previous) == set(model.__dict__)
    assert all(model.__dict__[key] is value for key, value in previous.items())
    after = model.inspect_queries([[1.]], feature_order=['level'])['factor'][0]
    np.testing.assert_allclose([before, after], [7/8, 7/8])
    print('retained reference:', model.reference[:, 0].tolist())
    print('query1 before/after:', before, after)
    # Next-fit choices must not change the already published reference statistics.
    model.k, model.epsilon = 3, 1e-10
    np.testing.assert_allclose(model.inspect_queries([[1.]])['factor'], [7/8])
    print('requested k/fitted k:', model.k, model.fitted_k)
    partial = ReferenceLOF(k=2)
    partial.reference = np.zeros((6, 1))
    try:
        partial.inspect_queries([[1.]])
    except ValueError as error:
        print('partial query:', str(error))
    else:
        raise AssertionError('A reference attribute alone is not a fitted bundle.')


if __name__ == '__main__':
    main()
