import numpy as np
from sklearn.svm import OneClassSVM
from one_class_core import PairOneClass


def main():
    fixtures = [np.array([[-1.], [1.]]), np.array([[-1.], [.2], [1.4]]),
                np.array([[-1., 0.], [0., .7], [1., .2], [2., 1.]])]
    for x in fixtures:
        scratch = PairOneClass(nu=.5, gamma=1., tolerance=1e-8).fit(x)
        native = OneClassSVM(nu=.5, gamma=1., tol=1e-9, max_iter=10000, cache_size=32).fit(x)
        scale = .5*len(x)
        native_alpha = np.zeros(len(x))
        native_alpha[native.support_] = native.dual_coef_[0]/scale
        gram = scratch.kernel.matrix(x, x)
        native_q = .5*native_alpha@gram@native_alpha
        np.testing.assert_allclose(scratch.certificate_state['quadratic'], native_q, atol=2e-8)
        queries = np.vstack([x, np.zeros((1, x.shape[1]))])
        np.testing.assert_allclose(scratch.score_queries(queries, 2, 1), native.decision_function(queries)/scale, atol=2e-7)
        print('rows', len(x), 'status', scratch.status, 'steps', scratch.steps,
              'gap', f"{scratch.certificate_state['gap']:.3g}")
        print('alpha:', np.round(scratch.alpha, 9).tolist(), 'rho:', round(scratch.rho, 9),
              'native fit_status:', native.fit_status_)
        print('normalized query decisions:', np.round(scratch.score_queries(queries, 2, 1), 9).tolist())
    no_free = PairOneClass(nu=1.).fit([[-1.], [1.]])
    assert no_free.status == 'gap passed' and no_free.certificate_state['gap'] < 1e-10
    print('nu1 alpha/rho/gap:', no_free.alpha.tolist(), round(no_free.rho, 9), no_free.certificate_state['gap'])
    same = PairOneClass(nu=1.).fit([[0.], [0.]])
    print('coincident nu1 decision:', same.score_queries([[0.], [2.]]).tolist())
    unfinished = PairOneClass(nu=.5, max_steps=0).fit(fixtures[1])
    assert unfinished.status == 'step limit' and unfinished.certificate_state['gap'] > 1e-8
    print('zero-step status/gap:', unfinished.status, round(unfinished.certificate_state['gap'], 9))
    assert no_free.score_queries(np.empty((0, 1))).shape == (0,)


if __name__ == '__main__':
    main()
