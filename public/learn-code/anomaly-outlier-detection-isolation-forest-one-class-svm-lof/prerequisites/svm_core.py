"""Inspectible bounded binary dual solver with maintained gradient and state."""
import numpy as np


class PairSVM:
    def __init__(self, c=1., kernel='rbf', gamma=.5, tolerance=1e-7,
                 max_steps=20000, certificate_every=10):
        if kernel not in ('linear', 'rbf') or not np.isfinite(c) or not .001 <= c <= 100:
            raise ValueError('Choose linear/rbf and finite C in [.001,100].')
        if not np.isfinite(gamma) or not 1e-4 <= gamma <= 10:
            raise ValueError('Gamma must be finite in [1e-4,10].')
        if not np.isfinite(tolerance) or not 1e-10 <= tolerance <= .01:
            raise ValueError('Tolerance must be finite in [1e-10,.01].')
        if not isinstance(max_steps, int) or not 1 <= max_steps <= 50000:
            raise ValueError('Use 1..50000 steps.')
        if not isinstance(certificate_every, int) or not 1 <= certificate_every <= 100:
            raise ValueError('Certificate interval must be an integer in [1,100].')
        self.c, self.kernel, self.gamma = float(c), kernel, float(gamma)
        self.tolerance, self.max_steps = float(tolerance), max_steps
        self.certificate_every = certificate_every

    def matrix(self, left, right, block_rows=16):
        left, right = np.asarray(left, dtype=float), np.asarray(right, dtype=float)
        if left.ndim != 2 or right.ndim != 2 or left.shape[1] != right.shape[1]:
            raise ValueError('Kernel matrices require matching feature dimensions.')
        if not np.isfinite(left).all() or not np.isfinite(right).all():
            raise ValueError('Kernel coordinates must be finite.')
        if max(np.max(np.abs(left), initial=0), np.max(np.abs(right), initial=0)) > 1000:
            raise ValueError('Feature magnitudes must be at most 1000.')
        if self.kernel == 'linear':
            return left @ right.T
        result = np.empty((len(left), len(right)))
        # Only block_rows x n_right x d differences exist at once.
        for start in range(0, len(left), block_rows):
            differences = left[start:start + block_rows, None, :] - right[None, :, :]
            squared = np.einsum('bnd,bnd->bn', differences, differences)
            result[start:start + block_rows] = np.exp(-self.gamma * squared)
        return result

    def certificate(self, gram, alpha, y):
        if np.min(alpha) < -1e-10 or np.max(alpha) > self.c + 1e-10 or abs(alpha @ y) > 1e-9:
            raise ArithmeticError('The proposed dual vector is not feasible.')
        signed = alpha * y
        raw = gram @ signed
        breaks = np.sort(y - raw)
        positives = int(np.sum(y == 1))
        # The hinge slope increases by one at every breakpoint.
        bias = float((breaks[positives - 1] + breaks[positives]) / 2)
        norm_squared = float(signed @ raw)
        scale = max(1., float(np.sum(np.abs(signed * raw))))
        if norm_squared < -1e-12 * scale:
            raise ArithmeticError('A materially negative kernel norm invalidates the certificate.')
        norm_squared = max(0., norm_squared)
        primal = .5 * norm_squared + self.c * np.maximum(0., 1 - y * (raw + bias)).sum()
        dual = float(alpha.sum()) - .5 * norm_squared
        gap = float(primal - dual)
        if not np.isfinite([bias, primal, dual, gap]).all():
            raise ArithmeticError('Certificate calculation is not finite.')
        if gap < -1e-10 * max(1., abs(primal), abs(dual)):
            raise ArithmeticError('A materially negative primal-dual gap is a numerical failure.')
        return bias, float(primal), dual, gap

    def pair_candidates(self, alpha, gradient, left, right, sign, curvature):
        slope = gradient[right] - sign * gradient[left]
        lower = np.maximum(-alpha[right], np.where(sign == 1, alpha[left] - self.c, -alpha[left]))
        upper = np.minimum(self.c - alpha[right], np.where(sign == 1, alpha[left], self.c - alpha[left]))
        delta = np.divide(slope, curvature, out=np.zeros_like(slope), where=curvature > 0)
        delta = np.clip(delta, lower, upper)
        endpoint = np.where(slope * upper > slope * lower, upper, lower)
        delta = np.where(curvature == 0, np.where(slope == 0, 0., endpoint), delta)
        gain = slope * delta - .5 * curvature * delta ** 2
        return delta, gain, slope, lower, upper

    def fit(self, x, y, feature_order=None, row_ids=None):
        x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
        if x.ndim != 2 or not (2 <= len(x) <= 100 and 1 <= x.shape[1] <= 20):
            raise ValueError('Use 2..100 rows and 1..20 features.')
        if y.shape != (len(x),) or set(y.tolist()) != {-1., 1.}:
            raise ValueError('Supply both -1 and +1 labels, one per row.')
        feature_order = list(feature_order) if feature_order is not None else [f'x{k}' for k in range(x.shape[1])]
        row_ids = list(row_ids) if row_ids is not None else [f'row{k}' for k in range(len(x))]
        if len(feature_order) != x.shape[1] or len(set(feature_order)) != len(feature_order):
            raise ValueError('Feature identities must be unique and match the columns.')
        if len(row_ids) != len(x) or len(set(row_ids)) != len(row_ids):
            raise ValueError('Row identities must be unique and match the observations.')
        self.x, self.y = x.copy(), y.copy()
        self.feature_order, self.row_ids = feature_order, row_ids
        gram = self.matrix(self.x, self.x)
        q = y[:, None] * gram * y[None, :]
        left, right = np.triu_indices(len(y), 1)
        sign = y[left] * y[right]
        differences = x[left] - x[right]
        squared = np.einsum('nd,nd->n', differences, differences)
        curvature = squared if self.kernel == 'linear' else -2 * np.expm1(-self.gamma * squared)
        alpha, gradient = np.zeros(len(y)), np.ones(len(y))
        self.trace = []
        self.status = 'step limit'
        for step in range(self.max_steps + 1):
            if step % self.certificate_every == 0 or step == self.max_steps:
                bias, primal, dual, gap = self.certificate(gram, alpha, y)
                self.trace.append({'step': step, 'primal': primal, 'dual': dual, 'gap': gap})
                if gap <= self.tolerance * max(1., abs(primal)):
                    self.status = 'gap passed'
                    break
            if step == self.max_steps:
                break
            delta, gain, _, _, _ = self.pair_candidates(alpha, gradient, left, right, sign, curvature)
            chosen = int(np.argmax(gain))
            if gain[chosen] <= 1e-15:
                bias, primal, dual, gap = self.certificate(gram, alpha, y)
                self.status = ('gap passed' if gap <= self.tolerance * max(1., abs(primal))
                               else 'stalled before gap criterion')
                break
            i, j = int(left[chosen]), int(right[chosen])
            old_i, old_j = alpha[i], alpha[j]
            new_i = float(np.clip(old_i - sign[chosen] * delta[chosen], 0., self.c))
            new_j = float(np.clip(old_j + delta[chosen], 0., self.c))
            # Both values use the old state. Update every gradient entry afterwards.
            alpha[i], alpha[j] = new_i, new_j
            gradient -= q[:, i] * (new_i - old_i) + q[:, j] * (new_j - old_j)
            if abs(alpha @ y) > 1e-9:
                raise ArithmeticError('The atomic pair update lost label balance.')
        bias, primal, dual, gap = self.certificate(gram, alpha, y)
        if not self.trace or self.trace[-1]['step'] != step:
            self.trace.append({'step': step, 'primal': primal, 'dual': dual, 'gap': gap})
        self.alpha, self.gradient, self.bias = alpha.copy(), gradient.copy(), bias
        self.primal, self.dual, self.gap, self.steps = primal, dual, gap, step
        np.testing.assert_allclose(self.gradient, 1 - q @ alpha, atol=1e-9, rtol=1e-10)
        return self

    def decision_function(self, x, feature_order=None):
        x = np.asarray(x, dtype=float)
        if x.ndim != 2 or x.shape[1] != self.x.shape[1]:
            raise ValueError('Queries must retain the fitted feature count.')
        if feature_order is not None and list(feature_order) != self.feature_order:
            raise ValueError('Query feature order differs from the saved model.')
        return self.matrix(x, self.x) @ (self.alpha * self.y) + self.bias

    def predict(self, x, feature_order=None):
        return np.where(self.decision_function(x, feature_order) >= 0, 1., -1.)

    def export_state(self):
        return {'schema': 1, 'kernel': self.kernel, 'c': self.c, 'gamma': self.gamma,
                'tolerance': self.tolerance, 'max_steps': self.max_steps,
                'certificate_every': self.certificate_every,
                'feature_order': list(self.feature_order), 'row_ids': list(self.row_ids),
                'n_features': self.x.shape[1], 'x': self.x.tolist(), 'y': self.y.tolist(),
                'alpha': self.alpha.tolist(), 'signed_coefficients': (self.alpha * self.y).tolist(),
                'bias': self.bias, 'status': self.status, 'steps': self.steps,
                'primal': self.primal, 'dual': self.dual, 'tie_label': 1}

    @classmethod
    def from_state(cls, state):
        if state.get('schema') != 1 or state.get('tie_label') != 1:
            raise ValueError('Unknown schema or score-zero label convention.')
        model = cls(state['c'], state['kernel'], state['gamma'], state['tolerance'],
                    state['max_steps'], state['certificate_every'])
        x, y = np.asarray(state['x'], float), np.asarray(state['y'], float)
        alpha = np.asarray(state['alpha'], float)
        features, rows = list(state['feature_order']), list(state['row_ids'])
        if x.ndim != 2 or not (2 <= len(x) <= 100 and 1 <= x.shape[1] <= 20):
            raise ValueError('Saved training shape is outside the model contract.')
        if y.shape != (len(x),) or set(y.tolist()) != {-1., 1.} or alpha.shape != y.shape:
            raise ValueError('Saved label/coefficient shape is invalid.')
        if not np.isfinite(alpha).all() or not np.isfinite(state['bias']):
            raise ValueError('Saved coefficients and bias must be finite.')
        if state['n_features'] != x.shape[1] or len(features) != x.shape[1] or len(set(features)) != len(features):
            raise ValueError('Saved feature identities do not match the matrix.')
        if len(rows) != len(x) or len(set(rows)) != len(rows):
            raise ValueError('Saved row identities do not match the matrix.')
        gram = model.matrix(x, x)
        bias, primal, dual, gap = model.certificate(gram, alpha, y)
        np.testing.assert_allclose(state['signed_coefficients'], alpha * y, atol=1e-12, rtol=1e-12)
        np.testing.assert_allclose([state['bias'], state['primal'], state['dual']],
                                   [bias, primal, dual], atol=1e-8, rtol=1e-10)
        if state['status'] not in ('gap passed', 'step limit', 'stalled before gap criterion'):
            raise ValueError('Unknown saved stop status.')
        if not isinstance(state['steps'], int) or not 0 <= state['steps'] <= model.max_steps:
            raise ValueError('Invalid saved step count.')
        if state['status'] == 'gap passed' and gap > model.tolerance * max(1., abs(primal)):
            raise ValueError('Saved gap-passed status fails reconstruction.')
        model.x, model.y, model.alpha = x.copy(), y.copy(), alpha.copy()
        model.feature_order, model.row_ids = features, rows
        model.bias, model.primal, model.dual, model.gap = bias, primal, dual, gap
        model.gradient = 1 - y * (gram @ (alpha * y))
        model.status, model.steps, model.trace = state['status'], state['steps'], []
        return model
