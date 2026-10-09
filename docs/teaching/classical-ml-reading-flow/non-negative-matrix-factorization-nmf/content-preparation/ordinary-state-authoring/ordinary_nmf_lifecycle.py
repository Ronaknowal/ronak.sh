"""Public NMF lifecycle with candidate publication; the solver remains sklearn's."""
from dataclasses import dataclass
import numpy as np
from sklearn.decomposition import NMF

from nmf_arrays import (
    feature_ids, frobenius_metrics, nonnegative_scalar, nonnegative_table,
    positive_integer, reconstruction, require_finite,
)


@dataclass(frozen=True)
class OrdinaryState:
    model: NMF
    features: tuple
    k: int
    fit_half_loss: float


class PublishedNMF:
    """A deliberately CD/Frobenius, unpenalized adapter; no new NMF solver."""
    def __init__(self, n_components, *, max_iter=2000, tol=1e-7):
        self.n_components, self.max_iter, self.tol = n_components, max_iter, tol
        self._state = None

    def _fitted(self):
        if self._state is None:
            raise ValueError("Fit the dictionary before querying it")
        return self._state

    @property
    def components_(self):
        return self._fitted().model.components_.copy()

    @property
    def fit_half_loss_(self):
        return self._fitted().fit_half_loss

    def fit_transform(self, values, *, features, initial_w, initial_h):
        x = nonnegative_table(values, require_rows=True)
        k = positive_integer(self.n_components, "n_components")
        cap = positive_integer(self.max_iter, "max_iter")
        tol = nonnegative_scalar(self.tol, "tol")
        names = feature_ids(features, x.shape[1])
        w0, h0 = nonnegative_table(initial_w, k), nonnegative_table(initial_h, x.shape[1])
        if w0.shape != (x.shape[0], k) or h0.shape != (k, x.shape[1]):
            raise ValueError("Initial factors must match fitting rows, rank and features")
        candidate = NMF(n_components=k, init='custom', solver='cd', beta_loss='frobenius',
                        alpha_W=0, alpha_H=0, shuffle=False, max_iter=cap, tol=tol,
                        random_state=0)
        w = candidate.fit_transform(x, W=w0, H=h0)
        require_finite(candidate.components_, "Candidate dictionary")
        loss = frobenius_metrics(x, w, candidate.components_).half_square
        result = w.copy()
        self._state = OrdinaryState(candidate, names, k, loss)
        return result

    def transform(self, values, *, features):
        state = self._fitted()
        x = nonnegative_table(values, state.model.components_.shape[1])
        if feature_ids(features, x.shape[1]) != state.features:
            raise ValueError("Query feature order differs from the fitted dictionary")
        if x.shape[0] == 0:
            return np.empty((0, state.k))
        return require_finite(state.model.transform(x), "Ordinary query amounts")

    def inverse_transform(self, values):
        state = self._fitted()
        w = nonnegative_table(values, state.k)
        if w.shape[0] == 0:
            return np.empty((0, state.model.components_.shape[1]))
        return require_finite(state.model.inverse_transform(w), "Ordinary reconstruction")


def main():
    from nmf_coordinate import CoordinateNMF

    np.set_printoptions(precision=9, suppress=True)
    # New constructed inputs, distinct from the earlier coordinate main.
    x = np.array([[3., 1., 4.], [1., 2., 3.], [2., 1., 3.]])
    query = np.array([[1.5, .5, 2.]])
    h0, w0 = np.array([[1., 0., 1.], [0., 1., 1.]]), np.ones((3, 2))
    features = ('F0', 'F1', 'F2')
    scratch, ordinary = CoordinateNMF(2, max_iter=2000), PublishedNMF(2)
    checks = []
    def check(name, condition):
        checks.append(name)
        if not condition:
            raise AssertionError(name)
    for name, model in [('scratch', scratch), ('ordinary', ordinary)]:
        w = model.fit_transform(x, features=features, initial_w=w0, initial_h=h0)
        h = model.components_
        amounts = model.transform(query, features=features)
        rebuilt = model.inverse_transform(amounts)
        print(name, 'shapes', w.shape, h.shape, amounts.shape, rebuilt.shape)
        print(name, 'dictionary', h, 'query_amounts', amounts, 'query_reconstruction', rebuilt)
        print(name, 'fit_half_loss', frobenius_metrics(x, w, h).half_square)
        check(name+' shapes', (w.shape,h.shape,amounts.shape,rebuilt.shape)==((3,2),(2,3),(1,2),(1,3)))
        check(name+' reconstruct by stored H', np.allclose(rebuilt, amounts @ h, rtol=1e-14,atol=1e-14))
        check(name+' small constructed fit residual', frobenius_metrics(x,w,h).half_square < 1e-10)
        check(name+' copied inputs', np.array_equal(w0,np.ones((3,2))) and np.array_equal(h0,[[1,0,1],[0,1,1]]))
        h[:] = -99
        check(name+' dictionary return is isolated', (model.components_ >= 0).all())
        before_h, before_q = model.components_, model.transform(query, features=features)
        model.n_components = 1  # Next fit only; old query must still have two amounts.
        for invalid, ids in [([[-1.,0.,1.]],features), ([[np.nan,0.,1.]],features), ([[1.,2.]],features)]:
            try:
                model.fit_transform(invalid,features=ids,initial_w=np.ones((1,1)),initial_h=np.ones((1,3)))
            except ValueError:
                check(name+' rejected fit conserves snapshot', np.array_equal(before_h,model.components_) and np.array_equal(before_q,model.transform(query,features=features)))
            else:
                raise AssertionError('Invalid fit unexpectedly accepted')
        for invalid, ids in [(query,('F1','F0','F2')), ([[-1.,0.,1.]],features), ([[1.,2.]],features)]:
            try:
                model.transform(invalid,features=ids)
            except ValueError:
                check(name+' refused incompatible query', True)
            else:
                raise AssertionError('Invalid query unexpectedly accepted')
        check(name+' empty shapes use fitted rank', model.transform(np.empty((0,3)),features=features).shape==(0,2) and model.inverse_transform(np.empty((0,2))).shape==(0,3))
        check(name+' next-fit rank did not change query', model.transform(query,features=features).shape==(1,2))
        print(name,'rejected_candidates_preserved',True,'empty_amounts',(0,2),'next_fit_rank',model.n_components)
    print('new_lifecycle_checks',len(checks))


if __name__ == '__main__':
    main()
