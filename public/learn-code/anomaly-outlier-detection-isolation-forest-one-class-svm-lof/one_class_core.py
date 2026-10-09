"""Inspectable normalized one-class RBF dual; kernel primitive reused unchanged."""
import numpy as np
from prerequisites.svm_core import PairSVM


class PairOneClass:
    def __init__(self, nu=.5, gamma=1., tolerance=1e-8, max_steps=10000):
        if not np.isfinite(nu) or not 0 < nu <= 1:
            raise ValueError('Nu must lie in (0,1].')
        if not np.isfinite(tolerance) or not 1e-10 <= tolerance <= .01:
            raise ValueError('Tolerance must lie in [1e-10,.01].')
        if type(max_steps) is not int or not 0 <= max_steps <= 50000:
            raise ValueError('Use 0..50000 steps.')
        self.nu, self.gamma, self.tolerance, self.max_steps = nu, gamma, tolerance, max_steps
        self.kernel = PairSVM(kernel='rbf', gamma=gamma)

    def certificate(self, alpha, raw, cap):
        if (not np.isfinite(alpha).all() or np.min(alpha) < -1e-12
                or np.max(alpha) > cap+1e-12 or abs(alpha.sum()-1) > 1e-10):
            raise ArithmeticError('Coefficient mass/caps are not feasible.')
        # Classification of bounds uses a small absolute feasibility tolerance,
        # capped relative to C so tiny positive coefficients are not all called zero.
        bound_tolerance = min(1e-10, cap*1e-8)
        zero = alpha <= bound_tolerance
        capped = alpha >= cap-bound_tolerance
        free = ~(zero | capped)
        if free.any():
            rho = float(raw[free].mean())
        else:
            lower = float(raw[capped].max()) if capped.any() else -np.inf
            upper = float(raw[zero].min()) if zero.any() else np.inf
            if lower > upper+1e-10:
                raise ArithmeticError('No admissible offset interval for this state.')
            if np.isfinite(lower) and np.isfinite(upper):
                rho = (lower+upper)/2
            elif np.isfinite(lower):
                rho = lower  # nu=1: all coefficients capped, choose max(raw).
            elif np.isfinite(upper):
                rho = upper
            else:
                raise ArithmeticError('Offset cannot be recovered.')
        slack = np.maximum(0., rho-raw)
        quadratic = float(.5*alpha@raw)
        primal = quadratic+cap*slack.sum()-rho
        dual = -quadratic
        gap = float(primal-dual)
        if not np.isfinite([rho, primal, dual, gap]).all() or gap < -1e-10:
            raise ArithmeticError('Invalid primal-dual certificate.')
        return {'rho': rho, 'slack': slack, 'quadratic': quadratic,
                'primal': float(primal), 'dual': dual, 'gap': max(0., gap)}

    def fit(self, reference, feature_order=None):
        x = np.asarray(reference, dtype=np.float64)
        if x.ndim != 2 or not 2 <= len(x) <= 100 or not 1 <= x.shape[1] <= 20:
            raise ValueError('Use 2..100 rows and 1..20 feature columns.')
        order = list(feature_order) if feature_order is not None else [f'x{i}' for i in range(x.shape[1])]
        if len(order) != x.shape[1] or len(set(order)) != len(order):
            raise ValueError('Feature names must be unique and match the columns.')
        # Validate requested next-fit choices; construct without solving a fit.
        requested = PairOneClass(self.nu, self.gamma, self.tolerance, self.max_steps)
        nu, gamma = requested.nu, requested.gamma
        tolerance, max_steps = requested.tolerance, requested.max_steps
        kernel = requested.kernel
        gram = kernel.matrix(x, x)
        n = len(x)
        cap = 1/(nu*n)
        # Geometry is fixed during fitting: cache curvature once, not per pair step.
        curvature = np.zeros((n, n))
        for i in range(n):
            for j in range(i+1, n):
                differences = x[i]-x[j]
                curvature[i, j] = -2*np.expm1(-gamma*float(differences@differences))
        alpha = np.full(n, 1/n)
        raw = gram@alpha
        trace = []
        status = 'step limit'
        for step in range(max_steps+1):
            certificate = self.certificate(alpha, raw, cap)
            trace.append({'step': step, 'quadratic': certificate['quadratic'], 'gap': certificate['gap']})
            if certificate['gap'] <= tolerance*max(1., abs(certificate['primal'])):
                status = 'gap passed'
                break
            if step == max_steps:
                break
            best_gain, best = 0., None
            for i in range(n):
                for j in range(i+1, n):
                    lower, upper = max(-alpha[i], alpha[j]-cap), min(cap-alpha[i], alpha[j])
                    eta = curvature[i, j]
                    slope = raw[i]-raw[j]
                    if eta > 0:
                        delta = float(np.clip(-slope/eta, lower, upper))
                    else:
                        delta = lower if slope > 0 else upper if slope < 0 else 0.
                    gain = -(delta*slope+.5*eta*delta*delta)
                    if gain > best_gain:
                        best_gain, best = gain, (i, j, delta)
            if best is None or best_gain <= 1e-15:
                status = 'stalled before gap criterion'
                break
            i, j, delta = best
            alpha[i] += delta
            alpha[j] -= delta
            raw += delta*(gram[:, i]-gram[:, j])
        np.testing.assert_allclose(raw, gram@alpha, atol=1e-10, rtol=1e-10)
        certificate_state = self.certificate(alpha, raw, cap)
        # Keep all strictly positive coefficients; arbitrary support pruning changes g.
        support = alpha > 0
        # Publish one complete candidate only after every construction can succeed.
        fitted_kernel = PairSVM(kernel='rbf', gamma=gamma)
        published = dict(reference=x.copy(), feature_order=order, kernel=kernel,
                         alpha=alpha.copy(), raw=raw.copy(), cap=cap,
                         certificate_state=certificate_state, rho=certificate_state['rho'],
                         steps=step, status=status, trace=trace,
                         support_ids=np.flatnonzero(support), supports=x[support].copy(),
                         coefficients=alpha[support].copy(), fitted_kernel=fitted_kernel,
                         fitted_nu=nu, fitted_gamma=gamma, fitted_tolerance=tolerance,
                         fitted_max_steps=max_steps, _fit_valid=True)
        self.__dict__.update(published)
        return self

    def score_queries(self, queries, query_batch_size=16, block_rows=16, feature_order=None):
        required = ('reference', 'feature_order', 'supports', 'support_ids', 'coefficients',
                    'rho', 'fitted_kernel', 'fitted_gamma', 'fitted_nu',
                    'fitted_tolerance', 'fitted_max_steps', 'certificate_state', 'trace', 'status')
        if not getattr(self, '_fit_valid', False) or not all(hasattr(self, key) for key in required):
            raise ValueError('Fit a complete valid reference first.')
        q = np.asarray(queries, dtype=np.float64)
        if q.ndim != 2 or q.shape[1] != self.reference.shape[1] or not np.isfinite(q).all():
            raise ValueError('Queries need finite matching feature columns.')
        if np.max(np.abs(q), initial=0) > 1000:
            raise ValueError('Feature magnitudes must be at most1000.')
        if feature_order is not None and list(feature_order) != self.feature_order:
            raise ValueError('Query feature order differs from the fit.')
        if any(type(value) is not int or value < 1 for value in (query_batch_size, block_rows)):
            raise ValueError('Outer/inner batch sizes must be positive integers.')
        result = np.empty(len(q))
        for start in range(0, len(q), query_batch_size):
            block = q[start:start+query_batch_size]
            gram = self.fitted_kernel.matrix(block, self.supports, block_rows=block_rows)
            result[start:start+len(block)] = gram@self.coefficients-self.rho
        return result
